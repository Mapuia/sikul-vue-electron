const { ipcMain } = require('electron');
const { db } = require('../database.cjs');
const currentTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString();

///////////////////////////////////////////////////////////////////////////////////////                CREATE

//Insert Student and Admission
ipcMain.handle('insert-student-admission', (event, form) => {
  console.log("Student Insert:", form);
  const studentId = crypto.randomUUID();
  
  const insertStudent = db.prepare(`
    INSERT INTO Students (
      Id, Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN, Contact, Address, PIN,
      FirstAdmissionDate, Status, Caste, Religion, Height, Weight, BloodGroup, Creation_at
    ) VALUES (
      @Id, @Name, @Gender, @FathersName, @MothersName, @DOB, @Aadhaar, @APAR, @PEN, @Contact, @Address, @PIN,
      @FirstAdmissionDate, @Status, @Caste, @Religion, @Height, @Weight, @BloodGroup, @Creation_at
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
      throw admissionError; // Re-throw other errors
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

ipcMain.handle('get-previous-admission', async (event, studentId, AcademicYearId) => {  
  try {
    // Get previous admission details
    console.log('Student and YearID:', studentId, AcademicYearId) 
 
    const admissionStmt = db.prepare(`
      SELECT s.Id as studentId, s.Name as Name,
        a.RollNo, a.AdmissionType, c.ClassName, sec.SectionName,
        s.PEN, s.APAR
      FROM Students s
      LEFT JOIN Admissions a ON s.Id = a.StudentId
      LEFT JOIN Classes c ON a.ClassId = c.Id
      LEFT JOIN Sections sec ON a.SectionId = sec.Id       
      WHERE s.Id = ? 
        AND a.AcademicYearId = ?       
        AND a.reAdmitted = 0     
    `);
    const lastResultStmt = db.prepare(`
      SELECT * FROM Results
      WHERE StudentId = ? AND AcademicYearId = ? AND ResultType = 'final'
    `);
    const admission = admissionStmt.get(studentId, AcademicYearId);
    let lastResults = null;
    if(admission.ClassName!== 'X'){
      lastResults = lastResultStmt.all(studentId, AcademicYearId); 
    }

    console.log('Admission Data:', admission)
    console.log('Last Result Data:', lastResults)
    return { 
      success: true, 
      admission: {
        ...admission
      },
      lastResults: {
        ...lastResults
      }
    };
  } catch (error) {
    //console.log('Error:', error.message)
    return { success: false, error: error.message };
  }
});

ipcMain.handle('readmit-student', async (event, admissionData) => {
  
    // Get admission details
    //console.log('Promoted:', admissionData)
    try{
      const promoteAdmission = db.prepare(`
        INSERT OR REPLACE INTO Admissions
        (StudentId, AcademicYearId, ClassId, SectionId, RollNo, Admissiong, Creation_at)
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
        SET reAdmitted = 1
        WHERE StudentId = ? AND AcademicYearId = ? AND Last_Modified_at = ?
      `);
      updatePreviousAdmission.run(
        admissionData.StudentId,
        admissionData.PreviousYearId,
        currentTime
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
