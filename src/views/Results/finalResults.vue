<template>
  <div class="form-container box wide">
    <div class="has-text-centered mb-4">
      <h1 class="title is-4">Final Result {{ CurrentYear }}</h1>
      <h2 class="subtitle is-5">Class-Section-Wise Result</h2>      
    </div>

    <div v-if="examType">
    <!-- Class and Section Selection -->
      <div class="box">
        <div class="columns is-centered">
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
      <div v-if="(!isLoading && selectedClassId && noSections)|| (!isLoading && selectedClassId && selectedSectionId)" class="result-container">
       

          <div class="level mt-4">
            <!-- Centered heading -->
            <div class="level-item has-text-left">
              <h2 class="subtitle is-5">Detail Results</h2>
            </div>

          </div>

        <!-- Detailed Results Table -->
        <div v-if=" selectedClassId && results.length > 0" class="print-container"> 
          <div class="print-page"> 
            <div class="header-wrapper has-text-centered mb-4" style="position: relative;">
            <!-- Logo (Option 1: if using public folder) -->
            <img src="/sikul_logo.png" alt="School Logo" style="position: absolute; top: 0; left: 0; height: 60px;" />
            <h1 class="result-title ">CALVARY HIGHER SECONDARY SCHOOL, TUIDU</h1>
            <h2 class="result-subtitle ">{{ currentExamName }} : {{ CurrentYear }}</h2>
            <h1 class="result-title "> Class {{ resultSummary.className }}{{ resultSummary.sectionName? ', Section ' + resultSummary.sectionName : '' }}</h1>
            </div>
            <div class="mt-4" v-if="results.length > 0">
            <div class="table-container">
              <table class="result-table is-fullwidth is-striped is-bordered">
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
                    <td style="font-weight: 700;">{{ result.ResultStatus === 'Pass' ? result.Rank : '' }}</td>
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
                <p class="print-date">Date: {{ currentDate }}</p>
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
                    <p>{{ principal?.designation || 'Signature of Class Teacher' }}</p>
                  </div>
              </div>

          </div>

            </div>  
          </div>

          <div class="has-text-centered mt-4">
            <button class="button is-primary" @click="downloadPDF">Download PDF</button>
          </div>  
        </div>  
        
     
        <div v-else-if="!isLoading" class="notification is-warning mt-4">
          No results found for Class {{ className }}{{ sectionName? ' Section ' + sectionName : '' }}.
        </div>
      
      </div>
    </div>
    </div>


   
 
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'
import html2pdf from 'html2pdf.js'

const { CurrentYearId, CurrentYear } = useAcademicYear()
const { 
  Terminal_Published,
  Annual_Published,
  PassingPercentage,      
  loadActiveExam 
} = useActiveExam()

const route = useRoute()

const examType = ref('')
const currentExamId = ref('')
const currentExamName = ref('')
const resultSummary = ref([]) 
const isLoading = ref(false)
const classes = ref([])
const sections = ref([])
const selectedClassId = ref('')
const selectedSectionId = ref('')
const noSections = ref(false)
const results = ref([])


const currentDate = ref(new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}))

watch(() => route.query.type, (newType) => {
  examType.value = newType
  //console.log("Exam Type in watch:", examType.value)
  getExam()
  
}, { immediate: true })

async function getExam() {
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  currentExamId.value = result.exam.Id
  currentExamName.value = result.exam.ExamName
}

//console.log("Current Exam ID:", currentExamId.value)

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
    const response = await window.electronAPI.getTeacherSignatory(className.value, sectionName.value)
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
  await loadActiveExam()
  await fetchClasses()
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
     noSections.value = true      
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
  if (!selectedClassId.value || !selectedSectionId.value) return
  
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
    margin:       0.2,
    filename:     `Result_${ className.value }_${ sectionName.value }.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
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
.print-container{
  background: white;
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
  
  text-align: center;
  color: black;
  vertical-align: middle;
}

.bl-table{
  border-collapse: true;
  border: 2px solid black;
  padding: 0.1rem;
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