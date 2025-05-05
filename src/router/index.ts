import { createRouter, createWebHashHistory } from 'vue-router'
import LandingPage from '../views/index.vue'
import NewAdmission from '../views/Admission/new-admission.vue'
import ReAdmission from '../views/Admission/re-admission.vue'
import Transfer from '../views/Admission/transfer.vue'
import ManageStudent from '../views/Manage/students.vue'
import AcademicYear from '../views/Manage/academic-year.vue'
import CreateExam from '../views/Manage/createExams.vue'
import Result from '../views/Results/createResults.vue'
import resultCriteria from '../views/Manage/resultCriteria.vue'
import Report from '../views/Results/reportCard.vue'
import marksEntry from '@/views/Marks/marksEntry.vue'
import marksViewEdit from '../views/Marks/marksViewEdit.vue'
import ClassSubjectMapping from '../views/Manage/mapClassSubject.vue'
import ClassSectionMapping from '../views/Manage/mapClassSection.vue'
import MasterClass from '../views/Master/MasterClass.vue'
import MasterSection from '../views/Master/MasterSection.vue'
import MasterSubject from '../views/Master/MasterSubject.vue'
import MasterExam from '../views/Master/MasterExam.vue'
import AdmissionSuccess from '../views/Admission/AdmissionSuccess.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage
  },
  {
    path: '/class-subject/mapping',
    name: 'ClassSubjectMapping',
    component: ClassSubjectMapping
  },
  {
    path: '/class-section/mapping',
    name: 'ClassSectionMapping',
    component: ClassSectionMapping
  },
  {
    path: '/admission/new',
    name: 'NewAdmission',
    component: NewAdmission
  },
  {
    path: '/admission/re',
    name: 'ReAdmission',
    component: ReAdmission
  },
  {
    path: '/admission/tr',
    name: 'Transfer',
    component: Transfer
  },
  {
    path: '/manage/student',
    name: 'ManageStudent',
    component: ManageStudent,
  },
  {
    path: '/exam/create',
    name: 'CreateExam',
    component: CreateExam
  },
  {
    path: '/academic-year/create',
    name: 'AcademicYear',
    component: AcademicYear
  },
  
  {
    path: '/result/create',
    name: 'Result',
    component: Result
  },
  {
    path: '/result-criteria/set',
    name: 'resultCriteria',
    component: resultCriteria
  },
  {
    path: '/result/report-card',
    name: 'Report',
    component: Report
  },
  {
    path: '/marks/view-edit-marks',
    name: 'marksViewEdit',
    component: marksViewEdit
  },
 
  {
    path: '/marks/student-marks-entry',
    name: 'marksEntry',
    component: marksEntry
  },
  {
    path: '/class/master',
    name: 'MasterClass',
    component: MasterClass
  },
  {
    path: '/section/master',
    name: 'MasterSection',
    component: MasterSection
  },
  {
    path: '/subject/master',
    name: 'MasterSubject',
    component: MasterSubject
  },
  {
    path: '/exam/master',
    name: 'MasterExam',
    component: MasterExam
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

export default router
