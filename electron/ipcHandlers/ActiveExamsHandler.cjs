const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

console.log("Active Exams Handler is loaded.");

// Main process IPC handlers


// Get available exams for current academic year
ipcMain.handle('get-active-exams', async (event, academicYearId) => {
  try {
    console.log("Fetching exams for year:", academicYearId);
    const stmt = db.prepare(`
      SELECT 
        e.ExamName,
        a.Id,
        a.AcademicYearId,
        a.ExamId,
        a.MajorMaxMark,
        a.MinorMaxMark,
        a.IsActive,
        a.Result_Published,
        a.Creation_at,
        a.Modified_at
      FROM 
        ActiveExams a
      JOIN 
        Exams e ON a.ExamId = e.Id
      WHERE 
        a.AcademicYearId = ?
   
    `);
    
    const exams = stmt.all(academicYearId);
    console.log("Fetched exams:", exams); // Debug log
    return { success: true, exams };
  } catch (err) {
    console.error("Error fetching exams:", err);
    return { success: false, message: err.message };
  }
});

// Insert new active exam (matches your schema)
ipcMain.handle('insert-active-exam', async (event, examData) => {
  // Validate required fields
  if (!examData.ExamId || examData.MajorMaxMark === undefined || examData.MinorMaxMark === undefined) {
    return { success: false, message: 'Missing required fields' };
  }

  const transaction = db.transaction(() => {
    try {
      // First deactivate all active exams if this one should be active
      if (examData.IsActive) {
        const deactivateStmt = db.prepare(`
          UPDATE ActiveExams 
          SET IsActive = 0 
          WHERE AcademicYearId = ?
        `);
        deactivateStmt.run(examData.AcademicYearId);
      }

      // Get ExamName from Exams table
      const examName = db.prepare(`
        SELECT ExamName FROM Exams WHERE Id = ?
      `).get(examData.ExamId)?.ExamName;

      if (!examName) {
        return { success: false, message: 'Invalid ExamId provided' };
      }

      // Then insert the new exam
      const stmt = db.prepare(`
        INSERT INTO ActiveExams (
          AcademicYearId,
          ExamId,
          MajorMaxMark,
          MinorMaxMark,
          IsActive,
          Result_Published,
          PublishDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        examData.AcademicYearId,
        examData.ExamId,
        examData.MajorMaxMark,
        examData.MinorMaxMark,
        examData.IsActive ? 1 : 0,
        examData.Result_Published ? 1 : 0,
        examData.PublishDate || null
      );
      
      return { success: true, id: result.lastInsertRowid };
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return { success: false, message: 'This exam already exists for the academic year' };
      }
      return { success: false, message: err.message };
    }
  });
  
  return transaction();
});

// Update Active Exam (matches your schema)
ipcMain.handle('update-active-exam', async (event, examData) => {
  // Validate required fields
  if (!examData.Id || !examData.ExamId || 
      examData.MajorMaxMark === undefined || 
      examData.MinorMaxMark === undefined) {
    return { success: false, message: 'Missing required fields' };
  }

  const transaction = db.transaction(() => {
    try {
      // If activating this exam, deactivate others first
      if (examData.IsActive) {
        const deactivateStmt = db.prepare(`
          UPDATE ActiveExams 
          SET IsActive = 0 
          WHERE AcademicYearId = ? AND Id != ?
        `);
        deactivateStmt.run(examData.AcademicYearId, examData.Id);
      }

      const stmt = db.prepare(`
        UPDATE ActiveExams SET
          MajorMaxMark = ?,
          MinorMaxMark = ?,
          IsActive = ?,
          Result_Published = ?,
          PublishDate = ?,
          Modified_at = CURRENT_TIMESTAMP
        WHERE Id = ?
      `);
      
      const result = stmt.run(
        examData.MajorMaxMark,
        examData.MinorMaxMark,
        examData.IsActive ? 1 : 0,
        examData.Result_Published ? 1 : 0,
        examData.PublishDate || null,
        examData.Id
      );
      
      return { success: result.changes > 0 };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
  
  return transaction();
});

// Delete Active Exam
ipcMain.handle('delete-active-exam', async (event, examId) => {
  try {
    const stmt = db.prepare('DELETE FROM ActiveExams WHERE Id = ?');
    const result = stmt.run(examId);
    return { success: result.changes > 0 };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

//To fetch Max Marks
ipcMain.handle('get-current-exam', async () => {
  try {
    const stmt = db.prepare(`
      SELECT 
          e.ExamName,
          a.Id,
          a.AcademicYearId,
          a.ExamId,
          a.MajorMaxMark,
          a.MinorMaxMark,
          a.Result_Published
      FROM 
          ActiveExams a
      JOIN 
          Exams e ON a.ExamId = e.Id
      WHERE 
          a.IsActive = 1    
     
    `);
   
    return stmt.get();
  } catch (err) {
    return { success: false, message: err.message };
  }
});