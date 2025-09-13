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


ipcMain.handle('fetch-upper-classes', async (event, className) => {
  //console.log("Fetching upper classes for:", className);
  try {
    const stmt = db.prepare('SELECT * FROM Classes');
    const allClasses = stmt.all();

    // Sort classes properly
    const sortedClasses = allClasses.sort((a, b) => {
      return compareClasses(a.ClassName, b.ClassName);
    });

    // Find current class index
    const currentIndex = sortedClasses.findIndex(c => c.ClassName === className);

    let result = [];
    if (currentIndex !== -1) {
      result.push(sortedClasses[currentIndex]); // Current class
      if (sortedClasses[currentIndex + 1]) {
        result.push(sortedClasses[currentIndex + 1]); // Next class if available
      }
    }
    //console.log("Upper classes fetched successfully:", result);
    return { success: true, classes: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});


// ---------- Helpers ----------

// Compare function for sorting
function compareClasses(a, b) {
  const isKG_A = a.startsWith('KG');
  const isKG_B = b.startsWith('KG');

  // KG always comes before normal classes
  if (isKG_A && !isKG_B) return -1;
  if (!isKG_A && isKG_B) return 1;

  // Both KG → compare by numeral (I, II)
  if (isKG_A && isKG_B) {
    return romanToInt(extractRomanNumeral(a)) - romanToInt(extractRomanNumeral(b));
  }

  // Both normal classes → compare by numeral
  return romanToInt(extractRomanNumeral(a)) - romanToInt(extractRomanNumeral(b));
}

// Extract Roman numeral from names like "KG-I", "V", "XII"
function extractRomanNumeral(name) {
  const match = name.match(/([IVXLCDM]+)$/i);
  return match ? match[1].toUpperCase() : 'I';
}

// Convert Roman numeral → integer
function romanToInt(roman) {
  const map = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
  let total = 0, prev = 0;
  for (let i = roman.length - 1; i >= 0; i--) {
    const val = map[roman[i]];
    total += val < prev ? -val : val;
    prev = val;
  }
  return total;
}

