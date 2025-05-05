const { ipcMain } = require('electron');
const { getDatabase } = require('../database.cjs');
const db = getDatabase()

//////////////////////////////////////////////////////////////////////////////////////                  GET
ipcMain.handle('get-sections-by-class', async (event, ClassId) => {
  try {
    const stmt = db.prepare(`SELECT 
      s.Id, s.SectionName FROM Sections AS s
      JOIN
      ClassSectionMapping AS m
      ON
      s.Id = m.SectionId
      WHERE
      m.ClassId = ?`);
    const sections = stmt.all(ClassId);
    return { success: true, sections };
  } catch (err) {
    console.error('Failed to get subjects:', err);
    return { success: false, message: err.message };
  }
});

///////////////////////////////////////////////////////////////////////////////////////                CREATE
ipcMain.handle('insert-student-admission', async (event, form) => {
  try {
      const stmt = db.prepare(
        'INSERT INTO Exams (ExamName, Description) VALUES (?, ?)'
      );
      stmt.run(examName, description);
      return {success: true};
    } catch (error) {
      console.error('Failed to insert exam:', error);
      throw error;
    }
});

//Insert Student and Admission
// In your main process or preload (e.g., `main.js` or `preload.js`)
const { ipcMain } = require('electron');
const db = require('./path/to/database'); // better-sqlite3 instance

ipcMain.handle('insertStudentAndAdmission', (event, form) => {
  const insertStudent = db.prepare(`
    INSERT INTO Students (
      Name, Gender, fathersName, mothersName, DOB, Aadhaar, APAR, PEN, Contact, Address,
      FirstAdmissionDate, Status, Caste, Religion, Height, Weight, BloodGroup
    ) VALUES (
      @Name, @Gender, @fathersName, @mothersName, @DOB, @Aadhaar, @APAR, @PEN, @Contact, @Address,
      @FirstAdmissionDate, @Status, @Caste, @Religion, @Height, @Weight, @BloodGroup
    )
  `);

  const insertAdmission = db.prepare(`
    INSERT INTO Admission (
      StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType
    ) VALUES (
      @StudentId, @AcademicYearId, @ClassId, @SectionId, @RollNo, @AdmissionType
    )
  `);

  const transaction = db.transaction((form) => {
    // Step 1: Insert into Students table
    const studentResult = insertStudent.run({
      Name: form.name,
      Gender: form.gender,
      fathersName: form.fathersName,
      mothersName: form.mothersName,
      DOB: form.dob,
      Aadhaar: form.aadhaar,
      APAR: form.apar,
      PEN: form.pen,
      Contact: form.contact,
      Address: form.address,
      FirstAdmissionDate: form.firstAdmissionDate,
      Status: form.status || 'Admitted',
      Caste: form.caste,
      Religion: form.religion,
      Height: form.height,
      Weight: form.weight,
      BloodGroup: form.bloodGroup
    });

    const studentId = studentResult.lastInsertRowid;

    // Step 2: Insert into Admission table
    const admissionResult = insertAdmission.run({
      StudentId: studentId,
      AcademicYearId: form.academicYearId,
      ClassId: form.classId,
      SectionId: form.sectionId,
      RollNo: form.rollNo,
      AdmissionType: form.admissionType
    });

    return {
      studentId,
      admissionId: admissionResult.lastInsertRowid
    };
  });

  try {
    return transaction(form);
  } catch (err) {
    console.error('Transaction failed:', err.message);
    throw err;
  }
});
