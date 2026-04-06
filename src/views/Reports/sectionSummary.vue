<template>
  <div class="form-container full mt-5 mb-1">
    <div v-if="isPublished" class="no-print">
      <div class="has-text-centered mb-2">
        <h1 class="title is-4 mb-1"> Section Summary - {{ resultName }}</h1>
        <h2 class="title is-4 mt-1 mb-1">({{ CurrentYear }})</h2>
      </div>

      <div class="form-container single mt-5">
        <div class="columns is-vcentered">
          <div class="column">
            <div class="field">
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

      <div v-if="isLoading" class="has-text-centered mt-4 no-print">
        <progress class="progress is-medium is-primary" max="100"></progress>
        <p>Loading results details...</p>
      </div>

      <div v-if="!isLoading && hasSelection" class="result-container no-print" >
        <div class="box">
          <div class="has-text-centered is-flex is-flex-direction-column is-align-items-center">
            <h2 class="title is-4 mb-2">{{ resultName }} Summary</h2>
            <h2 class="title is-4 mb-1">Class {{ className }} <span v-if="sectionName">({{ sectionName }})</span></h2>
            <p class="mb-1">(Screen View - Page {{ currentPage }} of {{ totalPages }})</p>
          </div>

          <table class="table is-fullwidth is-bordered is-narrow">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Name</th>
                <th>Exams</th>
                <th v-for="subject in subjects" :key="subject.Id">{{ subject.SubjectName }}</th>
                <th>Total</th>
                <th>%</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="student in paginatedStudents" :key="student.StudentId || student.Id">
                <tr v-for="(exam, examIndex) in examOrder" :key="examIndex">
                  <td v-if="examIndex === 0" :rowspan="3">{{ student.RollNo }}</td>
                  <td v-if="examIndex === 0" :rowspan="3">{{ student.Name }}</td>
                  <td>{{ exam }}</td>
                  <td v-for="subject in subjects" :key="subject.Id">
                    {{ student.marks?.[subject.Id]?.[examKey(exam)] ?? '-' }}
                  </td>
                  <td v-if="examIndex === 0" :rowspan="3">{{ student.totalMarks ?? '-' }}</td>
                  <td v-if="examIndex === 0" :rowspan="3">{{ student.Percentage ?? '-' }}</td>
                  <td v-if="examIndex === 0" :rowspan="3">{{ student.Result ?? '-' }}</td>
                </tr>
              </template>
            </tbody>
          </table>

          <nav class="pagination is-centered" role="navigation">
            <button class="pagination-previous" :disabled="currentPage === 1" @click="currentPage--">Previous</button>
            <button class="pagination-next" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
          </nav>

          <div class="buttons is-centered mt-3">
            <button class="button is-primary" @click="generateElectronPDF" :disabled="studentMarks.length === 0">
              <span class="icon is-small"><i class="fas fa-file-pdf"></i></span>
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>    

    <div v-else class="is-flex is-justify-content-center is-align-items-center no-print" style="height: 600px;">
      <div class="notification is-danger is-5 has-text-centered px-6 py-5">
        <strong>Result not Published: </strong> Result Summary is not available.
      </div>
    </div>
    <div id="full-export-container" class="print-only ">
      <template v-for="(group, gIdx) in studentGroups" :key="gIdx">
        <div class="print-page landscape">
          <div class="has-text-centered mb-1">
            <h1 class="title is-5 mb-1">RESULT SUMMARY - {{ resultName }} ({{ CurrentYear }}) </h1>
            <h2 class="title is-5 mb-1">Class {{ className }} <span v-if="sectionName">({{ sectionName }})</span></h2>
            <p class="is-size-7">Page {{ gIdx + 1 }} of {{ studentGroups.length }}</p>
          </div>

          <table class="table is-fullwidth is-bordered export-table">
            <thead>
              <tr>
                <th style="width: 40px;">Roll</th>
                <th style="width: 180px;">Student Name</th>
                <th style="width: 80px;">Exams</th>
                <th v-for="subject in subjects" :key="'h-'+subject.Id">{{ subject.SubjectName }}</th>
                <th>Total</th>
                <th>%</th>
                <th>Div</th>
                <th>Pos</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="student in group" :key="'st-'+student.Id">
                <tr v-for="(exam, examIndex) in examOrder" :key="examIndex">
                  <td class="smaller-cell" v-if="examIndex === 0" :rowspan="3">{{ student.RollNo }}</td>
                  <td class="smaller-cell has-text-weight-bold" v-if="examIndex === 0" :rowspan="3">{{ student.Name }}</td>
                  <td class="exam-label">{{ exam }}</td>
                  <td v-for="subject in subjects" :key="'m-'+subject.Id" class="smaller-cell">
                    {{ student.marks?.[subject.Id]?.[examKey(exam)] ?? '-' }}
                  </td>
                  <td class="smaller-cell" v-if="examIndex === 0" :rowspan="3">{{ student.totalMarks ?? '-' }}</td>
                  <td class="smaller-cell" v-if="examIndex === 0" :rowspan="3">{{ student.Percentage ?? '-' }}</td>
                  <td class="smaller-cell" v-if="examIndex === 0" :rowspan="3">{{ student.Division ?? '-' }}</td>
                  <td class="smaller-cell" v-if="examIndex === 0" :rowspan="3">{{ student.Position ?? '-' }}</td>
                  <td class="smaller-cell" v-if="examIndex === 0" :rowspan="3">{{ student.Result ?? '-' }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="page-break"></div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'
import { useCurrentExam } from '../../composables/useCurrentExam'
import { useResultStatus } from '../../composables/useResultStatus'
import { useClassesSections } from '../../composables/useClassesSections'
import { useResultNames } from '../../composables/useResultNames'

const { CurrentYearId, CurrentYear } = useAcademicYear()
const { currentExamId, currentExamName, getExamByType } = useCurrentExam()
const { isPublished, checkResultStatus } = useResultStatus()
const { classes, sections, loadClasses, loadSections } = useClassesSections()
const { resultName, setResultName } = useResultNames()

const route = useRoute()
const isLoading = ref(false)
const subjects = ref([])
const studentMarks = ref([])
const selectedClassId = ref('')
const selectedSectionId = ref('')
const examType = ref(route.query.type)
const currentPage = ref(1)
const perPage = 9

let examOrder = []
let examKeyMap = {}

function initializeExamConfig() {
  switch(examType.value) {
    case 'terminal':
      examOrder = ['Periodic', 'Half Yearly', 'Total']
      examKeyMap = { Periodic: 'periodic', 'Half Yearly': 'terminal', Total: 'total' }
      break
    case 'annual':
      examOrder = ['Periodic', 'Annual', 'Total']
      examKeyMap = { Periodic: 'periodic', 'Annual': 'terminal', Total: 'total' }
      break
    case 'final':
      examOrder = ['Periodic', 'Term', 'Total']
      examKeyMap = { Periodic: 'periodic', 'Term': 'terminal', Total: 'total' }
      break  
    case 'selection':
      examOrder = ['Internal', 'Selection Test', 'Total']
      examKeyMap = { Internal: 'periodic', 'Selection Test': 'terminal', Total: 'total' }
      break
  }
}

// Group students into 10 per page for the PDF
const studentGroups = computed(() => {
  const groups = []
  for (let i = 0; i < studentMarks.value.length; i += 10) {
    groups.push(studentMarks.value.slice(i, i + 10))
  }
  return groups
})

const hasSelection = computed(() => !!selectedClassId.value && (selectedSectionId.value !== '' && selectedSectionId.value !== null))
const className = computed(() => classes.value.find(c => c.Id === selectedClassId.value)?.ClassName ?? '')
const sectionName = computed(() => sections.value.find(s => s.Id === selectedSectionId.value)?.SectionName ?? '')
const totalPages = computed(() => Math.ceil(studentMarks.value.length / perPage))
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return studentMarks.value.slice(start, start + perPage)
})

