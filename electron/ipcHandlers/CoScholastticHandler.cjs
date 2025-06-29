const { ipcMain } = require('electron');
const { db } = require('../database.cjs');


//////////////////////////////////////////////////////////////////////////////Activity Grades
ipcMain.handle('get-coscholastic-marks', async (event, { examId, subjectId }) => {
  try {
    const stmt = db.prepare(`
      SELECT StudentId, Grade, Appeared
      FROM CoScholasticMarks
      WHERE ActiveExamId = ? AND SubjectId = ? 
    `)
    const grades = stmt.all(examId, subjectId)
    //console.log('Co-Scholastic Marks:', grades)
    return { success: true, grades }
  } catch (error) {
    console.error('Error fetching Co-Scholastic Marks:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-coscholastic-marks-by-student', async (event, { examId, studentId }) => {
  try {
    const stmt = db.prepare(`
      SELECT s.SubjectName as ActivityName, 
      c.Grade, c.Appeared,
      FROM CoScholasticMarks c
      JOIN Subjects s ON c.SubjectId = s.Id
      WHERE ActiveExamId = ? AND StudentId = ? 
    `)
    const grades = stmt.all(examId, studentId)
    return { success: true, grades }
  } catch (error) {
    console.error('Error fetching Co-Scholastic Marks:', error)
    return { success: false, error: error.message }
  }
})

///////////////////////////////Save Co-Scholastic Activity Grades..
ipcMain.handle('save-coscholastic-marks', async (event, gradesData) => {
  if (!gradesData || !Array.isArray(gradesData)) {
    //console.log("Invalid CoScholastic data received:", gradesData);
    return { success: false, error: "Invalid grades data format" };
  }

  const insertOrUpdate = db.prepare(`
    INSERT INTO CoScholasticMarks (
      StudentId,
      SubjectId,
      ActiveExamId,
      Grade,
      Appeared,
      Last_Modified_at
    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(StudentId, SubjectId, ActiveExamId)
    DO UPDATE SET
      Grade = excluded.Grade,
      Appeared = excluded.Appeared,
      Last_Modified_at = CURRENT_TIMESTAMP
  `);

  const transaction = db.transaction((gradesData) => {
    for (const grade of gradesData) {
      const {
        StudentId,
        SubjectId,
        ActiveExamId,
        Grade,
        Appeared
      } = grade;

      if (!StudentId || !SubjectId || !ActiveExamId) {
        throw new Error(`Missing required fields for student ${StudentId}`);
      }

      const normalizedGrade = Grade?.toString().toUpperCase();
      const appeared = 1

      insertOrUpdate.run(
        StudentId,
        SubjectId,
        ActiveExamId,
        normalizedGrade,
        appeared ? 1 : 0 // Convert to integer for SQLite
      );
    }
  });

  try {
    transaction(gradesData);
    return {
      success: true,
      message: `${gradesData.length} co-scholastic marks saved successfully`
    };
  } catch (error) {
    console.error('Error saving co-scholastic marks:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
});

