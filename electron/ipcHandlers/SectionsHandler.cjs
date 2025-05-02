const { ipcMain } = require('electron');
const { getDatabase } = require('../database.cjs');
const db = getDatabase();
console.log("Exam Handler");

// Section IPC Handlers
//////////////////////////////////////////////////////////////////////////////             GET
ipcMain.handle('get-sections', async () => {
  try {
    const stmt = db.prepare('SELECT * FROM Sections ORDER BY SectionName');
    const sections = stmt.all();
    if(sections) return { success: true, sections };
    else return { success: false, message: error.message };
  } catch (err) {
    console.error('Failed to get sections:', err);
    throw err;
  }
});

//////////////////////////////////////////////////////////////////////////////             CREATE
ipcMain.handle('insert-section', async (event, sectionName) => {
  try {
    const stmt = db.prepare('INSERT INTO Sections (SectionName) VALUES (?)');
    stmt.run(sectionName);
    if(result.length>0) return {success: true};
        else {
          return {success: false};
        }
  } catch (err) {
    console.error('Failed to insert section:', err);
    throw err;
  }
});

//////////////////////////////////////////////////////////////////////////////             UPDATE
ipcMain.handle('update-section', async (event, sectionId, newSectionName) => {
     try {
      const stmt = db.prepare('UPDATE Sections SET SectionName = ? WHERE Id = ?');
      const result = stmt.run(newSectionName, sectionId);
      if(result.length>0) return {success: true};
        else {
          return {success: false};
        }
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return { success: false, message: 'New section name already exists.' };
      }
      return { success: false, message: err.message };
    }
});

//////////////////////////////////////////////////////////////////////////////             DELETE
ipcMain.handle('delete-section', async (event, SectionId) => {
  try {
      const stmt = db.prepare('DELETE FROM Sections WHERE Id = ?');
      const result = stmt.run(SectionId);
      if(result.length>0) return {success: true};
        else {
          return {success: false};
        }
    } catch (err) {
      console.error('Failed to delete section:', err);
      throw err;
    }
});