const { ipcMain } = require('electron');
const { db } = require('../database.cjs');
const currentTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString();

///////////////////////////////////////////////////////////////////////////////////////                CREATE

//Insert Student and Admission
ipcMain.handle('insert-student-admission', (event, form) => {
  //console.log("Student Insert:", form);
  const studentId = crypto.randomUUID();

  const existingRollNo = db.prepare(`
    SELECT COUNT(*) as count 
    FROM Admissions 
    WHERE ClassId = ? AND SectionId = ? AND RollNo = ? AND AcademicYearId = ?
  `).get(form.ClassId, form.SectionId, form.RollNo, form.AcademicYearId).count;
  
  if (existingRollNo > 0) {    
    console.error('Duplicate Roll No. detected for the same Class & Section');      
    return { 
      success: false, 
      error: "Roll Number already assigned for the selected class and section.",
      duplicate: true
    };
  }
  
  const insertStudent = db.prepare(`
    INSERT INTO Students (
      Id, Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN, Contact, Address, PIN,
      FirstAdmissionDate, RegistrationNumber, Status, Caste, Religion, Height, Weight, BloodGroup, Creation_at
    ) VALUES (
      @Id, @Name, @Gender, @FathersName, @MothersName, @DOB, @Aadhaar, @APAR, @PEN, @Contact, @Address, @PIN,
      @FirstAdmissionDate, @RegistrationNumber, @Status, @Caste, @Religion, @Height, @Weight, @BloodGroup, @Creation_at
    )
  `);

  const insertAdmission = db.prepare(`
    INSERT INTO Admissions (
      StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType, Creation_at
    ) VALUES (
      @StudentId, @AcademicYearId, @ClassId, @SectionId, @RollNo, @AdmissionType, @Creation_at
    )
  `);

  const transaction = db.transaction((form) => {
    // Step 1: Insert into Students table
    const studentResult = insertStudent.run({
      Id: studentId,
      Name: form.name,
      Gender: form.gender,
      FathersName: form.fathersName,
      MothersName: form.mothersName,
      DOB: form.dob,
      Aadhaar: form.aadhaar || null,  // Ensure NULL instead of empty string
      APAR: form.apar || null,        // Ensure NULL instead of empty string
      PEN: form.pen || null,          // Ensure NULL instead of empty string
      Contact: form.contact,
      Address: form.address,
      PIN: form.pin,
      FirstAdmissionDate: form.admissionDate,
      RegistrationNumber: form.registrationNumber || null, // Ensure NULL instead of empty string
      Status: form.status || 'Admitted',
      Caste: form.caste,
      Religion: form.religion,
      Height: form.height,
      Weight: form.weight,
      BloodGroup: form.bloodGroup,
      Creation_at: currentTime
    });

    // Step 2: Insert into Admission table
    try {
      const admissionResult = insertAdmission.run({
        StudentId: studentId,
        AcademicYearId: form.academicYearId,
        ClassId: form.classId,
        SectionId: form.sectionId,
        RollNo: form.rollNo,
        AdmissionType: form.admissionType,
        Creation_at: currentTime
      });

      return {
        success: true,
        studentId,
        admissionId: admissionResult.lastInsertRowid
      };
    } catch (admissionError) {
      // Specifically catch the roll number unique constraint violation
      if (admissionError.message.includes('UNIQUE constraint failed: Admissions.AcademicYearId, Admissions.ClassId, Admissions.SectionId, Admissions.RollNo')) {
        throw new Error('Duplicate Roll No. Please assign a different Roll No.');
      }
      //throw admissionError; // Re-throw other errors
    }
  });

  try {
    return transaction(form);
  } catch (err) {
    console.error('Transaction failed:', err.message);
    // The error message will now be specific about roll number duplicates
    throw err;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////GET ADMISSION DETAILS
ipcMain.handle('get-admission-details', async (event, studentId, AcademicYearId) => {
  
  try {
    // Get admission details
    const admissionStmt = db.prepare(`
      SELECT 
        a.Id as admissionId,
        c.Id as classId,
        c.ClassName, 
        s.SectionName, a.RollNo, ay.YearName, a.AdmissionType, std.Id, std.Name, std.FathersName, std.Gender, std.PEN, std.APAR
      FROM Students std 
      LEFT JOIN Admissions a ON a.StudentId = std.Id
      LEFT JOIN Classes c ON c.Id = a.ClassId
      LEFT JOIN Sections s ON s.Id = a.SectionId
      JOIN AcademicYears ay ON ay.Id = a.AcademicYearId      
      WHERE a.StudentId = ? AND a.AcademicYearId = ?
    `);

  // Also fetch Some Details from Last Year Result
   const admission = admissionStmt.get(studentId, AcademicYearId);
   //console.log('AdmissionHandler- Fetch Addmission Details:', admission)
    return { 
      success: true, 
      admission: {
        ...admission
      }
    };
  } catch (error) {
    //console.log('Error:', error.message)
    return { success: false, error: error.message };
  }
});

// For Re-Admission - Fetch Previous Admission Details
ipcMain.handle('get-previous-admission', async (event, studentId, CurrentYearId, PreviousYearId) => {  
  try {
    // Get previous admission details
    // console.log('Student and YearID:', studentId, CurrentYearId, PreviousYearId) 
    const studentStmt = db.prepare(`
      SELECT Id, Name, FathersName, Aadhaar, APAR, PEN, FirstAdmissionDate, Status, RegistrationNumber
      FROM Students WHERE Id = ?
    `);
    const student = studentStmt.get(studentId);
       
    if (!student) {
      return { success: false, error: 'Student not found' };
    }
    const admissionStmt = db.prepare(`
      SELECT 
        a.*, c.ClassName, s.SectionName, ay.YearName as YearName
      FROM Admissions a
      JOIN Classes c ON c.Id = a.ClassId
      LEFT JOIN Sections s ON s.Id = a.SectionId AND a.SectionId != 0
      JOIN AcademicYears ay ON ay.Id = a.AcademicYearId
      WHERE a.StudentId = ?
      ORDER BY ay.YearName DESC
      LIMIT 1
    `);
   
    const admissions = admissionStmt.all(studentId);    
    const admission = admissions.length > 0 ? admissions[0] : null;
    
    //check whether student is already readmitted in current year or not, 
    let reAdmitted = false;
    let jumpReAdmission = false;
    if(admission && admission.AcademicYearId === CurrentYearId){
      reAdmitted = true;
    }
    // If there is an admission record but it's not for the previous year, it means the student has to jump years for readmission
    // This can happen if the student was not admitted in the previous year but had an admission record from an earlier year, 
    // or if the student was admitted in the previous year but is now applying for readmission in a later year without being readmitted in the immediate next year.
    // or student may have been studying in another school in the previous year and now seeking admission in current year, so there is an admission record but not for previous year, hence jump readmission
    else if(admission && admission.AcademicYearId != PreviousYearId){
      jumpReAdmission = true;
    }
    // console.log('Student Details:', student)        
    // console.log('Admission Details:', admission)        
    return { 
      success: true,
      student,
      admission: {
        ...admission
      },      
      reAdmitted: reAdmitted,
      jumpReAdmission: jumpReAdmission
    };
  } catch (error) {
    console.log('Error:', error.message)
    return { success: false, error: error.message };
  }
});

ipcMain.handle('readmit-student', async (event, admissionData) => {
    try{

      //console.log('Previous year ID:', admissionData.PreviousYearId)
      const currentAdmission = db.prepare(`
        SELECT ClassId, SectionId, RollNo FROM Admissions WHERE StudentId = ?
      `).get(admissionData.StudentId);

        //console.log('Current Admission:', currentAdmission)

      if (admissionData.RollNo !== currentAdmission.RollNo || 
          admissionData.ClassId !== currentAdmission.ClassId ||
          admissionData.SectionId !== currentAdmission.SectionId) {
        
        const duplicateCheck = db.prepare(`
          SELECT COUNT(*) as count 
          FROM Admissions 
          WHERE ClassId = ? AND SectionId = ? AND RollNo = ? AND StudentId != ? AND AcademicYearId = ?
        `).get(
          admissionData.ClassId,
          admissionData.SectionId,
          admissionData.RollNo,
          admissionData.StudentId,
          admissionData.AcademicYearId
        );
        //console.log("Duplicate", duplicateCheck.count)
        if (duplicateCheck.count > 0) {
          
          return { 
            success: false, 
            error: "Roll Number already assigned for the selected class and section.",
            duplicate: true
          };
        }
      }

      const promoteAdmission = db.prepare(`
        INSERT INTO Admissions
        (StudentId, AcademicYearId, ClassId, SectionId, RollNo, AdmissionType, Creation_at)
        VALUES
        (?, ?, ?, ?, ?, ?, ?)        

      `);
      promoteAdmission.run(
        admissionData.StudentId,
        admissionData.AcademicYearId,
        admissionData.ClassId,
        admissionData.SectionId,
        admissionData.RollNo,
        admissionData.AdmissionType,
        currentTime
      );

      const updatePreviousAdmission = db.prepare(`
        UPDATE Admissions
        SET reAdmitted = 1, Last_Modified_at = ?
        WHERE StudentId = ? AND AcademicYearId = ?
      `);
      updatePreviousAdmission.run(
        currentTime,
        admissionData.StudentId,
        admissionData.PreviousYearId       
      );
      
      return { success: true };
    } catch (error) {
      console.error('Promotion Error:', error.message);
      return { success: false, error: error.message };
    }
 
})

ipcMain.handle('update-admission',(event,payload)=>{
 // console.log('Admission Data:', payload)
  try{
    const updateAdmission = db.prepare(`
      UPDATE Admissions
      SET ClassId = ?, SectionId = ?, RollNo = ?, AdmissionType = ?, Last_Modified_at = ?
      WHERE Id = ?
    `);
    const updateAdmissionResult = updateAdmission.run(
      payload.ClassId,
      payload.SectionId,
      payload.RollNo,
      payload.AdmissionType,
      payload.AdmissionId,
      currentTime
    );
   // console.log('Admission Update Result:', updateAdmissionResult);
    return { success: true };
  } catch (error) {
    console.error('Update Error:', error.message);
    return { success: false, error: error.message };
  }
})
