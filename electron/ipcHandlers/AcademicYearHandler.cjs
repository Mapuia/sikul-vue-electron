const { ipcMain } = require('electron');
const { db } = require('../database.cjs');
const currentTime = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString();

function toCamelCase(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [
      key.charAt(0).toLowerCase() + key.slice(1),
      val
    ])
  );
}

//console.log("Academic Year Handler is loaded.");
//////////////////////////////////////////////////////////////////////////////////////////////Load Current Year
ipcMain.handle('get-current-academic-year', () => {
  try {
    const stmt = db.prepare('SELECT * FROM AcademicYears WHERE IsActive = 1');
   
    const result = stmt.get();
   //  console.log("ACademicYear Handler:",result)
    return {success:true, result}
  } catch (err) {
    console.error('DB error (AcademicYear):', err);
    return null;
  }
});

ipcMain.handle('get-year-Id', (event, yearName) => {

  try {
    const stmt = db.prepare(`
      SELECT Id FROM AcademicYears WHERE YearName = ? `);
    const previousYear = stmt.get(yearName);
    return { success: true, previousYearId: previousYear?.Id };
  } catch (err) {
    console.error('DB error (getPreviousYear):', err);
    return { success: false, error: err.message };
  }
});

////Getting all academic Years
ipcMain.handle('get-academic-years', () => {
  const rows = db.prepare('SELECT * FROM AcademicYears ORDER BY StartDate DESC').all();
  const result = rows.map(toCamelCase); 
  return { success: true, result };
});

/////////////////////////////////////////////////////////////////////////////////////////////Add Academic Year
ipcMain.handle('add-academic-year', async (event, { yearName, startDate, endDate }) => {
  try {
    //console.log("ACademicYear Handler:", yearName, startDate, endDate)
    const insertAcademicYear = db.transaction(() => {
      // Deactivate all existing academic years
      db.prepare('UPDATE AcademicYears SET IsActive = 0').run();

      // Insert the new academic year with IsActive = 1
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO AcademicYears (YearName, StartDate, EndDate, IsActive, Creation_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = insertStmt.run(yearName, startDate, endDate, 1, currentTime);
      const acYearId = result.lastInsertRowid;

      const allExams = db.prepare(`SELECT * FROM Exams`).all();

      // Step 5: Prepare the ActiveExams insertion statement
      const insertActiveExam = db.prepare(`
        INSERT OR REPLACE INTO ActiveExams (
          AcademicYearId,
          ExamId,
          MajorMaxMark,
          MinorMaxMark,
          PassingPercentage,
          IsActive,
          Result_Published,
          Creation_at,
          Modified_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Step 6: Insert each exam with logic based on ExamType
      for (const exam of allExams) {
        let majorMaxMark, minorMaxMark;
        if (exam.ExamType.toLowerCase() === "periodic") {
          majorMaxMark = 20;
          minorMaxMark = 10;
        } else {
          majorMaxMark = 80;
          minorMaxMark = 40;
        }

        insertActiveExam.run(
          acYearId,
          exam.Id,
          majorMaxMark,
          minorMaxMark,
          40,  // PassingPercentage
          0,   // IsActive
          0,
          currentTime,
          currentTime
        );
      }
    });
    
    insertAcademicYear(); // Execute the transaction

    return { success: true };
  } catch (err) {
    console.error("Error in add-academic-year:", err);
    const isDuplicate = err.code === 'SQLITE_CONSTRAINT_UNIQUE';
    return {
      success: false,
      message: isDuplicate ? 'Academic year already exists.' : 'Error adding year.'
    };
  }
});

//////////////////////////////////////////////////////////////////////////////////////
ipcMain.handle('activate-academic-year', async (event,  AcademicYearId) => {
  const dbTransaction = db.transaction(() => {

    const deactivate = db.prepare('UPDATE AcademicYears SET IsActive = 0').run();

    const activate = db.prepare('UPDATE AcademicYears SET IsActive = 1 WHERE Id = ?').run(AcademicYearId);

    if (activate.changes === 0) {
      throw new Error("No academic year was activated. Invalid ID?");
    }

    return { success: true };
  });

  try {
    
    return dbTransaction();
  } catch (err) {
    console.error("Error in activating academic year:", err);
    return { success: false, message: err.message };
  }
});

//////////////////////////////////////////////////////////////////////////////////////
ipcMain.handle('delete-academic-year', async (event, AcademicYearId) => {
  try {

    const stmt = db.prepare(`SELECT Id FROM AcademicYears WHERE IsActive = 1`);
    const activeYear = stmt.get();

    if (activeYear && activeYear.Id === AcademicYearId) {
      return { success: false, message: "Current Active Academic Year cannot be deleted!" };
    }

    db.prepare('DELETE FROM AcademicYears WHERE Id = ?').run(AcademicYearId);
    return { success: true };

  } catch (err) {
    console.error("Error deleting academic year:", err);
    return {
      success: false,
      message: "An error occurred while deleting the academic year."
    };
  }
});
