const { ipcMain } = require('electron');
const { db } = require('../database.cjs');
const currentTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString();

// Get all students with admission details
ipcMain.handle('get-all-students', async () => {
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
      ORDER BY s.Name
    `);
    const students = stmt.all();
    
    return { success: true, students }; // Consistent structure
  } catch (error) {
    return { success: false, message: error.message, students: [] };
  }
});


ipcMain.handle('get-students-by-class-sectionsId', async (event, params) => {
// This is to get the previous years students
  try {
    const stmt = db.prepare(`
      SELECT 
        s.Id as id, 
        s.Name as name, 
        s.Gender as gender,
        a.AdmissionType as AdmissionType,
        a.RollNo as rollNo,
        c.ClassName as className,
        sec.SectionName as sectionName       
      FROM Students s
      LEFT JOIN Admissions a ON s.Id = a.StudentId
      LEFT JOIN Classes c ON a.ClassId = c.Id
      LEFT JOIN Sections sec ON a.SectionId = sec.Id      
      WHERE a.ClassId = ? AND a.SectionId = ? AND a.AcademicYearId = ? AND a.reAdmitted = 0
      ORDER BY a.RollNo
    `);
    //Rank will be used as Roll Number in the next year
    const students = stmt.all(params.ClassId, params.SectionId, params.YearId);
    return { success: true, students };
  } catch (error) {
    return { success: false, message: error.message, students: [] };
  }
})  

//This will search students for a particular year
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
  WHERE a.AcademicYearId = ? AND a.reAdmitted = 0
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


//This will search all students for all years
ipcMain.handle('search-all-students', async (event, query) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        s.Id as id,
        s.Name as name,
        s.Gender as gender,
        s.Status as status,
        a.RollNo as rollNo,
        c.ClassName as className,
        sec.SectionName as sectionName,
        ay.YearName as YearName
      FROM Students s      
      LEFT JOIN Admissions a ON s.Id = a.StudentId
      LEFT JOIN AcademicYears ay ON ay.Id = a.AcademicYearId
      LEFT JOIN Classes c ON a.ClassId = c.Id
      LEFT JOIN Sections sec ON a.SectionId = sec.Id      
      WHERE s.Name LIKE ? OR s.PEN LIKE ? OR s.APAR LIKE ?
      ORDER BY a.Id DESC 
    `);
    const searchTerm = `%${query}%`;
    const students = stmt.all(searchTerm, searchTerm, searchTerm);
    return { success: true, students };
  } catch (error) {
    return { success: false, message: error.message, students: [] };
  }
});

// Get complete student details for editing
ipcMain.handle('get-student-details', async (event, studentId, AcademicYearId) => {
  //console.log('Students Handler get student details- Student ID, AcademicYearID:',studentId, AcademicYearId)
  try {
    // Get basic student info
    const studentStmt = db.prepare(`
      SELECT * FROM Students WHERE Id = ?
    `);
    const student = studentStmt.get(studentId);

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    // Get admission details
    const admissionStmt = db.prepare(`
      SELECT 
        a.AcademicYearId, a.ClassId, c.ClassName, a.SectionId, s.SectionName, a.RollNo, ay.YearName as YearName, a.AdmissionType
      FROM Classes c
      JOIN Admissions a ON a.ClassId = c.Id
      JOIN Sections s ON s.Id = a.SectionId
      JOIN AcademicYears ay ON ay.Id = a.AcademicYearId
      WHERE a.StudentId = ? AND a.AcademicYearId = ?
    `);
    const admission = admissionStmt.get(studentId, AcademicYearId);
   // console.log("Student Handler get student detail- Admission:", admission)

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
ipcMain.handle('update-student', async (event, studentData) => {

  console.log("Students Data:", studentData)
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
        currentTime,
        studentData.Id
      );

      // Update Admissions table
      const admissionStmt = db.prepare(`
        UPDATE Admissions 
        SET
          AcademicYearId = ?,
          ClassId = ?,
          SectionId = ?,
          RollNo = ?,
          AdmissionType = ?,
          Last_Modified_at = ?
        WHERE
          StudentId = ?
      `);

      const admissionUpdate = admissionStmt.run(
        studentData.AcademicYearId,
        studentData.ClassId,
        studentData.SectionId,
        studentData.RollNo,
        studentData.AdmissionType,
        currentTime,
        studentData.Id
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
          : "Failed to update student record" 
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