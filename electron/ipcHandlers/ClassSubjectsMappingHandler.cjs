const { ipcMain } = require('electron');
const { db } = require('../database.cjs');
//console.log("Mapping Handler");
////////////////////////////////////////////////////////////////////////////////Select Subjects based on Class

///For Managing Class-Subject Mapping
ipcMain.handle('get-subjects-for-class', async (event, classId) => {
  try {
    // 1. Get all subjects
    const allSubjectsStmt = db.prepare(`
      SELECT Id, SubjectName, SubjectCategory 
      FROM Subjects WHERE SubjectCategory IN ('Major', 'Minor')
      ORDER BY DisplayOrder, SubjectName
    `)
    const allSubjects = allSubjectsStmt.all()

    // 2. Get mapped subjects for the class
    const mappedStmt = db.prepare(`
      SELECT s.Id, s.SubjectName, s.SubjectCategory
      FROM ClassSubjectMapping csm
      JOIN Subjects s ON csm.SubjectId = s.Id
      WHERE csm.ClassId = ?
      ORDER BY s.DisplayOrder, s.SubjectName
    `)
    const mapped = mappedStmt.all(classId)

    // 3. Find unmapped by filtering out mapped
    const mappedIds = mapped.map(s => s.Id)
    const unmapped = allSubjects.filter(s => !mappedIds.includes(s.Id))

    return { success: true, mapped, unmapped }
  } catch (err) {
    console.error('Error fetching subjects for class:', err)
    return { success: false, message: err.message }
  }
})



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
ipcMain.handle('get-subjects-by-classId', async (event, ClassId, category) => {
  try {
   // Get the database connection
    const stmt = db.prepare(`
      SELECT s.Id, s.SubjectName, s.SubjectCategory
      FROM Subjects s
      JOIN ClassSubjectMapping csm ON s.Id = csm.SubjectId
      JOIN Classes c ON csm.ClassId = c.Id
      WHERE c.Id = ? 
    `);
   
    let subjects = [];
    // If category is 'coscholastic', fetch coscholastic subjects

    if (category === 'Co-Scholastic') {
      const coscholasticStmt = db.prepare(`
        SELECT Id, SubjectName
        FROM Subjects
        WHERE SubjectCategory = ?
      `);
      subjects = coscholasticStmt.all(category);      
     
    }else{
      subjects = stmt.all(ClassId);
    }
    return { success: true, subjects };
  } catch (error) {
    console.error('Error fetching subjects or Activities:', error);
    return { success: false, message: 'Failed to fetch subjects or Activities.' };
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

///////////////////////////Save Class Subject Mappings/////////////////////////////////////////

ipcMain.handle('save-class-subject-mappings', async (event, mappings) => {
  try {
    const classId = mappings.length > 0 ? mappings[0].ClassId : null;
    if (!classId) {
      return { success: false, message: 'No class selected' };
    }

    // Use a transaction to ensure atomic operation
    const transaction = db.transaction(() => {
      // Clear old mappings for this class
      db.prepare('DELETE FROM ClassSubjectMapping WHERE ClassId = ?').run(classId);

      // Insert new mappings
      const insertStmt = db.prepare(`
        INSERT INTO ClassSubjectMapping (ClassId, SubjectId)
        VALUES (?, ?)
      `);

      mappings.forEach(m => {
        insertStmt.run(m.ClassId, m.SubjectId);
      });
    });

    transaction();

    return { success: true };
  } catch (error) {
    console.error('Error saving mappings:', error);
    return { success: false, message: error.message };
  }
});
