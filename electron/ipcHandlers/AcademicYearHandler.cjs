const { ipcMain } = require('electron');
const { db } = require('../database.cjs');
const { errorMessages } = require('vue/compiler-sfc');

function toCamelCase(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [
      key.charAt(0).toLowerCase() + key.slice(1),
      val
    ])
  );
}
console.log("Academic Year Handler is loaded.");
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

////Getting all academic Years
ipcMain.handle('get-academic-years', () => {
  const rows = db.prepare('SELECT * FROM AcademicYears ORDER BY StartDate DESC').all();
  const result = rows.map(toCamelCase);  // 🔁 Normalize keys
  return { success: true, result };
});
/////////////////////////////////////////////////////////////////////////////////////////////Add Academic Year
ipcMain.handle('add-academic-year', async (event, { yearName, baseYear, startDate, endDate }) => {
  try {
    //console.log("ACademicYear Handler:", yearName, baseYear, startDate, endDate)
    const insertAcademicYear = db.transaction(() => {
      // Deactivate all existing academic years
      db.prepare('UPDATE AcademicYears SET IsActive = 0').run();

      // Insert the new academic year with IsActive = 1
      const stmt = db.prepare(`
        INSERT INTO AcademicYears (YearName, BaseYear, StartDate, EndDate, IsActive)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(yearName, baseYear, startDate, endDate, 1);
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
ipcMain.handle('activate-academic-year', async (event, { AcademicYearId }) => {
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
ipcMain.handle('deactivate-academic-year', async (event, { AcademicYearId }) => {
  const dbTransaction = db.transaction(() => {
   
    const latestInactive = db
      .prepare('SELECT Id FROM AcademicYears WHERE IsActive = 0 ORDER BY Id DESC LIMIT 1')
      .get();

    if (!latestInactive) {
      throw new Error("No inactive academic year found to activate.");
    }

    db.prepare('UPDATE AcademicYears SET IsActive = 1 WHERE Id = ?').run(latestInactive.Id);

    db.prepare('UPDATE AcademicYears SET IsActive = 0 WHERE Id = ?').run(AcademicYearId);

    return {
      success: true,
      activatedId: latestInactive.Id,
      deactivatedId: AcademicYearId
    };
  });

  try {
    return dbTransaction(); // Run as transaction to ensure atomicity
  } catch (err) {
    console.error("Error in deactivating academic year:", err);
    return {
      success: false,
      message: err.message || "An error occurred while deactivating."
    };
  }
});


//////////////////////////////////////////////////////////////////////////////////////
ipcMain.handle('delete-academic-year', async (event, { AcademicYearId }) => {
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
