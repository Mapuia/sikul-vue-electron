const { ipcMain, dialog } = require('electron');
const { db } = require('../database.cjs');
// const PDFDocument = require('pdfkit');
// const fs = require('fs');
// require('pdfkit-table')

const currentTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString();
// const path = require('path');
// IPC Handlers for Result
//////////////////////////////////////////////////////////////////////////////

ipcMain.handle('get-mark-entry-status', async (event, examId, examType) => {
  try {
    //console.log('Fetching mark entry status for exam:', examId);
    // Get all class-section mappings with details.. If 
    const classSections = db.prepare(`
      SELECT 
        c.Id as classId,
        c.ClassName,
        s.Id as sectionId,
        s.SectionName
      FROM Classes c
      LEFT JOIN ClassSectionMapping csm ON csm.ClassId = c.Id
      LEFT JOIN Sections s ON csm.SectionId = s.Id
      ORDER BY c.Id, s.SectionName
    `).all()

    classSections.forEach(cs => {
      cs.classId = cs.classId || 0; 
      ClassName = cs.ClassName || 'No Class';
      sectionId = cs.sectionId || 0;
      SectionName = cs.SectionName || '';

    });  

    // Get total subjects count per class
    const totalSubjectsStmt = db.prepare(`
      SELECT ClassId, COUNT(*) as total 
      FROM ClassSubjectMapping 
      GROUP BY ClassId
    `)

    // Get finished subjects count per class-section
    const finishedSubjectsStmt = db.prepare(`
      SELECT 
        ClassId,
        SectionId,
        COUNT(DISTINCT SubjectId) as finished
      FROM MarkEntryStatus
      WHERE 
        ActiveExamId = ? AND
        FinishedEntry = 1
      GROUP BY ClassId, SectionId
    `)

    const totalSubjectsMap = new Map(
      totalSubjectsStmt.all().map(row => [row.ClassId, row.total])
    )    

    const finishedSubjectsMap = new Map(
      finishedSubjectsStmt.all(examId)
        .map(row => [`${row.ClassId}-${row.SectionId || 0}`, row.finished])
    )

    // Prepare final result
    const result = classSections.map(cs => {
      let total = totalSubjectsMap.get(cs.classId) || 0
      // if(examType === 'selection'){
      //   total-= 1; // Exclude English for selection test
      // }
      const finished = finishedSubjectsMap.get(`${cs.classId}-${cs.sectionId || 0}`) || 0
      
      return {
        classId: cs.classId,
        sectionId: cs.sectionId || 0,
        className: cs.ClassName,
        sectionName: cs.SectionName,
        totalSubjects: total,
        finishedSubjects: finished,
        allFinished: finished >= total, // Using >= as safety check
        completionPercentage: total > 0 ? Math.round((finished / total) * 100) : 0
      }
    })
    //console.log("finished Subject raw", result)
    return { 
      success: true,
      data: result 
    }

  } catch (error) {
    console.error('Error in get-all-class-section-status:', error)
    return { 
      success: false,
      error: error.message,
      data: [] 
    }
  }
})


//Verify Result Status
ipcMain.handle('verify-result-status', async (event, { academicYearId, resultType, examId, classId, sectionId }) => {
  //console.log('Verifying result status for exam:', examId, 'class:', classId, 'section:', sectionId);
  try {
    const result = db.prepare(`
      SELECT 
        isGenerated, 
        isPublished,
        Last_Modified_at
      FROM ResultStatus
      WHERE 
        AcademicYearId = ? AND
        ResultType = ? AND
        ActiveExamId = ? AND 
        ClassId = ? AND 
        SectionId = ?

    `).get(academicYearId, resultType, examId, classId, sectionId);
    if (!result) {
      return { 
        success: false, 
        error: 'No result status found for the given exam/class/section.' 
      }
    }

    //console.log('Result status:', result);
    return { 
      success: true,
      isVerified: result.isGenerated || false,
      isPublished: result.isPublished || false,
      lastModifiedAt: result.Last_Modified_at || null
    }
  } catch (error) {
    console.error('Error verifying result status:', error)
    return { 
      success: false,
      error: error.message
    }
  }
})

//Generate Results
// ipcMain.handle('generate-results', async (event, { academicYearId, examType, resultType, examId, classId, sectionId }) => {

//   let PassingPercentage ; 

//   const passPercentage = db.prepare(`SELECT PassingPercentage FROM ActiveExams WHERE Id = ?`).get(examId);
//   PassingPercentage = passPercentage?.PassingPercentage || 40;
//   // console.log('Passing Percentage:', PassingPercentage)
  
//   const transaction = db.transaction(() => {

//     const classInfo = db.prepare(`SELECT ClassName FROM Classes WHERE Id = ?`).get(classId);
//     if (!classInfo) throw new Error('Class not found.');

//     const Class = romanToInt(classInfo.ClassName);

//     try {

//       let students;

//       if (examType === 'annual') {

//         students = db.prepare(`
//           SELECT s.Id as studentId, s.Name, a.RollNo,
//                  ctm.TotalMarksObtained, ctm.TotalMaxMarks, ctm.Percentage
//           FROM FinalCumulativeTotalMarks ctm
//           JOIN Students s ON s.Id = ctm.StudentId
//           JOIN Admissions a ON s.Id = a.StudentId
//           WHERE a.AcademicYearId = ?
//           AND a.ClassId = ?
//           AND a.SectionId = ?
//           AND ctm.AcademicYearId = ?
//           ORDER BY ctm.TotalMarksObtained DESC
//         `).all(academicYearId, classId, sectionId, academicYearId);

//       } else {

//         students = db.prepare(`
//           SELECT s.Id as studentId, s.Name, a.RollNo,
//                  ctm.TotalMarksObtained, ctm.TotalMaxMarks, ctm.Percentage
//           FROM CumulativeTotalMarks ctm
//           JOIN Students s ON s.Id = ctm.StudentId
//           JOIN Admissions a ON s.Id = a.StudentId
//           WHERE a.AcademicYearId = ?
//           AND a.ClassId = ?
//           AND a.SectionId = ?
//           AND ctm.ActiveExamId = ?
//           ORDER BY ctm.TotalMarksObtained DESC
//         `).all(academicYearId, classId, sectionId, examId);

//       }

//       if (!students.length) {
//         throw new Error('No students with calculated marks found.');
//       }

//       // Get ActiveExam details to check if it's a selection exam
//       // const activeExam = db.prepare(`
//       //   SELECT ae.*, e.ExamName, e.ExamType 
//       //   FROM ActiveExams ae
//       //   JOIN Exams e ON e.Id = ae.ExamId
//       //   WHERE ae.Id = ?
//       // `).get(examId);      

//       const insertResult = db.prepare(`
//         INSERT OR REPLACE INTO Results (
//           AcademicYearId, StudentId, ActiveExamId,
//           TotalMaxMarks, TotalMarksObtained, Percentage,
//           Division, Rank, ResultStatus, ResultType, Last_Modified_at
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
//       `);

//       const passStudents = [];
//       const simplePassStudents = [];
//       const failStudents = [];

//       let failMap = new Map();
//       let lowScoreMap = new Map();

//       // -----------------------------
//       // OPTIMIZED FINAL FAIL QUERY - UPDATED with AcademicYearId
//       // -----------------------------

//       if (resultType === 'final') {

