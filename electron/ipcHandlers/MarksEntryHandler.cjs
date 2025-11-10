const { ipcMain } = require('electron');
const { db } = require('../database.cjs');
const authService  = require('./auth.cjs');
const currentTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString();

ipcMain.handle('get-students-by-class-and-section', (event, data) => {

    const { classId, sectionId, AcademicYearId } = data;
  //  console.log('Fetching students for class:', classId, 'and year:', AcademicYearId);
    const stmt = db.prepare(`
      SELECT
        s.Id as StudentId,
        s.Name,
        a.RollNo
      FROM Students s
      JOIN Admissions a ON s.Id = a.StudentId
      WHERE a.ClassId = ? AND a.SectionId = ?
      AND a.AcademicYearId = ?
      ORDER BY a.RollNo ASC
    `);
    const rows = stmt.all(classId, sectionId, AcademicYearId); // Correct parameters
   //console.log("Students by class in MarksEntryHandler :", rows);
    return { success: true, students: rows }; // Also return the result
  });

  /////////////////////////////////////////////////////////Getting Existing Marks
 ipcMain.handle('get-marks-by-exam-subject', async (event, { examId, subjectId, ClassId, SectionId}) => {
  //console.log('Fetching marks for exam:', examId, 'and subject:', subjectId);
  const stmt = db.prepare(`
    SELECT m.StudentId, m.PeriodicMarksObtained, m.TerminalMarksObtained, m.SubjectResult
    FROM Marks m
    JOIN Admissions a ON m.StudentId = a.StudentId
    AND a.ClassId = ? AND a.SectionId = ?
    WHERE m.ActiveExamId = ? 
    AND m.SubjectId = ?
  `);
  if (typeof examId === 'undefined' || typeof subjectId === 'undefined') {
      throw new Error('Both examId and subjectId must be provided');
    }
  const rows = stmt.all(ClassId, SectionId, examId, subjectId);
  return rows
});

