const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

ipcMain.handle('get-stats', async (_event, { academicYearId, activeExamId }) => {
    try {
      const classSectionData = db.prepare(`
        SELECT 
          c.Id AS ClassId, c.ClassName, 
          s.Id AS SectionId, s.SectionName
        FROM ClassSectionMapping m
        JOIN Classes c ON m.ClassId = c.Id
        JOIN Sections s ON m.SectionId = s.Id
        ORDER BY c.ClassName, s.SectionName
      `).all()
  
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
          SELECT COUNT(*) as count FROM Admission 
          WHERE ClassId = ? AND SectionId = ? AND AcademicYearId = ?
        `).get(row.ClassId, row.SectionId, academicYearId).count
  
        const appeared = db.prepare(`
          SELECT COUNT(DISTINCT StudentId) as count FROM Marks
          WHERE ActiveExamId = ? AND AcademicYearId = ?
          AND StudentId IN (
            SELECT StudentId FROM Admission
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
  
      return { success: true, data: Object.values(grouped) }
    } catch (err) {
      return { success: false, message: err.message }
    }
  })
  