// In your electron/main.js or electron/ipcHandlers.js

const { ipcMain } = require('electron');
const { db } = require('../database.cjs'); // Your database interfac
const currentTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString();
const fs = require('fs');
const path = require('path');


//Generate Single Report Card
ipcMain.handle('generate-report-card', async (event, {
  academicYearId,
  examId,
  studentId,
  resultType,
  teachersRemark
  
   }) => {
    if (!studentId ) {
      console.error('Missing Student Id for report card generation');
      return { success: false, error: 'Missing required parameters' };
    }
    // console.log("Generating Report Card for Student:", studentId, "Result Type:", resultType, "Teachers Remark:", teachersRemark);
    // const result = db.prepare(`
    //   SELECT r.ResultStatus, r.Division
    //   FROM Results r
    //   WHERE r.StudentId = ? AND r.ActiveExamId = ? AND r.AcademicYearId = ? AND r.ResultType = ?
    // `).get(studentId, examId, academicYearId, resultType);
    // const teachersRemark = createTeachersRemark(result?.ResultStatus, result?.Division);

    const reportCardResult = await generateReportCard(
      academicYearId,
      examId,
      studentId,
      resultType,
      teachersRemark
    );
    if(!reportCardResult.success){
      console.error('Error generating report card for student:', studentId, reportCardResult.error);
    }
    else{
      return { success: true, message: 'Report card generated successfully' };
    }
})


//helper function to create Remarks for the student
function createTeachersRemark(resultStatus, division) {
  let remark = '';
  switch (resultStatus) {
    case 'Fail':
      remark = 'Needs Improvement';
      break;
    case 'Simple Pass':
      remark = 'Try Harder';
      break;
    default:
      switch (division) {
        case 'Dist':
          remark = 'Excellent!';
          break;
        case 'First':
          remark = 'Congratulations!';
          break;
        case 'Second':
          remark = 'Good';
          break;
        case 'Third':
          remark = 'Good';
          break;
        default:
          remark = '';
      }
  }
  return remark;
}

//check all report card generated
// ipcMain.handle('check-all-report-card-generated', async (event, {
//   CurrentYearId,
//   selectedClassId,
//   selectedSectionId,
//   resultType
// }) => {
//   try{
//   const reportCardGenerated = db.prepare(`
//     SELECT COUNT(*) as count
//     FROM Results r
//     JOIN Admissions a ON r.StudentId = a.StudentId
//     WHERE r.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ? AND r.ResultType = ? AND r.ReportCard = 1
//   `).get(CurrentYearId, selectedClassId, selectedSectionId, resultType);
// console.log("All Generated:", allGenerated.count)
//   const resultGenerated = db.prepare(`
//     SELECT COUNT(*) as count
//     FROM Results r
//     JOIN Admissions a ON r.StudentId = a.StudentId
//     WHERE r.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ? AND r.ResultType = ? 
//   `).get(CurrentYearId, selectedClassId, selectedSectionId, resultType);
// console.log("All Results:", resultGenerated.count)
//   return { success: true, reportCardGenerated: reportCardGenerated.count, resultGenerated: resultGenerated.count };
//   }
//   catch(error){
//     console.error('Error checking report card generation:', error);
//     return { success: false, error: 'Internal server error' };
//   }
// })

