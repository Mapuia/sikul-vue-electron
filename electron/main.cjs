const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const db = require('./database.cjs');
const authService = require('./ipcHandlers/auth.cjs');
const { runMigrations } = require('./utils/databaseMigrations.cjs');

runMigrations();

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
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'app_icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
    // mainWindow.webContents.openDevTools(); // Uncomment for debugging
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    if (splash && !splash.isDestroyed()) splash.close();
    mainWindow.show();
  });
}

async function loadHandlers() {
  const handlers = [
    'AcademicYearHandler',
    'ClassesHandler',
    'SectionsHandler',
    'SubjectsHandler',
    'ExamsHandler',
    'ActiveExamsHandler',
    'SignatoriesHandler',
    'ClassSubjectsMappingHandler',
    'ClassSectionsMappingHandler',
    'AdmissionHandler',
    'StudentsHandler',
    'MarksEntryHandler',
    'CoScholastticHandler',
    'StatsHandler',
    'ResultsHandler',
    'ReportCardHandler',
    'ExportHandler',
    'ImportHandler',
    'attendance'
  ];

  for (const handler of handlers) {
    await import(`./ipcHandlers/${handler}.cjs`);
  }
}

app.whenReady().then(async () => {
  try {
    await authService.initialize();
    await loadHandlers();
    createSplashWindow();
    runMigrations();
    createMainWindow();
  } catch (err) {
    console.error("Initialization failed:", err);
    app.quit();
  }
});

ipcMain.handle('open-dialog', async (event, options) => {
  const win = BrowserWindow.getFocusedWindow()
  return await dialog.showOpenDialog(win, options)
})

// Authentication IPC handlers
ipcMain.handle('auth-login', async (_, username, password) => {
  try {
    const user = await authService.login(username, password);
    return { success: true, user };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('auth-logout', async () => {
  try {
    return await authService.logout();
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
});

ipcMain.handle('auth-check', async () => await authService.checkAuth());

ipcMain.handle('register-user', async (_, username, password, role) => {
  try {
    await authService.register(username, password, role);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('auth-change-password', async (_, username, oldPassword, newPassword) => {
  try {
    await authService.changePassword(username, oldPassword, newPassword);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('auth-get-current-user', async () => await authService.getCurrentUser());

ipcMain.handle('get-user-role', async () => {
  const user = await authService.getCurrentUser();
  return user?.role || null;
});

// UI Sync: Notify when Academic Year is added
ipcMain.on('academic-year-added', () => {
  const [win] = BrowserWindow.getAllWindows();
  if (win && !win.isDestroyed()) {
    win.webContents.send('refresh-academic-year');
  }
});

// Confirmation dialog
ipcMain.handle('show-confirmation-dialog', async (_, message) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 1,
    title: 'Confirmation',
    message
  });
  return result.response === 0;
});
ipcMain.handle('show-info-dialog', async (_, message) => {
  const { dialog } = require('electron');
  await dialog.showMessageBox({
    type: 'info',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Info',
    message,
  });
});
ipcMain.handle('show-error-dialog', async (_, message) => {
  const { dialog } = require('electron');
  await dialog.showMessageBox({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Error Info',
    message,
  });
});
// Quit handling with cleanup
let isSafeToQuit = false;

ipcMain.on('logout', () => app.quit());

app.on('before-quit', (event) => {
   authService.logout();
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
    db.closeDatabase(); // better-sqlite3 uses sync close
    console.log("Cleanup done.");
  } catch (err) {
    console.error("Error during DB cleanup:", err);
  }
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
