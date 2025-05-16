const { contextBridge, ipcRenderer } = require("electron");

  console.log("Preload script loaded");
  contextBridge.exposeInMainWorld("electronAPI", {
    /////////////////////////////////////////////////////////////////////////////

  getAcademicYears: () => ipcRenderer.invoke('get-academic-years'),
  getCurrentAcademicYear: () => ipcRenderer.invoke('get-current-academic-year'),
  activateAcademicYear:() => ipcRenderer.invoke('activate-academic-year'),
  deactivateAcademicYear:() => ipcRenderer.invoke('deactivate-academic-year'),
  deleteAcademicYear:() => ipcRenderer.invoke('delete-academic-year'),

  addAcademicYear: (data) => ipcRenderer.invoke("add-academic-year", data),
  notifyAcademicYearAdded: () => ipcRenderer.send('academic-year-added'),
  onAcademicYearChanged: (callback) => {
    // Safe check for ipcRenderer
        if (ipcRenderer) {
            ipcRenderer.on('refresh-academic-year', callback)
          }
        },
        logout: () => {
          if (ipcRenderer) {
            ipcRenderer.send('logout')
          }
        },

  showConfirmationDialog: async (message) => await ipcRenderer.invoke('show-confirmation-dialog', message),
      
  //Classes API
  getClasses: () => ipcRenderer.invoke('get-classes'),
  insertClass: async (classId, className, classTeacher) => await ipcRenderer.invoke('insert-class', classId, className, classTeacher),       
  updateClass: async (Id, ClassId, newClassName, newClassTeacher) => await ipcRenderer.invoke('update-class', Id, ClassId, newClassName, newClassTeacher),
  deleteClass: async (className) => await ipcRenderer.invoke('delete-class', className),
   
  //Sections
  getSections: () => ipcRenderer.invoke('get-sections'),
  insertSection: async (sectionName) => await ipcRenderer.invoke('insert-section', sectionName),      
  updateSection: async (oldSectionName, newSectionName) => await ipcRenderer.invoke('update-section', oldSectionName, newSectionName),
  deleteSection: async (sectionName) => await ipcRenderer.invoke('delete-section', sectionName),

  // Subjects
  getSubjects: () => ipcRenderer.invoke('get-subjects'),      
  insertSubject: async (subjectData) => await ipcRenderer.invoke('insert-subject', subjectData),      
  updateSubject: async (subjectData) => await ipcRenderer.invoke('update-subject', subjectData),
  deleteSubject: async (subjectId) => await ipcRenderer.invoke('delete-subject', subjectId),

  //Master Exams
  getExams: () => ipcRenderer.invoke('get-exams'),
  insertExam: (examName, examType, description) => ipcRenderer.invoke('insert-exam', examName, examType, description),
  updateExam: (id, examName, examType, description) => ipcRenderer.invoke('update-exam', id, examName, examType, description),
  deleteExam: (examId) => ipcRenderer.invoke('delete-exam', examId),
      
  //Active Exams
  getActiveExams: (academicYearId) => ipcRenderer.invoke('get-active-exams', academicYearId),
  insertActiveExam: (examData) => ipcRenderer.invoke('insert-active-exam', examData),
  updateActiveExam: (examData) => ipcRenderer.invoke('update-active-exam', examData),
  deleteActiveExam: (examId) => ipcRenderer.invoke('delete-active-exam', examId),
  deactivateAllActiveExams: (academicYearId) => ipcRenderer.invoke('deactivate-all-active-exams', academicYearId),

  getCurrentExam: (academicYearId) => ipcRenderer.invoke('get-current-exam', academicYearId),

  //getSubjectsByClass: (className) => ipcRenderer.invoke('get-subjects-by-class', className),
  insertStudentAndAdmission: (form) => ipcRenderer.invoke('insert-student-admission', form),
     
  //Class Subject Mapping
  getClassSubjectMappings: () => ipcRenderer.invoke('get-class-subject-mappings'),
  saveClassSubjectMappings: (mappings) => ipcRenderer.invoke('save-class-subject-mappings', mappings),

  // Class-Section Mapping methods
  getClassSectionMappings: () => ipcRenderer.invoke('get-class-section-mappings'),
  saveClassSectionMappings: (mappings) => ipcRenderer.invoke('save-class-section-mappings', mappings),
  deleteClassSectionMapping: (classId) => ipcRenderer.invoke('delete-class-section-mapping', classId),
     
  getSectionsByClassId:(ClassId) => ipcRenderer.invoke('get-sections-by-classId', ClassId),
  getSubjectsByClassId:(ClassId) => ipcRenderer.invoke('get-subjects-by-classId', ClassId),
    
  // Window Management
  openNewAdmissionWindow: () => ipcRenderer.send('open-new-admission-window'),
  openEditStudentWindow: (studentId) => ipcRenderer.send('open-edit-student-window', studentId),
     
  // Error handling
  onError: (callback) => ipcRenderer.on('error', callback),

  getStudentsByClassAndSection: (data) => ipcRenderer.invoke('get-students-by-class-and-section', data),
  getMarksByExamSubject: (params) => ipcRenderer.invoke('get-marks-by-exam-subject', params),
  
  saveMarks: (data, subjectData) => ipcRenderer.invoke('save-marks', data, subjectData),
  saveCoScholasticMarks: (data) => ipcRenderer.invoke('save-coscholastic-marks', data),
  getCoScholastics: () => ipcRenderer.invoke('get-coscholastic'),
  getMarksByClassSection: (payload) => ipcRenderer.invoke('get-marks-by-class-section', payload),
  getCoScholasticMarks: (params) => ipcRenderer.invoke('get-coscholastic-marks', params),

  //Next Features
  //getClassSectionStats: (data) => ipcRenderer.invoke('get-stats', data),     

  // For the result creation page
  calculateTotalMarks: (data) => ipcRenderer.invoke('calculate-total-marks', data),
  generateResults: (data) => ipcRenderer.invoke('generate-results', data),

  // Utility functions
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),

  // Student management
  getAllStudents: () => ipcRenderer.invoke('get-all-students'),
  searchStudents: (query) => ipcRenderer.invoke('search-students', query),
  getStudentDetails: (studentId, YearId) => ipcRenderer.invoke('get-student-details', studentId, YearId),
  updateStudent: (studentData) => ipcRenderer.invoke('update-student', studentData),
  deleteStudent: (studentId) => ipcRenderer.invoke('delete-student', studentId),
  //for current Year Admission
  //getStudentDetails: (studentId) => ipcRenderer.invoke('get-student-details', studentId),

  getStudentAdmissionDetails: (studentId, YearId) => ipcRenderer.invoke('get-admission-details', studentId, YearId),


  getmarkEntryStatus: (params) => ipcRenderer.invoke('get-mark-entry-status', params),
      
  //getClassesForExam: (data) => ipcRenderer.invoke('get-classes-for-exam', data),
  calculateClassMarks: (data) => ipcRenderer.invoke('calculate-class-marks', data),
  getCalculatedMarks: (data) => ipcRenderer.invoke('get-calculated-marks', data),
  
  // For result generation
  generateResults: (data) => ipcRenderer.invoke('generate-results', data),
  
  // For viewing results
  getGeneratedResults: (data) => ipcRenderer.invoke('get-generated-results', data)
  // We can also expose variables if needed
  
      
});