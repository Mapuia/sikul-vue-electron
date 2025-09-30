<template>
  
  <div v-if="resultPublished" class="form-container box wide">
        
      <!-- Centered heading -->
      <div class="has-text-centered">
        <h2 class="subtitle is-4">{{ examType === 'terminal' ? currentExamName : "Final"}} Result Summary ({{ CurrentYear }})</h2>
      </div>   

    <div v-if="isLoading" class="has-text-centered mt-4">
      <progress class="progress is-medium is-primary" max="100"></progress>
      <p>Loading result summary...</p>
    </div>

    <div class="print-page">  

          <div v-if="!isLoading" class="print-container">
            <div class="header-wrapper has-text-centered mb-4" style="position: relative;">
              <!-- Logo (Option 1: if using public folder) -->
              <img src="/sikul_logo.png" alt="School Logo" style="position: absolute; top: 0; left: 0; height: 60px;" />

              <!-- Headings -->
              <h1 class="title print-title is-5">CALVARY HIGHER SECONDARY SCHOOL, TUIDU</h1>
              <h2 class="subtitle print-subtitle is-5">{{ currentExamName }} : {{ CurrentYear }}</h2>
              <h3 class="title print-title is-6">RESULT SUMMARY</h3>
            </div>
          
            <div class="table-container">
              <table class="summary-table">
                <thead>
                  <tr>
                    <th rowspan="2" >CLASS</th>
                    <th rowspan="2" >SECTION</th>
                    <th rowspan="2" >NO. OF STUDENTS</th>
                    <th rowspan="2" >NO. OF APPEARED</th>
                    <th rowspan="2" >NO. OF ABSENT</th>
                    <th rowspan="2" >NO. OF PASSED</th>
                    <th rowspan="2" >PASSED %</th>
                    <th rowspan="2" >NO. OF FAILED</th>
                    <th rowspan="2" >FAILED %</th>
                    <th colspan="5" class="has-text-centered" style="width: 300px">NO. OF STUDENTS PASSED IN</th>
                  </tr>
                  <tr>
                    <th class="smaller-header">DIST</th>
                    <th class="smaller-header">I DIV</th>
                    <th class="smaller-header">II DIV</th>
                    <th class="smaller-header">III DIV</th>
                    <th class="smaller-header">SP</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(group, groupIndex) in groupedResults" :key="groupIndex">
                    <tr v-for="(item, rowIndex) in group" :key="rowIndex">
                      <td v-if="rowIndex === 0" :rowspan="group.length" class="smaller-header" style="vertical-align: middle;">
                        {{ item.className }}
                      </td>
                      <td>{{ item.sectionName }}</td>
                      <td>{{ item.totalStudents }}</td>
                      <td>{{ item.appeared }}</td>
                      <td>{{ item.absent }}</td>
                      <td>{{ item.passed }}</td>
                      <td>{{ item.passedPercentage?.toFixed(2) ?? '0.00' }}</td>
                      <td>{{ item.failed }}</td>
                      <td>{{ item.failedPercentage?.toFixed(2) ?? '0.00' }}</td>
                      <td>{{ item.distinction }}</td>
                      <td>{{ item.firstDivision }}</td>
                      <td>{{ item.secondDivision }}</td>
                      <td>{{ item.thirdDivision }}</td>
                      <td>{{ item.simplePass }}</td>
                    </tr>
                  </template>

                  <tr v-if="resultSummary.length > 0" class="total has-text-centered">
                    <td colspan="2"><strong>TOTAL</strong></td>
                    <td class="smaller-header"><strong>{{ totals.totalStudents }}</strong></td>
                    <td class="smaller-header"><strong>{{ totals.appeared }}</strong></td>
                    <td class="smaller-header"><strong>{{ totals.absent }}</strong></td>
                    <td class="smaller-header"><strong>{{ totals.passed }}</strong></td>
                    <td class="smaller-header"><strong>{{ totals.passedPercentage.toFixed(2) }}%</strong></td>
                    <td class="smaller-header"><strong>{{ totals.failed }}</strong></td>
                    <td class="smaller-header"><strong>{{ totals.failedPercentage.toFixed(2) }}%</strong></td>
                    <td class="smaller-header"><strong>{{ totals.distinction }}</strong></td>
                    <td class="smaller-header"><strong>{{ totals.firstDivision }}</strong></td>
                    <td class="smaller-header"><strong>{{ totals.secondDivision }}</strong></td>
                    <td class="smaller-header"><strong>{{ totals.thirdDivision }}</strong></td>
                    <td class="smaller-header"><strong>{{ totals.simplePass }}</strong></td>
                  </tr>
                  <tr v-else>
                    <td colspan="14" class="has-text-centered">No data available</td>
                  </tr>
                </tbody>
              </table>

            </div>

            <div v-if="resultSummary.length > 0" class="summary-footer mt-4">
          <div class="columns is-vcentered" style="align-items: flex-end;">
          <!-- Column 1 -->
          <div class="column is-flex is-flex-direction-column is-justify-content-flex-end">
            <table class="bl-table">
              <tbody>
                <tr>
                  <th >No. of Students</th>
                  <td>{{ totals.totalStudents }}</td>
                </tr>
                <tr>
                  <th style="width:200px">No. of Appeared</th>
                  <td>{{ totals.appeared }}</td>
                </tr>
                <tr>
                  <th>No. of Passed</th>
                  <td>{{ totals.passed }}</td>
                </tr>
                <tr>
                  <th>No. of Failed</th>
                  <td>{{ totals.failed }}</td>
                </tr>
                <tr>
                  <th>Passed %</th>
                  <td>{{ totals.passedPercentage.toFixed(2) }}%</td>
                </tr>
                <tr>
                  <th >Failed %</th>
                  <td>{{ totals.failedPercentage.toFixed(2) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Column 2 -->
          <div class="column is-flex is-flex-direction-column is-justify-content-flex-end">
            <table class="bl-table1">
              <tbody>
                <tr>
                  <th>Distinction</th>
                  <td>{{ totals.distinction }}</td>
                </tr>
                <tr>
                  <th>I Division</th>
                  <td>{{ totals.firstDivision }}</td>
                </tr>
                <tr>
                  <th>II Division</th>
                  <td>{{ totals.secondDivision }}</td>
                </tr>
                <tr>
                  <th>III Division</th>
                  <td>{{ totals.thirdDivision }}</td>
                </tr>
                <tr>
                  <th>Simple Pass</th>
                  <td>{{ totals.simplePass }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Column 3  -->
          <div class="column"></div>
            
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
                    <p>
                      (
                      {{ head?.name ? head.name.toUpperCase() : 'Name of Head' }}
                      )
                    </p>
                    <p>{{ head?.designation || 'Designation of Head' }}</p>
                  </div>
              </div>
          </div>
        </div>        
      </div>      
    </div>

    <div class="has-text-centered mt-4 no-print">
      <button class="button is-primary" @click="downloadPDF">Download PDF</button>
    </div>  
  </div>
  <div v-else class="container single pb-1" >
    <div class="notification is-success has-text-centered " >
      <p>{{ resultName }} Results has not been published.</p>      
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
const { loadActiveExam } = useActiveExam()

const route = useRoute()

const examType = ref('')
const resultName = ref('')
const currentExamId = ref('')
const currentExamName = ref('')
const resultSummary = ref([]) 
const isLoading = ref(false)

const DisplayDate = stringReverse => {
  const date = new Date(stringReverse)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const currentDate = ref(new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}))

watch(() => route.query.type, (newType) => {
  examType.value = newType
  getExam()
  resultName.value = newType === 'terminal'? 'Half Yearly' : 'Final'  
}, { immediate: true })

watch(examType, async (newType) => {
  if (newType) {
    await getExam()
    await checkPublishStatus()
    await fetchResultSummary()
  }
}, { immediate: true })

async function getExam() {
  //console.log('Fetching exam for type:', examType.value, 'and year:', CurrentYearId.value)
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  currentExamId.value = result.exam.Id
  currentExamName.value = result.exam.ExamName
  //console.log('Fetched exam:', currentExamId.value, currentExamName.value)
}
// NEW: Principal signatory info
const head = ref({ name: '', designation: '' })


onMounted(async () => {
  isLoading.value = true
  try {    
    await loadActiveExam()    
    await fetchHeadSignatory()
    await fetchResultSummary()
   
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    isLoading.value = false
  }
})

// Load Head Signatory info
async function fetchHeadSignatory() {
  try {
    const response = await window.electronAPI.getHeadSignatory()
    if (response.success && response.data) {
      head.value = {
        name: response.data.Name,
        designation: response.data.Designation
      }
    }
    //console.log('Head Signatory:', head.value)
  } catch (error) {
    console.error('Error fetching head signatory:', error)
  }
}

async function fetchResultSummary() {
  try {
    const response = await window.electronAPI.getResultSummary({
      academicYearId: CurrentYearId.value,
      examId: currentExamId.value,
      resultType: examType.value === 'terminal' ? examType.value : 'final'
    })

    if (response.success) {
      resultSummary.value = response.data
    } else {
      console.error('Error fetching result summary:', response.error)
      resultSummary.value = []
    }
  } catch (error) {
    console.error('Error:', error)
    resultSummary.value = []
  }
}

const totals = computed(() => {
  const acc = {
    totalStudents: 0,
    appeared: 0,
    absent: 0,
    passed: 0,
    failed: 0,
    distinction: 0,
    firstDivision: 0,
    secondDivision: 0,
    thirdDivision: 0,
    simplePass: 0
  }

  for (const item of resultSummary.value) {
    acc.totalStudents += item.totalStudents
    acc.appeared += item.appeared 
    acc.absent += item.absent 
    acc.passed += item.passed 
    acc.failed += item.failed
    acc.distinction += item.distinction 
    acc.firstDivision += item.firstDivision 
    acc.secondDivision += item.secondDivision 
    acc.thirdDivision += item.thirdDivision 
    acc.simplePass += item.simplePass 
  }

  acc.passedPercentage = acc.appeared ? (acc.passed / acc.appeared) * 100 : 0
  acc.failedPercentage = acc.appeared ? (acc.failed / acc.appeared) * 100 : 0
  return acc
})

const groupedResults = computed(() => {
  const groups = {};
  resultSummary.value.forEach(item => {
    if (!groups[item.className]) {
      groups[item.className] = [];
    }
    groups[item.className].push(item);
  });
  return Object.values(groups)
})

function downloadPDF() {
  const element = document.querySelector('.print-container')
  const opt = {
    margin: 0.5,
    filename: `Result_Summary_${currentExamName.value}_${CurrentYear.value}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  }
  html2pdf().set(opt).from(element).save()
}

const resultPublished = ref(false)
const publishDate = ref('')
async function checkPublishStatus() {
  try {
    // Get counts from both tables
    //console.log("Checking publish status for exam:", currentExamId.value, "and academic year:", CurrentYearId.value)
    const status = await window.electronAPI.getPublishStatus({
      academicYearId: CurrentYearId.value,
      activeExamId: currentExamId.value      
    })   
    publishDate.value = status.publishDate || ''
    if(publishDate.value){
      resultPublished.value = true
    }
    else {
      resultPublished.value = false
    }

  } catch (error) {
    console.error("Error checking publish status:", error)    
  }
}
</script>

<style scoped>
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
.summary-table{
  border: 2px solid black;
}
.summary-table td{ 
  border-collapse: true;
  border: .1px solid black;
  padding: 0.1rem;
  font-size: 12px;
  text-align: center;
  color: black;
}
.summary-table th{
  border-collapse: true;
  border: 1px solid black;
  padding-left: 0.2rem;
  padding-right: 0.2rem;
  font-size: 12px;
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
  min-width: 60px;
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
  min-width: 40px;
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
