const { ipcMain, dialog, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { db } = require('../database.cjs');;

ipcMain.handle('export-master-data', async (event) => {
  try {
    const win = BrowserWindow.getFocusedWindow();
    
    // Prompt user for save location
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      title: 'Save Master Data',
      defaultPath: `SchoolMasterData_${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Export canceled by user' };
    }

    // Start transaction for consistent data
    db.exec('BEGIN TRANSACTION');

    try {
      // 1. Export Classes
      const classes = db.prepare('SELECT * FROM Classes').all();
      
      // 2. Export Sections
      const sections = db.prepare('SELECT * FROM Sections').all();
      
      // 3. Export Class-Section Mappings
      const classSectionMappings = db.prepare(`SELECT * FROM ClassSectionMapping`).all();
      
      // 4. Export Subjects
      const subjects = db.prepare('SELECT * FROM Subjects').all();
      
      // 5. Export Class-Subject Mappings
      const classSubjectMappings = db.prepare(`SELECT * FROM ClassSubjectMapping`).all();
      
      // 6. Export Exams
      const exams = db.prepare('SELECT * FROM Exams').all();

      // 7. Export Signatories
      const signatories = db.prepare('SELECT * FROM Signatories').all();

      // Combine all data
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          tablesExported: [
            'Classes',
            'Sections',
            'ClassSectionMapping',
            'Subjects',
            'ClassSubjectMapping',
            'Exams',
            'Signatories'
          ],
          recordCounts: {
            classes: classes.length,
            sections: sections.length,
            classSectionMappings: classSectionMappings.length,
            subjects: subjects.length,
            classSubjectMappings: classSubjectMappings.length,
            exams: exams.length,
            signatories: signatories.length
          }
        },
        data: {
          classes,
          sections,
          classSectionMappings,
          subjects,
          classSubjectMappings,
          exams,
          signatories
        }
      };

      // Write to file
      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
      
      db.exec('COMMIT');
      return { 
        success: true,
        filePath,
        counts: exportData.metadata.recordCounts
      };

    } catch (err) {
      db.exec('ROLLBACK');
      console.error('Master data export error:', err);
      return { 
        success: false, 
        message: 'Database error during export',
        error: err.message 
      };
    }

  } catch (err) {
    console.error('Export master data error:', err);
    return { 
      success: false, 
      message: 'An error occurred while exporting master data',
      error: err.message 
    };
  }
});

ipcMain.handle('export-settings', async (event, YearId) => {
  try {
    const win = BrowserWindow.getFocusedWindow();

    // Step 1: Fetch Academic Year
    const academicStmt = db.prepare('SELECT * FROM AcademicYears WHERE Id = ?');
    const academicYear = academicStmt.get(YearId);

    if (!academicYear) {
      return { success: false, message: 'No Academic Year found for given ID.' };
    }

    const academicYearName = academicYear.YearName;

    // Step 2: Prompt user to save file
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      title: 'Export Academic Settings',
      defaultPath: `AcademicSettings_${academicYearName}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'User canceled the export.' };
    }

    // Step 3: Begin transaction
    db.exec('BEGIN TRANSACTION');

    try {
      // Step 4: Fetch Active Exams for that year
      const examsStmt = db.prepare('SELECT * FROM ActiveExams WHERE AcademicYearId = ?');
      const activeExams = examsStmt.all(YearId);

      // Step 5: Structure export data
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          academicYearId: YearId,
          academicYearName,
          tablesExported: ['AcademicYears', 'ActiveExams'],
          recordCounts: {
            academicYears: 1,
            activeExams: activeExams.length
          }
        },
        data: {
          academicYear,
          activeExams
        }
      };

      // Step 6: Write to file
      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
      db.exec('COMMIT');

      return {
        success: true,
        filePath,
        counts: exportData.metadata.recordCounts
      };

    } catch (err) {
      db.exec('ROLLBACK');
      console.error('Export settings DB error:', err);
      return {
        success: false,
        message: 'Database error during export',
        error: err.message
      };
    }

  } catch (err) {
    console.error('Export settings error:', err);
    return {
      success: false,
      message: 'An error occurred while exporting settings.',
      error: err.message
    };
  }
});

