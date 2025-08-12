const { ipcMain } = require('electron');
const { db } = require('../database.cjs');
const currentTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString();

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
        isPublished
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
      isPublished: result.isPublished || false
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
ipcMain.handle('generate-results', async (event, { academicYearId, resultType, examId, classId, sectionId, PassingPercentage}) => {
  //console.log("Passing Percentage ", PassingPercentage)
  const transaction = db.transaction(() => {
    //Now fetch ClassInfo for Class Name
    const classInfo = db.prepare(`
      SELECT ClassName
      FROM Classes
      WHERE Id =?`).get(classId);
    if (!classInfo) {
      throw new Error('Class not found.');
    }
    const Class = romanToInt(classInfo.ClassName);    
    try {
      // 2. Fetch students with cumulative data
     let students; 
     
     if(resultType === 'final'){
      students = db.prepare(`
        SELECT 
          s.Id as studentId,
          s.Name,
          a.RollNo,
          ctm.TotalMarksObtained,
          ctm.TotalMaxMarks,
          ctm.Percentage
        FROM FinalCumulativeTotalMarks ctm
        JOIN Students s ON s.Id = ctm.StudentId
        JOIN Admissions a ON 
          s.Id = a.StudentId AND 
          a.AcademicYearId = ? AND 
          a.ClassId = ? AND 
          a.SectionId = ?
        WHERE 
          ctm.AcademicYearId = ? AND
          ctm.TotalMarksObtained IS NOT NULL
        ORDER BY ctm.TotalMarksObtained DESC
      `).all(academicYearId, classId, sectionId, academicYearId);

      if (students.length === 0) {
        throw new Error('No students with calculated marks found.');
      }
     }
     else {
      students = db.prepare(`
        SELECT 
          s.Id as studentId,
          s.Name,
          a.RollNo,
          ctm.TotalMarksObtained,
          ctm.TotalMaxMarks,
          ctm.Percentage
        FROM CumulativeTotalMarks ctm
        JOIN Students s ON s.Id = ctm.StudentId
        JOIN Admissions a ON 
          s.Id = a.StudentId AND 
          a.AcademicYearId = ? AND 
          a.ClassId = ? AND 
          a.SectionId = ?
        WHERE 
          ctm.ActiveExamId = ? AND 
          ctm.AcademicYearId = ? AND
          ctm.TotalMarksObtained IS NOT NULL
        ORDER BY ctm.TotalMarksObtained DESC
      `).all(academicYearId, classId, sectionId, examId, academicYearId);

      if (students.length === 0) {
        throw new Error('No students with calculated marks found.');
      }
     }    
      // 3. Prepare insert
      const insertResult = db.prepare(`
        INSERT OR REPLACE INTO Results (
          AcademicYearId, 
          StudentId, 
          ActiveExamId,
          TotalMaxMarks, 
          TotalMarksObtained, 
          Percentage,
          Division, 
          Rank, 
          ResultStatus,
          ResultType,
          Last_Modified_at          
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      // 5. Rank calculation
      let rank = 0;
      let tempRank = 0;
      let lastScore = null;
      let sameRankCount = 0;

      for (const student of students) {
        const { studentId, TotalMarksObtained, TotalMaxMarks, Percentage } = student;

        // Determine worst subject status
        const failCount = db.prepare(`
          SELECT COUNT(*) AS fails FROM Marks
          JOIN Subjects sub ON sub.Id = Marks.SubjectId
          WHERE Marks.StudentId = ? AND Marks.ActiveExamId = ? 
          AND sub.SubjectCategory != 'Co-Scholastic' 
          AND Marks.SubjectResult = 'Fail'
        `).get(studentId, examId).fails;

        // Determine division and result status
        let resultStatus = "Pass";
        let division = "N.A.";
        if( failCount > 2 ) {   
          resultStatus = 'Fail';
        }
        else {
          if(Class > 0 && Class <= 8) {
            if (failCount !== 0 && failCount <= 2) {            
              const failedCoreSubjects = db.prepare(`
                  SELECT * FROM Marks m
                  JOIN Subjects sub ON sub.Id = m.SubjectId
                  WHERE m.StudentId = ? AND m.ActiveExamId = ?
                  AND sub.IsCore = 1
                  AND m.TotalMarksObtained < m.TotalMaxMarks * 0.25 
                `).all(studentId, examId); //m.TotalMarksObtained < m.TotalMaxMarks * 0.25 is intentionally hardcoded.
      
              if (failedCoreSubjects.length > 0) {
                  resultStatus = 'Fail';
              }
              else{
                if (Percentage > PassingPercentage) {
                  resultStatus = 'Simple Pass';
                }
              }
            }
          } //End of Class 1 - 8
          if(Class >= 9){
            if (failCount === 1) {
              const anysubject = db.prepare(`
                SELECT * FROM Marks m
                  JOIN Subjects sub ON sub.Id = m.SubjectId
                  WHERE m.StudentId = ? AND m.ActiveExamId = ?
                  AND m.TotalMarksObtained < m.TotalMaxMarks * 0.25
                  `).all(studentId, examId); //m.TotalMarksObtained < m.TotalMaxMarks * 0.25 is intentionally hardcoded.
              //console.log("fail Count ", failCount )
              if (anysubject.length > 0) {
                  resultStatus = 'Fail';
              }
              else { 
                  resultStatus = 'Simple Pass';
              }
            }
            else if (failCount > 1) {
              resultStatus = 'Fail'
            }
          }        
          //End of Class 9
          if(classInfo.ClassName === 'KG-I' || classInfo.ClassName === 'KG-II'|| Class === 11){
            if(failCount > 0){
              resultStatus = 'Fail';
            }
          }
          else{
            division = getDivision(Percentage, failCount);
            //resultStatus = getResultStatus(Percentage, failCount, PassingPercentage);
          }
          
        }
        
        if(failCount != 0) {   
          tempRank = rank;       
          rank = "N.A."
        }else{
          rank = tempRank ;       
        if (lastScore === TotalMarksObtained) {
          sameRankCount++;
        } else {
          rank += 1;
          sameRankCount = 1;
          tempRank = rank;
        }
        lastScore = TotalMarksObtained;
      }
        insertResult.run(
          academicYearId, studentId, examId,
          TotalMaxMarks, TotalMarksObtained, Percentage,
          division, rank, resultStatus, resultType // Assuming 1 is the ID of the user generating results
        );
      }

      // 6. Update ResultStatus
      db.prepare(`
        INSERT OR REPLACE INTO ResultStatus (
          AcademicYearId, ActiveExamId, ClassId, SectionId, ResultType,
          isGenerated, Last_Modified_at
        ) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `).run(academicYearId, examId, classId, sectionId, resultType);     

      return {
        success: true,
        message: `Results generated for ${students.length} students.`,
      };

    } catch (error) {
      console.error('Result generation failed:', error);
      return { success: false, error: error.message };
    }
  });

  return transaction();
});

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
function getDivision(percentage, failCount) {
  if (failCount > 0) return 'N.A.'; 
  if (percentage >= 80) return 'Distinction';
  if (percentage >= 60) return 'First';
  if (percentage >= 50) return 'Second';
  if (percentage >= 40) return 'Third';
  return 'N.A.';
}

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
      JOIN Admissions a ON s.Id = a.StudentId
      JOIN Results r ON s.Id = r.StudentId 
        AND r.ActiveExamId = ? 
        AND r.AcademicYearId = ?
      WHERE a.AcademicYearId = ?
        AND a.ClassId = ?
        AND a.SectionId = ?
      ORDER BY 
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
      // Simple Pass should be Pass students without a division (not Dist/I/II/III)   Siam that a la ngai
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
    console.error('Error in get-section-results:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// In your electron main process file (e.g., main.js)

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
    //console.log("Publish Date ", publishDate)
    return {
      success: true,
      markEntryCount,
      resultStatusCount,
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


