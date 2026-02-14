 const { ipcMain } = require('electron');
const { db } = require('../database.cjs');
const currentTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString();

//STUDENTS PERSONAL INFORMATION
//1. Search Students in Students Table (Generally without Year)
ipcMain.handle('search-all-students', async (event, query) => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM Students  
      WHERE Name LIKE ? OR PEN LIKE ? OR APAR LIKE ?
      ORDER BY Name 
    `);
    const searchTerm = `%${query.query}%`;
    const students = stmt.all(searchTerm, searchTerm, searchTerm);
    return { success: true, students };
  } catch (error) {
    return { success: false, message: error.message, students: [] };
  }
});

ipcMain.handle('search-students-for-readmission', async (event, query) => {
  try {    
    // console.log('Students Handler- Search Students for Re-Admission:', query)
    const stmt = db.prepare(`
      SELECT * FROM Students  
      WHERE Name LIKE ? OR PEN LIKE ? OR APAR LIKE ?
      ORDER BY Name 
    `);
    const searchTerm = `%${query.query}%`;
    const students = stmt.all(searchTerm, searchTerm, searchTerm);
    
    for (const student of students) {
      // console.log('Checking re-admission for Student ID:', student.Id, 'YearID:', query.CurrentYearId)
      const admissionStmt = db.prepare(`
        SELECT COUNT(*) as count FROM Admissions  
        WHERE StudentId = ? AND AcademicYearId = ?
      `);      
      const admission = admissionStmt.get(student.Id, query.CurrentYearId);
      student.reAdmitted = admission.count > 0;
      // console.log(`Student: ${student.Name}, reAdmitted: ${student.reAdmitted}`);
    }
    // console.log('Students after re-admission check:', students);
    return { success: true, students };
  } catch (error) {
    return { success: false, message: error.message, students: [] };
  }
});

//2. Get student details for viewing in Personal Info View (without academic year specific details)
ipcMain.handle('get-student-personal-info', async (event, studentId) => {
  try {
    // Get basic student info
    const studentStmt = db.prepare(`
      SELECT * FROM Students WHERE Id = ?
    `);
    const student = studentStmt.get(studentId);
      //console.log("Student Handler get student detail- Student:", student)
    if (!student) {
      return { success: false, error: 'Student not found' };
    }

   return { 
      success: true,       
        student    
    };
  } catch (error) {
    //console.log('Error:', error.message)
    return { success: false, error: error.message };
  }
});

//3. Update Students Personal Information (without academic year specific details)
ipcMain.handle('update-student-personal', async (event, studentData) => {

  const transaction = db.transaction(() => {
    try { 
      // Update Students table
      const studentStmt = db.prepare(`
        UPDATE Students SET
          Name = ?,
          Gender = ?,
          FathersName = ?,
          MothersName = ?,
          DOB = ?,
          Aadhaar = ?,
          APAR = ?,
          PEN = ?,
          Contact = ?,
          Address = ?,
          Status = ?,
          Caste = ?,
          Religion = ?,
          Height = ?,
          Weight = ?,
          BloodGroup = ?,
          RegistrationNumber = ?,
          FirstAdmissionDate = ?,
          Last_Modified_at = ?
        WHERE Id = ?
      `);

      const studentUpdate = studentStmt.run(
        studentData.Name,
        studentData.Gender,
        studentData.FathersName,
        studentData.MothersName,
        studentData.DOB,
        studentData.Aadhaar,
        studentData.APAR,
        studentData.PEN,
        studentData.Contact,
        studentData.Address,
        studentData.Status,
        studentData.Caste,
        studentData.Religion,
        studentData.Height,
        studentData.Weight,
        studentData.BloodGroup,
        studentData.RegistrationNumber,
        studentData.FirstAdmissionDate,
        currentTime,
        studentData.Id
      );
  // Return appropriate response if update fails in the DB
      if (studentUpdate.changes === 0 ) {
        return { 
          success: true, 
          message: "No changes detected - student data remains unchanged" 
        };
      }

      return { 
        success: true,
        message: "Student record updated successfully",
        student: studentData // Return updated student data
      };

    } catch (error) {
      console.error("Update error:", error);
      return { 
        success: false        
      };
    }
  });

  return transaction();
});

// Get students and admission details for given Year, Class and Section
ipcMain.handle('get-students-by-class-sectionId', async (event, params) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        s.Id as Id,
        ay.YearName as YearName,
        a.AcademicYearId as AcademicYearId,
        s.Name as Name, 
        s.Gender as Gender,
        s.FathersName as FathersName,
        a.AdmissionType as AdmissionType,
        a.RollNo as RollNo,
        a.reAdmitted as reAdmitted,
        c.ClassName as ClassName,
        sec.SectionName as SectionName       
      FROM Students s
      LEFT JOIN Admissions a ON s.Id = a.StudentId
      LEFT JOIN Classes c ON a.ClassId = c.Id
      LEFT JOIN Sections sec ON a.SectionId = sec.Id      
      LEFT JOIN AcademicYears ay ON ay.Id = a.AcademicYearId
      WHERE a.ClassId = ? AND a.SectionId = ? AND a.AcademicYearId = ?
      ORDER BY a.RollNo
    `);
    //Rank will be used as Roll Number in the next year
    const students = stmt.all(params.ClassId, params.SectionId, params.YearId);
    return { success: true, students };
  } catch (error) {
    return { success: false, message: error.message, students: [] };
  }
})  

