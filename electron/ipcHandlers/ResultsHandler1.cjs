const { ipcMain, dialog } = require('electron');
const { db } = require('../database.cjs');
// const PDFDocument = require('pdfkit');
// const fs = require('fs');
// require('pdfkit-table')

const currentTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString();
// const path = require('path');
// IPC Handlers for Result
//////////////////////////////////////////////////////////////////////////////
//Export Result Summary as PDF


// ipcMain.handle('export-section-results-summary', async (event, { classId, sectionId, examId, academicYearId }) => {
//   try {
//     // Step 1: Fetch result data
//     const studentMarks = await getResultSummary(classId, sectionId, examId, academicYearId);

//     if (!studentMarks || studentMarks.length === 0) {
//       return { success: false, message: 'No data found for this section.' };
//     }

//     // Step 2: Choose save location
//     const { filePath } = await dialog.showSaveDialog({
//       title: 'Save Results Summary',
//       defaultPath: `Section_Summary_${classId}_${sectionId}.pdf`,
//       filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
//     });
//     if (!filePath) return { success: false, message: 'Save cancelled' };

//     // Step 3: Create PDF
//     const doc = new PDFDocument({ margin: 25, size: 'A4', layout: 'landscape' });
//     const stream = fs.createWriteStream(filePath);
//     doc.pipe(stream);

//     // Step 4: Title
//     doc.font('Helvetica-Bold').fontSize(16).text('Section Results Summary', { align: 'center' });
//     doc.moveDown(0.5);
//     doc.font('Helvetica').fontSize(10).text(`Class ID: ${classId} | Section ID: ${sectionId} | Exam ID: ${examId} | Academic Year: ${academicYearId}`, { align: 'center' });
//     doc.moveDown(1);

//     // Step 5: Prepare Table Data
//     const table = {
//       headers: [
//         { label: 'Roll No', property: 'RollNo', width: 50, headerColor: '#d3d3d3' },
//         { label: 'Name', property: 'Name', width: 150 },
//         { label: 'Total Marks', property: 'totalMarks', width: 80 },
//         { label: 'Percentage', property: 'Percentage', width: 80 },
//         { label: 'Division', property: 'Division', width: 70 },
//         { label: 'Position', property: 'Position', width: 70 },
//         { label: 'Result', property: 'Result', width: 70 }
//       ],
//       datas: studentMarks.map(s => ({
//         RollNo: s.RollNo ?? '',
//         Name: s.Name ?? '',
//         totalMarks: s.totalMarks ?? '',
//         Percentage: s.Percentage ? s.Percentage.toFixed(1) + '%' : '',
//         Division: s.Division ?? '',
//         Position: s.Position ?? '',
//         Result: s.Result ?? ''
//       }))
//     };

//     // Step 6: Draw Table
//     await doc.table(table, {
//       prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9),
//       prepareRow: (row, i) => doc.font('Helvetica').fontSize(8),
//       columnSpacing: 5,
//       padding: 3
//     });

//     // Step 7: Finalize PDF
//     doc.end();

//     await new Promise((resolve, reject) => {
//       stream.on('finish', resolve);
//       stream.on('error', reject);
//     });

//     return { success: true, filePath };

//   } catch (err) {
//     console.error('PDF Export Error:', err);
//     return { success: false, message: err.message };
//   }
// });



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
      if(examType === 'selection'){
        total-= 1; // Exclude English for selection test
      }
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

