const { ipcMain } = require('electron');
const { db } = require('../database.cjs');


//////////////////////////////////////////////////////////////////////////////////////                  GET
ipcMain.handle('get-sections-by-class', async (event, ClassId) => {
  try {
    console.log("Handler ClassId:(AdmissionHandler.cjs)", ClassId)
    const stmt = db.prepare(`SELECT 
      s.Id, s.SectionName FROM Sections AS s
      JOIN
      ClassSectionMapping AS m
      ON
      s.Id = m.SectionId
      WHERE
      m.ClassId = ?`);
    const sections = stmt.all(ClassId);
    console.log("Handler Sections:", sections)
    return { success: true, sections };
  } catch (err) {
    console.error('Failed to get subjects:', err);
    return { success: false, message: err.message };
  }
});

///////////////////////////////////////////////////////////////////////////////////////                CREATE

//Insert Student and Admission
ipcMain.handle('insert-student-admission', (event, form) => {
  const insertStudent = db.prepare(`
    INSERT INTO Students (
      Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN, Contact, Address,
      FirstAdmissionDate, Status, Caste, Religion, Height, Weight, BloodGroup
    ) VALUES (
      @Name, @Gender, @FathersName, @MothersName, @DOB, @Aadhaar, @APAR, @PEN, @Contact, @Address,
      @FirstAdmissionDate, @Status, @Caste, @Religion, @Height, @Weight, @BloodGroup
    )
  `);

  const insertAdmission = db.prepare(`
    INSERT INTO Admissions (
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
      FathersName: form.fathersName,
      MothersName: form.mothersName,
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
      success: true,
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
