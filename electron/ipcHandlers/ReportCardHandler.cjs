// In your electron/main.js or electron/ipcHandlers.js

const { ipcMain } = require('electron');
const { db } = require('../database.cjs'); // Your database interfac


  // Get Signatory
ipcMain.handle('get-head-signatory', () => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM Signatories
      WHERE SignatoryType = 'Head' AND IsActive = 1     
    `)
    const result = stmt.get()

    return { success: true, data: result || null }
  } catch (error) {
    console.error('Error fetching head signatory:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('generate-report-card', async (event, {
  academicYearId,
  examId,
  studentId, 
  totalWorkingDays, 
  attendance,
  teachersRemark,
  resultType 
   }) => {
    if (!studentId ) {
      console.error('Missing required parameters for report card generation');
      return { success: false, error: 'Missing required parameters' };
    }
    try {   
        // Insert new report card
      db.prepare(`
        INSERT INTO ReportCards (
          StudentId,
          AcademicYearId,
          ActiveExamId,
          TotalWorkingDays,
          TotalPresentDays,
          ReportCardType,
          TeachersRemark  
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (StudentId, AcademicYearId, ActiveExamId, ReportCardType) DO UPDATE SET
         TotalWorkingDays = EXCLUDED.TotalWorkingDays,
         TotalPresentDays = EXCLUDED.TotalPresentDays,
         TeachersRemark = EXCLUDED.TeachersRemark
      `).run(
        studentId,
        academicYearId,
        examId,
        totalWorkingDays,
        attendance,
        resultType,
        teachersRemark
      );

      db.prepare(`
        UPDATE Results
        SET ReportCard = 1
        WHERE ActiveExamId = ? AND StudentId = ? AND AcademicYearId = ? AND ResultType = ?        
        `).run(examId, studentId, academicYearId, resultType)

    return {
      success: true      
    }

  } catch (error) {
    console.error('Error generating report card:', error)
    return { success: false, error: error.message }
  }
})

//getting data for Half Yearly Results
ipcMain.handle('get-report-card', (event, { studentId, classId, sectionId, examId, resultType, academicYearId}) => {
  try {   
    let SectionId = sectionId || 0
    const studentData = db.prepare(`
  SELECT 
    s.Name as Name,
    s.FathersName as FathersName,
    a.RollNo as RollNo,
    s.PEN as PEN,
    s.APAR as APAR,     
    a.AcademicYearId as AcademicYearId,        
    s.APAR as APAR
  FROM Students s
  JOIN Admissions a ON a.StudentId = s.Id
  JOIN Classes c ON c.Id = a.ClassId
  LEFT JOIN Sections sec ON sec.Id = a.SectionId  -- LEFT JOIN instead of JOIN
  WHERE 
    s.Id = ? 
    AND a.AcademicYearId = ?
    AND c.Id = ? 
    AND (a.SectionId = ? OR ? = 0)  -- Allow SectionId=0 to bypass filtering
`).get(studentId, academicYearId, classId, SectionId, SectionId);
   
   // console.log("Student Data:", studentData)
    const reportCardData = db.prepare(`
      SELECT
        TotalWorkingDays,
        TotalPresentDays,
        TeachersRemark
      FROM ReportCards
      WHERE ActiveExamId = ? AND StudentId = ? AND AcademicYearId = ? AND ReportCardType = ?
    `).get(examId, studentId, academicYearId, resultType)

    const marksData = db.prepare(`
      SELECT
        s.SubjectName as SubjectName,
        m.TotalMaxMarks as FullMark,        
        m.PeriodicMarksObtained as PeriodicMark,
        m.TerminalMarksObtained as TerminalMark,
        m.TotalMarksObtained as TotalMark,
        m.SubjectResult as SubjectResult
      FROM
        Marks m 
      JOIN
        Subjects s ON m.SubjectId = s.Id
      WHERE
        m.ActiveExamId = ? AND m.StudentId = ?
      ORDER BY s.DisplayOrder ASC
    `).all(examId, studentId)

    const resultData = db.prepare(`
      SELECT 
        TotalMaxMarks as FullMark,
        TotalMarksObtained as TotalMark,       
        Percentage,
        Division,
        Rank,
        ResultStatus
      FROM
        Results
      WHERE 
        ActiveExamId = ? AND StudentId = ? AND ResultType = ? AND ReportCard = ?
      `).get(examId, studentId, resultType, 1)
      
    const activities = db.prepare(`
      SELECT s.SubjectName as ActivityName, 
      cm.Grade
      FROM Subjects s
      LEFT JOIN CoScholasticMarks cm ON cm.SubjectId = s.Id
      AND cm.ActiveExamId = ? 
      AND cm.StudentId = ?
      WHERE s.SubjectCategory = 'Co-Scholastic' 
    `).all(examId, studentId)
    if (!reportCardData) {
      return { success: false, error: 'Report card not found' }
    }
    return {
      success: true,
      studentData: studentData,
      marksData: marksData,
      resultData: resultData,
      reportCardData: reportCardData,
      activities: activities
    }
  } catch (error) {
    console.error('Error fetching report card:', error)
    return { success: false, error: error.message }
  }
})

//getting data for Final Results
ipcMain.handle('get-final-report-card', (event, { studentId, classId, sectionId, resultType, academicYearId, PassingPercentage }) => {
  const terminal = db.prepare(`
    SELECT ac.Id FROM ActiveExams ac
    JOIN Exams e ON e.Id = ac.ExamId
    WHERE ac.AcademicYearId = ? AND e.ExamType = 'terminal'
    `).get(academicYearId)
  const annual = db.prepare(`
    SELECT ac.Id FROM ActiveExams ac
    JOIN Exams e ON e.Id = ac.ExamId
    WHERE ac.AcademicYearId = ? AND e.ExamType =  'annual'
    `).get(academicYearId)  

  try {   
    let SectionId = sectionId || 0
    const studentData = db.prepare(`
      SELECT 
        s.Name as Name,
        s.FathersName as FathersName,
        a.RollNo as RollNo,
        s.PEN as PEN,
        s.APAR as APAR,     
        a.AcademicYearId as AcademicYearId,        
        s.APAR as APAR
      FROM Students s
      JOIN Admissions a ON a.StudentId = s.Id
      JOIN Classes c ON c.Id = a.ClassId
      LEFT JOIN Sections sec ON sec.Id = a.SectionId  -- LEFT JOIN instead of JOIN
      WHERE 
        s.Id = ? 
        AND a.AcademicYearId = ?
        AND c.Id = ? 
        AND (a.SectionId = ? OR ? = 0)  -- Allow SectionId=0 to bypass filtering
    `).get(studentId, academicYearId, classId, SectionId, SectionId);  

    const marksData = db.prepare(`
      SELECT
        s.SubjectName as SubjectName,
        t.TotalMaxMarks as FullMark,
        ROUND(t.TotalMaxMarks * ? / 100) as PassMark,
        t.PeriodicMarksObtained as FirstPeriodicMarks,
        t.TerminalMarksObtained as TerminalMarks,
        t.TotalMarksObtained as TerminalTotal,
        a.PeriodicMarksObtained as SecondPeriodicMarks,
        a.TerminalMarksObtained as AnnualMarks,
        a.TotalMarksObtained as AnnualTotalMarks
      FROM
        Subjects s
      JOIN
        Marks t ON t.SubjectId = s.Id AND t.ActiveExamId = ? AND t.StudentId = ?
      JOIN
        Marks a ON a.SubjectId = s.Id AND a.ActiveExamId = ? AND a.StudentId = ?
      ORDER BY s.DisplayOrder ASC
    `).all(PassingPercentage, terminal.Id, studentId, annual.Id, studentId);

    const finalMarksData = marksData.map(subject => {
      const finalFullMark = subject.FullMark * 2;
      const finalPassMark = subject.PassMark * 2;
      const finalMarks = subject.TerminalTotal + subject.AnnualTotalMarks;
      const result = finalMarks >= finalPassMark ? "Pass" : "Fail";
      
      return {
        ...subject, // Keep all existing properties
        finalFullMark,
        finalPassMark,
        finalMarks,
        Result: result
      };
    });

  // Now calculate the updated totals including the new fields
  const totals = finalMarksData.reduce((acc, row) => {
      acc.fullMark += row.FullMark || 0;
      acc.passMark += row.PassMark || 0;
      acc.finalFullMark += row.finalFullMark || 0;
      acc.finalPassMark += row.finalPassMark || 0;
      acc.terminalTotal += row.TerminalTotal || 0;
      acc.annualTotal += row.AnnualTotalMarks || 0;
      acc.finalMarks += row.finalMarks || 0;
      return acc;
    }, { 
      fullMark: 0, 
      passMark: 0,
      finalFullMark: 0,
      finalPassMark: 0,
      terminalTotal: 0, 
      annualTotal: 0,
      finalMarks: 0
    });

  const totalMarks = {     
        fullMark: totals.fullMark,
        passMark: totals.passMark,
        finalFullMark: totals.finalFullMark,
        finalPassMark: totals.finalPassMark,
        terminalTotal: totals.terminalTotal,
        annualTotal: totals.annualTotal,
        finalMarks: totals.finalMarks
      }    

    const resultData = db.prepare(`
      SELECT
        StudentId,
        TotalMarksObtained as TotalMark,       
        Percentage,
        Division,
        Rank,
        ResultStatus        
      FROM
        Results
      WHERE 
        ActiveExamId = ? AND StudentId = ? AND ResultType = ? AND ReportCard = ?
      `).get(annual.Id, studentId, resultType, 1)
      
    //ReportCard Data
    const reportCardData = db.prepare(`
      SELECT
        t.TotalWorkingDays as TerminalWorkingDays,
        t.TotalPresentDays as TerminalPresentDays,       
        f.TotalWorkingDays as AnnualWorkingDays,
        f.TotalPresentDays as AnnualPresentDays,
        f.TeachersRemark as FinalRemark
      FROM 
        (SELECT * FROM ReportCards 
        WHERE ActiveExamId = ? AND StudentId = ? AND AcademicYearId = ? AND ReportCardType = 'terminal') t
      LEFT JOIN
        (SELECT * FROM ReportCards 
        WHERE ActiveExamId = ? AND StudentId = ? AND AcademicYearId = ? AND ReportCardType = 'final') f
      ON t.StudentId = f.StudentId AND t.AcademicYearId = f.AcademicYearId
    `).get(
      terminal.Id, studentId, academicYearId,
      annual.Id, studentId, academicYearId
    );

//activities
  const activities = db.prepare(`
      SELECT s.SubjectName as ActivityName, 
      t.Grade as terminalGrade,
      a.Grade as annualGrade
      FROM Subjects s
      LEFT JOIN CoScholasticMarks t 
      ON t.SubjectId = s.Id 
      AND t.ActiveExamId = ? 
      AND t.StudentId = ?
      LEFT JOIN CoScholasticMarks a 
      ON a.SubjectId = s.Id 
      AND a.ActiveExamId = ? 
      AND a.StudentId = ?
      WHERE s.SubjectCategory = 'Co-Scholastic' 
    `).all(terminal.Id, studentId, annual.Id, studentId)    

    // Calculate totals 
    const attendanceData = reportCardData?{
     
      TerminalWorkingDays: reportCardData.TerminalWorkingDays,
      TerminalPresentDays: reportCardData.TerminalPresentDays,    
      AnnualWorkingDays: reportCardData.AnnualWorkingDays,
      AnnualPresentDays: reportCardData.AnnualPresentDays,   
      TotalWorkingDays: (reportCardData.TerminalWorkingDays || 0) + (reportCardData.AnnualWorkingDays || 0),
      TotalPresentDays: (reportCardData.TerminalPresentDays || 0) + (reportCardData.AnnualPresentDays || 0),  
      remarks: reportCardData.FinalRemark
      
    } : null;    

  return{
    success: true,
    studentData,
    finalMarksData,
    totalMarks,
    activities,
    resultData,
    attendanceData
  }
   
   
  } catch (error) {
    console.error('Error fetching report card:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-no-of-students', async (event, { classId, sectionId }) => {
  try {
    let SectionId = 0;
    if(sectionId === '') SectionId = 0
    else SectionId = sectionId
    const NoOfStudents = db.prepare(`
      SELECT COUNT(*) as Count
      FROM Admissions
      WHERE ClassId = ? AND SectionId = ?
    `).get(classId, SectionId)

    return {
      success: true,
      NoOfStudents: NoOfStudents.Count
    }

  } catch (error) {
    console.error('Error fetching number of students:', error)
    return { success: false, error: error.message }
  }
})
