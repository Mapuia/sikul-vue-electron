const { ipcMain, dialog, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { db } = require('../database.cjs');


//Import Master Data
ipcMain.handle('import-master-data', async (event, filePath) => {
  try {
    // 1. Read and parse the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const importData = JSON.parse(fileContent);

    // 2. Validate basic file structure
    if (!importData?.data || !importData.metadata?.tablesExported) {
      return { 
        success: false, 
        message: 'Invalid master data file format',
        code: 'INVALID_FILE_FORMAT'
      };
    }

    // Start transaction
    db.exec('BEGIN TRANSACTION');

    try {
      // Disable FK checks so we can safely clear tables
      db.exec('PRAGMA foreign_keys = OFF');

      const results = {
        classes: { imported: 0, skipped: 0 },
        sections: { imported: 0, skipped: 0 },
        classSectionMappings: { imported: 0, skipped: 0 },
        subjects: { imported: 0, skipped: 0 },
        classSubjectMappings: { imported: 0, skipped: 0 },
        exams: { imported: 0, skipped: 0 }
      };

      // 3. Import Classes
      if (importData.data.classes?.length > 0) {
        db.exec('DELETE FROM Classes');

        const stmt = db.prepare(`
          INSERT INTO Classes (Id, ClassId, ClassName, Creation_at)
          VALUES (?, ?, ?, ?)
        `);

        for (const cls of importData.data.classes) {
          try {
            stmt.run(
              cls.Id,
              cls.ClassId,
              cls.ClassName,
              cls.Creation_at || new Date().toISOString()
            );
            results.classes.imported++;
          } catch (err) {
            results.classes.skipped++;
            continue;
          }
        }
      }

      // 4. Import Sections
      if (importData.data.sections?.length > 0) {
        db.exec('DELETE FROM Sections');

        const stmt = db.prepare(`
          INSERT INTO Sections (Id, SectionName, Creation_at)
          VALUES (?, ?, ?)
        `);

        for (const sec of importData.data.sections) {
          try {
            stmt.run(
              sec.Id,
              sec.SectionName,
              sec.Creation_at || new Date().toISOString()
            );
            results.sections.imported++;
          } catch (err) {
            results.sections.skipped++;
            continue;
          }
        }
      }

      // 5. Import Subjects
      if (importData.data.subjects?.length > 0) {
        db.exec('DELETE FROM Subjects');

        const stmt = db.prepare(`
          INSERT INTO Subjects (
            Id, SubjectCode, SubjectName, SubjectCategory, 
            FullMark, IsCore, DisplayOrder, Creation_at, Last_Modified_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const sub of importData.data.subjects) {
          try {
            stmt.run(
              sub.Id,
              sub.SubjectCode,
              sub.SubjectName,
              sub.SubjectCategory,
              sub.FullMark,
              sub.IsCore ? 1 : 0,
              sub.DisplayOrder,
              sub.Creation_at || new Date().toISOString(),
              sub.Last_Modified_at || new Date().toISOString()
            );
            results.subjects.imported++;
          } catch (err) {
            results.subjects.skipped++;
            continue;
          }
        }
      }

      // 6. Import Exams
      if (importData.data.exams?.length > 0) {
        db.exec('DELETE FROM Exams');

        const stmt = db.prepare(`
          INSERT INTO Exams (
            Id, ExamName, ExamType, Description, Creation_at, Modified_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const exam of importData.data.exams) {
          try {
            stmt.run(
              exam.Id,
              exam.ExamName,
              exam.ExamType,
              exam.Description,
              exam.Creation_at || new Date().toISOString(),
              exam.Modified_at || new Date().toISOString()
            );
            results.exams.imported++;
          } catch (err) {
            results.exams.skipped++;
            continue;
          }
        }
      }

      // 7. Import Class-Section Mappings
      if (importData.data.classSectionMappings?.length > 0) {
        db.exec('DELETE FROM ClassSectionMapping');

        const stmt = db.prepare(`
          INSERT INTO ClassSectionMapping (Id, ClassId, SectionId, Creation_at)
          VALUES (?, ?, ?, ?)
        `);

        for (const mapping of importData.data.classSectionMappings) {
          try {
            stmt.run(
              mapping.Id,
              mapping.ClassId,
              mapping.SectionId,
              mapping.Creation_at || new Date().toISOString()
            );
            results.classSectionMappings.imported++;
          } catch (err) {
            results.classSectionMappings.skipped++;
            continue;
          }
        }
      }

      // 8. Import Class-Subject Mappings
      if (importData.data.classSubjectMappings?.length > 0) {
        db.exec('DELETE FROM ClassSubjectMapping');

        const stmt = db.prepare(`
          INSERT INTO ClassSubjectMapping (Id, ClassId, SubjectId, Creation_at)
          VALUES (?, ?, ?, ?)
        `);

        for (const mapping of importData.data.classSubjectMappings) {
          try {
            stmt.run(
              mapping.Id,
              mapping.ClassId,
              mapping.SubjectId,
              mapping.Creation_at || new Date().toISOString()
            );
            results.classSubjectMappings.imported++;
          } catch (err) {
            results.classSubjectMappings.skipped++;
            continue;
          }
        }
      }

      // Commit changes
      db.exec('COMMIT');
      db.exec('PRAGMA foreign_keys = ON');

      return { 
        success: true,
        results,
        filePath
      };

    } catch (err) {
      db.exec('ROLLBACK');
      db.exec('PRAGMA foreign_keys = ON');
      console.error('Import transaction error:', err);

      return { 
        success: false, 
        message: 'Database error during import',
        code: 'DATABASE_ERROR',
        error: err.message 
      };
    }

  } catch (err) {
    console.error('Import master data error:', err);

    if (err.code === 'ENOENT') {
      return { 
        success: false, 
        message: 'File not found',
        code: 'FILE_NOT_FOUND' 
      };
    }

    if (err instanceof SyntaxError) {
      return { 
        success: false, 
        message: 'Invalid JSON file',
        code: 'INVALID_JSON' 
      };
    }

    return { 
      success: false, 
      message: 'An error occurred while importing master data',
      code: 'UNKNOWN_ERROR',
      error: err.message 
    };
  }
});


// Import Settings Handler
ipcMain.handle('import-settings', async (event, { academicYearId, filePath }) => {
  let transactionStarted = false;
  
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, message: 'Invalid file path provided.' };
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(fileContent);

    const fileYearId = parsed?.metadata?.academicYearId;
    if (!fileYearId) {
      return { success: false, message: 'Missing academicYearId in settings file.' };
    }

    const { academicYear, activeExams } = parsed.data || {};
    if (!academicYear || !Array.isArray(activeExams)) {
      return { success: false, message: 'Invalid or incomplete settings file.' };
    }

    db.exec('BEGIN TRANSACTION');
    transactionStarted = true;

    db.prepare('UPDATE AcademicYears SET IsActive = 0 WHERE IsActive = 1').run();

    const insertAcademicYear = db.prepare(`
      INSERT OR REPLACE INTO AcademicYears
      (Id, YearName, StartDate, EndDate, IsActive, Creation_at)
      VALUES
      (@Id, @YearName, @StartDate, @EndDate, @IsActive, @Creation_at)
    `);
    insertAcademicYear.run({
      Id: academicYear.Id,
      YearName: academicYear.YearName,
      StartDate: academicYear.StartDate,
      EndDate: academicYear.EndDate,
      IsActive: academicYear.IsActive,
      Creation_at: academicYear.Creation_at || new Date().toISOString(),
    });

    const insertActiveExam = db.prepare(`
      INSERT OR REPLACE INTO ActiveExams
      (Id, AcademicYearId, ExamId, MajorMaxMark, MinorMaxMark, PassingPercentage,
       IsActive, Result_Published, PublishDate, Creation_at, Modified_at)
      VALUES
      (@Id, @AcademicYearId, @ExamId, @MajorMaxMark, @MinorMaxMark, @PassingPercentage,
       @IsActive, @Result_Published, @PublishDate, @Creation_at, @Modified_at)
    `);

    for (const ae of activeExams) {
      insertActiveExam.run({
        Id: ae.Id,
        AcademicYearId: ae.AcademicYearId,
        ExamId: ae.ExamId,
        MajorMaxMark: ae.MajorMaxMark,
        MinorMaxMark: ae.MinorMaxMark,
        PassingPercentage: ae.PassingPercentage ?? 40.0,
        IsActive: ae.IsActive ?? 0,
        Result_Published: ae.Result_Published ?? 0,
        PublishDate: ae.PublishDate || null,
        Creation_at: ae.Creation_at || new Date().toISOString(),
        Modified_at: ae.Modified_at || new Date().toISOString(),
      });
    }

    db.exec('COMMIT');
    transactionStarted = false;

    return {
      success: true,
      message: 'Year and Active Exam Settings imported successfully.',
      inserted: {
        academicYear: academicYear.YearName,
        exams: new Set(activeExams.map(a => a.ExamId)).size,
        activeExams: activeExams.length,
      },
    };

  } catch (err) {
    if (transactionStarted) {
      try {
        db.exec('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr.message);
      }
    }
    console.error('Import settings error:', err);
    return {
      success: false,
      message: 'An error occurred during import.',
      error: err.message,
    };
  }
});


// Import Student Data Handler
ipcMain.handle('import-student-data', async (event, { academicYearId, filePath }) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const studentData = JSON.parse(fileContent);
    // Validate incoming format
    if (!studentData || !studentData.students || !studentData.admissions) {
      return { success: false, message: 'Invalid student data format' };
    }

    
    if(studentData.academicYearId != academicYearId){
      return { success: false, message: 'The student Data is not for Current Session. Check Current AcademicYear' };
    }

    db.exec('BEGIN TRANSACTION');

    try {
      // Prepare upsert for Students
      const studentUpsertStmt = db.prepare(`
        INSERT OR REPLACE INTO Students (
          Id, Name, Gender, FathersName, MothersName, DOB, Aadhaar, APAR, PEN,
          Contact, Email, Address, PIN, FirstAdmissionDate, RegistrationNumber, Status, Caste,
          Religion, Height, Weight, BloodGroup, Creation_at, Last_Modified_at
        ) VALUES (
          @Id, @Name, @Gender, @FathersName, @MothersName, @DOB, @Aadhaar, @APAR, @PEN,
          @Contact, @Email, @Address, @PIN, @FirstAdmissionDate, @RegistrationNumber, @Status, @Caste,
          @Religion, @Height, @Weight, @BloodGroup, @Creation_at, @Last_Modified_at
        )
        ON CONFLICT(Id) DO UPDATE SET
          Name = excluded.Name,
          Gender = excluded.Gender,
          FathersName = excluded.FathersName,
          MothersName = excluded.MothersName,
          DOB = excluded.DOB,
          Aadhaar = excluded.Aadhaar,
          APAR = excluded.APAR,
          PEN = excluded.PEN,
          Contact = excluded.Contact,
          Email = excluded.Email,
          Address = excluded.Address,
          PIN = excluded.PIN,
          FirstAdmissionDate = excluded.FirstAdmissionDate,
          RegistrationNumber = excluded.RegistrationNumber,
          Status = excluded.Status,
          Caste = excluded.Caste,
          Religion = excluded.Religion,
          Height = excluded.Height,
          Weight = excluded.Weight,
          BloodGroup = excluded.BloodGroup,
          Creation_at = excluded.Creation_at,
          Last_Modified_at = CURRENT_TIMESTAMP
      `);

      for (const student of studentData.students) {
        studentUpsertStmt.run(student);
      }

      // Prepare upsert for Admissions
      const admissionUpsertStmt = db.prepare(`
        INSERT OR REPLACE INTO Admissions (
          StudentId, AcademicYearId, ClassId, SectionId, RollNo,
          AdmissionType, reAdmitted, Creation_at, Last_Modified_at
        ) VALUES (
          @StudentId, @AcademicYearId, @ClassId, @SectionId, @RollNo,
          @AdmissionType, @reAdmitted, @Creation_at, @Last_Modified_at
        )
        ON CONFLICT(StudentId, AcademicYearId) DO UPDATE SET          
          ClassId = excluded.ClassId,
          SectionId = excluded.SectionId,
          RollNo = excluded.RollNo,
          AdmissionType = excluded.AdmissionType,
          reAdmitted = excluded.reAdmitted,
          Creation_at = excluded.Creation_at,
          Last_Modified_at = excluded.Last_Modified_at
      `);

      for (const admission of studentData.admissions) {
        admissionUpsertStmt.run(admission);
      }

      db.exec('COMMIT');
      return { success: true, count: studentData.students.length };

    } catch (err) {
      db.exec('ROLLBACK');
      console.error('Transaction error during student import:', err);
      return { success: false, message: 'Database error during student import' };
    }

  } catch (err) {
    console.error('General import error:', err);
    return { success: false, message: 'An error occurred while importing student data' };
  }
});

