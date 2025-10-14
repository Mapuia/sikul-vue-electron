<template>
  <div class="form-container full mt-5 mb-1">
    <div v-if="isPublished">
      <div class="has-text-centered mb-2">
        <h1 class="title is-4 mb-1">Section Summary - {{ resultName }}</h1>
        <h2 class="title is-4 mt-1 mb-1">({{ CurrentYear }})</h2>
      </div>

      <!-- Filters: Class / Section -->
      <div class="form-container single ">
        <div class="columns is-vcentered">
          <div class="column">
            <div class="field">
              <!-- <label class="label">Class</label> -->
              <div class="select is-fullwidth">
                <select v-model="selectedClassId">
                  <option disabled value="">-- Select Class --</option>
                  <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                    {{ cls.ClassName }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="selectedClassId" class="column">
            <div class="field">
              <!-- <label class="label">Section</label> -->
              <div class="select is-fullwidth">
                <select v-model="selectedSectionId" :disabled="!selectedClassId || sections.length === 0">
                  <option disabled value="">-- Select Section --</option>
                  <option v-for="sec in sections" :key="sec.Id" :value="sec.Id">
                    {{ sec.SectionName }}
                  </option>
                  <option v-if="sections.length === 0" :value="0">No section</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

        <!-- Loading -->
        <div v-if="isLoading" class="has-text-centered mt-4">
          <progress class="progress is-medium is-primary" max="100"></progress>
          <p>Loading results details...</p>
        </div>

        <!-- Results -->
        <div v-if="!isLoading && hasSelection" class="result-container">
          <div class="box">
            <!-- <div class="buttons is-centered mb-3">
              <button class="button is-primary" @click="downloadPDF">
                <span class="icon is-small"><i class="fas fa-file-pdf"></i></span>
                <span>Download PDF</span>
              </button>
            </div> -->

            <div class="table-container print-page">
              <div class="has-text-centered is-flex is-flex-direction-column is-align-items-center">
                <h2 class="title is-4 mb-2">{{ resultName }} Summary</h2>
                <h2 class="title is-4 mb-1">
                  Class {{ className }}
                  <span v-if="sectionName">({{ sectionName }})</span>
                </h2>
                <p>(Page - {{ currentPage }})</p>
              </div>


              <table class="table is-fullwidth is-bordered">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th style="width: 200px;">Name</th>
                    <th style="width: 100px;">Exams</th>
                    <th v-for="subject in subjects" :key="subject.Id">{{ subject.SubjectName }}</th>
                    <th>Total</th>
                    <th>%</th>
                    <th>Div</th>
                    <th>Pos</th>
                    <th>Result</th>
                  </tr>
                </thead>

                <tbody>
                  <template v-for="student in paginatedStudents" :key="student.StudentId || student.Id">
                    <tr v-for="(exam, examIndex) in examOrder" :key="exam + '-' + (student.StudentId || student.Id) + '-' + examIndex">
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.RollNo }}</td>
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.Name }}</td>

                      <td>{{ exam }}</td>

                      <td v-for="subject in subjects" :key="subject.Id" class="smaller-cell">
                        <span v-if="student.marks && student.marks[subject.Id]">
                          {{ student.marks[subject.Id][examKey(exam)] ?? '-' }}
                        </span>
                        <span v-else>-</span>
                      </td>

                      <td v-if="examIndex === 0" :rowspan="3">{{ student.totalMarks ?? '-' }}</td>
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.Percentage ?? '-' }}</td>
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.Division ?? '-' }}</td>
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.Position ?? '-' }}</td>
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.Result ?? '-' }}</td>
                    </tr>
                  </template>

                  <tr v-if="!studentMarks || studentMarks.length === 0">
                    <td :colspan="4 + subjects.length" class="has-text-centered">No students found.</td>
                  </tr>
                </tbody>

              </table>
            </div>

            <nav class="box pagination is-centered" role="navigation" aria-label="pagination">
              <button class="pagination-previous" :disabled="currentPage === 1" @click="prevPage">Previous</button>
              <button class="pagination-next" :disabled="currentPage === totalPages" @click="nextPage">Next</button>

              <ul class="pagination-list">
                <li><span class="pagination-link is-current">{{ currentPage }}</span></li>
                <li><span>of {{ totalPages }}</span></li>
              </ul>
            </nav>


            <div class="buttons is-centered mt-3">
              <button class="button is-primary" @click="downloadPDF">
                <span class="icon is-small"><i class="fas fa-file-pdf"></i></span>
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      
    </div> 
    <!--Enf of ispublished-->

   <div v-else class="is-flex is-justify-content-center is-align-items-center" style="height: 600px;">
      <div class="notification is-danger is-5 has-text-centered px-6 py-5">
        <h2 class="subtitle is-5 mb-0"><strong>Result not Published: </strong> Result Summary is not available.</h2>
      </div>
    </div>
    <!-- <div v-else class="notification is-danger">
      <button class="delete" @click="closeNotification"></button>
      <strong>Result Summary is not available:</strong> Result not Published.
    </div> -->
  </div>
  <!-- End of the MAIN form-container -->
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'
import { useCurrentExam } from '../../composables/useCurrentExam'
const { currentExamId, currentExamName, getExamByType } = useCurrentExam()
import { useResultStatus } from '../../composables/useResultStatus'
const { isPublished, publishDate, checkResultStatus } = useResultStatus()
import { useClassesSections } from '../../composables/useClassesSections'
const { classes, sections, loadClasses, loadSections } = useClassesSections()
// import { useResultNames } from '../../composables/useResultNames'
// const { resultName, setResultName } = useResultNames()
// import { useSubjectsForClass } from '../../composables/useSubjectsForClass'
// const { subjects, loadSubjectsForClass } = useSubjectsForClass()
import html2pdf from 'html2pdf.js'

