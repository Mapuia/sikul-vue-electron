const { contextBridge, ipcRenderer } = require("electron");

  console.log("Preload loaded");
  console.log("🚀 Preload script loaded");
  contextBridge.exposeInMainWorld("electronAPI", {
      
      logout: () => ipcRenderer.send('logout'),
      getCurrentAcademicYear: () => ipcRenderer.invoke('get-current-academic-year'),      
      addAcademicYear: (data) => ipcRenderer.invoke("add-academic-year", data),
      notifyAcademicYearAdded: () => ipcRenderer.send('academic-year-added'),
      onAcademicYearChanged: (callback) => ipcRenderer.on('refresh-academic-year', callback),
  
});