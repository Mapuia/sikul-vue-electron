<template>
  <!-- <div v-if="resultPublished" class="form-container box wide"> -->
  <div class="form-container box wide">
    <div class="has-text-centered mb-4">
      <h1 class="title is-4">{{ resultName }}, {{ CurrentYear }}</h1>
      <h2 class="subtitle is-5" v-if="examType !== 'selection'">Select Class and Section</h2>
    </div>

    <div v-if="examType">
    <!-- Class and Section Selection -->
      <div class="box">
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
                <select v-model="selectedSectionId" :disabled="!selectedClassId || sections.length === 0" @change="fetchResults">
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
        <p>Loading results...</p>
      </div>

      <!-- Result Display -->
      <div v-if="results && resultSummary" class="result-container">
        <div class="level mt-4">
            <!-- Centered heading -->
            <div class="level-item has-text-left">
              <h2 class="subtitle is-5">Quick Results</h2>
            </div>
        </div>

        <!-- Detailed Results Table -->
        <div v-if=" selectedClassId && results.length > 0" class="print-container"> 
          <div class="print-page"> 
            <div class="header-wrapper has-text-centered mb-4" style="position: relative;">
            <!-- Logo (Option 1: if using public folder) -->
            <img src="/sikul_logo.png" alt="School Logo" style="position: absolute; top: 0; left: 0; height: 60px;" />
            <h1 class="result-title ">CALVARY HIGHER SECONDARY SCHOOL, TUIDU</h1>
            <h2 class="result-subtitle ">{{ resultName }} : {{ CurrentYear }}</h2>
            <h1 class="result-title "> Class {{ resultSummary.className }}{{ resultSummary.sectionName? ', Section ' + resultSummary.sectionName : '' }}</h1>
            </div>
            <div class="mt-4" v-if="results.length > 0">
            <div class="table-container">
              <table class="result-table is-fullwidth is-striped is-bordered mb-2">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Full Mark</th>
                    <th>Mark Scored</th>
                    <th>Percentage</th>
                    <th>Division</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in results" :key="result.StudentId">
                    <td style="font-weight: 700;">{{ result.Rank }}</td>
                    <td>{{ result.RollNo }}</td>
                    <td style="text-align: left; width: 250px;">{{ result.Name }}</td>
                    <td>{{ result.TotalMaxMark }}</td>
                    <td>{{ result.TotalMarksObtained }}</td>
                    <td>{{ result.Percentage }}%</td>
                    <td>{{ result.ResultStatus === 'Pass' ? result.Division : '' }}</td>
                    <td>
                      <span class="tag" :class="result.ResultStatus === 'Pass' ? 'is-success' : 'is-danger'">
                        {{ result.ResultStatus }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!--Summary-->
            <div class="columns is-vcentered" style="align-items: flex-end;">
                <!-- Column 1 -->
                <div class="column is-flex is-flex-direction-column is-justify-content-flex-end">
                  <table class="bl-table">
                    <tbody>
                      <tr>
                        <th >No. of Students</th>
                        <td>{{ resultSummary.totalStudents }}</td>
                      </tr>
                      <tr>
                        <th style="width:200px">No. of Appeared</th>
                        <td>{{ resultSummary.appeared }}</td>
                      </tr>
                      <tr>
                        <th>No. of Passed</th>
                        <td>{{ resultSummary.passed }}</td>
                      </tr>
                      <tr>
                        <th>No. of Failed</th>
                        <td>{{ resultSummary.failed }}</td>
                      </tr>
                      <tr>
                        <th>Passed %</th>
                        <td>{{ resultSummary.passedPercentage.toFixed(2) }}%</td>
                      </tr>
                      <tr>
                        <th >Failed %</th>
                        <td>{{ resultSummary.failedPercentage.toFixed(2) }}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Column 2 -->
                <div class="column is-flex is-flex-direction-column is-justify-content-flex-end">
                  <table class="bl-table1">
                    <tbody>
                      <tr>
                        <th>No. of Distinction</th>
                        <td>{{ resultSummary.distinction }}</td>
                      </tr>
                      <tr>
                        <th>No. of I Division</th>
                        <td>{{ resultSummary.firstDivision }}</td>
                      </tr>
                      <tr>
                        <th>No. of II Division</th>
                        <td>{{ resultSummary.secondDivision }}</td>
                      </tr>
                      <tr>
                        <th>No. of III Division</th>
                        <td>{{ resultSummary.thirdDivision }}</td>
                      </tr>
                      <tr>
                        <th>No. of Simple Pass</th>
                        <td>{{ resultSummary.simplePass }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="column is-flex is-flex-direction-column is-justify-content-flex-end"></div>
              </div>

              <div class="columns is-vcentered is-mobile mt-6">
            <!-- Left Side -->
            <div class="column has-text-left">
              <div class="signature">
                <p class="publish-date">Publish Date: {{ DisplayDate(publishDate) }}</p>
              </div>
            </div>
            <div class="column"></div>
            <!-- Right Side -->          
              <div class="column has-text-centered">
                <div>
                  <!-- Teacher's Signature 
                    <p>
                      (
                      {{ principal?.name ? principal.name.toUpperCase() : 'NAME OF TEACHER' }}
                      )
                    </p>-->
                    <p>{{ teacher?.designation || 'Signature of Class Teacher' }}</p>
                  </div>
                </div>
              </div>
            </div>  
          </div> 
          <div class="has-text-centered mt-4">
            <button class="button is-primary" @click="downloadPDF">Download PDF</button>
          </div>            
        
        </div>          

        <div v-else-if="!isLoading && selectedClassId !== ''" class="notification is-danger mt-4">
          No results found for Class {{ className }}{{ sectionName? ' Section ' + sectionName : '' }}.
        </div>
         
      </div>
    </div>
  </div>
  <!-- <div v-else class="form-container wide pb-1" >
    <div class="notification is-warning has-text-centered " >
      <p>{{ resultName }} has not been published.</p>      
    </div>    
  </div> -->
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'
import html2pdf from 'html2pdf.js'

const { CurrentYearId, CurrentYear } = useAcademicYear()
const { 
  Final_Published,
  Annual_Published,
  PassingPercentage,      
  loadActiveExam 
} = useActiveExam()

const route = useRoute()

const examType = ref('')
const resultName = ref('')
const currentExamId = ref('')
//const currentExamName = ref('')
const resultSummary = ref([]) 
const isLoading = ref(false)
const classes = ref([])
const sections = ref([])
const selectedClassId = ref('')
const selectedSectionId = ref('')
const noSections = ref(false)
const results = ref([])

const resultPublished = ref(false) // later, this must be changed
const publishDate = ref('')

const DisplayDate = stringReverse => {
  const date = new Date(stringReverse)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const currentDate = ref(new Date().toLocaleDateString('en-IN', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
}))

watch(() => route.query.type, (newType) => {
  examType.value = newType
  resultName.value = newType === 'terminal'? 'Half Yearly Exam Results' : newType === 'annual' ? 'Final Exam Results' : 'Selection Test Results'
  console.log("Exam Type:", examType.value)
  getExam()  
  selectedClassId.value = ''
  selectedSectionId.value = ''
  checkPublishStatus()
}, { immediate: true })

watch(examType, async (newType) => {
  if (newType) {    
    selectedClassId.value = ''
    selectedSectionId.value = ''     
  }
  await fetchClasses()
}, { immediate: true })

async function getExam() {
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  currentExamId.value = result.exam.Id
  //currentExamName.value = examType.value === 'terminal' ? result.exam.ExamName : examType.value === 'selection'? 'Class X Selection Test' :'Final'
  checkPublishStatus()
 //console.log("Current Exam ID in getExam:", currentExamId.value)
}

const className = computed(() => {
  const selectedClass = classes.value.find(cls => cls.Id === selectedClassId.value)
  return selectedClass ? selectedClass.ClassName : ''
})

const sectionName = computed(() => {
  const selectedSection = sections.value.find(sec => sec.Id === selectedSectionId.value)
  return selectedSection ? selectedSection.SectionName : ''
})

const teacher = ref({ name: '', designation: '' })
async function fetchClassTeacherInfo() {
  try {
    const response = await window.electronAPI.getTeacherSignatory(selectedClassId.value, selectedSectionId.value)
    if (response.success && response.data) {
      teacher.value = {
        name: response.data.Name,
        designation: response.data.Designation
      }
    }
  } catch (error) {
    console.error('Error fetching teacher:', error)
  }
}

onMounted(async () => {
  checkPublishStatus()
  await getExam()  
  await loadActiveExam()
  await fetchClasses()
  resultPublished.value === true
})

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
      resultPublished.value = false //must be change. This is for the purpose of debugging
    }
  } catch (error) {
    console.error("Error checking publish status:", error)    
  }
}


