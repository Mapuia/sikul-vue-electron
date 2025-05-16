const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

// New IPC Handlers for Exams
//////////////////////////////////////////////////////////////////////////////             GET
ipcMain.handle('get-exams', async () => {
    try {
        const stmt = db.prepare('SELECT * FROM Exams');
        const exams = stmt.all();
        return {success: true, exams};
      } catch (error) {
        console.error('Failed to get exams:', error);
        throw error;
      }
});

//////////////////////////////////////////////////////////////////////////////             CREATE
ipcMain.handle('insert-exam', async (event, examName, ExamType, description) => {
  try {
      const stmt = db.prepare(
        'INSERT INTO Exams (ExamName, ExamType, Description) VALUES (?, ?)'
      );
      stmt.run(examName, ExamType, description);
      return {success: true};
    } catch (error) {
      console.error('Failed to insert exam:', error);
      throw error;
    }
});

//////////////////////////////////////////////////////////////////////////////             UPDATE
ipcMain.handle('update-exam', async (event, id, examName, ExamType, description) => {
  try {
      const stmt = db.prepare(
        'UPDATE Exams SET ExamName = ?, ExamType = ?, Description = ? WHERE Id = ?'
      );
      const result = stmt.run(examName, ExamType, description, id);
      return { success: true};
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return { success: false, message: 'Exam name or Exam type already exists.' };
      }
      return { success: false, message: err.message };
    }
});

//////////////////////////////////////////////////////////////////////////////             DELETE
ipcMain.handle('delete-exam', async (event, examId) => {
  try {
    const stmt = db.prepare('DELETE FROM Exams WHERE Id = ?');
    stmt.run(examId); // use examId, not ExamId
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

