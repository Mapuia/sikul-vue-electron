const { ipcMain } = require('electron');
const { db } = require('../database.cjs');

//console.log("Class Handler loaded Successfully");
//////////////////////////////////////////////////////////////////////////////////////READ/GET
ipcMain.handle('get-classes', () => {
  try {
    const stmt = db.prepare('SELECT * FROM Classes');
    const classes = stmt.all();
    return { success: true, classes };
  } catch (err) {
    console.error('Failed to get classes:', err);
    return { success: false, message: err.message };
  }
});

//////////////////////////////////////////////////////////////////////////////////////INSERT
ipcMain.handle('insert-class', async (event, classId, className) => {
  try {
    const stmt = db.prepare('INSERT INTO Classes (ClassId, ClassName, Teacher) VALUES (?, ?, ?)');
    stmt.run(classId, className);
    return { success: true };
  } catch (err) {
    console.error('Failed to insert class:', err);
    return { success: false, message: err.message };
  }
});
  
//////////////////////////////////////////////////////////////////////////////////////UPDATE
ipcMain.handle('update-class', async (event, id, classId, newClassName) => {
  try {
    const checkStmt = db.prepare(`
      SELECT COUNT(*) as count FROM Classes 
      WHERE ClassName = ? AND Teacher = ? AND ClassId = ? AND Id != ?
    `);
    const exists = checkStmt.get(newClassName, classId, id);

    if (exists.count > 0) {
      return { success: false, message: 'Class with same name, ID, and teacher already exists' };
    }

    const updateStmt = db.prepare(`
      UPDATE Classes 
      SET ClassName = ?, Teacher = ?, ClassId = ?
      WHERE Id = ?
    `);
    const result = updateStmt.run(newClassName, classId, id);

    return result.changes > 0
      ? { success: true }
      : { success: false, message: 'No changes made - class not found' };
  } catch (err) {
    console.error('Update class error:', err);
    return { success: false, message: err.message };
  }
});


//////////////////////////////////////////////////////////////////////////////////////DELETE
ipcMain.handle('delete-class', async (event, classId) => {
  try {
    const stmt = db.prepare('DELETE FROM Classes WHERE Id = ?');
    const result = stmt.run(classId);

    return result.changes > 0
      ? { success: true }
      : { success: false, message: 'Class not found' };
  } catch (err) {
    console.error('Delete class error:', err);
    return { success: false, message: err.message };
  }
});


// fetch Upper Classes
ipcMain.handle('fetch-upper-classes', async (event, className) => {
  try {
    const stmt = db.prepare('SELECT * FROM Classes');
    const allClasses = stmt.all();

    const upperClasses = allClasses.filter(cls => {
      return isClassGreaterOrEqual(cls.ClassName, className);
    });

    //console.log("Upper classes for", className, ":", upperClasses);
    return { success: true, classes: upperClasses };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Custom comparison for KG-I/KG-II vs. Class I-XII
function isClassGreaterOrEqual(clsName, currentName) {
  // Extract prefixes and Roman numerals
  const clsPrefix = clsName.split('-')[0]; // "KG" or "Class"
  const currentPrefix = currentName.split('-')[0];
  const clsRoman = extractRomanNumeral(clsName);
  const currentRoman = extractRomanNumeral(currentName);

  // Case 1: Both are KG classes (KG-I, KG-II)
  if (clsPrefix === 'KG' && currentPrefix === 'KG') {
    return romanToInt(clsRoman) >= romanToInt(currentRoman);
  }
  // Case 2: Current is KG, class is not KG → exclude (KG < Class I)
  else if (currentPrefix === 'KG' && clsPrefix !== 'KG') {
    return false;
  }
  // Case 3: Current is Class I+, class is KG → exclude (Class I > KG)
  else if (currentPrefix !== 'KG' && clsPrefix === 'KG') {
    return false;
  }
  // Case 4: Both are Class I-XII
  else {
    return romanToInt(clsRoman) >= romanToInt(currentRoman);
  }
}

// Helpers (unchanged)
function extractRomanNumeral(name) {
  const romanMatch = name.match(/([IVXLCDM]+)$/i);
  return romanMatch ? romanMatch[1].toUpperCase() : 'I';
}


// Helper: Convert Roman numeral to integer
function romanToInt(roman) {
  const romanMap = { 'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000 };
  let total = 0, prev = 0;
  for (let i = roman.length - 1; i >= 0; i--) {
    const val = romanMap[roman[i]];
    total += val < prev ? -val : val;
    prev = val;
  }
  return total;
}
