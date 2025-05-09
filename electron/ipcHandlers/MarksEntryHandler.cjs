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
  // In main process (electron)
ipcMain.handle('get-marks-by-exam-subject', async (_, { examId, classId, sectionId, subjectId, academicYearId }) => {
  const stmt = db.prepare(`
    SELECT StudentId, MarksObtained 
    FROM Marks
    WHERE 
      ActiveExamId = ? AND
      SubjectId = ? AND
      AcademicYearId = ? AND
      StudentId IN (
        SELECT StudentId FROM Admissions 
        WHERE ClassId = ? AND SectionId = ?
      )
  `);
  console.log(stmt.all(examId, subjectId, academicYearId, classId, sectionId));
  return await stmt.all(examId, subjectId, academicYearId, classId, sectionId);
});


 ///////////////////////////////////////////////////////////////Save Marks
 ipcMain.handle('save-marks', async (event, marksData) => {
  if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
    return { success: false, error: "No marks data provided" };
  }
 
  let transaction;

  try {
    // Begin transaction
    transaction = db.prepare('BEGIN TRANSACTION').run();
    console.log('Transaction started');

    // Prepare statements
    const upsertMarkStmt = db.prepare(`
      INSERT INTO Marks (
        StudentId,
        SubjectId,
        ActiveExamId,
        AcademicYearId,
        MarksObtained
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(StudentId, SubjectId, ActiveExamId) 
      DO UPDATE SET 
        MarksObtained = excluded.MarksObtained,
        Last_Modified_at = CURRENT_TIMESTAMP
    `);

    const calculateCumulativeStmt = db.prepare(`
      SELECT SUM(MarksObtained) AS TotalMarks
      FROM Marks
      WHERE StudentId = ? 
      AND ActiveExamId = ?
      AND AcademicYearId = ?
    `);

    const upsertCumulativeStmt = db.prepare(`
      INSERT INTO CumulativeMarks (
        StudentId,
        ActiveExamId,
        TotalMarksObtained,
        AcademicYearId
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(StudentId, ActiveExamId) 
      DO UPDATE SET
        TotalMarksObtained = excluded.TotalMarksObtained,
        Last_Modified_at = CURRENT_TIMESTAMP
    `);

    // First pass: Save all individual marks
    for (const mark of marksData) {
      // Validate mark
      if (mark.MarksObtained === null || 
          mark.MarksObtained === undefined || 
          isNaN(mark.MarksObtained) ||
          mark.MarksObtained < 0) {
        throw new Error(`Invalid marks value for student ${mark.StudentId}`);
      }

      console.log(`Saving mark for student ${mark.StudentId}, subject ${mark.SubjectId}: ${mark.MarksObtained}`);
      upsertMarkStmt.run(
        mark.StudentId,
        mark.SubjectId,
        mark.ActiveExamId,
        mark.AcademicYearId,
        mark.MarksObtained
      );
    }

    // Second pass: Calculate and save cumulative marks
    // Get unique student+exam combinations
    const studentExamCombos = [...new Set(marksData.map(m => 
      `${m.StudentId}-${m.ActiveExamId}-${m.AcademicYearId}`
    ))];

    for (const combo of studentExamCombos) {
      const [studentId, examId, academicYearId] = combo.split('-');
      
      console.log(`Calculating cumulative for student ${studentId}, exam ${examId}`);
      const result = calculateCumulativeStmt.get(
        studentId,
        examId,
        academicYearId
      );

      const totalMarks = result?.TotalMarks || 0;
      
      console.log(`Saving cumulative total for student ${studentId}: ${totalMarks}`);
      upsertCumulativeStmt.run(
        studentId,
        examId,
        totalMarks,
        academicYearId
      );
    }

    // Commit transaction
    db.prepare('COMMIT').run();
    console.log('Transaction committed');

    return { 
      success: true, 
      message: `Successfully saved ${marksData.length} marks and updated cumulative totals`
    };

  } catch (error) {
    // Rollback transaction if error occurs
    if (transaction) {
      db.prepare('ROLLBACK').run();
      console.error('Transaction rolled back due to error');
    }
    
    console.error('Error saving marks:', error);
    return { 
      success: false, 
      error: error.message,
      details: error 
    };
  }
});

//////////////////////////////////////////////////////////////////////////////Activity Grades
ipcMain.handle('save-coscholastic-marks', async (event, gradesData) => {
  if (!gradesData || !Array.isArray(gradesData)) {
    return { success: false, error: "Invalid grades data format" };
  }

  let transaction;
  try {
    transaction = db.prepare('BEGIN TRANSACTION').run();

    const stmt = db.prepare(`
      INSERT INTO CoScholasticMarks (
        StudentId,
        SubjectId,
        ActiveExamId,
        AcademicYearId,
        Score
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(StudentId, SubjectId, ActiveExamId) 
      DO UPDATE SET
        Score = excluded.Score,
        Last_Modified_at = CURRENT_TIMESTAMP
    `);

    for (const grade of gradesData) {
      // Validate required fields
      if (!grade.StudentId || !grade.SubjectId || !grade.ActiveExamId || !grade.AcademicYearId) {
        throw new Error(`Missing required fields for student ${grade.StudentId}`);
      }

      // Validate grade value
      const normalizedGrade = grade.Score?.toUpperCase();
      if (!['A', 'B', 'C'].includes(normalizedGrade)) {
        throw new Error(`Invalid grade (${grade.Score}) for student ${grade.StudentId}`);
      }

      stmt.run(
        grade.StudentId,
        grade.SubjectId,
        grade.ActiveExamId,
        grade.AcademicYearId,
        normalizedGrade
      );
    }

    db.prepare('COMMIT').run();
    return { 
      success: true, 
      message: `${gradesData.length} co-scholastic marks saved successfully` 
    };

  } catch (error) {
    if (transaction) db.prepare('ROLLBACK').run();
    console.error('Error saving co-scholastic marks:', error);
    return { 
      success: false, 
      error: error.message,
      details: error 
    };
  }
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