function examKey(examLabel) { return examKeyMap[examLabel] || examLabel.toLowerCase() }

async function fetchSubjectsForClass(classId) {
  try {
    const res = await window.electronAPI.getSubjectsByClassIdforSummary(classId)
    if (res.success) subjects.value = res.subjects || []
  } catch (err) { console.error(err) }
}

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
      currentPage.value = 1
    }
  } finally { isLoading.value = false }
}

async function generateElectronPDF() {
  if (studentMarks.value.length === 0) return
  isLoading.value = true
  try {
    const fileName = `Summary_Class_${className.value}_${sectionName.value}.pdf`
    // Signal Electron Main process to print the current window
    const response = await window.electronAPI.generateSummaryPDF({ 
      fileName,
      landscape: true 
    })
    if (!response.success && response.message !== 'Save cancelled') {
      alert("Error: " + response.message)
    }
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadClasses()
  if(examType.value === 'selection'){
    classes.value = classes.value.filter(c => c.ClassName === 'X')
    selectedClassId.value = classes.value[0]?.Id || ''
  } else {
    classes.value = classes.value.filter(c => c.ClassName !== 'X')
  }
  await getExamByType(examType.value, CurrentYearId.value)
  await checkResultStatus(currentExamId.value, CurrentYearId.value)
  setResultName(examType.value)
  initializeExamConfig()
})

