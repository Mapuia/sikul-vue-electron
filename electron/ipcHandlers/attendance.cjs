const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

ipcMain.handle('insert-working-days',(event, {yearId, classId, term, noOfWorkingDays})=>{
 // console.log('Admission Data:', payload)
  try{
    db.prepare(`
      INSERT INTO totalWorkingDays (
      academicYearId, classId, term, noOfWorkingDays
      ) VALUES ( ?, ?, ?, ? )      
    `).run(yearId, classId, term, noOfWorkingDays );
    
    return { success: true };
  } catch (error) {
    console.error('Insert No. of Working Days Error:', error.message);
    return { success: false, error: error.message };
  }
})

//fetch Total No. of Working Days
ipcMain.handle('get-working-days',async(event, {yearId, classId, term})=>{
  // console.log('Working Data:', yearId, classId, term)
  try{
    const workingDaysStmt = db.prepare(`
      SELECT noOfWorkingDays
      FROM totalWorkingDays
      WHERE
        academicYearId = ? AND
        classId = ? AND
        term = ?     
    `)
    const workingDays = workingDaysStmt.get(yearId, classId, term);
    // console.log('Working Days:', workingDays?.noOfWorkingDays)
    
    return { 
      success: true,
      workingDays: workingDays?.noOfWorkingDays
    };
  } catch (error) {
    console.error('Error in fetching No. of Working Days:', error.message);
    return { success: false, error: error.message };
  }
})

//edit No. of Working Days
ipcMain.handle('edit-working-days',(event, {yearId, classId, term, totalWorkingDays})=>{
 // console.log('edit Data:', yearId)
  try{
    const workingDays = db.prepare(`
      UPDATE noOfWorkingDays 
      SET
        noOfWorkingDays = ?
      WHERE
        academicYearId = ?
      AND
        classId = ?
      AND
        term = ?
    `).run(totalWorkingDays, yearId, classId, term );
    
    return { 
      success: true,      
    };
  } catch (error) {
    console.error('Error in editting No. of Working Days:', error.message);
    return { success: false, error: error.message };
  }
})