import { createRouter, createWebHashHistory } from 'vue-router'
import { ROLES } from '@/constants/roles.cjs'

const routes = [
  {
    path: '/login',
    component: () => import('@/components/LoginPage.vue'),
    meta: { requiresUnauth: true }
  },
  {
    path: '/logout',
    component: () => import('@/components/LogoutPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/home', 
    component: () => import('@/views/home.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/students/new', 
    component: () => import('@/views/Students/studentEntry.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/students/re',
    component: () => import('@/views/Students/existingStudents.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/students/tr',
    component: () => import('@/views/Students/transfer.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
  {
    path: '/admission/success',  
    component: () => import('@/views/Students/AdmissionSuccess.vue'),
    props: true
  },

  // Management Routes
  {
    path: '/manage/student',
    component: () => import('@/views/Manage/studentsManagement.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/academic-year/create',
    component: () => import('@/views/Manage/academicYears.vue'),
    meta: { allowedRoles: [ROLES.ADMIN] }
  },
  {
    path: '/exam/create',
    component: () => import('@/views/Manage/activeExams.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
  {
    path: '/result-criteria/set',
    component: () => import('@/views/Manage/resultCriteria.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/class-subject/mapping',
    component: () => import('@/views/Manage/mapClassSubject.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
  {
    path: '/class-section/mapping',
    component: () => import('@/views/Manage/mapClassSection.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },

  // Result
  {
    path: '/result/create',
    component: () => import('@/views/Results/createResults.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
  
  {
    path: '/result/summary',
    component: () => import('@/views/Results/resultsSummary.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/result/section',
    component: () => import('@/views/Results/sectionResults.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/result/report-card/halfyearly',
    component: () => import('@/views/Results/halfYearReportCard.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/result/report-card/final',
    component: () => import('@/views/Results/finalReportCard.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },

  // Marks
  {
    path: '/marks/view',
    component: () => import('@/views/Marks/MarksView.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },
  {
    path: '/marks/marks-entry',
    component: () => import('@/views/Marks/marksEntry.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },

  // Masters
  {
    path: '/class/master',
    component: () => import('@/views/Master/MasterClass.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
  {
    path: '/section/master',
    component: () => import('@/views/Master/MasterSection.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
  {
    path: '/subject/master',
    component: () => import('@/views/Master/MasterSubject.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
  {
    path: '/exam/master',
    component: () => import('@/views/Master/MasterExam.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
  {
    path: '/signatories/master',
    component: () => import('@/views/Master/MasterSignatories.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.DEO] }
  },

  //Export and import
 {
    path: '/export',
    component: () => import('@/views/Exports/export.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
  {
    path: '/import',
    component: () => import('@/views/Exports/import.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.TEACHER] }
  },
 

  // Users
  {
    path: '/users/create',
    component: () => import('@/views/users/CreateUser.vue'),
    meta: { allowedRoles: [ROLES.ADMIN] }
  },
  {
    path: '/users/changepassword',
    component: () => import('@/views/users/ChangePassword.vue'),
    meta: { allowedRoles: [ROLES.ADMIN, ROLES.DEO, ROLES.TEACHER] }
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Global navigation guard
router.beforeEach(async (to, from, next) => {
  if (to.matched.some(r => r.meta.requiresAuth)) {
    const isAuthenticated = await window.electronAuth.isAuthenticated()
    const user = await window.electronAuth.getCurrentUser()

    if (!isAuthenticated || !user) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }

    if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(user.role)) {
      return next({ path: '/unauthorized' })
    }
  }

  next()
})

export default router
