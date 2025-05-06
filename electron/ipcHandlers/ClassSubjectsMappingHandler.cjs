const { ipcMain } = require('electron');
const { db } = require('../database.cjs');
console.log("Mapping Handler");
////////////////////////////////////////////////////////////////////////////////Select Subjects based on Class
ipcMain.handle('get-subjects-by-class', async (event, className) => {
  try {
   // Get the database connection
    const query = `
      SELECT s.Id, s.SubjectName, s.SubjectCategory
      FROM Subjects s
      JOIN ClassSubjectMapping csm ON s.Id = csm.SubjectId
      JOIN Classes c ON csm.ClassId = c.Id
      WHERE c.ClassName = ?
    `;
    const params = [className];
    const subjects = await db.all(query, params);
    
    return { success: true, subjects };
  } catch (error) {
    console.error('Error fetching subjects by class:', error);
    return { success: false, message: 'Failed to fetch subjects.' };
  }
});
ipcMain.handle('get-subjects-by-classId', async (event, ClassId) => {
  try {
   // Get the database connection
    const stmt = db.prepare(`
      SELECT s.Id, s.SubjectName, s.SubjectCategory
      FROM Subjects s
      JOIN ClassSubjectMapping csm ON s.Id = csm.SubjectId
      JOIN Classes c ON csm.ClassId = c.Id
      WHERE c.Id = ?
    `);
   
    const subjects = stmt.all(ClassId);
    console.log('Subjects at Handler:', subjects);
  
    return { success: true, subjects };
  } catch (error) {
    console.error('Error fetching subjects by classId:', error);
    return { success: false, message: 'Failed to fetch subjects.' };
  }
});

////////////////////////////////////////////////////////////////////////////////////////Class Subject Mapping
ipcMain.handle('insert-class-subject-mapping', async (event, classId, subjectId) => {
  try {
    await db.insertClassSubjectMappingDb(classId, subjectId)
    return { success: true }
  } catch (error) {
    console.error(error)
    dialog.showErrorBox('Error', 'Failed to insert class-subject mapping.')
    return { success: false, error: error.message }
  }
});
///////////////////////////////////////////////////////////////////////////////////////

ipcMain.handle('get-class-subject-mappings', () => {
  try {
    const rows = db.prepare(`
      SELECT 
        csm.ClassId, 
        cls.ClassName, 
        s.Id AS SubjectId, 
        s.SubjectName,
        s.SubjectCategory
      FROM ClassSubjectMapping csm
      JOIN Classes cls ON csm.ClassId = cls.Id
      JOIN Subjects s ON csm.SubjectId = s.Id
      ORDER BY cls.ClassName, s.SubjectName
    `).all();

    const grouped = {};

    for (const row of rows) {
      if (!grouped[row.ClassId]) {
        grouped[row.ClassId] = {
          ClassId: row.ClassId,
          ClassName: row.ClassName,
          Subjects: []
        };
      }
      grouped[row.ClassId].Subjects.push({
        SubjectId: row.SubjectId,
        SubjectName: row.SubjectName,
        SubjectCategory: row.SubjectCategory
      });
    }
    
    return { success: true, data: Object.values(grouped) };
  } catch (error) {
    console.error('Error fetching class-subject mappings:', error);
    return { success: false, message: 'Database error: ' + error.message };
  }
});

///////////////////////////////////////////////////////////////////////////////////////
ipcMain.handle('save-class-subject-mappings', async (event, mappings) => {
  try {
    const idToDelete = mappings[0].ClassId;
    const delstmt = db.prepare('DELETE FROM ClassSubjectMapping WHERE ClassId = ?').run(idToDelete);
    if(delstmt){
      const stmt = db.prepare('INSERT OR REPLACE INTO ClassSubjectMapping (ClassId, SubjectId) VALUES (?, ?)')

      const insert = db.transaction(() => {
        for (const mapping of mappings) {
          stmt.run(mapping.ClassId, mapping.SubjectId)
        }
      })
      insert()
      return { success: true }
    }
    else{
      console.error('Error saving mappings:', err)
      return { success: false, message: "Failed to remove existing Mapping" }
    }  
  } catch (err) {
    console.error('Error saving mappings:', err)
    return { success: false, message: err.message }
  }
})