///////////////////////////////////////////////////////////////Save Marks
ipcMain.handle('save-marks', async (event, { marksData, subjectData }) => {
  // Validate input
  if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
    return { success: false, error: "No marks data provided" };
  }

  if (!subjectData || typeof subjectData !== 'object') {
    return { success: false, error: "No subject data provided" };
  }
  let totalMarks = 0;
  totalMarks = db.prepare(`
    SELECT SUM(s.FullMark) AS TotalFullMark
    FROM ClassSubjectMapping csm
    LEFT JOIN Subjects s ON csm.SubjectId = s.Id
    WHERE csm.ClassId = ?
    `).get(subjectData.ClassId).TotalFullMark;

 
  //console.log('Check Total Marks:', totalMarks);
  // Prepare all statements outside transaction first
  let upsertMarkStmt, upsertEntryStatusStmt, upsertTotalMarksStmt, studentTotalsStmt, finalTotalsStmt, finalCumulativeStmt;
    const currentUser = await authService.getCurrentUser();
    //console.log("currentUser:", currentUser);
    if (!currentUser || !currentUser.id) {
      return { success: false, error: "User not authenticated" };
    }

  try {
    // Prepare statements
    upsertMarkStmt = db.prepare(`
      INSERT INTO Marks (
        ActiveExamId,
        StudentId,
        SubjectId,
        PeriodicMaxMark,
        TerminalMaxMark,
        TotalMaxMarks,
        PeriodicMarksObtained,
        TerminalMarksObtained,
        TotalMarksObtained,
        SubjectResult,
        Creation_at,
        Last_Modified_at,
        CreatedBy,
        ModifiedBy       
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(StudentId, SubjectId, ActiveExamId) 
      DO UPDATE SET
        PeriodicMaxMark = excluded.PeriodicMaxMark,
        TerminalMaxMark = excluded.TerminalMaxMark,
        TotalMaxMarks = excluded.TotalMaxMarks,
        PeriodicMarksObtained = excluded.PeriodicMarksObtained,
        TerminalMarksObtained = excluded.TerminalMarksObtained,
        TotalMarksObtained = excluded.TotalMarksObtained,
        SubjectResult = excluded.SubjectResult,        
        Last_Modified_at = excluded.Last_Modified_at,
        ModifiedBy = excluded.ModifiedBy
    `);

    upsertEntryStatusStmt = db.prepare(`
      INSERT INTO MarkEntryStatus (
        ActiveExamId,
        ClassId,
        SectionId, 
        SubjectId,
        FinishedEntry,
        Creation_at,
        Last_Modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(ActiveExamId, ClassId, SectionId, SubjectId) 
      DO UPDATE SET
        FinishedEntry = excluded.FinishedEntry,
        Last_Modified_at = excluded.Last_Modified_at
    `);

    upsertTotalMarksStmt = db.prepare(`
      INSERT INTO CumulativeTotalMarks (
        AcademicYearId,
        ActiveExamId,
        StudentId,
        TotalMaxMarks,
        TotalMarksObtained,
        Percentage,
        Creation_at,
        Last_Modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)       
      ON CONFLICT(StudentId, ActiveExamId, AcademicYearId) 
      DO UPDATE SET
        TotalMaxMarks = excluded.TotalMaxMarks,
        TotalMarksObtained = excluded.TotalMarksObtained,
        Percentage = excluded.Percentage,
        Last_Modified_at = excluded.Last_Modified_at
    `); 

    finalCumulativeStmt = db.prepare(`
      INSERT INTO FinalCumulativeTotalMarks (
        AcademicYearId,
        StudentId,
        TotalMaxMarks,
        TotalMarksObtained,
        Percentage,
        Creation_at,
        Last_Modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(StudentId, AcademicYearId) 
      DO UPDATE SET
        TotalMaxMarks = excluded.TotalMaxMarks,
        TotalMarksObtained = excluded.TotalMarksObtained,
        Percentage = excluded.Percentage,
        Last_Modified_at = excluded.Last_Modified_at
    `);

    // Direct query to calculate totals from Marks table
      studentTotalsStmt = db.prepare(`
        SELECT 
          StudentId,
          ? AS totalMax,  
          SUM(TotalMarksObtained) AS totalObtained,
          CASE 
            WHEN ? > 0  
            THEN (SUM(TotalMarksObtained) * 100.0 / ?)  
            ELSE 0 
          END AS percentage
        FROM Marks
        WHERE ActiveExamId = ? AND StudentId = ?
        GROUP BY StudentId
      `);

        // Begin transaction
    db.prepare('BEGIN').run();

    try {
      // 1. Save all student marks
      for (const mark of marksData) {
        upsertMarkStmt.run(
          subjectData.ExamId,
          mark.StudentId,
          subjectData.SubjectId,
          mark.PeriodicMaxMark,
          mark.TerminalMaxMark,
          mark.TotalMaxMarks,
          mark.PeriodicMarksObtained,
          mark.TerminalMarksObtained,
          mark.TotalMarksObtained,
          mark.SubjectResult,
          currentTime,
          currentTime,
          currentUser.id,
          currentUser.id

        );
    //console.log(`Saved marks for StudentId: ${mark.StudentId}, SubjectId: ${subjectData.SubjectId}`);
      }

      // 2. Update entry status
      upsertEntryStatusStmt.run(
        subjectData.ExamId,
        subjectData.ClassId,
        subjectData.SectionId,
        subjectData.SubjectId,
        1,
        currentTime,
        currentTime
      );
      
      const studentTotals = [];
      for (const mark of marksData) {
        studentTotals.push(studentTotalsStmt.get(
          totalMarks,  // First ? (totalMax)
          totalMarks,  // Second ? (in CASE)
          totalMarks,  // Third ? (in division)
          subjectData.ExamId,
          mark.StudentId
        ));
      }

      // Update CumulativeTotalMarks with calculated values
      for (const student of studentTotals) {
        upsertTotalMarksStmt.run(
          subjectData.YearId,
          subjectData.ExamId,
          student.StudentId,
          student.totalMax || 0,
          student.totalObtained || 0,
          student.percentage || 0,
          currentTime,
          currentTime
        );
      }

      //when examtype is annual, need to fetch and sum the marks andinsert new entry for final cumulative marks.
      if (subjectData.ExamType === 'annual') {
      // Insert new entry for final cumulative marks
        finalTotalsStmt = db.prepare(`
          SELECT
            StudentId,
            AcademicYearId,
            ? * 2 AS finalTotalMax, 
            SUM(TotalMarksObtained) AS finalTotalObtained,
            CASE 
              WHEN ? > 0 
              THEN ROUND(SUM(TotalMarksObtained) * 100.0 / (? * 2), 2)
              ELSE 0 
            END AS finalPercentage
          FROM CumulativeTotalMarks
          WHERE AcademicYearId = ? AND StudentId = ?
          GROUP BY StudentId
        `);

        let finalTotals = [];
        for (const student of studentTotals) {
          const finalTotal = finalTotalsStmt.get(
            totalMarks,   // First ? (for finalTotalMax)
            totalMarks,   // Second ? (in CASE)
            totalMarks,   // Third ? (in division)
            subjectData.YearId,
            student.StudentId
          );
          if (finalTotal) {
            finalTotals.push(finalTotal);
          }
        }

        for (const final of finalTotals) {
          finalCumulativeStmt.run(
            final.AcademicYearId,
            final.StudentId,
            final.finalTotalMax,
            final.finalTotalObtained,
            final.finalPercentage,
            currentTime,
            currentTime
          );
        }     
    //console.log('Final Totals:', finalTotals);
    }
      // Commit transaction
      db.prepare('COMMIT').run();
    
      return { 
        success: true,
        message: 'Marks saved successfully',
        updatedStudents: marksData.length
      };

    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      console.error('Transaction error:', error);
      return { 
        success: false, 
        error: 'Transaction failed',
        details: error.message 
      };
    }

  } catch (error) {
    console.error('Database error:', error);
    return { 
      success: false, 
      error: 'Database operation failed',
      details: error.message 
    };
  } 
});



