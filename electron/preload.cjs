const { contextBridge, ipcRenderer } = require("electron");

  console.log("Preload script loaded");
  contextBridge.exposeInMainWorld("electronAPI", {
    /////////////////////////////////////////////////////////////////////////////SIMPLE DATA FETCHING
    getCurrentAcademicYear: () => ipcRenderer.invoke('get-current-academic-year'),
    
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
      
      //Active Exams
      getActiveExams: (academicYearId) => ipcRenderer.invoke('get-active-exams', academicYearId),
      insertActiveExam: (examData) => ipcRenderer.invoke('insert-active-exam', examData),
      updateActiveExam: (examData) => ipcRenderer.invoke('update-active-exam', examData),
      deleteActiveExam: (examId) => ipcRenderer.invoke('delete-active-exam', examId),
      deactivateAllActiveExams: (academicYearId) => ipcRenderer.invoke('deactivate-all-active-exams', academicYearId),

      getCurrentExam: (CurrentYearId) => ipcRenderer.invoke('get-current-exam', CurrentYearId),

      //
      //getSubjectsByClass: (className) => ipcRenderer.invoke('get-subjects-by-class', className),
      insertStudentAndAdmission: (form) => ipcRenderer.invoke('insert-student-admission', form),
      
      //Class Subject Mapping
      getClassSubjectMappings: () => ipcRenderer.invoke('get-class-subject-mappings'),
      saveClassSubjectMappings: (mappings) => ipcRenderer.invoke('save-class-subject-mappings', mappings),

      // Class-Section Mapping methods
      getClassSectionMappings: () => ipcRenderer.invoke('get-class-section-mappings'),
      saveClassSectionMappings: (mappings) => ipcRenderer.invoke('save-class-section-mappings', mappings),
      deleteClassSectionMapping: (classId) => ipcRenderer.invoke('delete-class-section-mapping', classId),
      getSectionsByClass:(ClassId) => ipcRenderer.invoke('get-sections-by-class', ClassId),

      getSubjectssByClassId:(ClassId) => ipcRenderer.invoke('get-subjects-by-classId', ClassId),
      
      // Student Management
      getAllStudents: () => ipcRenderer.invoke('get-all-students'),
      searchStudents: (searchTerm) => ipcRenderer.invoke('search-students', searchTerm),
      getStudentDetails: (studentId) => ipcRenderer.invoke('get-student-details', studentId),
      
      // Window Management
      openNewAdmissionWindow: () => ipcRenderer.send('open-new-admission-window'),
      openEditStudentWindow: (studentId) => ipcRenderer.send('open-edit-student-window', studentId),
      
      // Error handling
      onError: (callback) => ipcRenderer.on('error', callback),

      getStudentsByClassAndSection: (data) => ipcRenderer.invoke('get-students-by-class-and-section', data),
      saveMarks: (data) => ipcRenderer.invoke('save-marks', data),
});