// --- state ---
const route = useRoute()
const { CurrentYearId, CurrentYear } = useAcademicYear()
const { loadActiveExam } = useActiveExam()

// const resultPublished = ref(false)
// const publishDate = ref('')
const isLoading = ref(false)

// const classes = ref([])
// const sections = ref([])
const subjects = ref([])
const studentMarks = ref([])

const selectedClassId = ref('')
const selectedSectionId = ref('')

const examType = ref(route.query.type)
console.log('Exam Type:', examType.value)
console.log('Current Exam ID:', currentExamId.value)
console.log('Current Exam Name:', currentExamName.value)
console.log('Academic Year ID:', CurrentYearId.value)
//const currentExamId = ref('')
//const currentExamName = ref('')
const resultName = ref('')

const examOrder = ['Periodic', 'Half Yearly', 'Total']
const examKeyMap = { Periodic: 'periodic', 'Half Yearly': 'terminal', Total: 'total' }

// --- computed ---
const hasSelection = computed(() => !!selectedClassId.value && (selectedSectionId.value !== '' && selectedSectionId.value !== null))
const className = computed(() => classes.value.find(c => c.Id === selectedClassId.value)?.ClassName ?? '')
const sectionName = computed(() => sections.value.find(s => s.Id === selectedSectionId.value)?.SectionName ?? '')

// --- helpers ---
function examKey(examLabel) { return examKeyMap[examLabel] || examLabel.toLowerCase() }

function DisplayDate(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function showError(message) {
  window.electronAPI.showErrorDialog(`Error: ${message}`)
}

// --- API calls ---
// async function fetchClasses() {
//   try {
//     const res = await window.electronAPI.getClasses()
//     if (res.success) classes.value = res.classes || []
//   } catch (err) { console.error('fetchClasses', err) }
// }

// async function fetchSectionsForClass(classId) {
//   try {
//     const response = await window.electronAPI.getSectionsByClassId(classId)
//     if (response.success) {
//       sections.value = response.sections || []
//       if (sections.value.length === 0) selectedSectionId.value = 0
//     }
//   } catch (err) { console.error('fetchSectionsForClass', err) }
// }

async function fetchSubjectsForClass(classId) {
  try {
    const res = await window.electronAPI.getSubjectsByClassIdforSummary(classId)
    if (res.success) subjects.value = res.subjects || []
  } catch (err) { console.error('fetchSubjectsForClass', err) }
}

// --- Pagination ---
const currentPage = ref(1)
const perPage = 10

const totalPages = computed(() => Math.ceil(studentMarks.value.length / perPage))

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * perPage
  const end = start + perPage
  return studentMarks.value.slice(start, end)
})

