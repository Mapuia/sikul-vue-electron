// In your electron/main.js or electron/ipcHandlers.js

const { ipcMain } = require('electron');
const { db } = require('../database.cjs'); // Your database interfac
const currentTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString();

ipcMain.handle('generate-report-card', async (event, {
  academicYearId,
  examId,
  studentId,   
  teachersRemark,
  resultType
  
   }) => {
    if (!studentId ) {
      console.error('Missing Stident Id for report card generation');
      return { success: false, error: 'Missing required parameters' };
    }
//
    // const classId = db.prepare(`
    //   SELECT ClassId FROM Admissions
    //   WHERE StudentId = ?
    //   AND AcademicYearId = ?
    //   `).get(studentId, academicYearId)?.ClassId;

    //   console.log("ClassId: for working Days", classId);
      
    try {   
        // Insert new report card
      db.prepare(`
        INSERT INTO ReportCards (
          StudentId,
          AcademicYearId,
          ActiveExamId,          
          ReportCardType,
          TeachersRemark,
          Creation_at,
          Last_Modified_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (StudentId, AcademicYearId, ActiveExamId, ReportCardType) DO UPDATE SET         
         TeachersRemark = EXCLUDED.TeachersRemark,         
         Last_Modified_at = EXCLUDED.Last_Modified_at
      `).run(
        studentId,
        academicYearId,
        examId,        
        resultType,
        teachersRemark,
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
    // console.log("Report Card Data:", examId, studentId, academicYearId, resultType,reportCardData)
    
    const marksData = db.prepare(`
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
        f.TeachersRemark as FinalRemark
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
      remarks: reportCardData.FinalRemark || ''
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

