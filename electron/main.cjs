const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

//get Academic Year
const { addAcademicYear,
  initializeDatabase,
  getDatabase, 
  closeDatabase 
} = require('./database.cjs');

//Get current Academic Year// App will be loaded for Current Academic Year
ipcMain.handle('get-current-academic-year', async () => {
  try {
      db = getDatabase();
      const stmt = db.prepare('SELECT Year FROM academicYears WHERE isActive = 1');
      const row = stmt.get();
      console.log(row);
      return row || null;
  } catch (err) {
      console.error("DB error:", err);
      return null;
  }
  
});

//Add Academic Year
ipcMain.handle('add-academic-year', async (event, { year, startDate, endDate }) => {
  //console.log("IPC Handler 'add-academic-year' called with:", year, startDate, endDate);
  try {
    addAcademicYear(year, startDate, endDate);
    return { success: true };
  } 
  catch (err) {
    console.error("Error in add-academic-year:", err);
    const isDuplicate = err.code === 'SQLITE_CONSTRAINT_UNIQUE';
    return {
      success: false,
      message: isDuplicate ? 'Academic year already exists.' : 'Error adding year.'
    };
  }
});

ipcMain.on('academic-year-added', (event) => {
  const webContents = BrowserWindow.getAllWindows()[0].webContents;
  webContents.send('refresh-academic-year');
});

//open the main Window
app.whenReady().then(() => {
  try {
    initializeDatabase();
    createWindow();
  } catch (err) {
    console.error("Database initialization failed:", err);
    app.quit(); // Exit app if DB init fails
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true
    }
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    win.loadURL(devUrl)
   // win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

//Implementation of Logout in the main process.
//Function to close the Application Instance (or Main Window).
let isSafeToQuit = false;

ipcMain.on('logout', () => {
  console.log("Logout requested via IPC");
  app.quit(); // Trigger before-quit
});

app.on('before-quit', (event) => {
  if (!isSafeToQuit) {
    event.preventDefault();
    performCleanup().then(() => {
      isSafeToQuit = true;
      console.log("Application is safely closed...")
      app.quit(); // Try quitting again after cleanup
    }).catch((err) => {
      console.error("Cleanup failed. App not quitting:", err);
    });
  }
});

async function performCleanup() {
  try {
    console.log("Performing cleanup...");
    closeDatabase(); // This is synchronous in better-sqlite3
    console.log("Cleanup done.");
  } catch (err) {
    console.error("Error during DB cleanup:", err);
  }
}

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
})
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        //clearCache();
        app.quit();
    }
});
