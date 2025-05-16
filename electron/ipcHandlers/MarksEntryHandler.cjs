const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

ipcMain.handle('get-students-by-class-and-section', (event, data) => {
    const { classId, sectionId } = data;
    const stmt = db.prepare(`
      SELECT
        s.Id as StudentId,
        s.Name,
        a.RollNo
      FROM Students s
      JOIN Admissions a ON s.Id = a.StudentId
      WHERE a.ClassId = ? AND a.SectionId = ?
    `);
    const rows = stmt.all(classId, sectionId); // Correct parameters
    console.log("Students by class in MarksEntryHandler :", rows);
    return { success: true, students: rows }; // Also return the result
  });

  /////////////////////////////////////////////////////////Getting Existing Marks
 ipcMain.handle('get-marks-by-exam-subject', async (event, { examId, subjectId, academicYearId }) => {
  const stmt = db.prepare(`
    SELECT StudentId, MarksObtained 
    FROM Marks
    WHERE 
      ActiveExamId = ? AND
      SubjectId = ? AND
      AcademicYearId = ? 
  `);
  const rows = stmt.all(examId, subjectId, academicYearId);
  console.log(rows);
  return rows
});


 ///////////////////////////////////////////////////////////////Save Marks
 ipcMain.handle('save-marks', async (event, marksData, subjectData) => {
  if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
    return { success: false, error: "No marks data provided" };
  }

  const transaction = db.transaction(() => {
    try {
      // Prepare statements
      const upsertMarkStmt = db.prepare(`
        INSERT INTO Marks (
          StudentId,
          SubjectId,
          ActiveExamId,
          AcademicYearId,
          MaxMark,
          MarksObtained,
          Status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(StudentId, SubjectId, ActiveExamId) 
        DO UPDATE SET 
          MarksObtained = excluded.MarksObtained,
          MaxMark = excluded.MaxMark,
          Status = excluded.Status,
          Last_Modified_at = CURRENT_TIMESTAMP
      `);

      const entryStatus = db.prepare(`
        INSERT INTO SubjectEntryStatus (
          AcademicYearId,
          ActiveExamId,
          ClassId,
          SectionId,
          SubjectId,
          Finished
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (AcademicYearId, ActiveExamId, ClassId, SectionId, SubjectId)
        DO UPDATE SET
          Finished = excluded.Finished,
          Last_Modified_at = CURRENT_TIMESTAMP
      `);

      // Process each mark
      for (const mark of marksData) {
        // Convert all values to proper types
        const values = [
          mark.StudentId,
          mark.SubjectId,
          mark.ActiveExamId,
          mark.AcademicYearId,
          Number(mark.MaxMark),
          Number(mark.MarksObtained),
          mark.Status
        ];

        // Check for invalid numbers
        if (values.some(v => typeof v === 'number' && isNaN(v))) {
          throw new Error(`Invalid numeric value in marks data for student ${mark.StudentId}`);
        }

        upsertMarkStmt.run(...values);
      }

      // Update SubjectEntryStatus with properly typed values
      console.log('Check Subjectdata', subjectData)
      entryStatus.run(
        Number(subjectData.YearId),
        Number(subjectData.ExamId),
        Number(subjectData.ClassId),
        Number(subjectData.SectionId),
        Number(subjectData.SubjectId),
        subjectData.Finished ? 1 : 0 // Convert boolean to SQLite integer (1 or 0)
      );

      return { 
        success: true, 
        message: `Successfully saved ${marksData.length} marks`
      };

    } catch (error) {
      console.error('Error saving marks:', error);
      return { 
        success: false, 
        error: error.message,
        details: error 
      };
    }
  });

  return transaction();
});



////////////////////////////////////////////////////////////////////View Marks
ipcMain.handle('get-marks-by-class-section', async (event, { classId, sectionId, academicYearId, examId }) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        m.StudentId,
        m.SubjectId,
        m.ActiveExamId,
        m.AcademicYearId,
        m.MarksObtained,
        s.Name, 
        a.RollNo,
        sub.SubjectName
      FROM Marks m
      JOIN Admissions a ON m.StudentId = a.StudentId
      JOIN Students s ON s.Id = m.StudentId
      JOIN Subjects sub ON m.SubjectId = sub.Id
      WHERE a.ClassId = ? 
        AND a.SectionId = ?
        AND m.AcademicYearId = ?
        AND m.ActiveExamId = ?
    `);
    const marks = stmt.all(classId, sectionId, academicYearId, examId);
    return { success: true, marks };
  } catch (err) {
    console.error("Error fetching marks:", err);
    return { success: false, error: err.message };
  }
});

///////////////////////////////////////////////////////////////////////////
ipcMain.handle('get-mark-entry-status', async (event, { academicYearId, examId }) => {
  try {
    // Get all class-section mappings with details
    const classSections = db.prepare(`
      SELECT 
        c.Id as classId,
        c.ClassName,
        s.Id as sectionId,
        s.SectionName
      FROM ClassSectionMapping csm
      JOIN Classes c ON csm.ClassId = c.Id
      JOIN Sections s ON csm.SectionId = s.Id
      ORDER BY c.Id, s.SectionName
    `).all()

    // Get total subjects count per class
    const totalSubjectsStmt = db.prepare(`
      SELECT ClassId, COUNT(*) as total 
      FROM ClassSubjectMapping 
      GROUP BY ClassId
    `)

    // Get finished subjects count per class-section
    const finishedSubjectsStmt = db.prepare(`
      SELECT 
        ClassId,
        SectionId,
        COUNT(DISTINCT SubjectId) as finished
      FROM SubjectEntryStatus
      WHERE 
        AcademicYearId = ? AND
        ActiveExamId = ? AND
        Finished = 1
      GROUP BY ClassId, SectionId
    `)

    const totalSubjectsMap = new Map(
      totalSubjectsStmt.all().map(row => [row.ClassId, row.total])
    )

    const finishedSubjectsMap = new Map(
      finishedSubjectsStmt.all(academicYearId, examId)
        .map(row => [`${row.ClassId}-${row.SectionId}`, row.finished])
    )

    // Prepare final result
    const result = classSections.map(cs => {
      const total = totalSubjectsMap.get(cs.classId) || 0
      const finished = finishedSubjectsMap.get(`${cs.classId}-${cs.sectionId}`) || 0
      
      return {
        classId: cs.classId,
        sectionId: cs.sectionId,
        className: cs.ClassName,
        sectionName: cs.SectionName,
        totalSubjects: total,
        finishedSubjects: finished,
        allFinished: finished >= total, // Using >= as safety check
        completionPercentage: total > 0 ? Math.round((finished / total) * 100) : 0
      }
    })

    return { 
      success: true,
      data: result 
    }

  } catch (error) {
    console.error('Error in get-all-class-section-status:', error)
    return { 
      success: false,
      error: error.message,
      data: [] 
    }
  }
})

