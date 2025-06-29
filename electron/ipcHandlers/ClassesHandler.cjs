const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

//console.log("Class Handler loaded Successfully");
//////////////////////////////////////////////////////////////////////////////////////READ/GET
ipcMain.handle('get-classes', () => {
  try {
    const stmt = db.prepare('SELECT * FROM Classes');
    const classes = stmt.all();
    return { success: true, classes };
  } catch (err) {
    console.error('Failed to get classes:', err);
    return { success: false, message: err.message };
  }
});

//////////////////////////////////////////////////////////////////////////////////////INSERT
ipcMain.handle('insert-class', async (event, classId, className) => {
  try {
    const stmt = db.prepare('INSERT INTO Classes (ClassId, ClassName, Teacher) VALUES (?, ?, ?)');
    stmt.run(classId, className);
    return { success: true };
  } catch (err) {
    console.error('Failed to insert class:', err);
    return { success: false, message: err.message };
  }
});
  
//////////////////////////////////////////////////////////////////////////////////////UPDATE
ipcMain.handle('update-class', async (event, id, classId, newClassName) => {
  try {
    const checkStmt = db.prepare(`
      SELECT COUNT(*) as count FROM Classes 
      WHERE ClassName = ? AND Teacher = ? AND ClassId = ? AND Id != ?
    `);
    const exists = checkStmt.get(newClassName, classId, id);

    if (exists.count > 0) {
      return { success: false, message: 'Class with same name, ID, and teacher already exists' };
    }

    const updateStmt = db.prepare(`
      UPDATE Classes 
      SET ClassName = ?, Teacher = ?, ClassId = ?
      WHERE Id = ?
    `);
    const result = updateStmt.run(newClassName, classId, id);

    return result.changes > 0
      ? { success: true }
      : { success: false, message: 'No changes made - class not found' };
  } catch (err) {
    console.error('Update class error:', err);
    return { success: false, message: err.message };
  }
});


//////////////////////////////////////////////////////////////////////////////////////DELETE
ipcMain.handle('delete-class', async (event, classId) => {
  try {
    const stmt = db.prepare('DELETE FROM Classes WHERE Id = ?');
    const result = stmt.run(classId);

    return result.changes > 0
      ? { success: true }
      : { success: false, message: 'Class not found' };
  } catch (err) {
    console.error('Delete class error:', err);
    return { success: false, message: err.message };
  }
});