// Import Marks Data Handler
ipcMain.handle('import-marks-data', async (event, { academicYearId, filePath }) => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, message: 'Invalid file path.' };
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData);

    const {
      metadata,
      data: {
        examId,
        academicYearId: fileAcademicYearId,
        classId,
        sectionId,
        studentIds,
        marks,
        markEntryStatus,
        coScholasticMarks,
        cumulativeMarks,
        finalCumulativeMarks
      }
    } = jsonData;

    // ✅ Academic year mismatch check
    if (academicYearId !== fileAcademicYearId) {
      return { success: false, message: 'Academic Year ID mismatched with the file.' };
    }

    db.exec('BEGIN TRANSACTION');
    const insertOrIgnore = (table, columns, rows) => {
      const keys = columns.join(',');
      const placeholders = columns.map(() => '?').join(',');
      const stmt = db.prepare(`INSERT OR IGNORE INTO ${table} (${keys}) VALUES (${placeholders})`);
      for (const row of rows) {
        const values = columns.map(col => row[col]);
        stmt.run(values);
      }
    };

    insertOrIgnore('Marks', [
      'ActiveExamId', 'StudentId', 'SubjectId',
      'PeriodicMaxMark', 'TerminalMaxMark', 'TotalMaxMarks',
      'PeriodicMarksObtained', 'TerminalMarksObtained', 'TotalMarksObtained',
      'SubjectResult', 'Appeared', 'Creation_at', 'Last_Modified_at',
      'CreatedBy', 'ModifiedBy'
    ], marks);

    insertOrIgnore('MarkEntryStatus', [
      'ActiveExamId', 'ClassId', 'SectionId', 'SubjectId',
      'FinishedEntry', 'Remarks', 'Creation_at', 'Last_Modified_at'
    ], markEntryStatus);

    insertOrIgnore('CoScholasticMarks', [
      'ActiveExamId', 'StudentId', 'SubjectId', 'Grade',
      'Appeared', 'Remark', 'Creation_at', 'Last_Modified_at',
      'CreatedBy', 'ModifiedBy'
    ], coScholasticMarks);

    insertOrIgnore('CumulativeTotalMarks', [
      'AcademicYearId', 'ActiveExamId', 'StudentId',
      'TotalMaxMarks', 'TotalMarksObtained', 'Percentage',
      'Creation_at', 'Last_Modified_at'
    ], cumulativeMarks);

    if (finalCumulativeMarks?.length) {
      insertOrIgnore('FinalCumulativeTotalMarks', [
        'AcademicYearId', 'StudentId',
        'TotalMaxMarks', 'TotalMarksObtained', 'Percentage',
        'Creation_at', 'Last_Modified_at'
      ], finalCumulativeMarks);
    }

    db.exec('COMMIT');
    return { success: true, message: 'Marks data imported successfully.' };

  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Import Marks Error:', err);
    return { success: false, message: 'Failed to import marks data.', error: err.message };
  }
});
