const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

ipcMain.handle('get-stats', async (_event, { academicYearId, activeExamId }) => {

  //console.log("Input for stats:", academicYearId,activeExamId)
    try {
      const classSectionData = db.prepare(`
        SELECT 
          c.Id AS ClassId, c.ClassName, 
          s.Id AS SectionId, s.SectionName
        FROM ClassSectionMapping m
        JOIN Classes c ON m.ClassId = c.Id
        JOIN Sections s ON m.SectionId = s.Id
        ORDER BY c.Id, s.SectionName
      `).all()
     //console.log("Output for stats:",classSectionData)     
      const grouped = {}
  
      for (const row of classSectionData) {
        if (!grouped[row.ClassId]) {
          grouped[row.ClassId] = {
            ClassId: row.ClassId,
            ClassName: row.ClassName,
            Sections: []
          }
        }
  
        const totalStudents = db.prepare(`
          SELECT COUNT(*) as count FROM Admissions
          WHERE ClassId = ? AND SectionId = ? AND AcademicYearId = ?
        `).get(row.ClassId, row.SectionId, academicYearId).count
  
        const appeared = db.prepare(`
          SELECT COUNT(DISTINCT StudentId) as count FROM Marks
          WHERE ActiveExamId = ? AND AcademicYearId = ?
          AND StudentId IN (
            SELECT StudentId FROM Admissions
            WHERE ClassId = ? AND SectionId = ? AND AcademicYearId = ?
          )
        `).get(activeExamId, academicYearId, row.ClassId, row.SectionId, academicYearId).count
  
        grouped[row.ClassId].Sections.push({
          SectionId: row.SectionId,
          SectionName: row.SectionName,
          TotalStudents: totalStudents,
          StudentsAppeared: appeared
        })
      }
    //  console.log("Returned from stats:", Object.values(grouped))
      return  Object.values(grouped) 
    } catch (err) {
      return { success: false, message: err.message }
    }
  })
  