//Student Data
ipcMain.handle('export-student-data', async (event, { classId, sectionId, academicYearId, className, sectionName, }) => {
  try {
    const academicStmt = db.prepare('SELECT * FROM AcademicYears WHERE Id = ?');
    const academicYear = academicStmt.get(academicYearId);
    const academicYearName = academicYear.YearName;

    const admissionsStmt = db.prepare(`
      SELECT * FROM Admissions
      WHERE ClassId = ? AND SectionId = ? AND AcademicYearId = ?
    `);
    const admissions = admissionsStmt.all(classId, sectionId, academicYearId);

    if (admissions.length === 0) {
      return { success: false, message: 'No admissions found.' };
    }

    // Collect all student IDs
    const studentIds = admissions.map(a => a.StudentId);
    const placeholders = studentIds.map(() => '?').join(',');

    const studentsStmt = db.prepare(`
      SELECT * FROM Students
      WHERE Id IN (${placeholders})
    `);
    const students = studentsStmt.all(...studentIds);

    // Combine data
    const exportData = {
      classId,
      sectionId,
      academicYearId,
      admissions,
      students
    };

    const win = BrowserWindow.getFocusedWindow();
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      title: 'Save Student Data',
      defaultPath: `StudentData_Class-${className}-${sectionName}_${academicYearName}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Save cancelled.' };
    }

    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    return { success: true };

  } catch (error) {
    console.error('Error exporting student data:', error);
    return { success: false, message: 'Error during export.' };
  }
});

//Marks Data
ipcMain.handle('export-marks-data', async (event, {
  examId,
  examType,
  classId,
  sectionId,
  className,
  sectionName,
  academicYearId
}) => {
  try {
    const academicStmt = db.prepare('SELECT * FROM AcademicYears WHERE Id = ?');
    const academicYear = academicStmt.get(academicYearId);
    const academicYearName = academicYear?.YearName || 'UnknownYear';

    const win = BrowserWindow.getFocusedWindow();

    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: `Export ${examType === 'annual' ? 'Annual' : 'Half-Yearly'} Marks`,
      defaultPath: `${examType}_Marks_Class-${className}-${sectionName}_${academicYearName}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (canceled || !filePath) return { success: false, message: 'Export canceled by user' };

    // Begin transaction
    db.exec('BEGIN TRANSACTION');
    try {
      // 1. Collect StudentIds
      const studentIds = db.prepare(`
        SELECT StudentId FROM Admissions
        WHERE AcademicYearId = ? AND ClassId = ? AND SectionId = ?
      `).all(academicYearId, classId, sectionId).map(row => row.StudentId);

      if (!studentIds.length) {
        db.exec('ROLLBACK');
        return { success: false, message: 'No students found for the selection.' };
      }

      const placeholders = studentIds.map(() => '?').join(',');

      // 2. Fetch all related marks data
      const marks = db.prepare(`
        SELECT * FROM Marks WHERE ActiveExamId = ? AND StudentId IN (${placeholders})
      `).all(examId, ...studentIds);

      const markEntryStatus = db.prepare(`
        SELECT * FROM MarkEntryStatus WHERE ActiveExamId = ? AND ClassId = ? AND SectionId = ?
      `).all(examId, classId, sectionId);

      const coScholasticMarks = db.prepare(`
        SELECT * FROM CoScholasticMarks WHERE ActiveExamId = ? AND StudentId IN (${placeholders})
      `).all(examId, ...studentIds);

      const cumulativeMarks = db.prepare(`
        SELECT * FROM CumulativeTotalMarks WHERE AcademicYearId = ? AND ActiveExamId = ? AND StudentId IN (${placeholders})
      `).all(academicYearId, examId, ...studentIds);

      let finalCumulativeMarks = [];
      if (examType === 'annual') {
        finalCumulativeMarks = db.prepare(`
          SELECT * FROM FinalCumulativeTotalMarks WHERE AcademicYearId = ? AND StudentId IN (${placeholders})
        `).all(academicYearId, ...studentIds);
      }

      // 3. Construct Export Object
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          examType,
          academicYear: academicYearName,
          class: className,
          section: sectionName,
          tablesExported: [
            'Marks',
            'MarkEntryStatus',
            'CoScholasticMarks',
            'CumulativeTotalMarks',
            ...(examType === 'annual' ? ['FinalCumulativeTotalMarks'] : [])
          ],
          recordCounts: {
            students: studentIds.length,
            marks: marks.length,
            markEntryStatus: markEntryStatus.length,
            coScholasticMarks: coScholasticMarks.length,
            cumulativeMarks: cumulativeMarks.length,
            finalCumulativeMarks: finalCumulativeMarks.length
          }
        },
        data: {
          examId,
          academicYearId,
          classId,
          sectionId,
          studentIds,
          marks,
          markEntryStatus,
          coScholasticMarks,
          cumulativeMarks,
          finalCumulativeMarks: examType === 'annual' ? finalCumulativeMarks : undefined
        }
      };

      // 4. Write to file
      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
      db.exec('COMMIT');

      return {
        success: true,
        filePath,
        recordCounts: exportData.metadata.recordCounts
      };

    } catch (err) {
      db.exec('ROLLBACK');
      console.error('Export Marks Data Error:', err);
      return { success: false, message: 'Failed during database fetch', error: err.message };
    }

  } catch (err) {
    console.error('Export Marks General Error:', err);
    return { success: false, message: 'Unexpected error occurred', error: err.message };
  }
});