//         const failData = db.prepare(`
//           SELECT 
//               StudentId,
//               SUM(isFail) AS failCount,
//               SUM(isLowScore) AS lowScoreCount
//           FROM (
//               SELECT 
//                   m.StudentId,
//                   m.SubjectId,
//                   SUM(m.TotalMarksObtained) AS totalObtained,
//                   SUM(m.TotalMaxMarks) AS totalMax,
//                   CASE 
//                       WHEN SUM(m.TotalMarksObtained) < SUM(m.TotalMaxMarks) * 0.40 THEN 1 
//                       ELSE 0 
//                   END AS isFail,
//                   CASE 
//                       WHEN SUM(m.TotalMarksObtained) < SUM(m.TotalMaxMarks) * 0.20 THEN 1 
//                       ELSE 0 
//                   END AS isLowScore
//               FROM Marks m
//               JOIN Subjects s ON s.Id = m.SubjectId
//               WHERE m.AcademicYearId = ?
//               AND s.SubjectCategory != 'Co-Scholastic'
//               GROUP BY m.StudentId, m.SubjectId
//           ) subjectTotals
//           GROUP BY StudentId
//         `).all(academicYearId);

//         for (const row of failData) {

//           if (!failMap.has(row.StudentId)) {
//             failMap.set(row.StudentId, 0);
//             lowScoreMap.set(row.StudentId, 0);
//           }

//           failMap.set(row.StudentId, failMap.get(row.StudentId) + row.failCount);
//           lowScoreMap.set(row.StudentId, lowScoreMap.get(row.StudentId) + row.lowScoreCount);

//         }
//       }

//       // -----------------------------
//       // PROCESS STUDENTS - UPDATED with AcademicYearId and Selection Exam Logic
//       // -----------------------------

//       for (const student of students) {

//         let { studentId, TotalMarksObtained, TotalMaxMarks, Percentage } = student;

//         // For selection exams, adjust the marks to be out of 80% of original
//         if (examType === 'selection' && withoutInternal) {
//           // Option 1: Keep obtained marks same but reduce max marks to 80%
          
//           TotalMaxMarks = Math.round(TotalMaxMarks*0.80);
          
//           // Recalculate percentage based on adjusted values
//           Percentage = (TotalMarksObtained / TotalMaxMarks) * 100;
//         }

//         let failCount = 0;
//         let lowScoreCount = 0;

//         if (resultType === 'final') {

//           failCount = failMap.get(studentId) || 0;
//           lowScoreCount = lowScoreMap.get(studentId) || 0;

//         } else {

//           const fCount = db.prepare(`
//             SELECT COUNT(*) AS fails
//             FROM Marks
//             JOIN Subjects s ON s.Id = Marks.SubjectId
//             WHERE Marks.StudentId = ?
//             AND Marks.ActiveExamId = ?
//             AND Marks.AcademicYearId = ?
//             AND s.SubjectCategory != 'Co-Scholastic'
//             AND Marks.SubjectResult = 'Fail'
//           `).get(studentId, examId, academicYearId);

//           failCount = fCount?.fails || 0;

//           const lsCount = db.prepare(`
//             SELECT COUNT(*) AS lowScores
//             FROM Marks
//             WHERE StudentId = ?
//             AND ActiveExamId = ?
//             AND AcademicYearId = ?
//             AND SubjectResult = 'Fail'
//             AND TotalMarksObtained < TotalMaxMarks * 0.20
//           `).get(studentId, examId, academicYearId);

//           lowScoreCount = lsCount?.lowScores || 0;
//         }

//         let resultStatus = "Pass";
//         let division = "N.A.";

//         // Check if student should be marked as Fail
//         // Fail if: more than 2 failures, OR any failure with less than 20% marks, OR overall percentage below passing
//         if (failCount > 2 || lowScoreCount > 0 || Percentage < PassingPercentage) {
//           resultStatus = 'Fail';
//         } else {
//           // Determine if it's Simple Pass based on class and fail count
//           if (Class <= 10 && Class >= 1) {
//             // For classes 1-10: Simple Pass if they have 1-2 failures but all above 20%
//             if (failCount >= 1 && failCount <= 2 && lowScoreCount === 0) {
//               resultStatus = 'Simple Pass';
//             }
//             // Otherwise remains 'Pass'
//           } else if (Class >= 11) {
//             // For classes 11-12: Simple Pass if exactly 1 failure and above 20%
//             if (failCount === 1 && lowScoreCount === 0) {
//               resultStatus = 'Simple Pass';
//             } else if (failCount > 1) {
//               resultStatus = 'Fail'; // More than 1 failure in higher classes = Fail
//             }
//             // Otherwise remains 'Pass'
//           } else {
//             // For any other class classification
//             if (failCount === 1) {
//               resultStatus = 'Simple Pass';
//             } else if (failCount > 1) {
//               resultStatus = 'Fail';
//             }
//           }

//           // Calculate division only for non-fail students
//           if (resultStatus !== 'Fail') {
//             division = getDivision(Percentage, failCount);
//           }
//         }

//         const studentWithStatus = { ...student, studentId, TotalMarksObtained, TotalMaxMarks, Percentage, resultStatus, division };

//         if (resultStatus === 'Pass') passStudents.push(studentWithStatus);
//         else if (resultStatus === 'Simple Pass') simplePassStudents.push(studentWithStatus);
//         else failStudents.push(studentWithStatus);

//       }

//       // -----------------------------
//       // RANKING
//       // -----------------------------

//       let rank = 0;
//       let lastScore = null;

//       const processRank = (list, giveRank = true) => {

//         for (const student of list) {

//           const { studentId, TotalMarksObtained, TotalMaxMarks, Percentage, resultStatus, division } = student;

//           if (lastScore !== TotalMarksObtained) {
//             rank++;
//           }

//           lastScore = TotalMarksObtained;

//           insertResult.run(
//             academicYearId,
//             studentId,
//             examId,
//             TotalMaxMarks,
//             TotalMarksObtained,
//             Percentage,
//             division,
//             giveRank ? rank : null,
//             resultStatus,
//             resultType
//           );
//         }
//       };

//       processRank(passStudents, true);
//       processRank(simplePassStudents, false);
//       processRank(failStudents, false);

//       // Update ResultStatus
//       db.prepare(`
//         INSERT OR REPLACE INTO ResultStatus (
//           AcademicYearId, ActiveExamId, ClassId, SectionId,
//           ResultType, isGenerated, Last_Modified_at
//         ) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
//       `).run(academicYearId, examId, classId, sectionId, resultType);

//       return {
//         success: true,
//         message: `Results generated for ${students.length} students.`
//       };

//     } catch (error) {

//       console.error('Result generation failed:', error);

//       return {
//         success: false,
//         error: error.message
//       };
//     }
//   });

