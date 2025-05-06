const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

ipcMain.handle('get-students-by-class-and-section', (event, data) => {
    const { classId, sectionId } = data;
    const stmt = db.prepare(`
      SELECT
        s.Id as StudentId,
        s.Name,
        a.RollNo
      FROM Students s
      JOIN Admission a ON s.Id = a.StudentId
      WHERE a.ClassId = ? AND a.SectionId = ?
    `);
    const rows = stmt.all(classId, sectionId); // Correct parameters
    console.log("Students by class in Handler:", rows);
    return { success: true, students: rows }; // Also return the result
  });
  
  ipcMain.handle('save-marks', (event, data) => {
    return new Promise((resolve, reject) => {
      db.serialize( () => {
          db.run('BEGIN TRANSACTION;');
          let error = null;
          for (const markEntry of data) {
            const { StudentId, SubjectId, ExamId, AcademicYearId, MarksObtained } = markEntry;
            const stmt = db.prepare(`
              INSERT INTO Marks (StudentId, SubjectId, ExamId, AcademicYearId, MarksObtained)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT (StudentId, SubjectId, ExamId, AcademicYearId) DO UPDATE SET
                MarksObtained = ?
            `);
            stmt.run(StudentId, SubjectId, ExamId, AcademicYearId, MarksObtained, (err) => {
              if (err) {
                  error = err;
                  console.error('Error saving marks:', err);
                  // No reject here, handle all errors, and rollback.
              }
            });
            stmt.finalize();
          }
          if (error) {
              db.run('ROLLBACK;');
              resolve({ success: false, error: error.message || 'Failed to save all marks' }); // Reject with the error
          } else {
              db.run('COMMIT;', (err) => {
                  if(err){
                    console.error("Commit Error", err);
                     resolve({success: false, error: err.message})
                  }
                  else{
                    resolve({ success: true }); // Resolve only if the transaction is successful
                  }
  
              });
          }
      });
    });
  });
  