watch(() => selectedClassId.value, async (newVal) => {
  if (!newVal) return
  await loadSections(newVal)
  await fetchSubjectsForClass(newVal)
  if (sections.value.length === 0) selectedSectionId.value = 0
})

watch(() => selectedSectionId.value, async (newVal) => {
  if (newVal !== '' && newVal !== null) await fetchResultsSummary()
})
</script>

<style scoped>
/* Screen behavior */
.no-print { display: block; }
.print-only { display: none; 
margin-top: 0 !important;}

/* Table styling for better fit */
.table td, .table th {
  padding: 0.25rem;
  vertical-align: middle;
  font-size: 0.85rem;
}

@media print {
  /* Hide the UI, show the export container */
  .no-print { display: none !important; }
  .print-only { display: block !important; width: 100%; }

  @page {
    size: A4 landscape;
    margin: 5mm;
    margin-top: 10mm !important; /* Adjust this to control top spacing */
  }

  .landscape {
    width: 280mm; /* Fit to A4 Landscape */
    /* margin: 0 auto; */
    margin-left: -20mm;
    margin-top: 0 !important; /* Remove default top margin */
  }

  .page-break {
    page-break-after: always;
    height: 0;
  }

  .export-table {
    width: 100% !important;
    font-size: 8pt !important;
    border-collapse: collapse !important;
    table-layout: fixed; /* Prevents overflow */
  }

  .export-table th, .export-table td {
    border: 1px solid black !important;
    padding: 1px 2px !important;
    line-height: 1.1;
    overflow: hidden;
  }

  .smaller-cell { text-align: center; }
  .exam-label { font-size: 7.5pt; white-space: nowrap; }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
  }

  /* 2. Target the main wrapper of your page to remove top spacing */
  .form-container.full, 
  .mt-5 {
    margin-top: 0 !important;
    padding-top: 0 !important;
  }

  /* 3. Ensure the Print-Only container starts exactly at the top of the page */
  #full-export-container {
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* 4. This is the container for EACH page (the 10-student block) */
  .landscape-layout {
    width: 297mm;
    height: 210mm;
    /* ADJUST THIS: This controls the gap on EVERY page */
    padding-top: 10mm !important; 
    padding-left: 10mm !important;
    padding-right: 10mm !important;
    box-sizing: border-box;
    page-break-after: always;
  }

  /* 5. Clean up the header to ensure no extra bottom margin pushes the table down */
  .export-header {
    margin-top: 0 !important;
    margin-bottom: 10px !important;
  }
}
</style>