// Generate results
ipcMain.handle('generate-results', async (event, { academicYearId, resultType, examId, classId, sectionId, PassingPercentage }) => {
  const transaction = db.transaction(() => {
    // 1. Fetch class info
    const classInfo = db.prepare(`SELECT ClassName FROM Classes WHERE Id = ?`).get(classId);
    if (!classInfo) {
      throw new Error('Class not found.');
    }

    const Class = romanToInt(classInfo.ClassName);

    try {
      // 2. Fetch students with total marks and arrange by marks desc
      // For 'final' resultType, use FinalCumulativeTotalMarks
      // For 'exam' resultType, use CumulativeTotalMarks for the given examId
      let students;
      if (resultType === 'final') {
        students = db.prepare(`
          SELECT s.Id as studentId, s.Name, a.RollNo, ctm.TotalMarksObtained, 
                 ctm.TotalMaxMarks, ctm.Percentage 
          FROM FinalCumulativeTotalMarks ctm 
          JOIN Students s ON s.Id = ctm.StudentId 
          JOIN Admissions a ON s.Id = a.StudentId AND a.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ?
          WHERE ctm.AcademicYearId = ? AND ctm.TotalMarksObtained IS NOT NULL 
          ORDER BY ctm.TotalMarksObtained DESC
        `).all(academicYearId, classId, sectionId, academicYearId);
      } else {
        students = db.prepare(`
          SELECT s.Id as studentId, s.Name, a.RollNo, ctm.TotalMarksObtained, 
                 ctm.TotalMaxMarks, ctm.Percentage 
          FROM CumulativeTotalMarks ctm 
          JOIN Students s ON s.Id = ctm.StudentId 
          JOIN Admissions a ON s.Id = a.StudentId AND a.AcademicYearId = ? AND a.ClassId = ? AND a.SectionId = ?
          WHERE ctm.ActiveExamId = ? AND ctm.AcademicYearId = ? 
          ORDER BY ctm.TotalMarksObtained DESC
        `).all(academicYearId, classId, sectionId, examId, academicYearId);
      }

      //check if students found
      if (!students || students.length === 0) {
        throw new Error('No students with calculated marks found.');
      }

      // 3. Prepare insert
      const insertResult = db.prepare(`
        INSERT OR REPLACE INTO Results (
          AcademicYearId, StudentId, ActiveExamId, TotalMaxMarks, 
          TotalMarksObtained, Percentage, Division, Rank, ResultStatus, 
          ResultType, Last_Modified_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      // 4. Separate students by result status
      const passStudents = [];
      const simplePassStudents = [];
      const failStudents = [];

      // First pass: determine result status for all students
      for (const student of students) {
        const { studentId, TotalMarksObtained, TotalMaxMarks, Percentage } = student;

        // Count number of subjects failed for each student (non co-scholastic)
        const failCount = db.prepare(`
          SELECT COUNT(*) AS fails 
          FROM Marks 
          JOIN Subjects sub ON sub.Id = Marks.SubjectId 
          WHERE Marks.StudentId = ? AND Marks.ActiveExamId = ? 
          AND sub.SubjectCategory != 'Co-Scholastic' 
          AND Marks.SubjectResult = 'Fail'
        `).get(studentId, examId).fails;

        // Initialize status
        let resultStatus = "Pass";
        let division = "";

        // if failed in more than 2 subjects, Fail
        if (failCount > 2){
          resultStatus = 'Fail';
        }

        else {

          if (classInfo.ClassName === 'KG-I' || classInfo.ClassName === 'KG-II'){
            if (failCount > 0) {
              resultStatus = 'Fail';
            } else resultStatus = 'Simple Pass';
          } 
          // If scored less than 20% in any subject, Fail
          const lowScoredSubjects = db.prepare(`
            SELECT * 
            FROM Marks m 
            JOIN Subjects sub ON sub.Id = m.SubjectId 
            WHERE m.StudentId = ? AND m.ActiveExamId = ?             
            AND m.TotalMarksObtained < m.TotalMaxMarks * 0.2
          `).all(studentId, examId);
          
          if (lowScoredSubjects.length > 0) {
            resultStatus = 'Fail';
          } else if (Percentage > PassingPercentage) {
            resultStatus = 'Simple Pass';
          }
           
          // Determine Division for all classes if passed
          division = getDivision(Percentage, failCount);

        }

        // Add student to appropriate array with their status and division
        const studentWithStatus = {
          ...student,
          resultStatus,
          division
        };

        if (resultStatus === 'Pass') {
          passStudents.push(studentWithStatus);
        } else if (resultStatus === 'Simple Pass') {
          simplePassStudents.push(studentWithStatus);
        } else {
          failStudents.push(studentWithStatus);
        }
        
      }

      // 5. Rank calculation for all students with continuing ranks
      let rank = 0;
      let lastScore = null;
      let sameRankCount = 0;

      // Process Pass students with ranks
      for (const student of passStudents) {
        const { studentId, TotalMarksObtained, TotalMaxMarks, Percentage, resultStatus, division } = student;

        // Rank assignment for Pass students
        if (lastScore === TotalMarksObtained) {
          // Same score as previous student - same rank
          sameRankCount++;
        } else {
          // Different score - increment rank
          rank += 1 + sameRankCount;
          sameRankCount = 0;
        }
        
        lastScore = TotalMarksObtained;

        // Insert result
        insertResult.run(
          academicYearId,
          studentId,
          examId,
          TotalMaxMarks,
          TotalMarksObtained,
          Percentage,
          division,
          rank, // Rank for Pass students
          resultStatus,
          resultType
        );
      }

      // Process Simple Pass students with continuing ranks
      for (const student of simplePassStudents) {
        const { studentId, TotalMarksObtained, TotalMaxMarks, Percentage, resultStatus, division } = student;

        // Continue rank assignment for Simple Pass students
        if (lastScore === TotalMarksObtained) {
          // Same score as previous student - same rank
          sameRankCount++;
        } else {
          // Different score - increment rank
          rank += 1 + sameRankCount;
          sameRankCount = 0;
        }
        
        lastScore = TotalMarksObtained;

        // Insert result with continuing rank
        insertResult.run(
          academicYearId,
          studentId,
          examId,
          TotalMaxMarks,
          TotalMarksObtained,
          Percentage,
          division,
          rank, // Continuing rank for Simple Pass
          resultStatus,
          resultType
        );
      }

      // Process Fail students with continuing ranks
      for (const student of failStudents) {
        const { studentId, TotalMarksObtained, TotalMaxMarks, Percentage, resultStatus, division } = student;

        // Continue rank assignment for Fail students
        if (lastScore === TotalMarksObtained) {
          // Same score as previous student - same rank
          sameRankCount++;
        } else {
          // Different score - increment rank
          rank += 1 + sameRankCount;
          sameRankCount = 0;
        }
        
        lastScore = TotalMarksObtained;

        // Insert result with continuing rank
        insertResult.run(
          academicYearId,
          studentId,
          examId,
          TotalMaxMarks,
          TotalMarksObtained,
          Percentage,
          division,
          rank, // Continuing rank for Fail
          resultStatus,
          resultType
        );
      }

      // 6. Update ResultStatus
      db.prepare(`
        INSERT OR REPLACE INTO ResultStatus (
          AcademicYearId, ActiveExamId, ClassId, SectionId, 
          ResultType, isGenerated, Last_Modified_at
        ) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `).run(academicYearId, examId, classId, sectionId, resultType);

      return {
        success: true,
        message: `Results generated for ${students.length} students.`,
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

function getDivision(percentage, failCount) {
  if (failCount > 0) return 'N.A.'; 
  if (percentage >= 80) return 'Dist';
  if (percentage >= 60) return 'First';
  if (percentage >= 50) return 'Second';
  if (percentage >= 40) return 'Third';
  return 'N.A.';
}

function romanToInt(roman) {
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
// Helper functions

function getResultStatus(percentage, failCount, PassingPercentage) {
  //if (failCount === 2 && percentage < passingThreshold) return 'Simple Pass'; /////Noooo
  if (failCount > 0 && percentage < PassingPercentage) return 'Fail';
  return 'Pass';
}

//Check for if Result is Generated for given ClassID and SectionId of CurrentExam Sections.


/*
ipcMain.handle('publish-results', async (event, { academicYearId, examId, classId, sectionId }) => {
  try {
    // Check if results are generated
    const isResult = await db.prepare(`
      SELECT isGenerated
      FROM ResultStatus
      WHERE AcademicYearId = ?
      AND ActiveExamId = ?
      AND ClassId = ?
      AND SectionId = ?
     `).get(academicYearId, examId, classId, sectionId);

    if (!isResult || !isResult.isGenerated) {
      //console.log('Results not generated for this exam/class/section.');
      return { success: false, message: 'Results not generated for this exam/class/section.' };
    }

    // Update the published status
    db.prepare(`
      UPDATE ResultStatus
      SET isPublished = 1, Last_Modified_at = CURRENT_TIMESTAMP
      WHERE AcademicYearId =? AND ActiveExamId = ? AND ClassId = ? AND SectionId = ?
    `).run(academicYearId, examId, classId, sectionId);

    return { success: true, message: 'Results published successfully.' };

  } catch (error) {
    console.error('Error publishing results:', error);
    return { success: false, error: error.message };
  }
});
*/

//Get generated Result Summary
ipcMain.handle('get-result-summary', async (event, { academicYearId, examId, resultType }) => {
  try {
    if (!academicYearId || !examId) {
      throw new Error('Missing required parameters: academicYearId or examId');
    }
    // console.log("Current ExamId for Summary:", examId)
    // Get all class-section mappings (synchronously)
    const classSections = db.prepare(`
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
        AND r.Division = 'Distinction'
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
        passed,
        passedPercentage: appeared > 0 ? (passed / appeared) * 100 : 0,
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

ipcMain.handle('get-section-results', async (event, { academicYearId, examId, classId, sectionId }) => {
  try {  
  
    // Get class and section names for the summary
    const classInfo = db.prepare(`
      SELECT ClassName FROM Classes WHERE Id = ?
    `).get(classId);

    const sectionInfo = db.prepare(`
      SELECT SectionName FROM Sections WHERE Id = ?
    `).get(sectionId);

    // Get all students with their results for this exam r.TotalMaxMarks telh tur
    const results = db.prepare(`
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
      JOIN Admissions a 
        ON s.Id = a.StudentId
      JOIN Results r 
        ON s.Id = r.StudentId 
      AND r.ActiveExamId = ? 
      AND r.AcademicYearId = ?
      WHERE a.AcademicYearId = ?
        AND a.ClassId = ?
        AND a.SectionId = ?
      ORDER BY 
        -- Push NULL ranks to the bottom
        CASE WHEN r.Rank IS NULL THEN 1 ELSE 0 END,
        r.Rank ASC,
        CASE 
          WHEN r.ResultStatus = 'Pass' THEN 1
          WHEN r.ResultStatus = 'Simple Pass' THEN 2
          WHEN r.ResultStatus = 'Fail' THEN 3
          ELSE 4
        END ASC,
        s.Name ASC
    `).all(examId, academicYearId, academicYearId, classId, sectionId);


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
      distinction: results.filter(r => r.Division === 'Distinction').length,
      firstDivision: results.filter(r => r.Division === 'First').length,
      secondDivision: results.filter(r => r.Division === 'Second').length,
      thirdDivision: results.filter(r => r.Division === 'Third').length,      
      simplePass: results.filter(r => r.ResultStatus === 'Simple Pass').length,
    };

    // Calculate percentages
    const passedPercentage = summary.appeared > 0 ? (summary.passed / summary.appeared) * 100 : 0;
    const failedPercentage = summary.appeared > 0 ? (summary.failed / summary.appeared) * 100 : 0;

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
      }
    };
  } catch (error) {
    console.error('Error in get section results:', error);
    return {
      success: false,
      error: error.message
    };
  }
});


ipcMain.handle('get-publish-status', async (event, { academicYearId, activeExamId }) => {
    
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

//Section Result Summary
// electron/ipcHandlers/getResultsSummary.js
// const getSubjectsByClassId = (classId) => {
//   return db.prepare(`
//       SELECT s.Id, SubjectCode as SubjectName
//       FROM ClassSubjectMapping csm
//       JOIN Subjects s ON csm.SubjectId = s.Id
//       WHERE csm.ClassId = ?
//       AND s.SubjectCategory != 'Co-Scholastic'
//       ORDER BY s.DisplayOrder
//     `).all(classId);
//   }

const getResultSummary = async (classId, sectionId, examId, academicYearId, examType) => {
         
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
        AND a.AcademicYearId = ?
        AND r.resultType = ?
    ORDER BY a.RollNo;`).all(classId, sectionId, academicYearId, examType);

    const resultMap = new Map(results.map(r => [r.StudentId, r]));

// Push result fields directly into the students array
    for (const stu of students) {
      const res = resultMap.get(stu.StudentId);
      stu.Percentage = res?.Percentage || null;
      stu.Division = res?.Division || null;
      stu.Position = res?.Position || null;
      stu.Result = res?.Result || null;
    }

  //console.log("Students: ", students)
  
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
      //console.log("Final Marks:", marks)
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

  return studentMarks;
}

ipcMain.handle('get-section-results-summary', async (event, { classId, sectionId, examId, academicYearId, examType }) => {
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

// electron/ipcHandlers/exportSectionResultsSummary.js

// ipcMain.handle('export-section-results-summary', async (event, { classId, sectionId, examId, academicYearId }) => {
//   try {
//     const { filePath } = await dialog.showSaveDialog({
//       title: 'Save Results Summary',
//       defaultPath: `Section_Summary_${classId}_${sectionId}.pdf`,
//       filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
//     });
//     if (!filePath) return { success: false, message: 'Save cancelled' };

//     const subjects = await getSubjectsByClassId(classId) || [];
//     const studentMarks = await getResultSummary(classId, sectionId, examId, academicYearId) || [];

//     const doc = new PDFDocument({ margin: 20, size: 'A4', layout: 'landscape' });
//     const stream = fs.createWriteStream(filePath);
//     doc.pipe(stream);

//     doc.fontSize(16).text(`Results Summary - Class ${classId} Section ${sectionId}`, { align: 'center' });
//     doc.moveDown(1);

//     const headers = [
//       'Roll No',
//       'Name',
//       'Exam',
//       ...subjects.map(s => s.SubjectName),
//       'Total',
//       '%',
//       'Div',
//       'Pos',
//       'Result'
//     ];

//     const examLabels = ['Periodic', 'Half Yearly', 'Total'];
//     const examKeys = { Periodic: 'periodic', 'Half Yearly': 'terminal', Total: 'total' };

//     const rows = [];
//     studentMarks.forEach(student => {
//       examLabels.forEach(exam => {
//         const row = [
//           student.RollNo,
//           student.Name,
//           exam,
//         ];

//         subjects.forEach(subj => {
//           const marks = student.marks[subj.Id];
//           row.push(marks ? marks[examKeys[exam]] : '-');
//         });

//         row.push(student.totalMarks || '-');
//         row.push(student.Percentage || '-');
//         row.push(student.Division || '-');
//         row.push(student.Position || '-');
//         row.push(student.Result || '-');

//         rows.push(row);
//       });
//     });

//     doc.table({ headers, rows }, {
//       prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
//       prepareRow: (row, i) => doc.font('Helvetica').fontSize(7),
//       columnSpacing: 3,
//       padding: 3,
//       width: doc.page.width - 40
//     });

//     doc.end();
//     await new Promise((resolve, reject) => {
//       stream.on('finish', resolve);
//       stream.on('error', reject);
//     });

//     return { success: true, filePath };
//   } catch (err) {
//     console.error('PDF Export failed:', err);
//     return { success: false, message: err.message };
//   }
// });

// ipcMain.handle(
//   'export-section-results-summary',
//   async (event, { classId, sectionId, examId, academicYearId, subjects}) => {
//     try {
//       // Ask where to save
//       const { filePath } = await dialog.showSaveDialog({
//         title: 'Save Results Summary',
//         defaultPath: `Section_Summary_${classId}_${sectionId}.pdf`,
//         filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
//       });
//       if (!filePath) return { success: false, message: 'Save cancelled' };

//       // Fetch data
//       //const subjects = await getSubjectsByClassId(classId);
//       const studentMarks = await getResultSummary(
//         classId,
//         sectionId,
//         examId,
//         academicYearId
//       );

//       // Create PDF
//       const doc = new PDFDocument({
//         margin: 20,
//         size: 'A4',
//         layout: 'landscape',
//       });
//       const stream = fs.createWriteStream(filePath);
//       doc.pipe(stream);

//       // Title
//       doc.fontSize(16).text(`Results Summary - Class ${classId} Section ${sectionId}`, {
//         align: 'center',
//       });
//       doc.moveDown(1);

//       // Build headers: Roll No | Name | Exams | subject1 | subject2 ... | Total | % | Div | Pos | Result
//       const headers = [
//         'Roll No',
//         'Name',
//         'Exam',
//         ...subjects.map((s) => s.SubjectName),
//         'Total',
//         '%',
//         'Div',
//         'Pos',
//         'Result',
//       ];

//       // Exams to display
//       const examLabels = ['Periodic', 'Half Yearly', 'Total'];
//       const examKeys = { Periodic: 'periodic', 'Half Yearly': 'terminal', Total: 'total' };

//       // Build rows
//       const rows = [];
//       studentMarks.forEach((student) => {
//         examLabels.forEach((exam, examIndex) => {
//           const row = [];

//           // RollNo & Name only in first exam row
//           if (examIndex === 0) {
//             row.push({ label: student.RollNo, options: { rowspan: 3 } });
//             row.push({ label: student.Name, options: { rowspan: 3 } });
//           } else {
//             row.push('');
//             row.push('');
//           }

//           // Exam Name
//           row.push(exam);

//           // Subject marks
//           subjects.forEach((subj) => {
//             const markObj = student.marks[subj.Id];
//             const val = markObj ? markObj[examKeys[exam]] : '-';
//             row.push(val);
//           });

//           // Totals etc only in first exam row
//           if (examIndex === 0) {
//             row.push({ label: student.totalMarks || '-', options: { rowspan: 3 } });
//             row.push({ label: student.Percentage || '-', options: { rowspan: 3 } });
//             row.push({ label: student.Division || '-', options: { rowspan: 3 } });
//             row.push({ label: student.Position || '-', options: { rowspan: 3 } });
//             row.push({ label: student.Result || '-', options: { rowspan: 3 } });
//           } else {
//             row.push('');
//             row.push('');
//             row.push('');
//             row.push('');
//             row.push('');
//           }

//           rows.push(row);
//         });
//       });

//       // Draw table
//       await doc.table(
//         {
//           headers,
//           rows,
//         },
//         {
//           prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
//           prepareRow: (row, i) => doc.font('Helvetica').fontSize(7),
//           columnSpacing: 3,
//           padding: 3,
//           width: doc.page.width - 40,
//         }
//       );

//       // Finish
//       doc.end();
//       await new Promise((resolve, reject) => {
//         stream.on('finish', resolve);
//         stream.on('error', reject);
//       });

//       return { success: true, filePath };
//     } catch (err) {
//       console.error('PDF Export failed:', err);
//       return { success: false, message: err.message };
//     }
//   }
// );



/*
const results = students.map(stu => {
   //   const studentMarks = subjects.map(sub => {
   //     const markEntry = marksMap[stu.StudentId]?.[sub.Id];
   //     return markEntry || { periodic: null, terminal: null, total: null, result: null };
   //   });
   */




