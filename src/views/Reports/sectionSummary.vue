<template>
  <div class="form-container full mt-5">
   <div v-if="resultPublished"> 
    <div class="has-text-centered mb-4">
      <h1 class="title is-4">{{ resultName }} - Summary</h1>        
    </div>

    <!-- Class and Section Selection -->
      <div class="form-container single">
        <div class="columns is-vcentered">
          <div class="column">
            <div class="field">
              <label class="label">Class</label>
              <div class="select is-fullwidth">
                <select v-model="selectedClassId" @change="fetchSections">
                  <option disabled value="">-- Select Class --</option>
                  <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                    {{ cls.ClassName }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div class="column">
            <div class="field">
              <label class="label">Section</label>
              <div class="select is-fullwidth">
                <select v-model="selectedSectionId" :disabled="!selectedClassId || sections.length === 0">
                  <option disabled value="">-- Select Section --</option>
                  <option v-for="sec in sections" :key="sec.Id" :value="sec.Id">
                    {{ sec.SectionName }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="has-text-centered mt-4">
        <progress class="progress is-medium is-primary" max="100"></progress>
        <p>Loading results details...</p>
      </div>

      <!-- Result Display -->
      <div v-if="(!isLoading && selectedClassId && selectedSectionId === 0) || 
      (!isLoading && selectedClassId && selectedSectionId)" class="result-container">
          
          <!-- Detailed Results Table -->
          <div class="box ">
            <div class="buttons is-centered">
              <button class="button is-primary" @click="downloadPDF">
                <span class="icon is-small">
                  <i class="fas fa-file-pdf"></i>
                </span>
                <span>Download PDF</span>
              </button>
            </div>
            <div class="table-container print-page">
              <div class="level">
                <!-- Centered heading -->
                <div class="level-item has-text-centered">
                  <h2 class="title is-4"> Results Summary for Class {{ className }} ({{ sectionName }})</h2>
                </div>
              </div>
              <table class="table is-fullwidth is-bordered ">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th style="width: 300px;">Name</th>
                    <th style="width: 100px;">Exams</th>
                    <th v-for="subject in subjects" :key="subject.Id">
                      {{ subject.SubjectName }}
                    </th>
                    <th>Total</th>
                    <th>%</th>
                    <th>Div</th>
                    <th>Pos</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="student in studentMarks" :key="student.Id">
                    <tr v-for="(exam, examIndex) in ['Periodic', 'Half Yearly', 'Total']" :key="examIndex">
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.RollNo }}</td>
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.Name }}</td>
                      <td>{{ exam }}</td>
                      <td v-for="subject in subjects" :key="subject.Id" class="smaller-cell">
                        <span v-if="student.marks[subject.Id]">
                          {{ student.marks[subject.Id][examNames[exam]] }}
                        </span>
                        <span v-else>-</span>
                      </td>
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.totalMarks || '-' }}</td>
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.Percentage || '-' }}</td>
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.Division || '-' }}</td>
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.Position || '-' }}</td>
                      <td v-if="examIndex === 0" :rowspan="3">{{ student.Result || '-' }}</td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>  
          
            <div class="buttons is-centered">
              <button class="button is-primary" @click="downloadPDF">
                <span class="icon is-small">
                  <i class="fas fa-file-pdf"></i>
                </span>
                <span>Download PDF</span>
              </button>
            </div>
          </div>  
               
      </div>
          
     

   </div>
  
  <div v-else class="notification is-danger">
    <button class="delete" @click="closeNotification"></button>
    <strong>Result Summary is not available:</strong> Result not Published.
  </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'
import html2pdf from 'html2pdf.js'

const { PassingPercentage, loadActiveExam } = useActiveExam()
const { CurrentYearId, CurrentYear } = useAcademicYear()

const resultPublished = ref(false) 
const publishDate = ref('')

const route = useRoute()
const userRole = ref('')
const isLoading = ref(false)

const examType= ref('terminal')
const currentExamId = ref('')
const currentExamName = ref('')
const subjects = ref([])
const classes = ref([])
const sections = ref([])
const selectedClassId = ref('')
const selectedSectionId = ref('')

const results = ref([])
const resultName = ref('')

const students = ref([])
const marks = ref([])

const studentMarks = ref([])

const examNames = {
  'Periodic': 'periodic',
  'Half Yearly': 'terminal',
  'Total': 'total'
}

const currentDate = ref(new Date().toLocaleDateString('en-IN', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
}))

