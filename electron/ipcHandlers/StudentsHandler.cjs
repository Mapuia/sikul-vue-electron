const { ipcMain } = require('electron');
const { db } = require('../database.cjs');


console.log("Students Handler is loaded.");
// Student search functions

// Get all students
ipcMain.handle('get-all-students', async () => {
    try {
      const query = db.prepare(`
        SELECT 
          s.Id AS id,
          s.Name AS name,
          s.Gender AS gender,
          s.Status AS status,
          s.PEN AS pen,
          s.APAR AS apar,
          a.RollNo AS rollNo,
          c.ClassName AS className,
          sec.SectionName AS sectionName
        FROM Students s
        LEFT JOIN Admission a ON s.Id = a.StudentId AND a.Id = (
          SELECT MAX(Id) FROM Admission WHERE StudentId = s.Id
        )
        LEFT JOIN Classes c ON a.ClassId = c.Id
        LEFT JOIN Sections sec ON a.SectionId = sec.Id
        ORDER BY s.Name
      `);
      return query.all();
    } catch (error) {
      console.error('Error in get-all-students:', error);
      throw new Error('Failed to fetch students');
    }
  });
  
  // Search students
  ipcMain.handle('search-students', async (event, searchTerm) => {
    try {
      const query = db.prepare(`
        SELECT 
          s.Id AS id,
          s.Name AS name,
          s.Gender AS gender,
          s.Status AS status,
          s.PEN AS pen,
          s.APAR AS apar,
          a.RollNo AS rollNo,
          c.ClassName AS className,
          sec.SectionName AS sectionName
        FROM Students s
        LEFT JOIN Admission a ON s.Id = a.StudentId AND a.Id = (
          SELECT MAX(Id) FROM Admission WHERE StudentId = s.Id
        )
        LEFT JOIN Classes c ON a.ClassId = c.Id
        LEFT JOIN Sections sec ON a.SectionId = sec.Id
        WHERE s.Name LIKE @search OR s.PEN = @term OR s.APAR = @term
        ORDER BY s.Name
      `);
      return query.all({
        search: `%${searchTerm}%`,
        term: searchTerm
      });
    } catch (error) {
      console.error('Error in search-students:', error);
      throw new Error('Search failed');
    }
  });
  
  // Get student details
ipcMain.handle('get-student-details', (event, studentId) => {
  try {
    const query = db.prepare(`
      SELECT 
        s.*,
        a.RollNo,
        a.AdmissionType,
        c.ClassName,
        sec.SectionName,
        ay.YearName AS academicYear
      FROM Students s
      LEFT JOIN Admission a ON s.Id = a.StudentId AND a.Id = (
        SELECT MAX(Id) FROM Admission WHERE StudentId = s.Id
      )
      LEFT JOIN Classes c ON a.ClassId = c.Id
      LEFT JOIN Sections sec ON a.SectionId = sec.Id
      LEFT JOIN AcademicYears ay ON a.AcademicYearId = ay.Id
      WHERE s.Id = ?
    `);

    const student = query.get(studentId);
    
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // Format dates consistently
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateString; // Return raw string if formatting fails
      }
    };

    return {
      // Personal Information
      id: student.Id,
      name: student.Name,
      gender: student.Gender,
      dob: formatDate(student.DOB),
      fathersName: student.fathersName || '-',
      mothersName: student.mothersName || '-',
      contact: student.Contact || '-', // Now properly included
      address: student.Address || '-',
      
      // Additional Information
      caste: student.Caste || '-',
      religion: student.Religion || '-',
      bloodGroup: student.BloodGroup || '-',
      height: student.Height ? `${student.Height} cm` : '-',
      weight: student.Weight ? `${student.Weight} kg` : '-',
      
      // Identification
      pen: student.PEN || '-',
      apar: student.APAR || '-',
      aadhaar: student.Aadhaar || '-',
      
      // Academic Information
      rollNo: student.RollNo || '-',
      className: student.ClassName || '-',
      sectionName: student.SectionName || '-',
      admissionType: student.AdmissionType || '-',
      academicYear: student.academicYear || '-',
      firstAdmissionDate: formatDate(student.FirstAdmissionDate), // Formatted same as DOB
      status: student.Status || '-'
    };

  } catch (error) {
    console.error('Error in get-student-details:', error);
    throw new Error(`Failed to fetch student details: ${error.message}`);
  }
});
  
  // Helper function to format dates
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Window management handlers
  ipcMain.on('open-new-admission-window', () => {
    console.log('New admission window requested');
    // Your window creation logic here
  });
  
  ipcMain.on('open-edit-student-window', (event, studentId) => {
    console.log(`Edit window requested for student ${studentId}`);
    // Your window creation logic here
  });