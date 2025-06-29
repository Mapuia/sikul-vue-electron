const { ipcMain, dialog } = require('electron');
const { db } = require('../database.cjs');


// Get all signatories
ipcMain.handle('get-signatories', () => {
  try {
    const stmt = db.prepare(`
        Select * FROM Signatories where IsActive = 1 
        order by case
        when SignatoryType = 'Head' then 1
        else 2        
        end
    `);
    const signatories = stmt.all();

    for (const signatory of signatories) {
      if(signatory.ClassId) {
        const classStmt = db.prepare(`SELECT ClassName FROM Classes WHERE Id = ?`);
        const classData = classStmt.get(signatory.ClassId);
        signatory.ClassName = classData ? classData.ClassName : null;
      }
    
    if(signatory.SectionId) {
      const sectionStmt = db.prepare(`SELECT SectionName FROM Sections WHERE Id = ?`);
      const sectionData = sectionStmt.get(signatory.SectionId);
      signatory.SectionName = sectionData ? sectionData.SectionName : null;
    }
  }

    //console.log('Fetched signatories:', signatories);
    return { success: true, signatories };
} catch (error) {
    console.error("Database error:", error);
    // Handle error appropriately
}
});

// Insert new signatory
ipcMain.handle('insert-signatory', (event, data) => {
  try {
    //console.log('Inserting signatory:', data);
    const stmt = db.prepare(`
      INSERT INTO Signatories (
        ClassId, SectionId, SignatoryType, Designation, Name, SignatureImage, IsActive
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      data.ClassId,
      data.SectionId,
      data.SignatoryType,
      data.Designation,
      data.Name,
      data.SignatureImage || null,
      data.IsActive ? 1 : 0
    );
    return { success: true };
  } catch (err) {
    console.error('Insert signatory error:', err);
    return { success: false, message: err.message };
  }
});

// Update signatory
ipcMain.handle('update-signatory', (event, id, data) => {
  try {
    const stmt = db.prepare(`
      UPDATE Signatories
      SET ClassId = ?, SectionId = ?, SignatoryType = ?, Designation = ?, Name = ?, SignatureImage = ?, IsActive = ?
      WHERE Id = ?
    `);
    stmt.run(
      data.ClassId,
      data.SectionId,
      data.SignatoryType,
      data.Designation,
      data.Name,
      data.SignatureImage || null,
      data.IsActive ? 1 : 0,
      id
    );
    return { success: true };
  } catch (err) {
    console.error('Update signatory error:', err);
    return { success: false, message: err.message };
  }
});

// Delete signatory
ipcMain.handle('delete-signatory', (event, id) => {
  try {
    const stmt = db.prepare(`DELETE FROM Signatories WHERE Id = ?`);
    stmt.run(id);
    return { success: true };
  } catch (err) {
    console.error('Delete signatory error:', err);
    return { success: false, message: err.message };
  }
});

ipcMain.handle('get-teacher-signatory', (event,  { classId, sectionId }) => {
  try {
    const stmt = db.prepare(`
      SELECT Name, Designation FROM Signatories
      WHERE SignatoryType = ? AND IsActive = 1
      AND ClassId = ? AND SectionId = ?      
    `)
    const result = stmt.get('ClassTeacher', classId, sectionId)
    //console.log("Teacher Signatory:", result)
    return { success: true, data: result || null }
  } catch (error) {
    console.error('Error fetching teacher signatory:', error)
    return { success: false, error: error.message }
  }
})