//search students for a selected year
ipcMain.handle('search-students', async (event, query) => {
 // console.log('Students Handler- Search Students:', query)
  try {
    const stmt = db.prepare(`
  SELECT 
    s.Id as id,
    s.Name as name,
    s.Gender as gender,
    s.Status as status,
    a.RollNo as rollNo,
    c.ClassName as className,
    sec.SectionName as sectionName
  FROM Students s
  LEFT JOIN Admissions a ON s.Id = a.StudentId
  LEFT JOIN Classes c ON a.ClassId = c.Id
  LEFT JOIN Sections sec ON a.SectionId = sec.Id      
  WHERE a.AcademicYearId = ?
  AND (s.Name LIKE ? OR s.PEN LIKE ? OR s.APAR LIKE ?)
  ORDER BY s.Name
`);
    const searchTerm = `%${query.query}%`;
    const students = stmt.all(query.yearId, searchTerm, searchTerm, searchTerm );
    return { success: true, students };
  } catch (error) {
    return { success: false, message: error.message, students: [] };
  }
});


// Get student academic details for viewing in Academic Info View (for a specific academic year)
ipcMain.handle('get-student-academic-info', async (event, studentId, AcademicYearId) => {
  try {

    // Get basic student info
    const studentStmt = db.prepare(`
      SELECT Name, FathersName, Aadhaar, APAR, PEN, FirstAdmissionDate, Status
      FROM Students WHERE Id = ?
    `);
    const student = studentStmt.get(studentId);
      
    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    // Get admission details
    const admissionStmt = db.prepare(`
      SELECT 
        a.*, c.ClassName, s.SectionName, ay.YearName as YearName
      FROM Admissions a
      JOIN Classes c ON c.Id = a.ClassId
      LEFT JOIN Sections s ON s.Id = a.SectionId AND a.SectionId != 0
      JOIN AcademicYears ay ON ay.Id = a.AcademicYearId
      WHERE a.StudentId = ? AND a.AcademicYearId = ?      
    `);
    const admission = admissionStmt.get(studentId, AcademicYearId);  

    return { 
      success: true,       
        student,
        admission     
    };
  } catch (error) {
    //console.log('Error:', error.message)
    return { success: false, error: error.message };
  }
});

// Get student for Re  Admission
// Search for Academic Records
ipcMain.handle('get-last-academic-records', async (event, studentId) => {
  try {
    // Get basic student info
    const studentStmt = db.prepare(`
      SELECT Name, FathersName, Aadhaar, APAR, PEN, FirstAdmissionDate, Status, RegistrationNumber
      FROM Students WHERE Id = ?
    `);
    const student = studentStmt.get(studentId);
      
    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    // Get last admission details
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

    return { 
      success: true,       
        student,
        admission
    };
  } catch (error) {
    //console.log('Error:', error.message)
    return { success: false, error: error.message };
  }
});


