const { contextBridge, ipcRenderer } = require("electron");
//suthentication  
contextBridge.exposeInMainWorld('electronAuth', {
  login: (username, password) => ipcRenderer.invoke('auth-login', username, password),
  logout: () => ipcRenderer.invoke('auth-logout'),
  isAuthenticated: () => ipcRenderer.invoke('auth-check'),
  changePassword: (username, oldPassword, newPassword) => ipcRenderer.invoke('auth-change-password', username, oldPassword, newPassword),
  getCurrentUser: () => ipcRenderer.invoke('auth-get-current-user'),
  getUserRole: () => ipcRenderer.invoke('get-user-role'),
  register: (username, password, role) => ipcRenderer.invoke('register-user', username, password, role )
  })

  //Functional
  contextBridge.exposeInMainWorld("electronAPI", {
  getAcademicYears: () => ipcRenderer.invoke('get-academic-years'),
  getCurrentAcademicYear: () => ipcRenderer.invoke('get-current-academic-year'),
  getPreviousYear: () => ipcRenderer.invoke('get-previous-year'),
  activateAcademicYear: async (data) => await ipcRenderer.invoke('activate-academic-year', data),
  deleteAcademicYear:(id) => ipcRenderer.invoke('delete-academic-year',id),
  addAcademicYear: (id) => ipcRenderer.invoke("add-academic-year", id),
  notifyAcademicYearAdded: () => ipcRenderer.send('academic-year-added'),
  onAcademicYearChanged: (callback) => {
    // Safe check for ipcRenderer
        if (ipcRenderer) {
            ipcRenderer.on('refresh-academic-year', callback)
          }
        },
        

  showConfirmationDialog: async (message) => await ipcRenderer.invoke('show-confirmation-dialog', message),
      
  //Classes API
  getClasses: () => ipcRenderer.invoke('get-classes'),
  insertClass: async (classId, className) => await ipcRenderer.invoke('insert-class', classId, className),       
  updateClass: async (Id, ClassId, newClassName) => await ipcRenderer.invoke('update-class', Id, ClassId, newClassName),
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
  activateExam: (Id) => ipcRenderer.invoke('activate-exam',Id),
  //getPeriodicMaxmarks: (YearId) => ipcRenderer.invoke('get-periodic-max-marks',YearId),

  getExamByType: (examType, YearId) => ipcRenderer.invoke('get-exam-by-type', examType, YearId), 
  
  //Signatories for Report Print out.
  getSignatories: () => ipcRenderer.invoke('get-signatories'),
  getHeadSignatory: () => ipcRenderer.invoke('get-head-signatory'),
  insertSignatory: (data) => ipcRenderer.invoke('insert-signatory', data),
  updateSignatory: (id, data) => ipcRenderer.invoke('update-signatory', id, data),
  deleteSignatory: (id) => ipcRenderer.invoke('delete-signatory', id),

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
  getSubjectsByClassId:(ClassId, category) => ipcRenderer.invoke('get-subjects-by-classId', ClassId, category),
    
  // Window Management
  openNewAdmissionWindow: () => ipcRenderer.send('open-new-admission-window'),
  openEditStudentWindow: (studentId) => ipcRenderer.send('open-edit-student-window', studentId),
     
  // Error handling
  onError: (callback) => ipcRenderer.on('error', callback),

  getStudentsByClassAndSection: (data) => ipcRenderer.invoke('get-students-by-class-and-section', data),
  getMarksByExamSubject: (params) => ipcRenderer.invoke('get-marks-by-exam-subject', params),
  
  saveMarks: ({marksData, subjectData}) => ipcRenderer.invoke('save-marks', {marksData, subjectData}),
  saveCoScholasticMarks: (data) => ipcRenderer.invoke('save-coscholastic-marks', data),
  //getCoScholastics: () => ipcRenderer.invoke('get-coscholastic'),
  getMarksByClassSection: (payload) => ipcRenderer.invoke('get-marks-by-class-section', payload),
  getCoScholasticMarks: (params) => ipcRenderer.invoke('get-coscholastic-marks', params), 
  getCoScholasticMarksByStudentId: (examId, studentId) => ipcRenderer.invoke('get-coscholastic-marks-by-student', examId, studentId),
 

  getActiveExamByType: (examType, YearId) => ipcRenderer.invoke('get-active-exam-by-type', examType, YearId),             //New
  getMarksByClassSectionExams: (data) => ipcRenderer.invoke('get-marks-by-class-section-exams', data),

  //Next Features
  //getClassSectionStats: (data) => ipcRenderer.invoke('get-stats', data),     

  // For the result creation page
  calculateTotalMarks: (data) => ipcRenderer.invoke('calculate-total-marks', data),
  generateResults: (data) => ipcRenderer.invoke('generate-results', data),

  // Utility functions
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),

  // Student management
  getAllStudents: () => ipcRenderer.invoke('get-all-students'),
  getStudentsByClassSectionsId: (params) => ipcRenderer.invoke('get-students-by-class-sectionsId', params),
  searchAllStudents: (query) => ipcRenderer.invoke('search-all-students', query),
  searchStudents: (query) => ipcRenderer.invoke('search-students', query),
  getStudentDetails: (studentId, YearId) => ipcRenderer.invoke('get-student-details', studentId, YearId),
  updateStudent: (studentData) => ipcRenderer.invoke('update-student', studentData),
  deleteStudent: (studentId) => ipcRenderer.invoke('delete-student', studentId),
  promoteStudent: (studentData) => ipcRenderer.invoke('promote-student', studentData),
  updateAdmission:(payload)=> ipcRenderer.invoke('update-admission', payload),

  //for current Year Admission
  //getStudentDetails: (studentId) => ipcRenderer.invoke('get-student-details', studentId),

  getStudentAdmissionDetails: (studentId, YearId) => ipcRenderer.invoke('get-admission-details', studentId, YearId),
  getPreviousAdmission: (studentId, YearId) => ipcRenderer.invoke('get-previous-admission', studentId, YearId),

  getmarkEntryStatus: (examId) => ipcRenderer.invoke('get-mark-entry-status', examId),

   getExamStatus: (data) => ipcRenderer.invoke('get-exam-status', data),
   getPublishStatus: (yearId) =>ipcRenderer.invoke('get-publish-status', yearId),
      
  //getClassesForExam: (data) => ipcRenderer.invoke('get-classes-for-exam', data),
  calculateClassMarks: (data) => ipcRenderer.invoke('calculate-class-marks', data),
  getCalculatedMarks: (data) => ipcRenderer.invoke('get-calculated-marks', data),
  
  // For result generation
  generateResults: (data) => ipcRenderer.invoke('generate-results', data), 
  
  // For viewing results
  verifyResultStatus: (data) => ipcRenderer.invoke('verify-result-status', data),
  //verifyResults: (data) => ipcRenderer.invoke('verify-results', data),

  getSectionResults: (data) => ipcRenderer.invoke('get-section-results', data),
  getResultSummary: (data) => ipcRenderer.invoke('get-result-summary', data),  
 

  getStudentReportCard: (params) => ipcRenderer.invoke('get-student-report-card', params),

  getMarksByExamSubject: (params) => ipcRenderer.invoke('get-marks-by-exam-subject', params),
  publishResults: (params) => ipcRenderer.invoke('publish-results', params),
  unpublishResults: (params) => ipcRenderer.invoke('unpublish-results', params),

  generateReportCard:(params) => ipcRenderer.invoke('generate-report-card', params),
  getReportCard: (params) => ipcRenderer.invoke('get-report-card', params),
  getFinalReportCard: (params) => ipcRenderer.invoke('get-final-report-card', params),
  getNoOfStudents: (params) => ipcRenderer.invoke('get-no-of-students', params),

  getHeadSignatory:() => ipcRenderer.invoke('get-head-signatory'),
  getTeacherSignatory:(params) => ipcRenderer.invoke('get-teacher-signatory', params),
    
});

