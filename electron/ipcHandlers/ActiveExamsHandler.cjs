const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

// Get all available exams for dropdown


// Get active exams for current academic year
ipcMain.handle('get-active-exams', async (event, academicYearId) => {
  try {
    const stmt = db.prepare(`
      SELECT ae.*, e.ExamName, e.ExamType, ay.YearName as AcademicYearName
      FROM ActiveExams ae
      JOIN Exams e ON ae.ExamId = e.Id
      JOIN AcademicYears ay ON ae.AcademicYearId = ay.Id
      WHERE ae.AcademicYearId = ?
      ORDER BY e.ExamName
    `);
    const exams = stmt.all(academicYearId);
    return { success: true, exams };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Insert new active exam
ipcMain.handle('insert-active-exam', async (event, examData) => {
  const transaction = db.transaction(() => {
    try {
      // First check if this exam already exists for this academic year
      const checkStmt = db.prepare(`
        SELECT 1 FROM ActiveExams 
        WHERE AcademicYearId = ? AND ExamId = ?
      `);
      const exists = checkStmt.get(examData.AcademicYearId, examData.ExamId);
      
      if (exists) {
        throw new Error('This exam already exists for the current academic year');
      }

      // Insert new active exam
      const insertStmt = db.prepare(`
        INSERT INTO ActiveExams (
          AcademicYearId, ExamId, MajorMaxMark, MinorMaxMark,
          PassingPercentage, IsActive, Result_Published
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const info = insertStmt.run(
        examData.AcademicYearId,
        examData.ExamId,
        examData.MajorMaxMark,
        examData.MinorMaxMark,
        examData.PassingPercentage,
        examData.IsActive,
        examData.Result_Published || 0
      );

      return { success: true, id: info.lastInsertRowid };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  return transaction();
});

// Update active exam
ipcMain.handle('update-active-exam', async (event, examData) => {
  try {
    const stmt = db.prepare(`
      UPDATE ActiveExams SET
        MajorMaxMark = ?,
        MinorMaxMark = ?,
        PassingPercentage = ?,
        Modified_at = CURRENT_TIMESTAMP
      WHERE Id = ?
    `);
    
    stmt.run(
      examData.MajorMaxMark,
      examData.MinorMaxMark,
      examData.PassingPercentage,
      examData.Id
    );
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Delete active exam
ipcMain.handle('delete-active-exam', async (event, examId) => {
  try {
    const stmt = db.prepare('DELETE FROM ActiveExams WHERE Id = ?');
    stmt.run(examId);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Deactivate all active exams for academic year
ipcMain.handle('deactivate-all-active-exams', async (event, academicYearId) => {
  try {
    const stmt = db.prepare(`
      UPDATE ActiveExams 
      SET IsActive = 0, Modified_at = CURRENT_TIMESTAMP
      WHERE AcademicYearId = ?
    `);
    stmt.run(academicYearId);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Get Current Active exams for current academic year only
ipcMain.handle('get-current-exam', async (event, yearId) => {
  //console.log("Current Exam:",yearId)  
  try {
    const stmt = db.prepare(`
      SELECT ae.*, e.ExamName, e.ExamType
      FROM ActiveExams ae
      JOIN Exams e ON ae.ExamId = e.Id
      WHERE ae.AcademicYearId = ?
      AND ae.IsActive = 1
    `);
    //console.log("Current Exam:",stmt.get(yearId))    
    return stmt.get(yearId);
  } catch (err) {
    return { success: false, message: err.message };
  }
});