//   return transaction();
// });
ipcMain.handle('generate-results', async (event, {
  academicYearId,
  examType,   // now only 'terminal' or 'annual'
  resultType,
  examId,
  classId,
  sectionId
}) => {

  let PassingPercentage;

  const passPercentage = db.prepare(`
    SELECT PassingPercentage FROM ActiveExams WHERE Id = ?
  `).get(examId);

  PassingPercentage = passPercentage?.PassingPercentage || 40;

  const transaction = db.transaction(() => {

    const classInfo = db.prepare(`
      SELECT ClassName FROM Classes WHERE Id = ?
    `).get(classId);

    if (!classInfo) throw new Error('Class not found.');

    const Class = romanToInt(classInfo.ClassName);

    try {

      let students;

      // -----------------------------
      // STUDENTS FETCH
      // -----------------------------
      if (examType === 'annual') {

        students = db.prepare(`
          SELECT s.Id as studentId, s.Name, a.RollNo,
                 ctm.TotalMarksObtained, ctm.TotalMaxMarks, ctm.Percentage
          FROM FinalCumulativeTotalMarks ctm
          JOIN Students s ON s.Id = ctm.StudentId
          JOIN Admissions a ON s.Id = a.StudentId
          WHERE a.AcademicYearId = ?
          AND a.ClassId = ?
          AND a.SectionId = ?
          AND ctm.AcademicYearId = ?
          ORDER BY ctm.TotalMarksObtained DESC
        `).all(academicYearId, classId, sectionId, academicYearId);

      } else {

        // terminal
        students = db.prepare(`
          SELECT s.Id as studentId, s.Name, a.RollNo,
                 ctm.TotalMarksObtained, ctm.TotalMaxMarks, ctm.Percentage
          FROM CumulativeTotalMarks ctm
          JOIN Students s ON s.Id = ctm.StudentId
          JOIN Admissions a ON s.Id = a.StudentId
          WHERE a.AcademicYearId = ?
          AND a.ClassId = ?
          AND a.SectionId = ?
          AND ctm.ActiveExamId = ?
          ORDER BY ctm.TotalMarksObtained DESC
        `).all(academicYearId, classId, sectionId, examId);
      }

      if (!students.length) {
        throw new Error('No students with calculated marks found.');
      }

      // -----------------------------
      // PREPARE INSERT
      // -----------------------------
      const insertResult = db.prepare(`
        INSERT OR REPLACE INTO Results (
          AcademicYearId, StudentId, ActiveExamId,
          TotalMaxMarks, TotalMarksObtained, Percentage,
          Division, Rank, ResultStatus, ResultType, Last_Modified_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const passStudents = [];
      const simplePassStudents = [];
      const failStudents = [];

      let failMap = new Map();
      let lowScoreMap = new Map();

      // -----------------------------
      // FAIL LOGIC (FINAL RESULT ONLY)
      // -----------------------------
      if (resultType === 'final') {

        const failData = db.prepare(`
          SELECT 
              StudentId,
              SUM(isFail) AS failCount,
              SUM(isLowScore) AS lowScoreCount
          FROM (
              SELECT 
                  m.StudentId,
                  m.SubjectId,
                  SUM(m.TotalMarksObtained) AS totalObtained,
                  SUM(m.TotalMaxMarks) AS totalMax,
                  CASE 
                      WHEN SUM(m.TotalMarksObtained) < SUM(m.TotalMaxMarks) * 0.40 THEN 1 
                      ELSE 0 
                  END AS isFail,
                  CASE 
                      WHEN SUM(m.TotalMarksObtained) < SUM(m.TotalMaxMarks) * 0.20 THEN 1 
                      ELSE 0 
                  END AS isLowScore
              FROM Marks m
              JOIN Subjects s ON s.Id = m.SubjectId
              WHERE m.AcademicYearId = ?
              AND s.SubjectCategory != 'Co-Scholastic'
              GROUP BY m.StudentId, m.SubjectId
          ) subjectTotals
          GROUP BY StudentId
        `).all(academicYearId);

        for (const row of failData) {
          failMap.set(row.StudentId, row.failCount);
          lowScoreMap.set(row.StudentId, row.lowScoreCount);
        }
      }

      // -----------------------------
      // PROCESS STUDENTS
      // -----------------------------
      for (const student of students) {

        let { studentId, TotalMarksObtained, TotalMaxMarks, Percentage } = student;

        let failCount = 0;
        let lowScoreCount = 0;

        if (resultType === 'final') {
          failCount = failMap.get(studentId) || 0;
          lowScoreCount = lowScoreMap.get(studentId) || 0;
        } else {

          const fCount = db.prepare(`
            SELECT COUNT(*) AS fails
            FROM Marks
            JOIN Subjects s ON s.Id = Marks.SubjectId
            WHERE Marks.StudentId = ?
            AND Marks.ActiveExamId = ?
            AND Marks.AcademicYearId = ?
            AND s.SubjectCategory != 'Co-Scholastic'
            AND Marks.SubjectResult = 'Fail'
          `).get(studentId, examId, academicYearId);

          failCount = fCount?.fails || 0;

          const lsCount = db.prepare(`
            SELECT COUNT(*) AS lowScores
            FROM Marks
            WHERE StudentId = ?
            AND ActiveExamId = ?
            AND AcademicYearId = ?
            AND SubjectResult = 'Fail'
            AND TotalMarksObtained < TotalMaxMarks * 0.20
          `).get(studentId, examId, academicYearId);

          lowScoreCount = lsCount?.lowScores || 0;
        }

        let resultStatus = "Pass";
        let division = "N.A.";

        if (failCount > 2 || lowScoreCount > 0 || Percentage < PassingPercentage) {
          resultStatus = 'Fail';
        } else {

          if (Class <= 10) {
            if (failCount >= 1 && failCount <= 2 && lowScoreCount === 0) {
              resultStatus = 'Simple Pass';
            }
          } else if (Class >= 11) {
            if (failCount === 1 && lowScoreCount === 0) {
              resultStatus = 'Simple Pass';
            } else if (failCount > 1) {
              resultStatus = 'Fail';
            }
          } else {
            if (failCount === 1) {
              resultStatus = 'Simple Pass';
            } else if (failCount > 1) {
              resultStatus = 'Fail';
            }
          }

          if (resultStatus !== 'Fail') {
            division = getDivision(Percentage, failCount);
          }
        }

        const studentWithStatus = {
          ...student,
          studentId,
          TotalMarksObtained,
          TotalMaxMarks,
          Percentage,
          resultStatus,
          division
        };

        if (resultStatus === 'Pass') passStudents.push(studentWithStatus);
        else if (resultStatus === 'Simple Pass') simplePassStudents.push(studentWithStatus);
        else failStudents.push(studentWithStatus);
      }

      // -----------------------------
      // RANKING
      // -----------------------------
      let rank = 0;
      let lastScore = null;

      const processRank = (list, giveRank = true) => {

        for (const student of list) {

          const { studentId, TotalMarksObtained, TotalMaxMarks, Percentage, resultStatus, division } = student;

          if (lastScore !== TotalMarksObtained) {
            rank++;
          }

          lastScore = TotalMarksObtained;

          insertResult.run(
            academicYearId,
            studentId,
            examId,
            TotalMaxMarks,
            TotalMarksObtained,
            Percentage,
            division,
            giveRank ? rank : null,
            resultStatus,
            resultType
          );
        }
      };

      processRank(passStudents, true);
      processRank(simplePassStudents, false);
      processRank(failStudents, false);

      // -----------------------------
      // RESULT STATUS UPDATE
      // -----------------------------
      db.prepare(`
        INSERT OR REPLACE INTO ResultStatus (
          AcademicYearId, ActiveExamId, ClassId, SectionId,
          ResultType, isGenerated, Last_Modified_at
        ) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `).run(academicYearId, examId, classId, sectionId, resultType);

      return {
        success: true,
        message: `Results generated for ${students.length} students.`
      };

    } catch (error) {

      console.error('Result generation failed:', error);

      return {
        success: false,
        error: error.message
      };
    }
  });

  return transaction();
});

//generate Selection Test Results for Class X
// ipcMain.handle('generate-selection-results', async (event, {
//   academicYearId,
//   examId,
//   classId,
//   sectionId,
//   withoutInternalMarks // boolean
// }) => {

//   const resultType = withoutInternalMarks ? 'selection' : 'provisional';
//   const transaction = db.transaction(() => {
//     try {

//       // -----------------------------
//       // PASSING PERCENTAGE
//       // -----------------------------
//       const passRow = db.prepare(`
//         SELECT PassingPercentage FROM ActiveExams WHERE Id = ?
//       `).get(examId);

//       const PassingPercentage = passRow?.PassingPercentage || 40;

//       // -----------------------------
//       // CLASS INFO
//       // -----------------------------
//       const classInfo = db.prepare(`
//         SELECT ClassName FROM Classes WHERE Id = ?
//       `).get(classId);

//       if (!classInfo) throw new Error('Class not found.');

//       const Class = romanToInt(classInfo.ClassName);

//       // -----------------------------
//       // SUBJECT-LEVEL AGGREGATION
//       // -----------------------------
//       const marksData = db.prepare(`
//         SELECT 
//           m.StudentId,
//           m.SubjectId,
//           ${withoutInternalMarks ? 'm.TerminalMarksObtained' : 'm.TotalMarksObtained'} AS obtained,
//           ${withoutInternalMarks ? 'm.TerminalMaxMark' : 'm.TotalMaxMarks'} AS maxMarks
//         FROM Marks m
//         JOIN Subjects s ON s.Id = m.SubjectId
//         WHERE m.AcademicYearId = ?
//         AND m.ActiveExamId = ?
//         AND s.SubjectCategory != 'Co-Scholastic'
//       `).all(academicYearId, examId);

//       if (!marksData.length) {
//         throw new Error('No marks found for selection exam.');
//       }

//       // -----------------------------
//       // BUILD STUDENT MAP
//       // -----------------------------
//       const studentMap = new Map();

//       for (const row of marksData) {

//         const { StudentId, obtained, maxMarks } = row;

//         if (!studentMap.has(StudentId)) {
//           studentMap.set(StudentId, {
//             TotalMarksObtained: 0,
//             TotalMaxMarks: 0,
//             failCount: 0,
//             lowScoreCount: 0
//           });
//         }

//         const student = studentMap.get(StudentId);

//         student.TotalMarksObtained += obtained || 0;
//         student.TotalMaxMarks += maxMarks || 0;

//         // subject fail logic
//         if ((obtained || 0) < (maxMarks || 0) * 0.40) {
//           student.failCount++;
//         }

//         if ((obtained || 0) < (maxMarks || 0) * 0.20) {
//           student.lowScoreCount++;
//         }
//       }

//       // -----------------------------
//       // FETCH STUDENT DETAILS
//       // -----------------------------
//       const studentIds = Array.from(studentMap.keys());

//       const studentsInfo = db.prepare(`
//         SELECT s.Id as studentId, s.Name, a.RollNo
//         FROM Students s
//         JOIN Admissions a ON a.StudentId = s.Id
//         WHERE a.AcademicYearId = ?
//         AND a.ClassId = ?
//         AND a.SectionId = ?
//         AND s.Id IN (${studentIds.map(() => '?').join(',')})
//       `).all(academicYearId, classId, sectionId, ...studentIds);

//       // -----------------------------
//       // PREPARE INSERT
//       // -----------------------------
//       const insertResult = db.prepare(`
//         INSERT OR REPLACE INTO Results (
//           AcademicYearId, StudentId, ActiveExamId,
//           TotalMaxMarks, TotalMarksObtained, Percentage,
//           Division, Rank, ResultStatus, ResultType, Last_Modified_at
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
//       `);

//       let passList = [];
//       let simplePassList = [];
//       let failList = [];

//       // -----------------------------
//       // PROCESS STUDENTS
//       // -----------------------------
//       for (const info of studentsInfo) {

//         const student = studentMap.get(info.studentId);

//         const Percentage = student.TotalMaxMarks > 0
//           ? (student.TotalMarksObtained / student.TotalMaxMarks) * 100
//           : 0;

//         let resultStatus = 'Pass';
//         let division = 'N.A.';

//         if (
//           student.failCount > 2 ||
//           student.lowScoreCount > 0 ||
//           Percentage < PassingPercentage
//         ) {
//           resultStatus = 'Fail';
//         } else {

//           if (Class <= 10) {
//             if (student.failCount >= 1 && student.failCount <= 2 && student.lowScoreCount === 0) {
//               resultStatus = 'Simple Pass';
//             }
//           } else {
//             if (student.failCount === 1 && student.lowScoreCount === 0) {
//               resultStatus = 'Simple Pass';
//             } else if (student.failCount > 1) {
//               resultStatus = 'Fail';
//             }
//           }

//           if (resultStatus !== 'Fail') {
//             division = getDivision(Percentage, student.failCount);
//           }
//         }

//         const obj = {
//           studentId: info.studentId,
//           TotalMarksObtained: student.TotalMarksObtained,
//           TotalMaxMarks: student.TotalMaxMarks,
//           Percentage,
//           resultStatus,
//           division
//         };

//         if (resultStatus === 'Pass') passList.push(obj);
//         else if (resultStatus === 'Simple Pass') simplePassList.push(obj);
//         else failList.push(obj);
//       }

//       // -----------------------------
//       // RANKING
//       // -----------------------------
//       let rank = 0;
//       let lastScore = null;

//       const applyRank = (list, giveRank) => {
//         for (const s of list) {
//           if (lastScore !== s.TotalMarksObtained) rank++;
//           lastScore = s.TotalMarksObtained;

//           insertResult.run(
//             academicYearId,
//             s.studentId,
//             examId,
//             s.TotalMaxMarks,
//             s.TotalMarksObtained,
//             s.Percentage,
//             s.division,
//             giveRank ? rank : null,
//             s.resultStatus,
//             resultType
//           );
//         }
//       };

//       applyRank(passList, true);
//       applyRank(simplePassList, false);
//       applyRank(failList, false);

//       // -----------------------------
//       // RESULT STATUS UPDATE
//       // -----------------------------
//       db.prepare(`
//         INSERT OR REPLACE INTO ResultStatus (
//           AcademicYearId, ActiveExamId, ClassId, SectionId,
//           ResultType, isGenerated, Last_Modified_at
//         ) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
//       `).run(academicYearId, examId, classId, sectionId, resultType);

//       return {
//         success: true,
//         message: `Selection results generated (${resultType}) for ${studentsInfo.length} students.`
//       };

//     } catch (error) {
//       console.error(error);
//       return { success: false, error: error.message };
//     }
//   });

//   return transaction();
// });
// -----------------------------
// CORE PROCESS FUNCTION
// -----------------------------
const processResults = ({
  academicYearId,
  examId,
  classId,
  sectionId,
  withoutInternalMarks,
  PassingPercentage,
  Class,
  insertResult
}) => {
  const resultType = withoutInternalMarks ? 'selection' : 'provisional';

  // ------------------------------------------------------------------
  // 1. Delete old results for this class/section/resultType
  // ------------------------------------------------------------------
  db.prepare(`
    DELETE FROM Results
    WHERE ActiveExamId = ?
      AND ResultType = ?
      AND StudentId IN (
        SELECT StudentId FROM Admissions
        WHERE AcademicYearId = ? AND ClassId = ? AND SectionId = ?
      )
  `).run(examId, resultType, academicYearId, classId, sectionId);

  // ------------------------------------------------------------------
  // 2. Fetch all enrolled students with their marks (if any)
  // ------------------------------------------------------------------
  const studentMarks = db.prepare(`
    SELECT
      s.Id as studentId,
      s.Name,
      a.RollNo,
      m.TerminalMarksObtained,
      m.TerminalMaxMark,
      m.PeriodicMarksObtained,
      m.PeriodicMaxMark
    FROM Students s
    JOIN Admissions a ON a.StudentId = s.Id AND a.AcademicYearId = ?
    LEFT JOIN Marks m
      ON m.StudentId = s.Id
      AND m.AcademicYearId = ?
      AND m.ActiveExamId = ?
      AND m.SubjectId IN (
        SELECT Id FROM Subjects WHERE SubjectCategory != 'Co-Scholastic'
      )
    WHERE a.ClassId = ? AND a.SectionId = ?
    ORDER BY s.Id
  `).all(academicYearId, academicYearId, examId, classId, sectionId);

  if (!studentMarks.length) {
    throw new Error(`No students found for class ${classId}, section ${sectionId}.`);
  }

  // ------------------------------------------------------------------
  // 3. Aggregate totals per student
  // ------------------------------------------------------------------
  const studentMap = new Map();

  for (const row of studentMarks) {
    const { studentId, Name, RollNo } = row;

    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, {
        Name,
        RollNo,
        TotalMarksObtained: 0,
        TotalMaxMarks: 0,
        failCount: 0,
        lowScoreCount: 0,
      });
    }

    const student = studentMap.get(studentId);

    // If marks are missing (no row or NULL), treat as 0
    const obtained = withoutInternalMarks
      ? (row.TerminalMarksObtained || 0)
      : (row.TerminalMarksObtained || 0) + (row.PeriodicMarksObtained || 0);

    const maxMarks = withoutInternalMarks
      ? (row.TerminalMaxMark || 0)
      : (row.TerminalMaxMark || 0) + (row.PeriodicMaxMark || 0);

    // If there are no marks for this subject (row is from left join but m.* are NULL),
    // obtained and maxMarks will be 0, which is fine.
    student.TotalMarksObtained += obtained;
    student.TotalMaxMarks += maxMarks;

    // Count fails and low scores (only if the subject has positive max marks)
    if (maxMarks > 0) {
      if (obtained < maxMarks * PassingPercentage / 100.0) student.failCount++;
      if (obtained < maxMarks * 0.20) student.lowScoreCount++;
    }
  }

  // ------------------------------------------------------------------
  // 4. Process each student to determine result status and division
  // ------------------------------------------------------------------
  let passList = [];
  let simplePassList = [];
  let failList = [];

  for (const [studentId, student] of studentMap.entries()) {
    const Percentage = student.TotalMaxMarks > 0
      ? Number(((student.TotalMarksObtained / student.TotalMaxMarks) * 100).toFixed(2))
      : 0;

    let resultStatus = 'Pass';
    let division = 'N.A.';

    // Fail condition
    if (
      student.failCount > 2 ||
      student.lowScoreCount > 0 ||
      Percentage < PassingPercentage
    ) {
      resultStatus = 'Fail';
    } else {
      // Determine Simple Pass vs Pass
      if (Class <= 10) {
        if (student.failCount >= 1 && student.failCount <= 2 && student.lowScoreCount === 0) {
          resultStatus = 'Simple Pass';
        }
      } else { // Class > 10
        if (student.failCount === 1 && student.lowScoreCount === 0) {
          resultStatus = 'Simple Pass';
        } else if (student.failCount > 1) {
          resultStatus = 'Fail'; // already covered by earlier condition, but for clarity
        }
      }

      // Assign division only if not Fail
      if (resultStatus !== 'Fail') {
        division = getDivision(Percentage, student.failCount);
      }
    }

    const obj = {
      studentId,
      TotalMarksObtained: student.TotalMarksObtained,
      TotalMaxMarks: student.TotalMaxMarks,
      Percentage,
      resultStatus,
      division,
    };

    if (resultStatus === 'Pass') passList.push(obj);
    else if (resultStatus === 'Simple Pass') simplePassList.push(obj);
    else failList.push(obj);
  }

  // ------------------------------------------------------------------
  // 5. Rank only Pass students
  // ------------------------------------------------------------------
  passList.sort((a, b) => b.TotalMarksObtained - a.TotalMarksObtained);

  let rank = 0;
  let lastScore = null;

  const applyRank = (list, giveRank) => {
    for (const s of list) {
      if (lastScore !== s.TotalMarksObtained) rank++;
      lastScore = s.TotalMarksObtained;

      insertResult.run(
        academicYearId,
        s.studentId,
        examId,
        s.TotalMaxMarks,
        s.TotalMarksObtained,
        s.Percentage,
        s.division,
        giveRank ? rank : null,
        s.resultStatus,
        resultType
      );
    }
  };

  applyRank(passList, true);
  applyRank(simplePassList, false);
  applyRank(failList, false);

  return studentMap.size; // total number of students processed
};

ipcMain.handle('generate-selection-results', async (event, params) => {

  const { academicYearId, examId, classId, sectionId } = params;

  const transaction = db.transaction(() => {
    try {

      const passRow = db.prepare(`
        SELECT PassingPercentage FROM ActiveExams WHERE Id = ?
      `).get(examId);

      const PassingPercentage = passRow?.PassingPercentage || 40;

      const classInfo = db.prepare(`
        SELECT ClassName FROM Classes WHERE Id = ?
      `).get(classId);

      if (!classInfo) throw new Error('Class not found.');

      const Class = romanToInt(classInfo.ClassName);

      const insertResult = db.prepare(`
        INSERT OR REPLACE INTO Results (
          AcademicYearId, StudentId, ActiveExamId,
          TotalMaxMarks, TotalMarksObtained, Percentage,
          Division, Rank, ResultStatus, ResultType, Last_Modified_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      // 🔥 RUN BOTH
      const countSelection = processResults({
        academicYearId,
        examId,
        classId,
        sectionId,
        withoutInternalMarks: true,
        PassingPercentage,
        Class,
        insertResult
      });

      const countProvisional = processResults({
        academicYearId,
        examId,
        classId,
        sectionId,
        withoutInternalMarks: false,
        PassingPercentage,
        Class,
        insertResult
      });

      // Update ResultStatus for BOTH
      const updateStatus = db.prepare(`
        INSERT OR REPLACE INTO ResultStatus (
          AcademicYearId, ActiveExamId, ClassId, SectionId,
          ResultType, isGenerated, Last_Modified_at
        ) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `);

      updateStatus.run(academicYearId, examId, classId, sectionId, 'selection');
      updateStatus.run(academicYearId, examId, classId, sectionId, 'provisional');

      return {
        success: true,
        message: `Results generated:
          Selection: ${countSelection}
          Provisional: ${countProvisional}`
      };

    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  });

  return transaction();
});

//Get generated Result Summary
ipcMain.handle('get-result-summary', async (event, { academicYearId, examId, resultType }) => {
  try {
    if (!academicYearId || !examId) {
      throw new Error('Missing required parameters: academicYearId or examId');
    }
    // console.log("Current ExamId for Summary:", examId)
    // Get all class-section mappings (synchronously)
    let classSections = [];
    const classes = db.prepare(`
      SELECT 
        c.Id as classId, 
        c.ClassName as className,
        s.Id as sectionId,
        s.SectionName as sectionName,
        CASE WHEN s.Id IS NULL THEN 0 ELSE 1 END as hasSections
      FROM Classes c
      LEFT JOIN ClassSectionMapping csm ON c.Id = csm.ClassId
      LEFT JOIN Sections s ON csm.SectionId = s.Id
      ORDER BY c.Id, s.Id
    `).all();
    // console.log("Classes fetched for summary: with result Type", classes, resultType)
    classSections = classes; // Default to all class sections 
    if(resultType === 'selection'){
      classSections = classes.filter(cs => cs.className === 'X'); 
      // console.log("Class sections for selection test", classSections)
    }
    else if(resultType === 'final'){
      classSections = classes.filter(cs => cs.className !== 'X');
      // console.log("Class sections for final test", classSections)
    } 

    const results = [];

    // Helper to execute a query and return count
    const getCount = (query, params) => {
      const row = db.prepare(query).get(...params);
      return row?.count || 0;
    };
    
    let SectionId = 0
    for (const cs of classSections) {
      if(cs.sectionId === null){
        SectionId = 0
      }else{
        SectionId = cs.sectionId
      }
      params = [examId, academicYearId, cs.classId, SectionId];

      const totalStudents = getCount(`
        SELECT COUNT(*) as count
        FROM Admissions
        WHERE AcademicYearId = ? AND ClassId = ? AND SectionId = ?
      `, [academicYearId, cs.classId, SectionId]);

      const appeared = getCount(`
        SELECT COUNT(DISTINCT m.StudentId) as count
        FROM Marks m
        JOIN Admissions a ON m.StudentId = a.StudentId
        WHERE m.ActiveExamId = ? AND a.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ? 
      `, params);

      const passed = getCount(`
        SELECT COUNT(*) as count
        FROM Results r
        JOIN Admissions a ON r.StudentId = a.StudentId AND r.AcademicYearId = a.AcademicYearId 
        JOIN ResultStatus rs ON rs.ResultType = r.ResultType AND r.AcademicYearId = rs.AcademicYearId
        AND r.ActiveExamId = rs.ActiveExamId AND a.ClassId = rs.ClassId AND a.SectionId = rs.SectionId
        WHERE r.ActiveExamId = ? AND a.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ?
        AND r.ResultStatus = 'Pass'
        AND rs.isPublished = 1
      `, params);

      const failed = getCount(`
        SELECT COUNT(*) as count
        FROM Results r
        JOIN Admissions a ON r.StudentId = a.StudentId
        JOIN ResultStatus rs ON rs.ResultType = r.ResultType AND r.AcademicYearId = rs.AcademicYearId
        AND r.ActiveExamId = rs.ActiveExamId AND a.ClassId = rs.ClassId AND a.SectionId = rs.SectionId
        AND r.AcademicYearId = a.AcademicYearId
        WHERE r.ActiveExamId = ? AND a.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ?
        AND r.ResultStatus = 'Fail'
        AND rs.isPublished = 1
      `, params);

      const distinction = getCount(`
        SELECT COUNT(*) as count
        FROM Results r
        JOIN Admissions a ON r.StudentId = a.StudentId
        JOIN ResultStatus rs ON rs.ResultType = r.ResultType AND r.AcademicYearId = rs.AcademicYearId
        AND r.ActiveExamId = rs.ActiveExamId AND a.ClassId = rs.ClassId AND a.SectionId = rs.SectionId
        AND r.AcademicYearId = a.AcademicYearId
        WHERE r.ActiveExamId = ? AND a.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ?
        AND r.Division = 'Dist'
        AND rs.isPublished = 1
      `, params);

      const firstDivision = getCount(`
        SELECT COUNT(*) as count
        FROM Results r
        JOIN Admissions a ON r.StudentId = a.StudentId
        JOIN ResultStatus rs ON rs.ResultType = r.ResultType AND r.AcademicYearId = rs.AcademicYearId
        AND r.ActiveExamId = rs.ActiveExamId AND a.ClassId = rs.ClassId AND a.SectionId = rs.SectionId
        AND r.AcademicYearId = a.AcademicYearId
        WHERE r.ActiveExamId = ? AND a.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ?
        AND r.Division = 'First'
        AND rs.isPublished = 1
      `, params);

      const secondDivision = getCount(`
        SELECT COUNT(*) as count
        FROM Results r
        JOIN Admissions a ON r.StudentId = a.StudentId
        JOIN ResultStatus rs ON rs.ResultType = r.ResultType AND r.AcademicYearId = rs.AcademicYearId
        AND r.ActiveExamId = rs.ActiveExamId AND a.ClassId = rs.ClassId AND a.SectionId = rs.SectionId
        AND r.AcademicYearId = a.AcademicYearId
        WHERE r.ActiveExamId = ? AND a.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ?
        AND r.Division = 'Second'
        AND rs.isPublished = 1
      `, params);

      const thirdDivision = getCount(`
        SELECT COUNT(*) as count
        FROM Results r
        JOIN Admissions a ON r.StudentId = a.StudentId
        JOIN ResultStatus rs ON rs.ResultType = r.ResultType AND r.AcademicYearId = rs.AcademicYearId
        AND r.ActiveExamId = rs.ActiveExamId AND a.ClassId = rs.ClassId AND a.SectionId = rs.SectionId
        AND r.AcademicYearId = a.AcademicYearId
        WHERE r.ActiveExamId = ? AND a.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ?
        AND r.Division = 'Third'
        AND rs.isPublished = 1
      `, params);

      const simplePass = getCount(`
        SELECT COUNT(*) as count
        FROM Results r
        JOIN Admissions a ON r.StudentId = a.StudentId
        JOIN ResultStatus rs ON rs.ResultType = r.ResultType AND r.AcademicYearId = rs.AcademicYearId
        AND r.ActiveExamId = rs.ActiveExamId AND a.ClassId = rs.ClassId AND a.SectionId = rs.SectionId
        AND r.AcademicYearId = a.AcademicYearId
        WHERE r.ActiveExamId = ? AND a.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ?
        AND r.ResultStatus = 'Simple Pass'
        AND rs.isPublished = 1
      `, params);

      results.push({
        className: cs.className,
        sectionName: cs.sectionName,
        totalStudents,
        appeared,
        absent: totalStudents - appeared,
        passed: passed + simplePass,
        passedPercentage: appeared > 0 ? passed  / appeared * 100 : 0,
        failed,
        failedPercentage: appeared > 0 ? (failed / appeared) * 100 : 0,
        distinction,
        firstDivision,
        secondDivision,
        thirdDivision,
        simplePass
      });
    }

    return { success: true, data: results };

  } catch (error) {
    console.error('Error generating result summary:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('get-section-results', async (event, { academicYearId, examId, classId, sectionId, resultType }) => {

  if (sectionId === '') sectionId = 0;
  try {  
    // console.log('get-section-results', { academicYearId, examId, classId, sectionId });
    // Get class and section names for the summary
    const classInfo = db.prepare(`
      SELECT ClassName FROM Classes WHERE Id = ?
    `).get(classId);

    const sectionInfo = db.prepare(`
      SELECT SectionName FROM Sections WHERE Id = ?
    `).get(sectionId);
// console.log("Inputs: ", academicYearId, examId, classId, sectionId, resultType)
    // Get all students with their results for this exam r.TotalMaxMarks telh tur
    const unSortedResults = db.prepare(`
      SELECT 
        s.Id AS StudentId,
        s.Name,
        a.RollNo,
        r.TotalMaxMarks,
        r.TotalMarksObtained,
        r.Percentage,
        r.Division,
        r.Rank,
        r.ResultStatus,
        r.ReportCard
      FROM Students s
      LEFT JOIN Admissions a 
        ON s.Id = a.StudentId
      JOIN Results r 
        ON s.Id = r.StudentId 
      AND r.ActiveExamId = ? 
      AND r.AcademicYearId = ?
      WHERE a.AcademicYearId = ?
        AND a.ClassId = ?
        AND a.SectionId = ?
        AND r.ResultType = ?      
    `).all(examId, academicYearId, academicYearId, classId, sectionId, resultType);
     
    const passedStudents = unSortedResults
      .filter(r => r.ResultStatus === 'Pass')
      .sort((a, b) => {
        if (b.Percentage !== a.Percentage)
          return b.Percentage - a.Percentage;

        return a.Name.localeCompare(b.Name);
      });
    const simplePassStudents = unSortedResults
      .filter(r => r.ResultStatus === 'Simple Pass')
      .sort((a, b) => {
        if (b.Percentage !== a.Percentage)
          return b.Percentage - a.Percentage;

        return a.Name.localeCompare(b.Name);
      });
    const failedStudents = unSortedResults
      .filter(r => r.ResultStatus === 'Fail')
      .sort((a, b) => {
        if (b.Percentage !== a.Percentage)
          return b.Percentage - a.Percentage;

        return a.Name.localeCompare(b.Name);
      });

    const results = [...passedStudents, ...simplePassStudents, ...failedStudents];

    //sort by marks desc and then by name asc for simple pass and fail students to assign continuing ranks
    
    //console.log("Results fetched: ", results)
    // Calculate summary statistics from the results we already fetched
    const noOfStudents = db.prepare(`
      SELECT COUNT(*) as count
      FROM Students s
      JOIN Admissions a ON s.Id = a.StudentId
      WHERE a.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ?
    `).get(academicYearId, classId, sectionId).count;

    const noOfAbsent = noOfStudents - results.filter(r => r.ResultStatus).length;

    const summary = {
      totalStudents: noOfStudents,
      appeared: results.filter(r => r.ResultStatus).length,
      absent: noOfAbsent,
      passed: results.filter(r => r.ResultStatus === 'Pass').length,
      failed: results.filter(r => r.ResultStatus === 'Fail').length,
      distinction: results.filter(r => r.Division === 'Dist').length,
      firstDivision: results.filter(r => r.Division === 'First').length,
      secondDivision: results.filter(r => r.Division === 'Second').length,
      thirdDivision: results.filter(r => r.Division === 'Third').length,      
      simplePass: results.filter(r => r.ResultStatus === 'Simple Pass').length,
    };

    // Calculate percentages
    const passedPercentage = summary.appeared > 0 ? (summary.passed / summary.appeared) * 100 : 0;
    const failedPercentage = summary.appeared > 0 ? (summary.failed / summary.appeared) * 100 : 0;

    //Get Result generated count, report card generated count
    const resultGenerated = db.prepare(`
      SELECT COUNT(*) as count
      FROM Results r
      JOIN Admissions a ON r.StudentId = a.StudentId
      WHERE r.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ? AND r.ResultType = ? 
    `).get(academicYearId, classId, sectionId, resultType);
    // console.log("All Results:", resultGenerated.count)
    const reportCardGenerated = db.prepare(`
      SELECT COUNT(*) as count
      FROM Results r
      JOIN Admissions a ON r.StudentId = a.StudentId
      WHERE r.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ? AND r.ResultType = ? AND r.ReportCard = 1
    `).get(academicYearId, classId, sectionId, resultType);
    // console.log("Report Card Generated:", reportCardGenerated.count)

    return {
      success: true,
      results: results.map(result => ({
        StudentId: result.StudentId,
        Name: result.Name,
        RollNo: result.RollNo,//
        TotalMaxMark: result.TotalMaxMarks,
        TotalMarksObtained: result.TotalMarksObtained,
        Percentage: result.Percentage?.toFixed(2) || '0.00',
        Division: result.Division,
        Rank: result.Rank,
        ResultStatus: result.ResultStatus || '',
        ReportCard: result.ReportCard || 0
      })),
      summary: {
        className: classInfo?.ClassName || '',
        sectionName: sectionInfo?.SectionName || '',
        totalStudents: summary.totalStudents,
        appeared: summary.appeared,
        absent: summary.absent,
        passed: summary.passed,
        passedPercentage: passedPercentage,
        failed: summary.failed,
        failedPercentage: failedPercentage,
        distinction: summary.distinction,
        firstDivision: summary.firstDivision,
        secondDivision: summary.secondDivision,
        thirdDivision: summary.thirdDivision,
        simplePass: summary.simplePass
      },
      reportCardGenerated: reportCardGenerated.count,

    };
  } catch (error) {
    console.error('Error in get section results:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

//Get Result publish status.
ipcMain.handle('get-publish-status', async (event, { academicYearId, activeExamId }) => {
    // console.log("Check for Status-annual", academicYearId, activeExamId)
  try {
    // Get count of finished mark entries
    const markEntryStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM MarkEntryStatus 
      WHERE ActiveExamId = ? AND FinishedEntry = 1
    `);
    const markEntryCount = markEntryStmt.get(activeExamId).count;

    // Get count of generated results
    const resultStatusStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM ResultStatus 
      WHERE AcademicYearId = ? AND ActiveExamId = ? AND isGenerated = 1
    `);
    const resultStatusCount = resultStatusStmt.get(academicYearId, activeExamId).count;
    // get published date
    const publishDateStmt = db.prepare(`
      SELECT PublishDate 
      FROM ActiveExams 
      WHERE Id = ? AND AcademicYearId = ?
    `);
    const publishDate = publishDateStmt.get(activeExamId, academicYearId)?.PublishDate;

    const resultPublished = db.prepare(`
      SELECT Result_Published 
      FROM ActiveExams
      WHERE Id = ? AND AcademicYearId = ?
      `).get(activeExamId, academicYearId)
      
      let isPublished = false

      if (resultPublished && resultPublished.Result_Published === 1){
        isPublished = true
      }
    
    return {
      success: true,
      markEntryCount,
      resultStatusCount,
      isPublished,
      publishDate
    };
  } catch (error) {
    console.error('Error getting publish status counts:', error);
    return { success: false, message: error.message };
  } 
});

//publish Result
ipcMain.handle('publish-results', async (event, { academicYearId, activeExamId, publishDate }) => {  

  try {
    
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();

    /* 1. Verify counts match
    const countCheck = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM MarkEntryStatus WHERE ActiveExamId = ? AND FinishedEntry = 1) as markEntryCount,
        (SELECT COUNT(*) FROM ResultStatus WHERE AcademicYearId = ? AND ActiveExamId = ? AND isGenerated = 1) as resultStatusCount
    `).get(activeExamId, academicYearId, activeExamId);

    if (countCheck.markEntryCount !== countCheck.resultStatusCount) {
      throw new Error(`Count mismatch - Mark entries: ${countCheck.markEntryCount}, Generated results: ${countCheck.resultStatusCount}`);
    }

    if (countCheck.markEntryCount === 0) {
      throw new Error('No results available to publish');
    }*/

    // 2. Update ResultStatus table
    // console.log("check Result publih status")
    const updateResultStatus = db.prepare(`
      UPDATE ResultStatus 
      SET isPublished = 1, Last_Modified_at = CURRENT_TIMESTAMP
      WHERE AcademicYearId = ? AND ActiveExamId = ? AND isGenerated = 1
    `);
    
    updateResultStatus.run(academicYearId, activeExamId);

    // 3. Update ActiveExams table
    const updateActiveExams = db.prepare(`
      UPDATE ActiveExams
      SET Result_Published = 1, PublishDate = ?, Modified_at = CURRENT_TIMESTAMP
      WHERE Id = ? AND AcademicYearId = ?
    `);
    updateActiveExams.run(publishDate, activeExamId, academicYearId);

    // Commit transaction
    db.prepare('COMMIT').run();

    return { success: true };
  } catch (error) {
    db.prepare('ROLLBACK').run();
    console.error('Error publishing results:', error);
    return { success: false, message: error.message };
  } 
});

//Unpublish Resukt
ipcMain.handle('unpublish-results', async (event, { academicYearId, activeExamId }) => {
  try {
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();

    // 1. Update ResultStatus table
    const updateResultStatus = db.prepare(`
      UPDATE ResultStatus 
      SET isPublished = 0, Last_Modified_at = CURRENT_TIMESTAMP
      WHERE AcademicYearId = ? AND ActiveExamId = ? AND isGenerated = 1
    `);
    updateResultStatus.run(academicYearId, activeExamId);

    // 2. Update ActiveExams table
    const updateActiveExams = db.prepare(`
      UPDATE ActiveExams 
      SET Result_Published = 0, PublishDate = NULL, Modified_at = CURRENT_TIMESTAMP
      WHERE Id = ? AND AcademicYearId = ?
    `);
    updateActiveExams.run(activeExamId, academicYearId);

    // Commit transaction
    db.prepare('COMMIT').run();

    return { success: true };
  } catch (error) {
    db.prepare('ROLLBACK').run();
    console.error('Error unpublishing results:', error);
    return { success: false, message: error.message };
  } 
});

// Helper function to get result summary for a given class, section, and exam
const getResultSummary = async (classId, sectionId, examId, academicYearId, examType, resultType) => {
         
  const students = db.prepare(`
    SELECT 
        stu.Id as StudentId,
        stu.Name, 
        a.RollNo         
    FROM Students stu        
    JOIN Admissions a ON stu.Id = a.StudentId     
    WHERE a.ClassId = ? 
        AND a.SectionId = ? 
        AND a.AcademicYearId = ?
    ORDER BY a.RollNo;`).all(classId, sectionId, academicYearId);        

  const results = db.prepare(`
    SELECT 
        stu.Id as StudentId,        
        r.Percentage,
        r.Division,
        r.Rank as Position,
        r.ResultStatus as Result
    FROM Students stu        
    JOIN Admissions a ON stu.Id = a.StudentId
    LEFT JOIN Results r ON stu.Id = r.StudentId
    WHERE a.ClassId = ? 
        AND a.SectionId = ? 
        AND r.AcademicYearId = ?
        AND r.resultType = ?
    ORDER BY a.RollNo;`).all(classId, sectionId, academicYearId, examType);

    // console.log("Results check:",classId, sectionId, academicYearId, examType, results)

    const resultMap = new Map(results.map(r => [r.StudentId, r]));

// Push result fields directly into the students array
    for (const stu of students) {
      const res = resultMap.get(stu.StudentId);
      stu.Percentage = res?.Percentage || null;
      stu.Division = res?.Division || null;
      stu.Position = res?.Position || null;
      stu.Result = res?.Result || null;
    }

  // console.log("Students: ", students)
  
// Get Marks based on examType
  let marks;
  //console.log('Exam Type:', examType)
  if(examType === 'final'){
    marks = db.prepare(`
        SELECT 
            stu.Id AS StudentId,
            a.RollNo,
            s.SubjectCode AS SubjectName,
            s.Id AS SubjectId,
            s.displayOrder,
            SUM(m.PeriodicMarksObtained) AS PeriodicMarksObtained,
            SUM(m.TerminalMarksObtained) AS TerminalMarksObtained,
            SUM(m.TotalMarksObtained) AS TotalMarksObtained
        FROM Students stu
        INNER JOIN Admissions a ON stu.Id = a.StudentId
        INNER JOIN Marks m ON stu.Id = m.StudentId
        INNER JOIN Subjects s ON m.SubjectId = s.Id
        WHERE a.ClassId = ? 
          AND a.SectionId = ? 
          AND a.AcademicYearId = ?
        GROUP BY stu.Id, s.Id
        ORDER BY a.RollNo, s.displayOrder;`)
      .all(classId, sectionId, academicYearId);
      // console.log("Final Marks:", marks)
  }
  else{
    marks = db.prepare(`
      SELECT 
          stu.Id as StudentId,
          a.RollNo,
          s.SubjectCode as SubjectName,
          s.Id as SubjectId,
          s.displayOrder,
          m.PeriodicMarksObtained,
          m.TerminalMarksObtained,
          m.TotalMarksObtained
      FROM Students stu
      INNER JOIN Admissions a ON stu.Id = a.StudentId
      INNER JOIN Marks m ON stu.Id = m.StudentId
      INNER JOIN Subjects s ON m.SubjectId = s.Id
      WHERE a.ClassId = ? 
          AND a.SectionId = ? 
          AND a.AcademicYearId = ?
          AND m.ActiveExamId = ?
      ORDER BY a.RollNo, s.displayOrder;
      `).all(classId, sectionId, academicYearId, examId);
    }

    let studentMarks = [];

    students.map((student) => {
      let currentMarks = {};
      let totalMarks = 0;
      marks.map((mark) => {
        if(student.StudentId === mark.StudentId){
          currentMarks[mark.SubjectId] = {
            periodic: mark.PeriodicMarksObtained,
            terminal: mark.TerminalMarksObtained,
            total: mark.TotalMarksObtained
          };
          totalMarks += mark.TotalMarksObtained || 0;
        }
      })
      studentMarks.push({
        ...student,
        totalMarks,
        marks: currentMarks
      })
    });
    // console.log("Summary check:", studentMarks)
  return studentMarks;
}

//Getting Section Result Summary for a given ClassId and SectionId of CurrentExam Sections.
ipcMain.handle('get-section-results-summary', async (event, { classId, sectionId, examId, academicYearId, examType, resultType }) => {
  try {
   const studentMarks = await getResultSummary(classId, sectionId, examId, academicYearId, examType);
    //console.log("Student Marks: ", studentMarks)
    return { 
      success: true,
      studentMarks
    }
  } catch (error) {
    console.error("Error fetching results summary:", error);
    return { success: false, error: error.message };
  }
});

///////////////////Helper Functions/////////////////////
function getDivision(percentage, failCount) {
  if (failCount > 0) return 'N.A.'; 
  if (percentage >= 80) return 'Dist';
  if (percentage >= 60) return 'First';
  if (percentage >= 50) return 'Second';
  if (percentage >= 40) return 'Third';
  return 'N.A.';
}

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