//generate Report Card for all students in a Section
ipcMain.handle('generate-section-report-card', async (event, {
  academicYearId,
  examId,
  classId,
  sectionId,  
  resultType  
   }) => {
    // console.log("Generating Report Card for Section:", classId, sectionId, "Result Type:", resultType);
    if (!classId || !examId || !academicYearId ) {
      console.error('Missing required parameters for report card generation');
      return { success: false, error: 'Missing required parameters' };
    }
    // console.log("Generating Report Card for Section:", classId, sectionId, academicYearId, resultType);
   // Get all students in the section
   const students = db.prepare(`
      SELECT a.StudentId as StudentId
      FROM Admissions a       
      LEFT JOIN Results r ON r.StudentId = a.StudentId
      WHERE a.ClassId = ? AND a.SectionId = ? AND a.AcademicYearId = ? AND r.ResultType = ?
   `).all(classId, sectionId, academicYearId, resultType);

  //  console.log("Total Students in Section:", students.length);

    // Generate report card for each student
    for (const student of students) {
      // console.log("Checking Student Id:", student.StudentId);
      const result = db.prepare(`
        SELECT StudentId, Division, ResultStatus FROM Results
        WHERE StudentId = ? AND ActiveExamId = ? AND ResultType = ? AND AcademicYearId = ?
      `).get(student.StudentId, examId, resultType, academicYearId);       
     
      // console.log("Result Status:", result?.ResultStatus, "Division:", result?.Division);
      const teachersRemark = createTeachersRemark(result?.ResultStatus, result?.Division);
      // console.log("Teachers Remark:", student.StudentId,teachersRemark)
      const reportCardResult = await generateReportCard(
        academicYearId,
        examId,
        student.StudentId,
        resultType,
        teachersRemark
      );
      if(!reportCardResult.success){
        console.error('Error generating report card for student:', student.StudentId, reportCardResult.error);
      }
    }
    return {
      success: true      
    }
})