// Update student information
ipcMain.handle('update-academic-info', async (event, studentData) => {

  const transaction = db.transaction(() => {
    try {
      // Check for duplicate RollNo if relevant fields are being changed
      const currentAdmission = db.prepare(`
        SELECT ClassId, SectionId, RollNo FROM Admissions WHERE StudentId = ?
      `).get(studentData.Id);

      if (studentData.RollNo !== currentAdmission.RollNo || 
          studentData.ClassId !== currentAdmission.ClassId ||
          studentData.SectionId !== currentAdmission.SectionId) {
        
        const duplicateCheck = db.prepare(`
          SELECT COUNT(*) as count 
          FROM Admissions 
          WHERE ClassId = ? AND SectionId = ? AND RollNo = ? AND StudentId != ? AND AcademicYearId = ?
        `).get(
          studentData.ClassId,
          studentData.SectionId,
          studentData.RollNo,
          studentData.Id,
          studentData.AcademicYearId
        );
        //console.log("Duplicate", duplicateCheck.count)
        if (duplicateCheck.count > 0) {
          
          return { 
            success: false, 
            message: "Duplicate Roll Number detected in the same Class & Section",
            duplicate: true
          };
        }
      }

      // Update Students table
      const studentStmt = db.prepare(`
        UPDATE Students SET
          RegistrationNumber = ?,
          FirstAdmissionDate = ?,
          Last_Modified_at = ?
        WHERE Id = ?
      `);

      const studentUpdate = studentStmt.run(       
        studentData.RegistrationNumber,
        studentData.FirstAdmissionDate,
        currentTime,
        studentData.Id
      );

      // Update Admissions table
      const admissionStmt = db.prepare(`
        UPDATE Admissions 
        SET
          ClassId = ?,
          SectionId = ?,
          RollNo = ?,
          AdmissionType = ?,
          Last_Modified_at = ?
        WHERE
          StudentId = ? AND AcademicYearId = ?
      `);

      const admissionUpdate = admissionStmt.run(        
        studentData.ClassId,
        studentData.SectionId,
        studentData.RollNo,
        studentData.AdmissionType,
        currentTime,
        studentData.Id,
        studentData.AcademicYearId
      );

      // Return appropriate response
      if (studentUpdate.changes === 0 && admissionUpdate.changes === 0) {
        return { 
          success: true, 
          message: "No changes detected - student data remains unchanged" 
        };
      }

      return { 
        success: true,
        message: "Student record updated successfully",
        student: studentData // Return updated student data
      };

    } catch (error) {
      console.error("Update error:", error);
      return { 
        success: false, 
        message: error.message.includes("UNIQUE") 
          ? "Duplicate Roll Number detected" 
          : "DB Error - Failed to update student record" 
      };
    }
  });

  return transaction();
});

// Delete student
ipcMain.handle('delete-student', async (event, studentId) => {
  const transaction = db.transaction(() => {
    try {
      // First delete from Admissions (due to foreign key constraint)
      const deleteAdmissionStmt = db.prepare(`
        DELETE FROM Admissions WHERE StudentId = ?
      `);
      deleteAdmissionStmt.run(studentId);

      // Then delete from Students
      const deleteStudentStmt = db.prepare(`
        DELETE FROM Students WHERE Id = ?
      `);
      deleteStudentStmt.run(studentId);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  return transaction();
});

ipcMain.handle('delete-from-admission', async (event, studentId, academicYearId) => {
  const transaction = db.transaction(() => {
    try {
      // First delete from Admissions (due to foreign key constraint)
      const deleteAdmissionStmt = db.prepare(`
        DELETE FROM Admissions WHERE StudentId = ? AND AcademicYearId = ?
      `);
      deleteAdmissionStmt.run(studentId, academicYearId);    

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  return transaction();
});