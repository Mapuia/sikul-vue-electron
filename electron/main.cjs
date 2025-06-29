// main.cjs
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { runMigrations } = require('./utils/databaseMigrations.cjs');

// Import database and handlers
const db = require('./database.cjs');
const authService = require('../src/services/auth.cjs');

require('./ipcHandlers/AcademicYearHandler.cjs');
require('./ipcHandlers/ClassesHandler.cjs');
require('./ipcHandlers/SectionsHandler.cjs');
require('./ipcHandlers/SubjectsHandler.cjs');
require('./ipcHandlers/ExamsHandler.cjs');
require('./ipcHandlers/ActiveExamsHandler.cjs');
require('./ipcHandlers/SignatoriesHandler.cjs');
require('./ipcHandlers/ClassSubjectsMappingHandler.cjs');
require('./ipcHandlers/ClassSectionsMappingHandler.cjs');
require('./ipcHandlers/AdmissionHandler.cjs');
require('./ipcHandlers/StudentsHandler.cjs');
require('./ipcHandlers/MarksEntryHandler.cjs');
require('./ipcHandlers/CoScholastticHandler.cjs');
require('./ipcHandlers/StatsHandler.cjs');
require('./ipcHandlers/ResultsHandler.cjs');
require('./ipcHandlers/ReportCardHandler.cjs');
//require('./ipcHandlers/PDFHandler.cjs');


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
    //fullscreen: true,
    width: 1400,
    height: 900,
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
    await authService.initialize();
    createSplashWindow();
    createMainWindow();
  } catch (err) {
    console.error("Database initialization failed:", err);
    app.quit();
  }
});

//user authentication
ipcMain.handle('auth-login', async (_, username, password) => {
  try {
    const user = await authService.login(username, password)
    return { success: true, user }
  } catch (error) {
    return { success: false, message: error.message }
  }
})

ipcMain.handle('auth-logout', async () => {
  try {
    return await authService.logout();
  } catch (error) {
    console.error('Logout handler error:', error);
    return false;
  }
});

ipcMain.handle('auth-check', async () => {
  return await authService.checkAuth()
})

ipcMain.handle('register-user', async (_, username, password, role) => {
  try {
    await authService.register(username, password, role)
    return { success: true }
  } catch (error) {
    return { success: false, message: error.message }
  }
})


ipcMain.handle('auth-change-password', async (_, username, oldPassword, newPassword) => {
  try {
    await authService.changePassword(username, oldPassword, newPassword)
    return { success: true }
  } catch (error) {
    return { success: false, message: error.message }
  }
})

ipcMain.handle('auth-get-current-user', async () => {
  return await authService.getCurrentUser()
})
ipcMain.handle('get-user-role', async () => {
  const user = await authService.getCurrentUser()
  return user?.role || null
})

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
    db.closeDatabase(); // sync in better-sqlite3
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