const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

//////////////////////////////////////////////////////////////////////////////////////                  GET
ipcMain.handle('get-subjects', async () => {
  try {
    const stmt = db.prepare('SELECT * FROM Subjects ORDER BY Id');
    const subjects = stmt.all();
    return { success: true, subjects };
  } catch (err) {
    console.error('Failed to get subjects:', err);
    return { success: false, message: err.message };
  }
});

///////////////////////////////////////////////////////////////////////////////////////                CREATE
ipcMain.handle('insert-subject', async (event, { subjectName, subjectCategory }) => {
  try {
    // Check if subject already exists (case-insensitive)
    const checkStmt = db.prepare(`
      SELECT COUNT(*) as count FROM Subjects 
      WHERE UPPER(SubjectName) = UPPER(?)
    `);
    const exists = checkStmt.get(subjectName);
    
    if (exists.count > 0) {
      return { success: false, message: 'Subject name already exists' };
    }

    // Insert new subject
    const insertStmt = db.prepare(`
      INSERT INTO Subjects (SubjectName, SubjectCategory) 
      VALUES (?, ?)
    `);
    const result = insertStmt.run(subjectName.toUpperCase(), subjectCategory);
    
    return { success: result.changes > 0 };
  } catch (err) {
    console.error('Failed to insert subject:', err);
    return { success: false, message: err.message };
  }
});

///////////////////////////////////////////////////////////////////////////////////////             UPDATE
ipcMain.handle('update-subject', async (event, { Id, subjectName, subjectCategory }) => {
  try {
    // Check if new name already exists (excluding current subject)
    const checkStmt = db.prepare(`
      SELECT COUNT(*) as count FROM Subjects 
      WHERE UPPER(SubjectName) = UPPER(?) AND Id != ?
    `);
    const exists = checkStmt.get(subjectName, Id);
    
    if (exists.count > 0) {
      return { success: false, message: 'Subject name already exists' };
    }

    // Update subject
    const stmt = db.prepare(`
      UPDATE Subjects 
      SET SubjectName = ?, SubjectCategory = ? 
      WHERE Id = ?
    `);
    const result = stmt.run(subjectName.toUpperCase(), subjectCategory, Id);
    
    return { success: result.changes > 0 };
  } catch (err) {
    console.error('Failed to update subject:', err);
    return { success: false, message: err.message };
  }
});

///////////////////////////////////////////////////////////////////////////////////////              DELETE
ipcMain.handle('delete-subject', async (event, subjectId) => {
  try {
    const stmt = db.prepare('DELETE FROM Subjects WHERE Id = ?');
    const result = stmt.run(subjectId);
    return { success: result.changes > 0 };
  } catch (err) {
    console.error('Failed to delete subject:', err);
    return { success: false, message: err.message };
  }
});

///////////////////////////////////////////////////////////////////////////////////// GET CO-SCHOLASTIC ACTIVITY
ipcMain.handle('get-coscholastic', async () => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM Subjects 
      WHERE SubjectCategory = 'Co-Scholastic' 
      ORDER BY Id
    `);
    const subjects = stmt.all();
    console.log("Activities:", subjects);
    return { success: true, subjects };
  } catch (err) {
    console.error('Failed to get subjects:', err);
    return { success: false, message: err.message };
  }
});