async function fetchClasses() {
  const result = await window.electronAPI.getClasses();
  if (result.success) {
    switch (examType.value) {
      case 'selection':
        // Only show Class X for selection tests
        classes.value = result.classes.filter(cls => cls.ClassName === 'X');
        if (classes.value.length > 0) {
          selectedClassId.value = classes.value[0].Id;
          console.log("Selection a ni tur a ni", examType.value, classes.value);
        }
        break;
        
      case 'annual':
        // Exclude Class X for annual exams
        classes.value = result.classes.filter(cls => cls.ClassName !== 'X');
       console.log("Annual a ni tur a ni", examType.value, classes.value);
        break;
        
      
      default:
        // Show all classes for terminal exams (or any other type)
        classes.value = result.classes;
        //console.log("Terminal a ni tur a ni", examType.value, classes.value);
        break;
    }
  }
}


watch(selectedClassId, async (newClassId) => {
  if (newClassId) {
    await fetchSections()
    if (sections.value.length < 2) {
     noSections.value = true
     selectedSectionId.value = 0
     fetchClassTeacherInfo()
     await fetchResults()
    }
  } else {
    sections.value = []
    selectedSectionId.value = ''
    results.value = []
    resultSummary.value = null
  }
})

async function fetchSections() {
  if (!selectedClassId.value) return
  
  try {
    sections.value = []
    selectedSectionId.value = ''
    results.value = []
    resultSummary.value = null
    
    const response = await window.electronAPI.getSectionsByClassId(selectedClassId.value)
    if (response.success) {
      sections.value = response.sections
      if (sections.value.length === 0) {
        noSections.value = true
        selectedSectionId.value = 0
      } else {
        noSections.value = false
      }
    }
  } catch (error) {
    console.error('Error fetching sections:', error)
  }
}