watch(() => route.query.type, (newType) => {
  examType.value = newType
  getExam()
  switch (newType) {
    case 'terminal':
      resultName.value = 'Half Yearly Results'
      break
    case 'annual':
      resultName.value = 'Final Results'
      break
    case 'selection':
      resultName.value = 'Class X Selection Test Results'
      break    
  }
}, { immediate: true })

async function getExam() {
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  currentExamId.value = result.exam.Id
  currentExamName.value = result.exam.ExamName
  console.log("Current Exam:", currentExamName.value, currentExamId.value)
}

const className = computed(() => {
  const selectedClass = classes.value.find(cls => cls.Id === selectedClassId.value)
  return selectedClass ? selectedClass.ClassName : ''
})

const sectionName = computed(() => {
  const selectedSection = sections.value.find(sec => sec.Id === selectedSectionId.value)
  return selectedSection ? selectedSection.SectionName : ''
})

//Check Result Published or not
async function checkPublishStatus() {
  try {  
    const status = await window.electronAPI.getPublishStatus({
      academicYearId: CurrentYearId.value,
      activeExamId: currentExamId.value      
    })   
    publishDate.value = status.publishDate || ''

    //console.log("Publish Date:", publishDate.value)

    if(publishDate.value !== '') {
      resultPublished.value = true
    }
    else {
      resultPublished.value = false 
    }
  } catch (error) {
    console.error("Error checking publish status:", error)    
  }
}

async function getUser() {
  const user = await window.electronAuth.getCurrentUser()
  if (user) {    
    userRole.value = user.role
  }
}
const canAccess = (requiredRoles) => {
  return requiredRoles.includes(userRole.value)
}

onMounted(async () => {
  await getUser()
  await fetchClasses()
  await getExam()  
  await checkPublishStatus()
})

async function fetchClasses() {
  try {
    const response = await window.electronAPI.getClasses()
    if (response.success) {
      classes.value = response.classes
    }
  
  } catch (error) {
    console.error('Error fetching classes:', error)
  }
}

watch(selectedClassId, async (newClassId) => {
  if (newClassId) {
    await fetchSections()
    if (sections.value.length < 2) {
      selectedSectionId.value = 0
      await fetchSubjects()    
      await fetchResultsSummary()

    }
  } else {
    sections.value = []
    selectedSectionId.value = ''
    results.value = []
  }
})
watch(selectedSectionId, async (newSectionId) => {
  if (newSectionId) {
    await fetchResultsSummary()
    await fetchSubjects()   
  }
})
async function fetchSections() {
  try {
    sections.value = []
    selectedSectionId.value = ''
    results.value = []   
    const response = await window.electronAPI.getSectionsByClassId(selectedClassId.value)
    if (response.success) {
      sections.value = response.sections
      console.log("Test2")
      
      if (sections.value.length === 0) {  
        selectedSectionId.value = 0
      }
    }
    
  } catch (error) {
    console.error('Error fetching sections:', error)
  }
}

async function fetchSubjects() {
  try {
    const response = await window.electronAPI.getSubjectsByClassIdforSummary(selectedClassId.value)
    if (response.success) {
      subjects.value = response.subjects 
      console.log("Subjects:", subjects.value)
    }
    
  } catch (error) {
    console.error('Error fetching subjects:', error)
  }
}

async function fetchResultsSummary() { 
  
  //isLoading.value = true
  try {
    const response = await window.electronAPI.getSectionResultsSummary({
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value,
      examId: currentExamId.value,
      academicYearId: CurrentYearId.value      
    })
    if (response.success) {
      students.value = response.students,
      marks.value = response.marks    
      studentMarks.value = response.studentMarks      
    } else {
      results.value = []
      showError(response.message || 'Failed to fetch results summary.')
    }
  } catch (error) {
    console.error('Error fetching results summary:', error)
    results.value = []
     } finally {
    isLoading.value = false
  }
}


function downloadPDF() {
  const element = document.querySelector('.print-page') // or any specific container you want
  const opt = {
    margin: 0.05,
    filename: `Section_Summary_${className.value}_${sectionName.value.trim()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF:{ unit: 'in', format: 'a4', orientation: 'landscape' },
    //pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  }

  html2pdf().set(opt).from(element).save()
}

function DisplayDate(dateString) {
  if (!dateString) return ''; // handles null, undefined, empty

  const d = new Date(dateString);
  if (isNaN(d.getTime())) {
    return ''; // invalid date string
  }

  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-IN', options);
}

function showError(message) {
  window.electronAPI.showErrorDialog(`Error: ${message}`)
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