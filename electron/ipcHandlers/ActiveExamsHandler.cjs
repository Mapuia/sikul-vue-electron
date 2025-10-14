const { ipcMain } = require('electron');
const { db } = require('../database.cjs');
const currentTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString();

function toCamelCase(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [
      key.charAt(0).toLowerCase() + key.slice(1),
      val
    ])
  );
}


// Get active exams for current academic year
ipcMain.handle('get-active-exams', async (event, academicYearId) => {
  try {
    const stmt = db.prepare(`
      SELECT ae.*, e.ExamName, e.ExamType, ay.YearName as AcademicYearName
      FROM ActiveExams ae
      JOIN Exams e ON ae.ExamId = e.Id
      JOIN AcademicYears ay ON ae.AcademicYearId = ay.Id
      WHERE ae.AcademicYearId = ?
      ORDER BY e.Id
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
        Modified_at = ?
      WHERE Id = ?
    `);
    
    stmt.run(
      examData.MajorMaxMark,
      examData.MinorMaxMark,
      examData.PassingPercentage,
      currentTime,
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
      SET IsActive = 0, Modified_at = ?
      WHERE AcademicYearId = ?
    `);
    stmt.run(currentTime, academicYearId);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Get Current Active exams for current academic year only
ipcMain.handle('get-current-exam', async (event, yearId) => {
  
  try {
    // Prepare all statements first
    const periodicStmt = db.prepare(`
      SELECT ae.*, e.ExamName, e.ExamType
      FROM ActiveExams ae
      JOIN Exams e ON ae.ExamId = e.Id
      WHERE ae.AcademicYearId = ? AND e.ExamType = 'periodic'
    `);
    
    const terminalStmt = db.prepare(`
      SELECT ae.*, e.ExamName, e.ExamType
      FROM ActiveExams ae
      JOIN Exams e ON ae.ExamId = e.Id
      WHERE ae.AcademicYearId = ? AND e.ExamType = 'terminal'
    `);

    const annualStmt = db.prepare(`
      SELECT ae.*, e.ExamName, e.ExamType
      FROM ActiveExams ae
      JOIN Exams e ON ae.ExamId = e.Id
      WHERE ae.AcademicYearId = ? AND e.ExamType = 'annual'
    `);

    // Execute queries
    const periodic = periodicStmt.get(yearId) || {};
    const terminal = terminalStmt.get(yearId) || {};
    const annual = annualStmt.get(yearId) || {};

    // Always include Result_Published with default false if not found
    return {
      periodic: {
        MajorMaxMark: periodic.MajorMaxMark || null,
        MinorMaxMark: periodic.MinorMaxMark || null
      },
      terminal: {
        MajorMaxMark: terminal.MajorMaxMark || null,
        MinorMaxMark: terminal.MinorMaxMark || null,
        PassingPercentage: terminal.PassingPercentage || null,
        Result_Published: terminal.Result_Published || false
      },
      final: {
        Result_Published: annual.Result_Published || false
      }
    };
  } catch (err) {
    console.error('Error getting current exam details', err);
    return { 
      success: false, 
      message: err.message,
      // Provide fallback structure
      periodic: { MajorMaxMark: null, MinorMaxMark: null, Result_Published: false },
      terminal: { MajorMaxMark: null, MinorMaxMark: null, PassingPercentage: null, Result_Published: false },
      annual: { Result_Published: false }
    };
  }
});

ipcMain.handle('activate-exam', async (EventTarget, Id) => {
  try{
    const result = db.prepare('UPDATE ActiveExams SET IsActive = 1 WHERE Id = ?').run(Id);
    //console.log('Activate Response:', result)
    if (result.length > 0 ){
      return { success: true}
    }
  }
  catch(err){
    return {
      success: false, message: err.message
    } 
  }
})


ipcMain.handle('get-active-exam-by-type', async (event, examType, YearId) => {
  try {
    const exam = db.prepare(`
      SELECT ae.Id, e.ExamType
      FROM ActiveExams ae
      JOIN Exams e ON ae.ExamId = e.Id
      WHERE e.ExamType = ? AND ae.AcademicYearId = ?
    `).get(examType, YearId)
   // console.log(exam)
    return { success: true, exam }
  } catch (error) {
    return { success: false, error: error.message }
  }
})


ipcMain.handle('get-exam-by-type', async (event, type, YearId) => {
  try {
    const exam = db.prepare(`
      SELECT ae.Id as Id, e.ExamName as ExamName
      FROM ActiveExams ae
      JOIN Exams e ON ae.ExamId = e.Id
      WHERE e.ExamType = ? AND ae.AcademicYearId = ?
    `).get("terminal", YearId)
    
    
    return { success: true, exam };
  } catch (error) {
    return { success: false, error: error.message }
  }
})





