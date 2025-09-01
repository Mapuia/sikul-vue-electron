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
ipcMain.handle('insert-subject', async (event, subjectData) => {
  //console.log("Received subject data:", subjectData); // Debug log
  try {
    const stmt = db.prepare(`
      INSERT INTO Subjects (SubjectCode, SubjectName, SubjectCategory, FullMark, IsCore, DisplayOrder)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      subjectData.subjectCode,
      subjectData.subjectName,
      subjectData.subjectCategory,
      subjectData.fullMark,
      subjectData.isCore,
      subjectData.displayOrder
    );
    
    return { success: true };
  } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return { success: false, message: "Duplicate Subject Code or Subject Name" };
    }
    return { success: false, message: error.message };
  }
});

///////////////////////////////////////////////////////////////////////////////////////             UPDATE
ipcMain.handle('update-subject', async (event, subject) => {  // Remove the destructuring
  try {
    const stmt = db.prepare(`
      UPDATE Subjects
      SET SubjectCode = ?, SubjectName = ?, SubjectCategory = ?, 
          FullMark = ?, IsCore = ?, DisplayOrder = ?
      WHERE Id = ?
    `);
    stmt.run(
      subject.subjectCode,  // Add this
      subject.subjectName,
      subject.subjectCategory,
      subject.fullMark,
      subject.isCore,
      subject.displayOrder,
      subject.id
    );
    return { success: true };
    } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return { success: false, message: "Duplicate Subject Code or Subject Name" };
    }
    return { success: false, message: error.message };
  }
});

///////////////////////////////////////////////////////////////////////////////////////              DELETE
ipcMain.handle('delete-subject', async (event, Id) => {
  try {
    const stmt = db.prepare(`DELETE FROM Subjects WHERE Id = ?`);
    stmt.run(Id);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
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
    //console.log("Activities:", subjects);
    return { success: true, subjects };
  } catch (err) {
    console.error('Failed to get Co-Scholastic subjects:', err);
    return { success: false, message: err.message };
  }
});

