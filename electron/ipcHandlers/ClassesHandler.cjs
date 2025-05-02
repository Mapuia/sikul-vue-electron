const { ipcMain } = require('electron');
const { getDatabase } = require('../database.cjs');
const db = getDatabase();
console.log("Class Handler");
//////////////////////////////////////////////////////////////////////////////////////READ/GET
ipcMain.handle('get-classes', () => {
  try {
      const stmt = db.prepare('SELECT * FROM Classes ORDER BY Id DESC');
      const classes = stmt.all();
      if(classes) return { success: true, classes };
      else return { success: false, message: error.message };
  
    } catch (err) {
      console.error('Failed to get classes:', err);
      throw err;
    }
});

//////////////////////////////////////////////////////////////////////////////////////INSERT
ipcMain.handle('insert-class', async (event, className) => {
    try {
      const stmt = db.prepare('INSERT INTO Classes (ClassName) VALUES (?)');
      stmt.run(className);
      return {success: true};
    } catch (err) {
      console.error('Failed to insert class:', err);
      throw err;
    }
});
  
//////////////////////////////////////////////////////////////////////////////////////UPDATE
ipcMain.handle('update-class', async (event, classId, newClassName) => {
  try {
    // First check if the new name already exists (excluding current class)
    const checkStmt = db.prepare(`
      SELECT COUNT(*) as count FROM Classes 
      WHERE ClassName = ? AND Id != ?
    `);
    const exists = checkStmt.get(newClassName, classId);
    
    if (exists.count > 0) {
      return { success: false, message: 'Class name already exists' };
    }

    // Update the class
    const updateStmt = db.prepare(`
      UPDATE Classes 
      SET ClassName = ? 
      WHERE Id = ?
    `);
    const result = updateStmt.run(newClassName, classId);
    
    if (result.changes > 0) {
      return { success: true };
    } else {
      return { success: false, message: 'No changes made - class not found' };
    }
    
  } catch (err) {
    console.error('Update class error:', err);
    return { success: false, message: err.message };
  }
});

//////////////////////////////////////////////////////////////////////////////////////DELETE
ipcMain.handle('delete-class', async (event, ClassId) => {
  try {
    const stmt = db.prepare('DELETE FROM Classes WHERE Id = ?');
    const result = stmt.run(ClassId);
    if(result.length>0) return {success: true};
        else {
          return {success: false};
        }
  } catch (err) {
    return { success: false, message: err.message };
  }
});
