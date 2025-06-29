import { createRouter, createWebHashHistory } from 'vue-router'

import { ROLES } from '@/constants/roles.cjs'
import LoginPage from '../components/LoginPage.vue'
import LogoutPage from '../components/LogoutPage.vue'

import LandingPage from '../views/home.vue'
import NewStudent from '../views/Students/studentEntry.vue'
import ExistingStudent from '../views/Students/existingStudents.vue'
import Transfer from '../views/Students/transfer.vue'
import ManageStudent from '../views/Manage/studentsManagement.vue'
import AcademicYear from '../views/Manage/academicYears.vue'
import CreateExam from '../views/Manage/activeExams.vue'
import Result from '../views/Results/createResults.vue'
//import FinalResult from '../views/Results/createFinalResults.vue'
import ResultSummary from '../views/Results/resultsSummary.vue'
import MarksView from '../views/Marks/MarksView.vue'

import ClassSubjectMapping from '../views/Manage/mapClassSubject.vue'
import ClassSectionMapping from '../views/Manage/mapClassSection.vue'
import MasterClass from '../views/Master/MasterClass.vue'
import MasterSection from '../views/Master/MasterSection.vue'
import MasterSubject from '../views/Master/MasterSubject.vue'
import MasterExam from '../views/Master/MasterExam.vue'
import MasterSignatories from '../views/Master/MasterSignatories.vue'
import AdmissionSuccess from '../views/Students/AdmissionSuccess.vue'

import SectionResult from '../views/Results/sectionResults.vue'
import resultCriteria from '../views/Manage/resultCriteria.vue'
import HyReport from '../views/Results/halfYearReportCard.vue'
import FinalReport from '../views/Results/finalReportCard.vue'
import MarksEntry from '../views/Marks/marksEntry.vue'
import NewUser from '../views/users/CreateUser.vue'
import ChangePassword from '../views/users/ChangePassword.vue'

const routes = [
  // router.js
{
  path:'/users/create',  
  component: NewUser,
  meta: { allowedRoles: [ROLES.ADMIN] }
}, 
{
  path:'/users/changepassword',  
  component: ChangePassword,
  meta: { allowedRoles: [ROLES.ADMIN, ROLES.DEO, ROLES.TEACHER] }
},
{
  path: '/login',
  component: LoginPage,
  meta: { requiresUnauth: true } // Only accessible when logged out
},
{
  path: '/logout',
  component: LogoutPage,
  meta: { requiresAuth: true } // Only accessible when logged in
},
  {
    path: '/home',
    name: 'Landing',
    component: LandingPage,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/class-subject/mapping',
    name: 'ClassSubjectMapping',
    component: ClassSubjectMapping,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.DEO] }
  },
  {
    path: '/class-section/mapping',
    name: 'ClassSectionMapping',
    component: ClassSectionMapping,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.DEO] }
  },
  {
    path: '/students/new',
    name: 'NewStudent',
    component: NewStudent,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/students/re',
    name: 'ExistingStudent',
    component: ExistingStudent,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/students/tr',
    name: 'Transfer',
    component: Transfer,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/manage/student',
    name: 'ManageStudent',
    component: ManageStudent,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/exam/create',
    name: 'CreateExam',
    component: CreateExam,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/academic-year/create',
    name: 'AcademicYear',
    component: AcademicYear,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.DEO] }
  },
  
  {
    path: '/result/create',
    name: 'Result',
    component: Result,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
 
  {
    path: '/result/summary',
    name: 'ResultSummary',
    component: ResultSummary,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
  {
    path: '/result/section',
    name: 'SectionResult',
    component: SectionResult,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/result-criteria/set',
    name: 'resultCriteria',
    component: resultCriteria,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/result/report-card/halfyearly',
    name: 'HyReport',
    component: HyReport,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
  {
    path: '/result/report-card/final',
    name: 'FinalReport',
    component: FinalReport,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
  {
    path: '/marks/view',
    name: 'MarksView',
    component: MarksView,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
 
  {
    path: '/marks/marks-entry',
    name: 'MarksEntry',
    component: MarksEntry,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },

  {
    path: '/class/master',
    name: 'MasterClass',
    component: MasterClass,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.DEO] }
  },
  {
    path: '/section/master',
    name: 'MasterSection',
    component: MasterSection,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.DEO] }
  },
  {
    path: '/subject/master',
    name: 'MasterSubject',
    component: MasterSubject,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.DEO] }
  },
  {
    path: '/exam/master',
    name: 'MasterExam',
    component: MasterExam,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.DEO] }
  },
  {
    path: '/signatories/master',
    name: 'MasterSignatories',
    component: MasterSignatories,
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.DEO] }
  },
  {
    path: '/admission/success',
    name: 'admission-success',
    component: AdmissionSuccess,
    props: true // This allows passing route params as props
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

/// src/router/index.js
router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const isAuthenticated = await window.electronAuth.isAuthenticated()
    const currentUser = await window.electronAuth.getCurrentUser()
    
    if (!isAuthenticated || !currentUser) {
      // Not authenticated - redirect to login
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
    
    // Check if route has role restrictions
    if (to.matched.some(record => record.meta.allowedRoles)) {
      const userRole = currentUser.role
      const allowedRoles = to.meta.allowedRoles
      
      if (!allowedRoles.includes(userRole)) {
        // User doesn't have required role
        return next({ path: '/unauthorized' })
      }
    }
  }
  
  next()
})

export default router