//Fetch Results Summary
async function fetchResultsSummary() {
  if (!selectedClassId.value) return
  isLoading.value = true
  try {    
    const params = {
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value,
      examId: currentExamId.value,
      academicYearId: CurrentYearId.value,
      examType: examType.value
    }
    const response = await window.electronAPI.getSectionResultsSummary(params)
    if (response.success) {
      studentMarks.value = response.studentMarks || []
      currentPage.value = 1 // reset to first page on new fetch
    } else {
      studentMarks.value = []
      showError(response.message || 'Failed to fetch results summary.')
    }
  } catch (err) {
    console.error('fetchResultsSummary', err)
    studentMarks.value = []
  } finally {
    isLoading.value = false
  }
}
//For Pagination
function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}
function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}


// --- user & lifecycle ---
onMounted(async () => {
  loadClasses()
  await getExamByType(examType.value, CurrentYearId.value)
  await checkResultStatus(currentExamId.value, CurrentYearId.value)
  // await setResultName(examType.value)
  //await getExam()
  //await fetchClasses()
  //await checkPublishStatus()
  //await statusMessage()
  setResultName(examType.value)
})

// async function statusMessage(){
//   if(!resultPublished.value){
//     alert('Result is not published yet, Result Summary is not available now.')
//     return
//   }  
// }
watch(() => selectedClassId.value, async (newClass) => {
  if (!newClass) {
    sections.value = []
    subjects.value = []
    studentMarks.value = []
    selectedSectionId.value = ''
    return
  }
  await loadSections(newClass)
  await fetchSubjectsForClass(newClass)
  // If there are no sections, keep sectionId = 0 (meaning 'all') and fetch
  if (sections.value.length === 0) selectedSectionId.value = 0
})

watch(() => selectedSectionId.value, async (newSection) => {
  if (newSection === '' || newSection === null) return
  await fetchResultsSummary()
})

async function setResultName(type) {
  if(type === 'terminal'){
    resultName.value = 'Half Yearly Exam'
  }
  if(type === 'annual'){
    resultName.value = 'Annual Exam'
  }
  if(type === 'final'){
    resultName.value = 'Final Result'
  }
}

watch(
  () => route.query.type,          // Watch only the 'type' query param
  async (newType, oldType) => {
    if (!newType || newType === oldType) return

    examType.value = newType
    await setResultName(examType.value)
    if(examType.value === 'terminal'){
      resultName.value = 'Half Yearly Exam'
    }
    if(examType.value === 'annual'){
      resultName.value = 'Annual Exam'
    }
    if(examType.value === 'final'){
      resultName.value = 'Final Result'
    }
    console.log('Result Name changed to:', resultName.value)
    // Re-fetch current exam info for this new type
    await getExamByType(examType.value, CurrentYearId.value)

    // Re-check publish status for the new exam
    await checkResultStatus(currentExamId.value, CurrentYearId.value)

    // If a class & section are already selected, refresh the summary
    if (selectedClassId.value && selectedSectionId.value !== '' && selectedSectionId.value !== null) {
      await fetchResultsSummary()
    }
  }
)


//NEED TO WATCH ROUTE CHANGE

// watch(route, async (newType) => {
//   // const newType = newRoute.query.type
//   examType.value = newType.query.type || ''

//   // await checkPublishStatus()
// })

