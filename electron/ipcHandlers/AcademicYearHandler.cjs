const { ipcMain } = require('electron');
const { db } = require('../database.cjs');


console.log("Academic Year is loaded.");
//////////////////////////////////////////////////////////////////////////////////////////////Load Current Year
ipcMain.handle('get-current-academic-year', () => {
  try {
    const stmt = db.prepare('SELECT * FROM AcademicYears WHERE isActive = 1');
    console.log(stmt.get())
    return stmt.get();
  } catch (err) {
    console.error('DB error (AcademicYear):', err);
    return null;
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////Add Academic Year
ipcMain.handle('add-academic-year', async (event, { year, startDate, endDate }) => {
  try {
    const insertAcademicYear = db.transaction(() => {
      // Deactivate all existing academic years
      db.prepare('UPDATE AcademicYears SET IsActive = 0').run();

      // Insert the new academic year with IsActive = 1
      const stmt = db.prepare(`
        INSERT INTO AcademicYears (YearName, StartDate, EndDate, IsActive)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(year, startDate, endDate, 1);
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