async function fetchResults() {
  if (!selectedClassId.value ) return
  
  try {
    isLoading.value = true
    results.value = []
    resultSummary.value = null
    
    // First get the detailed results
    const resultsResponse = await window.electronAPI.getSectionResults({
      academicYearId: CurrentYearId.value,
      examId: currentExamId.value,
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value
    });
    
    if (resultsResponse) {
      results.value = resultsResponse.results;      
      // Create summary from the detailed results we just got
      resultSummary.value = resultsResponse.summary
    }
  } catch (error) {
    console.error('Error fetching results:', error)
  } finally {
    isLoading.value = false
  }
}



function downloadPDF() {
  const element = document.querySelector('.print-page') // or any specific container you want
  const opt = {
    margin: 0.1,
    filename: `Result-Class_${ className.value }_${ sectionName.value }.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF:{ unit: 'in', format: 'a4', orientation: 'portrait' }
  }

  html2pdf().set(opt).from(element).save()
}
</script>

<style scoped>
.table-container {
  overflow-x: auto;
  margin-top: 1rem;
}

.notification {
  margin-bottom: 0;
}

.tag {
  min-width: 60px;
  justify-content: center;
}

.select {
  width: 100%;
}

.box {
  margin-bottom: 1.5rem;
}
.print-page{
  padding: 3rem;
  background: white;
  color:black;
}

.smaller-header {
  font-size: 12px;
  text-align: center;
  color: black;
  
}
.smaller-cell {
  font-size: 12px;
  text-align: center;
  color: black;
}
.columns {
  color:black;
}

.table-container {
  margin: 0 auto;
 color:black;
}
.result-heading {
  display: flex;
  flex-direction: column;
  align-items: center; /* centers items horizontally */
  text-align: center;  /* centers text inside each heading */
  margin-bottom: 1rem;
}
.result-title{
  font-size: 14pt;
  font-weight: 900;
}
.result-subtitle{
  font-size: 12pt;
  font-weight: 500;
}
.result-table{
  border: 2px solid black;
  width: 100%;
  border-collapse: collapse;
  font-size: 11pt;
}

.result-table td{ 
  border-collapse: collapse;
  border: .1px solid black;
  padding: 0.1rem 0.3rem;
  
  text-align: center;
  color: black;
}
.result-table th{
  border-collapse: true;
  border: 1px solid black;
  padding-left: 0.2rem;
  padding-right: 0.2rem;
  border-bottom: 2px solid black;
  text-align: center;
  color: black;
  vertical-align: middle;
  font-size: 16px;
}

.bl-table{
  border-collapse: true;
  border: 2px solid black;
  padding: 0.1rem;
  font-size: 14px;
}
.bl-table th{
  
  font-size: 14px;
  color: black;
  border: 1px solid black;
  padding: 0 0.5rem;
  font-weight: 500;
}
.bl-table tbody td{
  min-width:60px;
  font-size: 14px;
  color: black;
  border: 1px solid black;
  text-align: center;
  font-weight: 700;
}

.bl-table1{
  border-collapse: true;
  border: 2px solid black;
  padding: 0.1rem;
}
.bl-table1 th{

  font-size: 14px;
  color: black;
  border: 1px solid black;
  padding-left: 0.5rem;
  padding-top: 0.12rem;
  padding-bottom: 0.12rem;
  font-weight: 500;
}
.bl-table1 tbody td{
  min-width:60px;
  font-size: 14px;
  color: black;
  border: 1px solid black;
  text-align: center;
  padding-top: 0.14rem;
  padding-bottom: 0.12rem;
  font-weight: 700;
}
.total{
  color:black;
}
.total td,
.total td strong {
  color: black !important;
}
@media print {
  .no-print {
    display: none !important;
  }
}
</style>