const { contextBridge, ipcRenderer } = require("electron");

  console.log("Preload script loaded");
  contextBridge.exposeInMainWorld("electronAPI", {
    /////////////////////////////////////////////////////////////////////////////SIMPLE DATA FETCHING
    getCurrentAcademicYear: () => ipcRenderer.invoke('get-current-academic-year'),
    
    
    
    
    getActiveExams: () => ipcRenderer.invoke('get-active-exams'),
    
    insertActiveExam: (data) => ipcRenderer.invoke('insert-active-exam', data),
    deactivateAllActiveExams: (yearId) => ipcRenderer.invoke('deactivate-active-exams', yearId),

      //Main API
      logout: () => ipcRenderer.send('logout'),
            
      addAcademicYear: (data) => ipcRenderer.invoke("add-academic-year", data),
      notifyAcademicYearAdded: () => ipcRenderer.send('academic-year-added'),
      onAcademicYearChanged: (callback) => ipcRenderer.on('refresh-academic-year', callback),
      showConfirmationDialog: async (message) => await ipcRenderer.invoke('show-confirmation-dialog', message),
      
      //Classes API
      getClasses: () => ipcRenderer.invoke('get-classes'),
      insertClass: async (className) => await ipcRenderer.invoke('insert-class', className),       
      updateClass: async (ClassId, newClassName) => await ipcRenderer.invoke('update-class', ClassId, newClassName),
      deleteClass: async (className) => await ipcRenderer.invoke('delete-class', className),
      
      // Sections
      getSections: () => ipcRenderer.invoke('get-sections'),
      insertSection: async (sectionName) => await ipcRenderer.invoke('insert-section', sectionName),      
      updateSection: async (oldSectionName, newSectionName) => await ipcRenderer.invoke('update-section', oldSectionName, newSectionName),
      deleteSection: async (sectionName) => await ipcRenderer.invoke('delete-section', sectionName),

      // Subjects
      getSubjects: () => ipcRenderer.invoke('get-subjects'),
      insertSubject: async (subjectData) => await ipcRenderer.invoke('insert-subject', subjectData),      
      updateSubject: async (subjectData) => await ipcRenderer.invoke('update-subject', subjectData),
      deleteSubject: async (subjectName) => await ipcRenderer.invoke('delete-subject', subjectName),

      //
      getExams: () => ipcRenderer.invoke('get-exams'),
      insertExam: (examName, description) => ipcRenderer.invoke('insert-exam', examName, description),
      updateExam: (id, examName, description) => ipcRenderer.invoke('update-exam', id, examName, description),
      deleteExam: (examId) => ipcRenderer.invoke('delete-exam', examId),
      
      getActiveExam: () => ipcRenderer.invoke('get-active-exam'),
      

      //
      //getSubjectsByClass: (className) => ipcRenderer.invoke('getSubjectsByClass', className),
      insertStudentAndAdmission: (form) => ipcRenderer.invoke('insert-student-admission', form),
      
      //Class Subject Mapping
      getClassSubjectMappings: () => ipcRenderer.invoke('get-class-subject-mappings'),
      saveClassSubjectMappings: (mappings) => ipcRenderer.invoke('save-class-subject-mappings', mappings),

      // Class-Section Mapping methods
      getClassSectionMappings: () => ipcRenderer.invoke('get-class-section-mappings'),
      saveClassSectionMappings: (mappings) => ipcRenderer.invoke('save-class-section-mappings', mappings),
      deleteClassSectionMapping: (classId) => ipcRenderer.invoke('delete-class-section-mapping', classId),
     
});