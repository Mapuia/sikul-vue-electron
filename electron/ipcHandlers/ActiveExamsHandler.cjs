const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

console.log("Active Exams Handler is loaded.");
//ACTIVE EXAMS
//////////////////////////////////////////////////////////////////////////////             GET ACTIVE EXAM
// Get all active exams for a specific academic year
ipcMain.handle('get-active-exams', async (event, academicYearId) => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM ActiveExam 
      WHERE AcademicYearId = ?
      ORDER BY IsActive DESC, ExamName
    `);
    const data = stmt.all(academicYearId);
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

//get current Exam
ipcMain.handle('get-current-exam', async (event, CurrentYearId) => {
  console.log("iPC Handle:", CurrentYearId);
  try {
    const stmt = db.prepare(`
      SELECT * FROM ActiveExam 
      WHERE IsActive = 1
      AND AcademicYearId = ?
    `);
    const data = stmt.get(CurrentYearId);
    console.log(data);
    return stmt.get(CurrentYearId);
    
  } catch (err) {
    return { message: err.message };
  }
});


//insert Avtive exam
ipcMain.handle('insert-active-exam', async (event, examData) => {
  const transaction = db.transaction(() => {
    try {
      // First deactivate all active exams if this one should be active
      if (examData.IsActive) {
        const deactivateStmt = db.prepare(`
          UPDATE ActiveExam 
          SET IsActive = 0 
          WHERE AcademicYearId = ?
        `);
        deactivateStmt.run(examData.AcademicYearId);
      }

      // Then insert the new exam
      const stmt = db.prepare(`
        INSERT INTO ActiveExam (
          AcademicYearId, 
          ExamName, 
          MajorMaxMark, 
          MinorMaxMark, 
          CoScholasticMaxMark, 
          IsActive
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        examData.AcademicYearId,
        examData.ExamName,
        examData.MajorMaxMark || 0,  // Default to 0 if null
        examData.MinorMaxMark || 0,  // Default to 0 if null
        examData.CoScholasticMaxMark || 0,  // Default to 0 if null
        examData.IsActive ? 1 : 0
      );
      
      return { success: true, id: result.lastInsertRowid };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
  
  return transaction();
});

// Update Active Exam
ipcMain.handle('update-active-exam', async (event, examData) => {
  const transaction = db.transaction(() => {
    try {
      // If activating this exam, deactivate others first
      if (examData.IsActive) {
        const deactivateStmt = db.prepare(`
          UPDATE ActiveExam 
          SET IsActive = 0 
          WHERE AcademicYearId = ? AND Id != ?
        `);
        deactivateStmt.run(examData.AcademicYearId, examData.Id);
      }
    
      const stmt = db.prepare(`
        UPDATE ActiveExam SET
          ExamName = ?,
          MajorMaxMark = ?,
          MinorMaxMark = ?,
          CoScholasticMaxMark = ?,
          IsActive = ?,
          Modified_at = CURRENT_TIMESTAMP
        WHERE Id = ?
      `);
      
      const result = stmt.run(
        examData.ExamName,
        examData.MajorMaxMark || 0,
        examData.MinorMaxMark || 0,
        examData.CoScholasticMaxMark || 0,
        examData.IsActive ? 1 : 0,
        examData.Id
      );
      
      return { success: result.changes > 0 };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
  
  return transaction();
});

// Delete active exam
ipcMain.handle('delete-active-exam', async (event, examId) => {
  try {
    const stmt = db.prepare('DELETE FROM ActiveExam WHERE Id = ?');
    const result = stmt.run(examId);
    return { success: result.changes > 0 };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Deactivate all active exams for an academic year
ipcMain.handle('deactivate-all-active-exams', async (event, academicYearId) => {
  try {
    const stmt = db.prepare(`
      UPDATE ActiveExam 
      SET IsActive = 0, Modified_at = CURRENT_TIMESTAMP
      WHERE AcademicYearId = ? AND IsActive = 1
    `);
    const result = stmt.run(academicYearId);
    return { success: true, deactivatedCount: result.changes };
  } catch (err) {
    return { success: false, message: err.message };
  }
});