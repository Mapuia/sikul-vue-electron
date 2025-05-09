const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

  ///////////////////////////////////////////////////////////////////////////////////////Class Section mapping  Handle
// Get class-section mappings
ipcMain.handle('get-class-section-mappings', async () => {
  try {
    const stmt = db.prepare(`
      SELECT 
        c.Id AS ClassId,
        c.ClassName,
        json_group_array(
          json_object(
            'SectionId', s.Id,
            'SectionName', s.SectionName
          )
        ) AS Sections
      FROM ClassSectionMapping m
      JOIN Classes c ON m.ClassId = c.Id
      JOIN Sections s ON m.SectionId = s.Id
      GROUP BY c.Id
      ORDER BY c.Id DESC
    `)
    
    const results = stmt.all()
    const data = results.map(row => ({
      ...row,
      Sections: JSON.parse(row.Sections)
    }))
    //console.log("ClassSectionsHandler:", data)
    return { success: true, data }
  } catch (err) {
    return { success: false, message: err.message }
  }
})

// Save class-section mappings
ipcMain.handle('save-class-section-mappings', async (event, mappings) => {
  const transaction = db.transaction(() => {
    try {
      // First delete existing mappings for this class
      const classId = mappings[0]?.ClassId
      if (!classId) throw new Error('Invalid class ID')
      
      const deleteStmt = db.prepare(`
        DELETE FROM ClassSectionMapping WHERE ClassId = ?
      `)
      deleteStmt.run(classId)

      // Then insert new mappings
      const insertStmt = db.prepare(`
        INSERT INTO ClassSectionMapping (ClassId, SectionId)
        VALUES (?, ?)
      `)
      
      for (const mapping of mappings) {
        insertStmt.run(mapping.ClassId, mapping.SectionId)
      }

      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  })

  return transaction()
})

// Delete class-section mapping
ipcMain.handle('delete-class-section-mapping', async (event, classId) => {
  try {
    const stmt = db.prepare(`
      DELETE FROM ClassSectionMapping WHERE ClassId = ?
    `)
    const result = stmt.run(classId)
    return { success: result.changes > 0 }
  } catch (err) {
    return { success: false, message: err.message }
  }
})

//
