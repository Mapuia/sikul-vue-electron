const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

// IPC Handlers for Result
//////////////////////////////////////////////////////////////////////////////
//Fetch students based on exam and Year
//Fetch Marks for all subjects for each student
//Calculate total marks for each student
//Save it in CumulativeMarks Table

// Get classes for an exam

// Calculate marks for a class
ipcMain.handle('calculate-class-marks', async (event, { classId, activeExamId, academicYearId }) => {
  try {
    await db.run('BEGIN TRANSACTION')

    // Calculate and insert cumulative marks
    const query = `
      INSERT OR REPLACE INTO CumulativeMarks 
        (StudentId, ActiveExamId, TotalMaxMarks, TotalMarksObtained, AcademicYearId)
      SELECT 
        m.StudentId,
        m.ActiveExamId,
        SUM(m.MaxMark) AS TotalMaxMarks,
        SUM(m.MarksObtained) AS TotalMarksObtained,
        m.AcademicYearId
      FROM Marks m
      JOIN Students s ON m.StudentId = s.Id
      WHERE m.ActiveExamId = ? 
        AND m.AcademicYearId = ?
        AND s.ClassId = ?
      GROUP BY m.StudentId
    `
    const result = await db.run(query, [activeExamId, academicYearId, classId])
    
    await db.run('COMMIT')
    return { success: true, changes: result.changes }
  } catch (error) {
    await db.run('ROLLBACK')
    return { success: false, message: error.message }
  }
})

// Get calculated marks for a class
ipcMain.handle('get-calculated-marks', async (event, { classId, activeExamId, academicYearId }) => {
  try {
    const query = `
      SELECT 
        s.RollNo,
        s.Name AS studentName,
        cm.TotalMarksObtained,
        ROUND((cm.TotalMarksObtained / cm.TotalMaxMarks) * 100, 2) AS Percentage
      FROM CumulativeMarks cm
      JOIN Students s ON cm.StudentId = s.Id
      WHERE cm.ActiveExamId = ?
        AND cm.AcademicYearId = ?
        AND s.ClassId = ?
      ORDER BY cm.TotalMarksObtained DESC
    `
    const marks = await db.all(query, [activeExamId, academicYearId, classId])
    return { success: true, marks }
  } catch (error) {
    return { success: false, message: error.message }
  }
})

// Generate final results
ipcMain.handle('generate-results', async (event, { activeExamId, academicYearId }) => {
  try {
    await db.run('BEGIN TRANSACTION')

    // First delete existing results if any
    await db.run('DELETE FROM Results WHERE ActiveExamId = ? AND AcademicYearId = ?', [activeExamId, academicYearId])

    // Calculate ranks and insert results
    const query = `
      INSERT INTO Results 
        (AcademicYearId, StudentId, ActiveExamId, TotalMarksObtained, Percentage, Division, Rank, ResultStatus)
      SELECT
        cm.AcademicYearId,
        cm.StudentId,
        cm.ActiveExamId,
        cm.TotalMarksObtained,
        ROUND((cm.TotalMarksObtained / cm.TotalMaxMarks) * 100, 2) AS Percentage,
        CASE 
          WHEN (cm.TotalMarksObtained / cm.TotalMaxMarks) >= 0.8 THEN 'Distinction'
          WHEN (cm.TotalMarksObtained / cm.TotalMaxMarks) >= 0.6 THEN 'First'
          WHEN (cm.TotalMarksObtained / cm.TotalMaxMarks) >= 0.45 THEN 'Second'
          WHEN (cm.TotalMarksObtained / cm.TotalMaxMarks) >= 0.33 THEN 'Third'
          ELSE 'Fail'
        END AS Division,
        RANK() OVER (ORDER BY (cm.TotalMarksObtained / cm.TotalMaxMarks) DESC) AS Rank,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM Marks m 
            WHERE m.StudentId = cm.StudentId 
              AND m.ActiveExamId = cm.ActiveExamId 
              AND m.Status = 'Fail'
          ) THEN 'Fail'
          ELSE 'Pass'
        END AS ResultStatus
      FROM CumulativeMarks cm
      WHERE cm.ActiveExamId = ? AND cm.AcademicYearId = ?
    `
    const result = await db.run(query, [activeExamId, academicYearId])
    
    await db.run('COMMIT')
    return { success: true, changes: result.changes }
  } catch (error) {
    await db.run('ROLLBACK')
    return { success: false, message: error.message }
  }
})

//Get generated Result
ipcMain.handle('get-generated-results', async (event, { activeExamId, academicYearId }) => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM Results
      WHERE ActiveExamId = ? AND academicYearId = ?
    `)

    const results = stmt.all(activeExamId, academicYearId)

    return {
      success: true,
      results
    }
  } catch (error) {
    console.error('Error fetching generated results:', error)
    return {
      success: false,
      message: error.message
    }
  }
})