function downloadPDF() {  
  const element = document.querySelector('.print-page') // or any specific container you want
  const opt = {
    margin:       0.05,
    filename:     `Section-wise_Summary_for_Class-${ className.value }_${ sectionName.value }_Page_${ currentPage.value }.pdf`,
    image:        { type: 'jpeg', quality: 1.0 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
  }

  html2pdf().set(opt).from(element).save()
}

// --- actions ---
// async function downloadPDF() {
//   if (!selectedClassId.value) return showError('Please select a class first.')

//   const params = {
//     classId: selectedClassId.value,
//     sectionId: selectedSectionId.value,
//     examId: currentExamId.value,
//     academicYearId: CurrentYearId.value
//   }

//   try {
//     const result = await window.electronAPI.exportSectionResultsSummary(params)
//     if (result.success) {
//       window.electronAPI.showInfoDialog?.(`PDF saved at ${result.filePath}`)
//     } else {
//       showError(result.message )
//     }
//   } catch (err) {
//     console.error('downloadPDF', err)
//     showError('Failed to export PDF')
//   }
// }

///--------------------------------------------------USED NO MORE--------------------------------------------------
// async function fetchResultsSummary() {
//   if (!selectedClassId.value) return
//   isLoading.value = true
//   try {
//     const params = {
//       classId: selectedClassId.value,
//       sectionId: selectedSectionId.value,
//       examId: currentExamId.value,
//       academicYearId: CurrentYearId.value
//     }
//     const response = await window.electronAPI.getSectionResultsSummary(params)
//     if (response.success) {
//       studentMarks.value = response.studentMarks || []
//     } else {
//       studentMarks.value = []
//       showError(response.message || 'Failed to fetch results summary.')
//     }
//   } catch (err) {
//     console.error('fetchResultsSummary', err)
//     studentMarks.value = []
//   } finally {
//     isLoading.value = false
//   }
// }
// const examTypeTemp = ref('')
// async function getExamByType() {
//   try {
//     if(examType.value === 'final'){
//       examTypeTemp.value = 'annual'
//     }else{
//       examTypeTemp.value = examType.value
//     }  
//     const result = await window.electronAPI.getExamByType(examTypeTemp.value, CurrentYearId.value)
//     currentExamId.value = result?.exam?.Id || ''
//     currentExamName.value = result?.exam?.ExamName || ''
//     console.log('Exam and ID', currentExamId.value)
//   } catch (err) {
//     console.error('getExamByType', err)
//   }
// }

// async function checkPublishStatus() {
//   if (!currentExamId.value) return
//   try {
//     const status = await window.electronAPI.getPublishStatus({ academicYearId: CurrentYearId.value, activeExamId: currentExamId.value })
//     publishDate.value = status?.publishDate || ''
//     resultPublished.value = !!publishDate.value
//     // console.log('Publish Status:', resultPublished.value, publishDate.value ? DisplayDate(publishDate.value) : '')
//   } catch (err) {
//     console.error('checkPublishStatus', err)
//     resultPublished.value = false
//   }
// }

function closeNotification() {
  // you can modify to change UI state or route away
  // resultPublished.value = false
}
</script>




<style scoped>

.box {
  margin-bottom: 1.5rem;
}

.print-page{
  padding: 1.5rem 2.5rem;
  background: white;
  color:black;
  margin:0;
  
}
.avoid-break {
  page-break-inside: avoid;
  break-inside: avoid;
}
.print-title{
  font-size: 14pt;
  font-family: 'Oswald';
  font-weight: 600;
}
.print-subtitle{
  font-size: 11pt;
  font-family: 'Oswald';
  font-weight: 500;
}

.smaller-header {
  font-size: 11px;
  text-align: center;
  color: black;
  
}
.smaller-cell {
  font-size: 11px;
  text-align: center;
  color: black;
}
.columns {
  color:black;
}
.print-container{
  background: white;
}
.table-container {
  margin: 0 auto;
 color:black;

}
table{
  font-size: 9pt;
  border: 1px solid black;
}

.table td{
  max-height: 5px;
  padding: 0 0.5rem;
  vertical-align: middle;
  border: 1px solid black;
}
.table th{
  font-weight: bold;
  text-align: center;
  border: 1px solid black;
}

.center{
  text-align: center;
}



@media print {
  .no-print {
    display: none !important;
  }
}

.watermark {
  position: relative;
}



</style>