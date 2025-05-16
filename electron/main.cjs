// main.cjs
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { runMigrations } = require('./utils/databaseMigrations.cjs');

// Import database and handlers
const db = require('./database.cjs');
require('./ipcHandlers/AcademicYearHandler.cjs');
require('./ipcHandlers/ClassesHandler.cjs');
require('./ipcHandlers/SectionsHandler.cjs');
require('./ipcHandlers/SubjectsHandler.cjs');
require('./ipcHandlers/ExamsHandler.cjs');
require('./ipcHandlers/ActiveExamsHandler.cjs');
require('./ipcHandlers/ClassSubjectsMappingHandler.cjs');
require('./ipcHandlers/ClassSectionsMappingHandler.cjs');
require('./ipcHandlers/AdmissionHandler.cjs');
require('./ipcHandlers/StudentsHandler.cjs');
require('./ipcHandlers/MarksEntryHandler.cjs');
require('./ipcHandlers/CoScholastticHandler.cjs');
require('./ipcHandlers/StatsHandler.cjs');
require('./ipcHandlers/ResultsHandler.cjs');


let mainWindow;
let splash;

function createSplashWindow() {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  splash.loadFile(path.join(__dirname, 'splash.html'));
  splash.once('ready-to-show', () => splash.show());
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    show: false, // wait until content is ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    if (splash && !splash.isDestroyed()) {
      splash.close();
    }
    mainWindow.show();
  });
}

app.whenReady().then(async() => {
  try {   
   //await runMigrations();
    createSplashWindow();
    createMainWindow();
  } catch (err) {
    console.error("Database initialization failed:", err);
    app.quit();
  }
});

// IPC: Notify UI of new Academic Year
ipcMain.on('academic-year-added', () => {
  try {
    const [win] = BrowserWindow.getAllWindows();
    if (win && !win.isDestroyed()) {
      win.webContents.send('refresh-academic-year');
    }
  } catch (error) {
    console.error('Error sending academic year update:', error);
  }
});

// IPC: Show confirmation dialog
ipcMain.handle('show-confirmation-dialog', async (event, message) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 1,
    title: 'Confirmation',
    message
  });
  return result.response === 0;
});


// IPC: Logout and quit
let isSafeToQuit = false;
ipcMain.on('logout', () => app.quit());

app.on('before-quit', (event) => {
  if (!isSafeToQuit) {
    event.preventDefault();
    performCleanup().then(() => {
      isSafeToQuit = true;
      app.quit();
    }).catch((err) => {
      console.error("Cleanup failed. App not quitting:", err);
    });
  }
});

async function performCleanup() {
  try {
    console.log("Performing cleanup...");
    await db.closeDatabase(); // sync in better-sqlite3
    console.log("Cleanup done.");
  } catch (err) {
    console.error("Error during DB cleanup:", err);
  }
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});