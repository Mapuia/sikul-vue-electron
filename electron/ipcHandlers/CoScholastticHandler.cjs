const { ipcMain } = require('electron');
const { db } = require('../database.cjs');


//////////////////////////////////////////////////////////////////////////////Activity Grades
ipcMain.handle('get-coscholastic-marks', async (event, { examId, subjectId, academicYearId }) => {
  try {
    const stmt = db.prepare(`
      SELECT StudentId, Grade
      FROM CoScholasticMarks
      WHERE ActiveExamId = ? AND SubjectId = ? AND AcademicYearId = ?
    `)
    const grades = stmt.all(examId, subjectId, academicYearId)
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
      AcademicYearId,
      Grade,
      Last_Modified_at
    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(StudentId, SubjectId, ActiveExamId)
    DO UPDATE SET
      Grade = excluded.Grade,
      Last_Modified_at = CURRENT_TIMESTAMP
  `);

  const transaction = db.transaction((grades) => {
    for (const grade of grades) {
      const {
        StudentId,
        SubjectId,
        ActiveExamId,
        AcademicYearId,
        Grade
      } = grade;

      if (!StudentId || !SubjectId || !ActiveExamId || !AcademicYearId) {
        throw new Error(`Missing required fields for student ${StudentId}`);
      }

      const normalizedGrade = Grade?.toString().toUpperCase();
      if (!['A', 'B', 'C'].includes(normalizedGrade)) {
        throw new Error(`Invalid grade (${Grade}) for student ${StudentId}`);
      }

      insertOrUpdate.run(
        StudentId,
        SubjectId,
        ActiveExamId,
        AcademicYearId,
        normalizedGrade
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