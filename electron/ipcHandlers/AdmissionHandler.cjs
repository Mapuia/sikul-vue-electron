const { ipcMain } = require('electron');
const { db } = require('../database.cjs');


///////////////////////////////////////////////////////////////////////////////////////                CREATE

//Insert Student and Admission
ipcMain.handle('insert-student-admission', (event, form) => {
  //console.log("Student Insert:", form)
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

ipcMain.handle('get-admission-details', async (event, studentId, AcademicYearId) => {
  
  try {
    // Get admission details
    const admissionStmt = db.prepare(`
      SELECT 
        c.ClassName, s.SectionName, a.RollNo, ay.YearName, a.AdmissionType, std.Name, std.FathersName, std.Gender, std.PEN, std.APAR
      FROM Classes c
      JOIN Admissions a ON a.ClassId = c.Id
      JOIN Sections s ON s.Id = a.SectionId
      JOIN AcademicYears ay ON ay.Id = a.AcademicYearId
      JOIN Students std ON std.Id = a.StudentId
      WHERE a.StudentId = ? AND a.AcademicYearId = ?
    `);

  // Also fetch Some Details from Last Year Result
   const admission = admissionStmt.get(studentId, AcademicYearId);
   console.log('AdmissionHandler- Fetch Addmission Details:', admission)
    return { 
      success: true, 
      admission: {
        ...admission
      } 
    };
  } catch (error) {
    console.log('Error:', error.message)
    return { success: false, error: error.message };
  }
});