//function to generate report card
async function generateReportCard(
        academicYearId,
        examId,
        studentId,
        resultType,
        teachersRemark
      ){

    // console.log("Generating Report Card for Student:", studentId, "Result Type:", resultType);

    if (!studentId ) {
      console.error('Missing Student Id for report card generation......', studentId);
      return { success: false, error: 'Missing required parameters' };
    }
      
    try { 
      // getting result status for the student
      const resultStatus = db.prepare(`
        SELECT ResultStatus FROM Results
        WHERE ActiveExamId = ? AND StudentId = ? AND AcademicYearId = ? AND ResultType = ?
      `).get(examId, studentId, academicYearId, resultType);
       //Create Final Remarks for the student based on their result status 
       
        let finalRemark = '';
        if(resultType === 'final'){
          const classInfo = db.prepare(`
            SELECT c.ClassId, c.ClassName
            FROM Classes c
            JOIN Admissions a ON a.ClassId = c.Id
            WHERE a.StudentId = ?
            AND a.AcademicYearId = ?
            `).get(studentId, academicYearId);

          
          const classInt = romanToInt(classInfo.ClassName);  
          if(resultStatus?.ResultStatus !== 'Fail'){
              const promotedToNextClass = classInt + 1;
              const promotedToNextClassRoman = intToRoman(promotedToNextClass); // Convert
              finalRemark = `Promoted to Class - ${promotedToNextClassRoman}`;
          } else {
            finalRemark = `Try Again`;
          }
        }  
        
        // Insert new report card
      db.prepare(`
        INSERT INTO ReportCards (
          StudentId,
          AcademicYearId,
          ActiveExamId,          
          ReportCardType,
          TeachersRemark,
          FinalRemarks,
          Creation_at,
          Last_Modified_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (StudentId, AcademicYearId, ActiveExamId, ReportCardType) DO UPDATE SET
         FinalRemarks = EXCLUDED.FinalRemarks,         
         TeachersRemark = EXCLUDED.TeachersRemark,         
         Last_Modified_at = EXCLUDED.Last_Modified_at
      `).run(
        studentId,
        academicYearId,
        examId,        
        resultType,
        teachersRemark,
        finalRemark,
        currentTime,
        currentTime
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
}


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
    // console.log("Report Card Data:", examId, studentId, academicYearId, resultType,reportCardData)
    
    let marksData = []
    if (resultType === 'selection'){
      marksData = db.prepare(`
        SELECT
          s.SubjectName as SubjectName,
          COALESCE(m.TerminalMaxMark, s.FullMark) as FullMark,
          COALESCE(0, 0) as PeriodicMark,
          COALESCE(m.TerminalMarksObtained, 0) as TerminalMark,
          COALESCE(m.TerminalMarksObtained, 0) as TotalMark,
          COALESCE(m.SubjectResult, '') as SubjectResult
        FROM ClassSubjectMapping csm

        JOIN Subjects s 
          ON s.Id = csm.SubjectId

        LEFT JOIN Marks m 
          ON m.SubjectId = s.Id 
          AND m.ActiveExamId = ? 
          AND m.StudentId = ?

        WHERE csm.ClassId = ?
        AND s.SubjectCategory != 'Co-Scholastic'

        ORDER BY s.DisplayOrder ASC
      `).all(examId, studentId, classId)
    }
    else{  
      marksData = db.prepare(`
        SELECT
          s.SubjectName as SubjectName,
          COALESCE(m.TotalMaxMarks, s.FullMark) as FullMark,
          COALESCE(m.PeriodicMarksObtained, 0) as PeriodicMark,
          COALESCE(m.TerminalMarksObtained, 0) as TerminalMark,
          COALESCE(m.TotalMarksObtained, 0) as TotalMark,
          COALESCE(m.SubjectResult, '') as SubjectResult
        FROM ClassSubjectMapping csm

        JOIN Subjects s 
          ON s.Id = csm.SubjectId

        LEFT JOIN Marks m 
          ON m.SubjectId = s.Id 
          AND m.ActiveExamId = ? 
          AND m.StudentId = ?

        WHERE csm.ClassId = ?
        AND s.SubjectCategory != 'Co-Scholastic'

        ORDER BY s.DisplayOrder ASC
      `).all(examId, studentId, classId)
     }
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
    const studentIdsInAdmissions = db.prepare(`
        SELECT StudentId FROM Admissions
        WHERE ClassId = ? AND AcademicYearId = ? AND (SectionId = ? OR ? = 0)
      `).all(classId, academicYearId, SectionId, SectionId).map(row => row.StudentId);

      // Step 2: Get distinct student IDs from Results for terminal
      const terminalResultStudents = db.prepare(`
        SELECT DISTINCT StudentId FROM Results
        WHERE resultType = ?
      `).all(resultType).map(row => row.StudentId);

      const TerminalNoOfStudents = studentIdsInAdmissions.filter(id => terminalResultStudents.includes(id)).length;
     
      // Step 5: Add to attendanceData
      if (reportCardData) {
        reportCardData.noOfStudents = TerminalNoOfStudents;        
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

//get section report card
// ipcMain.handle('get-section-report-cards', async (event, { classId, sectionId, academicYearId, PassingPercentage }) => {
//   try {
//     const SectionId = sectionId || 0;

//     // 1. Get Exam IDs
//     const terminal = db.prepare(`
//       SELECT ac.Id FROM ActiveExams ac JOIN Exams e ON e.Id = ac.ExamId
//       WHERE ac.AcademicYearId = ? AND e.ExamType = 'terminal'
//     `).get(academicYearId);

//     const annual = db.prepare(`
//       SELECT ac.Id FROM ActiveExams ac JOIN Exams e ON e.Id = ac.ExamId
//       WHERE ac.AcademicYearId = ? AND e.ExamType = 'annual'
//     `).get(academicYearId);

//     if (!terminal || !annual) throw new Error("Terminal or Annual exam IDs not found.");

//     // 2. Get all students in the section
//     const students = db.prepare(`
//       SELECT s.Id, s.Name, s.FathersName, a.RollNo, s.PEN, s.APAR, a.AcademicYearId
//       FROM Students s
//       JOIN Admissions a ON a.StudentId = s.Id
//       WHERE a.ClassId = ? AND a.AcademicYearId = ? AND (a.SectionId = ? OR ? = 0)
//       ORDER BY a.RollNo ASC
//     `).all(classId, academicYearId, SectionId, SectionId);

//     // 3. Pre-calculate Section Stats (No. of students)
//     const studentIdsInAdmissions = students.map(s => s.Id);
    
//     const terminalResultStudents = db.prepare(`SELECT DISTINCT StudentId FROM Results WHERE ActiveExamId = ?`)
//       .all(terminal.Id).map(row => row.StudentId);
//     const finalResultStudents = db.prepare(`SELECT DISTINCT StudentId FROM Results WHERE ActiveExamId = ?`)
//       .all(annual.Id).map(row => row.StudentId);

//     const TerminalNoOfStudents = studentIdsInAdmissions.filter(id => terminalResultStudents.includes(id)).length;
//     const AnnualNoOfStudents = studentIdsInAdmissions.filter(id => finalResultStudents.includes(id)).length;

//     // 4. Compile Data for each student
//     const allReportCards = students.map(student => {
//       const studentId = student.Id;

//       // Marks Logic
//       const marksData = db.prepare(`
//         SELECT s.SubjectName, 
//                COALESCE(t.TotalMaxMarks, a.TotalMaxMarks, s.FullMark) as FullMark,
//                ROUND(COALESCE(t.TotalMaxMarks, a.TotalMaxMarks, s.FullMark) * ? / 100) as PassMark,
//                COALESCE(t.TotalMarksObtained, 0) as TerminalTotal,
//                COALESCE(a.TotalMarksObtained, 0) as AnnualTotalMarks
//         FROM ClassSubjectMapping csm
//         JOIN Subjects s ON s.Id = csm.SubjectId
//         LEFT JOIN Marks t ON t.SubjectId = s.Id AND t.ActiveExamId = ? AND t.StudentId = ?
//         LEFT JOIN Marks a ON a.SubjectId = s.Id AND a.ActiveExamId = ? AND a.StudentId = ?
//         WHERE csm.ClassId = ? ORDER BY s.DisplayOrder ASC
//       `).all(PassingPercentage, terminal.Id, studentId, annual.Id, studentId, classId);

//       const resStatus = db.prepare(`SELECT ResultStatus FROM Results WHERE StudentId = ? AND ResultType = 'final'`).get(studentId);

//       const finalMarksData = marksData.map(m => ({
//         ...m,
//         finalFullMark: m.FullMark * 2,
//         finalPassMark: m.PassMark * 2,
//         finalMarks: m.TerminalTotal + m.AnnualTotalMarks,
//         Result: resStatus?.ResultStatus
//       }));

//       // Results Logic
//       const results = db.prepare(`
//         SELECT r.TotalMarksObtained, r.Percentage, r.Division, r.Rank, r.ResultStatus, e.ExamType
//         FROM Results r JOIN ActiveExams ae ON ae.Id = r.ActiveExamId JOIN Exams e ON e.Id = ae.ExamId
//         WHERE r.StudentId = ? AND (r.ActiveExamId = ? OR r.ActiveExamId = ?)
//       `).all(studentId, terminal.Id, annual.Id);

//       // Attendance Logic
//       const reportCardData = db.prepare(`
//         SELECT t.TotalWorkingDays as TWD, t.TotalPresentDays as TPD, f.TotalWorkingDays as AWD, f.TotalPresentDays as APD, f.TeachersRemark, f.FinalRemarks
//         FROM (SELECT * FROM ReportCards WHERE ActiveExamId = ? AND StudentId = ? AND ReportCardType = 'terminal') t
//         LEFT JOIN (SELECT * FROM ReportCards WHERE ActiveExamId = ? AND StudentId = ? AND ReportCardType = 'final') f ON t.StudentId = f.StudentId
//       `).get(terminal.Id, studentId, annual.Id, studentId);

//       // Activities
//       const activities = db.prepare(`
//         SELECT s.SubjectName as ActivityName, t.Grade as terminalGrade, a.Grade as annualGrade
//         FROM Subjects s
//         LEFT JOIN CoScholasticMarks t ON t.SubjectId = s.Id AND t.ActiveExamId = ? AND t.StudentId = ?
//         LEFT JOIN CoScholasticMarks a ON a.SubjectId = s.Id AND a.ActiveExamId = ? AND a.StudentId = ?
//         WHERE s.SubjectCategory = 'Co-Scholastic'
//       `).all(terminal.Id, studentId, annual.Id, studentId);

//       return {
//         studentData: student,
//         finalMarksData,
//         resultData: {
//           terminal: results.find(r => r.ExamType === 'terminal') || {},
//           finalResult: results.find(r => r.ExamType === 'annual') || {}
//         },
//         attendanceData: reportCardData ? {
//           TotalWorkingDays: (reportCardData.TWD || 0) + (reportCardData.AWD || 0),
//           TotalPresentDays: (reportCardData.TPD || 0) + (reportCardData.APD || 0),
//           teachersRemarks: reportCardData.TeachersRemark || '',
//           finalRemarks: reportCardData.FinalRemarks || ''
//         } : null,
//         activities
//       };
//     });

//     return { success: true, allReportCards, TerminalNoOfStudents, AnnualNoOfStudents };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// });

//getting data for Final Results
ipcMain.handle('get-final-report-card', (event, { studentId, classId, sectionId, resultType, academicYearId, PassingPercentage }) => {
  const terminal = db.prepare(`
    SELECT ac.Id FROM ActiveExams ac
    JOIN Exams e ON e.Id = ac.ExamId
    WHERE ac.AcademicYearId = ? AND e.ExamType = 'terminal'
  `).get(academicYearId);

  const annual = db.prepare(`
    SELECT ac.Id FROM ActiveExams ac
    JOIN Exams e ON e.Id = ac.ExamId
    WHERE ac.AcademicYearId = ? AND e.ExamType = 'annual'
  `).get(academicYearId);

  try {
    const SectionId = sectionId || 0;

    const studentData = db.prepare(`
      SELECT 
        s.Name as Name,
        s.FathersName as FathersName,
        a.RollNo as RollNo,
        s.PEN as PEN,
        s.APAR as APAR,
        a.AcademicYearId as AcademicYearId
      FROM Students s
      JOIN Admissions a ON a.StudentId = s.Id
      JOIN Classes c ON c.Id = a.ClassId
      LEFT JOIN Sections sec ON sec.Id = a.SectionId
      WHERE 
        s.Id = ? 
        AND a.AcademicYearId = ?
        AND c.Id = ? 
        AND (a.SectionId = ? OR ? = 0)
    `).get(studentId, academicYearId, classId, SectionId, SectionId);

    const marksData = db.prepare(`
      SELECT
        s.SubjectName as SubjectName,
        COALESCE(t.TotalMaxMarks, a.TotalMaxMarks, s.FullMark) as FullMark,
        ROUND(COALESCE(t.TotalMaxMarks, a.TotalMaxMarks, s.FullMark) * ? / 100) as PassMark,

        COALESCE(t.PeriodicMarksObtained, 0) as FirstPeriodicMarks,
        COALESCE(t.TerminalMarksObtained, 0) as TerminalMarks,
        COALESCE(t.TotalMarksObtained, 0) as TerminalTotal,

        COALESCE(a.PeriodicMarksObtained, 0) as SecondPeriodicMarks,
        COALESCE(a.TerminalMarksObtained, 0) as AnnualMarks,
        COALESCE(a.TotalMarksObtained, 0) as AnnualTotalMarks

      FROM ClassSubjectMapping csm

      JOIN Subjects s 
        ON s.Id = csm.SubjectId

      LEFT JOIN Marks t 
        ON t.SubjectId = s.Id 
        AND t.ActiveExamId = ? 
        AND t.StudentId = ?

      LEFT JOIN Marks a 
        ON a.SubjectId = s.Id 
        AND a.ActiveExamId = ? 
        AND a.StudentId = ?

      WHERE csm.ClassId = ?

      ORDER BY s.DisplayOrder ASC
    `).all(
      PassingPercentage,
      terminal.Id, studentId,
      annual.Id, studentId,
      classId
    );

      const finalMarksData = marksData.map(subject => {
      const finalFullMark = subject.FullMark * 2;
      const finalPassMark = subject.PassMark * 2;
      const finalMarks = subject.TerminalTotal + subject.AnnualTotalMarks;
      // const result = finalMarks >= finalPassMark ? "Pass" : "Fail";
      const result = db.prepare(`
        SELECT ResultStatus FROM Results
        WHERE StudentId = ? AND ResultType = 'final'
      `).get(studentId);
      return {
        ...subject,
        finalFullMark,
        finalPassMark,
        finalMarks,
        Result: result?.ResultStatus
      };
    });

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
    };

    const results = db.prepare(`
      SELECT
        r.StudentId,
        r.TotalMarksObtained as TotalMark,
        r.Percentage,
        r.Division,
        r.Rank,
        r.ResultStatus,
        e.ExamType,
        r.ResultType
      FROM Results r
      JOIN ActiveExams ae ON ae.Id = r.ActiveExamId
      JOIN Exams e ON e.Id = ae.ExamId
      WHERE 
        r.StudentId = ? 
        AND (
          (e.ExamType = 'terminal' AND r.ResultType = 'terminal') OR
          (e.ExamType = 'annual' AND r.ResultType = 'final' AND r.ReportCard = 1)
        )
        AND (r.ActiveExamId = ? OR r.ActiveExamId = ?)
    `).all(studentId, terminal.Id, annual.Id);

    const resultData = {
      terminal: results.find(r => r.ExamType === 'terminal'),
      finalResult: results.find(r => r.ExamType === 'annual')
    };    

    const reportCardData = db.prepare(`
      SELECT
        t.TotalWorkingDays as TerminalWorkingDays,
        t.TotalPresentDays as TerminalPresentDays,
        f.TotalWorkingDays as AnnualWorkingDays,
        f.TotalPresentDays as AnnualPresentDays,
        f.TeachersRemark as teachersRemark,
        f.FinalRemarks as finalRemark
      FROM 
        (SELECT * FROM ReportCards 
         WHERE ActiveExamId = ? AND StudentId = ? AND AcademicYearId = ? AND ReportCardType = 'terminal') t
      LEFT JOIN
        (SELECT * FROM ReportCards 
         WHERE ActiveExamId = ? AND StudentId = ? AND AcademicYearId = ? AND ReportCardType = 'final') f
      ON t.StudentId = f.StudentId AND t.AcademicYearId = f.AcademicYearId
    `).get(terminal.Id, studentId, academicYearId, annual.Id, studentId, academicYearId);

    const activities = db.prepare(`
      SELECT s.SubjectName as ActivityName, 
             t.Grade as terminalGrade,
             a.Grade as annualGrade
      FROM Subjects s
      LEFT JOIN CoScholasticMarks t 
        ON t.SubjectId = s.Id AND t.ActiveExamId = ? AND t.StudentId = ?
      LEFT JOIN CoScholasticMarks a 
        ON a.SubjectId = s.Id AND a.ActiveExamId = ? AND a.StudentId = ?
      WHERE s.SubjectCategory = 'Co-Scholastic' 
    `).all(terminal.Id, studentId, annual.Id, studentId);

    const attendanceData = reportCardData ? {
      TerminalWorkingDays: reportCardData.TerminalWorkingDays || 0,
      TerminalPresentDays: reportCardData.TerminalPresentDays || 0,
      AnnualWorkingDays: reportCardData.AnnualWorkingDays || 0,
      AnnualPresentDays: reportCardData.AnnualPresentDays || 0,
      TotalWorkingDays: (reportCardData.TerminalWorkingDays || 0) + (reportCardData.AnnualWorkingDays || 0),
      TotalPresentDays: (reportCardData.TerminalPresentDays || 0) + (reportCardData.AnnualPresentDays || 0),
      teachersRemarks: reportCardData.teachersRemark || '',
      finalRemarks: reportCardData.finalRemark || ''
    } : null;

    /////No of Students
    // Step 1: Get all student IDs for this class, section, and academic year
      const studentIdsInAdmissions = db.prepare(`
        SELECT StudentId FROM Admissions
        WHERE ClassId = ? AND AcademicYearId = ? AND (SectionId = ? OR ? = 0)
      `).all(classId, academicYearId, SectionId, SectionId).map(row => row.StudentId);

      // Step 2: Get distinct student IDs from Results for terminal
      const terminalResultStudents = db.prepare(`
        SELECT DISTINCT StudentId FROM Results
        WHERE ActiveExamId = ?
      `).all(terminal.Id).map(row => row.StudentId);

      // Step 3: Get distinct student IDs from Results for annual
      const finalResultStudents = db.prepare(`
        SELECT DISTINCT StudentId FROM Results
        WHERE ActiveExamId = ?
      `).all(annual.Id).map(row => row.StudentId);

      // Step 4: Count how many students from Admissions are in Results
      const TerminalNoOfStudents = studentIdsInAdmissions.filter(id => terminalResultStudents.includes(id)).length;
      const AnnualNoOfStudents = studentIdsInAdmissions.filter(id => finalResultStudents.includes(id)).length;


    return {
      success: true,
      studentData,
      finalMarksData,
      resultData: {
        terminal: {
          Percentage: resultData.terminal?.Percentage || 0,
          Division: resultData.terminal?.Division || '',
          Rank: resultData.terminal?.Rank || '',
          ResultStatus: resultData.terminal?.ResultStatus || ''
        },
        finalResult: {
          Percentage: resultData.finalResult?.Percentage || 0,
          Division: resultData.finalResult?.Division || '',
          Rank: resultData.finalResult?.Rank || '',
          ResultStatus: resultData.finalResult?.ResultStatus || ''
        }
      },
      totalMarks,
      attendanceData,
      activities,
      TerminalNoOfStudents,
      AnnualNoOfStudents
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      error: error.message,
      studentData: {},
      finalMarksData: [],
      resultData: {
        terminal: {},
        finalResult: {}
      },
      totalMarks: {},
      attendanceData: null,
      activities: []
    };
  }
});

ipcMain.handle('save-attendance', async (event, attendanceData, examData ) => {

  let reportCardType = '';
  if (examData.ExamType === 'annual') {
    reportCardType = 'final';
  } else reportCardType = examData.ExamType;

  const upsertAttendance = db.prepare(`
      INSERT INTO ReportCards (
      StudentId, 
      AcademicYearId, 
      ActiveExamId, 
      TotalWorkingDays, 
      TotalPresentDays, 
      ReportCardType,
      Creation_at,
      Last_Modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (StudentId, AcademicYearId, ActiveExamId, ReportCardType) 
      DO UPDATE SET
      TotalWorkingDays = EXCLUDED.TotalWorkingDays,
      TotalPresentDays = EXCLUDED.TotalPresentDays,
      Last_Modified_at = EXCLUDED.Last_Modified_at
    `)
  
      // Begin transaction
    db.prepare('BEGIN').run();  

  try {

    for(student of attendanceData) {
      // console.log("Saving attendance for StudentId:", student.StudentId, "Attendance:", student.Attendance);
      upsertAttendance.run(
        student.StudentId, 
        examData.AcademicYearId, 
        examData.ActiveExamId, 
        examData.TotalWorkingDays, 
        student.Attendance,
        reportCardType, 
        currentTime, 
        currentTime
      );
    }
    // Commit transaction
    db.prepare('COMMIT').run();
    return { success: true  };
  } catch (error) {
    console.error('Error saving attendance:', error);
    db.prepare('ROLLBACK').run();
    return { success: false, error: error.message };
  }

});

//Convert Roman numeral to Integer
function romanToInt(roman) {
  // console.log(`Converting Roman numeral: ${roman}`);
  const romanNumerals = { 'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000 };
  let total = 0;
  let prevValue = 0;

  for (let i = roman.length - 1; i >= 0; i--) {
      const char = roman[i];
      const value = romanNumerals[char];

      if (value < prevValue) {
          total -= value;
      } else {
          total += value;
      }
      prevValue = value;
  }

  return total;
}

//Convert Integer to Roman numeral
function intToRoman(num) {
  const romanMap = [
    { value: 1000, symbol: 'M' },
    { value: 900, symbol: 'CM' },
    { value: 500, symbol: 'D' },
    { value: 400, symbol: 'CD' },
    { value: 100, symbol: 'C' },
    { value: 90, symbol: 'XC' },
    { value: 50, symbol: 'L' },
    { value: 40, symbol: 'XL' },
    { value: 10, symbol: 'X' },
    { value: 9, symbol: 'IX' },
    { value: 5, symbol: 'V' },
    { value: 4, symbol: 'IV' },
    { value: 1, symbol: 'I' }
  ];

  let result = '';

  for (const { value, symbol } of romanMap) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }

  return result;
}

ipcMain.handle('file:savePdf', async (event, { folderPath, fileName, buffer }) => {
  try {
    const fullPath = path.join(folderPath, fileName);
    
    // Convert the incoming ArrayBuffer to a Node.js Buffer
    const nodeBuffer = Buffer.from(buffer);
    
    // Write the file to the chosen directory
    fs.writeFileSync(fullPath, nodeBuffer);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to save PDF:', error);
    throw error; // This will trigger the catch block in your Vue code
  }
});