<template>
  <div v-if="resultPublished" class="form-container box wide">
    <div class="has-text-centered mb-4">
      <h1 class="title is-4">Half Yearly Examination Result, {{ CurrentYear }}</h1>
      <h2 class="subtitle is-5" v-if="publishDate">Result Published on {{ DisplayDate(publishDate) }}</h2>
      <h2 class="subtitle is-5">Select Class and Section to generate Report Card</h2>      
    </div>

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
      <div v-if="(!isLoading && selectedClassId && selectedSectionId === 0) || (!isLoading && selectedClassId && selectedSectionId)" class="result-container">

          <div class="level mt-4">
            <!-- Centered heading -->
            <div class="level-item has-text-left">
              <h2 class="subtitle is-5">Detail Results</h2>
            </div>

          </div>

        <!-- Detailed Results Table -->
         
            <div class="mt-4" v-if="results.length > 0">
            <div class="table-container">
              
              <table class="table is-fullwidth is-striped is-bordered">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Division</th>
                    <th>Result</th>
                    <th>Action</th>
                    
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in results" :key="result.StudentId">
                    <td style="font-weight: 700;">{{ result.ResultStatus === 'Pass' ? result.Rank : '' }}</td>
                    <td>{{ result.RollNo }}</td>
                    <td style="text-align: left;">{{ result.Name }}</td>
                    <td>
                      {{ result.Division }}
                    </td>
                    <td>
                      {{ result.ResultStatus }}
                      
                    </td>

                    <td>
                      <button v-if="result.ReportCard === 1" class="button is-small is-warning mr-2"
                              @click="fetchReportCard(result.StudentId, result.Name)">
                        <span class="icon is-small">
                          <i class="fas fa-eye"></i>
                        </span>
                        <span>View Report Card</span>
                      </button>
                      <button v-else class="button is-small is-primary mr-2"
                              @click="openInputModal(result.StudentId, result.Name)">
                        <span class="icon is-small">
                          <i class="fas fa-download"></i>
                        </span>
                        <span>Generate Report Card</span>
                      </button>
                      <button v-if="result.ReportCard === 1 && canAccess(['admin'])" class="button is-small is-primary mr-2"
                              @click="openInputModal(result.StudentId, result.Name)">
                        <span class="icon is-small">
                          <i class="fas fa-download"></i>
                        </span>
                        <span>Re-Generate</span> 
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>  
          </div>     
        <div v-else-if="!isLoading" class="notification is-warning mt-4">
          No results found for Class {{ className }}{{ sectionName? ' Section ' + sectionName : '' }}.
        </div>
      </div>
  </div>

  <div v-else class="form-container wide pb-1" >
    <div class="notification is-danger has-text-centered " >
      <p>{{ resultName }} has not been published. Result can not be generated</p>      
    </div>    
  </div>
      <!--Start of  Input Modal-->
      
      <div class="modal" :class="{ 'is-active': inputModalVisible }">
        <div class="modal-background" @click="inputModalVisible = false"></div>
        <div class="modal-content">
          <div class="box">
            <h2 class="title is-5">Enter Details for {{ selectedStudentName }}</h2>            
            <div class="field">
              <label class="label">Total Working Days</label>
              <input class="input" type="number" v-model.number="totalWorkingDays">
            </div>
            <div class="field">
              <label class="label">Days Present</label>
              <input class="input" type="number" 
                    v-model.number="currentAttendance"
                    :max="totalWorkingDays">
            </div>
            <div class="field">
              <label class="label">Teacher's Remark</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="currentTeachersRemark">
                    <option value="" disabled>Select Remark</option>
                    <option>Congratulations! Keep it up</option>
                    <option>Excellent !!</option>
                    <option>Good!</option>
                    <option>Try More Hard.</option>
                    <option>Work Hard.</option>
                    <option>Try Again.</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="notification is-info is-light">
              <p><strong>Note:</strong> Please ensure that the attendance and remark are accurate before generating the report card.</p>
            </div>
            <div class="field is-grouped is-grouped-right">
              <div class="control">
                <button class="button is-light" @click="inputModalVisible = false"> 
                  Cancel
                </button>
              </div>
              <div class="control">
                <button class="button is-primary" @click="proceedToGenerateReportCard">
                  Generate Report Card
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal" :class="{ 'is-active': modalVisible }">
        <div class="modal-background" @click="closeModal"></div>
        <div class="modal-content wide">
          <div class="modal-card">
            <header class="modal-card-head">
              <h1 class="modal-card-title ">Report Card</h1>
              <h2></h2>
              <button class="delete" aria-label="close" @click="closeModal"></button>
            </header>
            <div class="print-container pt-1 pb-3" >
              <section class="modal-card-body  print-page watermark">
                <div class="header-wrapper has-text-centered  mb-3" style="position: relative;">                  
                  <!-- Headings -->
                  <h1 class="title print-title mt-2">CALVARY HIGHER SECONDARY SCHOOL</h1>
                  <h2 class="subtitle print-subtitle  m-0"><i>(Tripura Presbyterian School)</i></h2>
                  <img src="/sikul_logo.png" alt="School Logo" style="display: block; margin: 3px auto; height: 60px;" />
                  
                  <h2 class="subtitle print-subtitle  m-0">Affiliated to TBSE, School Code: 2C018</h2>
                  <h2 class="subtitle print-subtitle  m-0">Mission Compound, Tuidu. Gomati District, Tripura – 799101 </h2>
                  <h2 class="subtitle print-subtitle  m-0">Phone No: (+91) 8787793883, email: calvaryhighschool2019@gmail.com</h2>
                  <h2 class="subtitle print-subtitle ">Academic Session : {{ CurrentYear }}</h2>
                  <h1 class="title print-title is-5 mt-2 mb-7">REPORT CARD (Half Yealy)</h1>

                </div>
                
                <div class="table-container">
                  <table class="student-table">
                    <tbody>
                      <tr>
                        <th class="" style="width:350px">Name: <b>{{ studentData.Name }}</b></th>
                        <td class=""></td>
                        <th class="">Class: <b>{{className}}</b> &nbsp; <b>{{sectionName ? 'Section '+ sectionName : ''}}</b></th>
                        <td class=""></td>


                        <th class="">Roll No: <b>{{ studentData.RollNo }}</b></th>
                        <td class="has-content-left" style="text-align: left !important;"></td>
                      </tr>
                      <tr>
                        <th class="" style="width:120px">Father's Name: <b>{{ studentData.FathersName }}</b></th>
                        <td class=""></td>
                        <th class="">PEN: <b>{{ studentData.PEN }}</b></th>
                        <td class=""></td>

                        <th class="">APAR: <b>{{ studentData.APAR }}</b></th>
                        <td class=""></td>

                      </tr>
                    </tbody>
                  </table>

                  <table class="marks-table mb-4">
                    <thead>
                      <tr>
                        <th>SUBJECTS</th>
                        <th>FULL MARK</th>
                        <th>PASS MARK</th>
                        <th>FIRST PERIODIC</th>
                        <th>HALF YEARLY</th>
                        <th>TOTAL</th>
                        <th>RESULT</th>
                      </tr>                   
                    </thead>
                    <tbody>                 

                      <tr v-for="mark in marksData" :key="mark.SubjectId" class="total has-text-centered">
                        <th style="text-align: left;">{{ mark.SubjectName?.toUpperCase() }}</th>
                        <td>{{ mark.FullMark }}</td>
                        <td>{{ (PassingPercentage * mark.FullMark / 100).toFixed() }}</td>
                        <td>{{ mark.PeriodicMark ?? '-' }}</td>
                        <td>{{ mark.TerminalMark ?? '-' }}</td>
                        <td v-if="mark.SubjectResult === 'Pass'">{{ mark.TotalMark }}</td>
                        <td v-else>
                          <span class="tag is-danger">{{ mark.TotalMark }}</span>
                        </td>
                        <td>
                          <span :class="['tag', mark.SubjectResult === 'Pass' ? 'is-light' : 'is-danger']">
                            {{ mark.SubjectResult }}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <th>Total</th>
                        <td><b>{{ resultData.FullMark }}</b></td>
                        <td><b>{{ (PassingPercentage * resultData.FullMark/100).toFixed() }}</b></td>
                        <td>-</td>
                        <td>-</td>
                        <td><b>{{ resultData.TotalMark }}</b></td>
                        <td>-</td>
                      </tr>

                    </tbody>
                  </table>
                </div>
                  <div class="columns is-vcentered" style="align-items: flex-end;">
                    <div class="column is-half is-flex is-flex-direction-column is-justify-content-flex-end">
                        <table class="report-card-b">
                          <tbody>
                            <tr>
                              <th colspan="4" class="summary-header">COSCHOLASTIC ACTIVITIES</th>
                            </tr>
                            <tr>
                            
                              <th class="summary-header">ACTIVITY NAME</th>
                              <th >GRADE</th>
                              
                            </tr>
                            <tr v-for="activity in activities" :key="activity.Id">
                              <th class = "summary">{{ activity.ActivityName }}</th>
                              <td>{{ activity.Grade }}</td>
                            </tr>
                          </tbody>
                        </table> 
                    </div>
                    <div class="column is-half is-flex is-flex-direction-column is-justify-content-flex-end">
                    <table class="report-card-b">
                          <tbody>                            
                            <tr>
                              <th colspan="2" class="summary-header">GENERAL REPORT</th>    
                            </tr>
                            <tr >
                              <th class = "summary">No. of Students</th>
                              <td>{{reportCardData.noOfStudents}}</td>
                            </tr>
                            <tr>
                              <th class = "summary">No. of Working Days</th>
                              <td>{{reportCardData.TotalWorkingDays}}</td>
                            </tr>
                            <tr>  
                              <th class = "summary">No. of Days Present</th>
                              <td>{{reportCardData.TotalPresentDays}}</td>
                            </tr>
                            <tr>
                              <th class = "summary">Percentage</th>
                              <td>{{ Number(resultData.Percentage).toFixed(2) }}</td>
                            </tr>
                            <tr>
                              <th class = "summary">Division</th>
                              <td>{{resultData.Division}}</td>
                            </tr>
                            <tr>
                              <th class = "summary">Position</th>
                              <td>{{resultData.ResultStatus==="Pass" ? resultData.Rank : '-'}}</td>
                            </tr>
                            <tr>
                              <th class = "summary">Result</th>
                              <td>{{resultData.ResultStatus}}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div class="">
                        <table class="report-table">
                          <tbody>
                            <tr>
                              <td class="top" style>Class Teacher's Remark:</td>
                              <th class="top">
                                <span>{{ reportCardData.TeachersRemark }}</span>                                
                              </th>
                            </tr>
                          
                            <tr>
                              <td class="top">Name of Class Teacher:</td>
                              <th class="top  ">
                               <span v-if="classTeacher.name">{{ classTeacher.name }}</span>
                                <span v-else>Class Teacher's Name</span>
                              </th>
                            </tr> 
                            <tr>
                              <th class="bottom"></th>
                              <th class="bottom"></th>
                              <th class="bottom pt-5"></th>
                            </tr>
                            <tr>
                              <th class="bottom"></th>
                              <th class="bottom"></th>
                              <th class="bottom pt-5"></th>
                            </tr>
                            <tr>
                              <th class="bottom">Signature of Class Teacher</th>
                              <th class="bottom" style="text-align: center;">Signature of Parents</th>
                              <th class="bottom" style="text-align: center;">Signature of {{ head.designation }}</th>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                <div class="mb-2" style="position: relative;">
                  <p class="is-size-6">Issue Date: {{ currentDate }}</p>
                </div>  
                <div class="is-flex has-flex-direction-column has-text-centered">
                  <p class="is-size-7">* This is a computer-generated report card.</p>
                </div>
              </section>
            </div>
            <footer class="modal-card-foot">
              <button class="button is-primary mr-3" @click="downloadPDF">
                <span class="icon is-small">
                  <i class="fas fa-file-pdf"></i>
                </span>
                <span>Download PDF</span>
              </button>
              <button class="button is-dark" @click="closeModal">Close</button>
            </footer>
          </div>
        </div>
        
      </div>
      <!--End of Modal-->
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
const modalVisible = ref(false)

const examType= ref('terminal')
const currentExamId = ref('')
const currentExamName = ref('')
const subjects = ref([])
const activities = ref([])
const classes = ref([])
const sections = ref([])
const selectedClassId = ref('')
const selectedSectionId = ref('')

const results = ref([])
const resultName = ref('')

//input Modal
const inputModalVisible = ref(false)
const currentStudentId = ref(null)
const selectedStudentName = ref('')
const totalWorkingDays = ref(0)
const currentAttendance = ref(0)
const currentTeachersRemark = ref('')

//For Report Card Fetch
const marksData = ref([])
const studentData = ref([])
const resultData = ref([])
const reportCardData = ref([])


const classTeacher = ref({ name: '', designation: '' })
const head = ref({ name: '', designation: '' })

const currentDate = ref(new Date().toLocaleDateString('en-IN', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
}))

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

async function fetchClassTeacherInfo() {
  try {
    //console.log("Class and Section:", selectedClassId.value, selectedSectionId.value)
    const response = await window.electronAPI.getTeacherSignatory({
      classId: selectedClassId.value, 
      sectionId: selectedSectionId.value
    })
    if (response.success && response.data) {
      classTeacher.value = {
        name: response.data.Name,
        designation: response.data.Designation
      }
//console.log("Class Teacher:", classTeacher.value)
    }

  } catch (error) {
    console.error('Error fetching teacher:', error)
  }
}

async function fetchHeadInfo() {
  try {
    const response = await window.electronAPI.getHeadSignatory()
    if (response.success && response.data) {
      head.value = {
        name: response.data.Name,
        designation: response.data.Designation
      }

      //console.log("Head Signatory:", head.value)
    }
  } catch (error) {
    console.error('Error fetching head signatory:', error)
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
  await fetchHeadInfo()
  
  resultName.value = 'Half Yearly Exam Results'
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
      await fetchClassTeacherInfo()
      await fetchResults()
    }
  } else {
    sections.value = []
    selectedSectionId.value = ''
    results.value = []
  }
})
watch(selectedSectionId, async (newSectionId) => {
  if (newSectionId) {
    await fetchResults()
    await fetchClassTeacherInfo()
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
      
      if (sections.value.length === 0) {  
        selectedSectionId.value = 0
      }
    }
    
  } catch (error) {
    console.error('Error fetching sections:', error)
  }
}

async function fetchResults() {
  if (!selectedClassId.value) return  
  try {
    isLoading.value = true
    results.value = []
    
    // First get the detailed results
    const resultsResponse = await window.electronAPI.getSectionResults({
      academicYearId: CurrentYearId.value,
      examId: currentExamId.value,
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value
    });    
    if (resultsResponse) {
      results.value = resultsResponse.results;      
    }
  } catch (error) {
    console.error('Error fetching results:', error)
  } finally {
    isLoading.value = false
  }
}

function openInputModal(studentId, studentName) {
  currentStudentId.value = studentId
  selectedStudentName.value = studentName
  currentAttendance.value = ''
  currentTeachersRemark.value = ''
  inputModalVisible.value = true
}

async function proceedToGenerateReportCard() {  
  // Close input modal
  inputModalVisible.value = false
  
  // Generate report card with the entered data
  await generateReportCard(
    currentStudentId.value, 
    totalWorkingDays.value, 
    currentAttendance.value,
    currentTeachersRemark.value
  )
  fetchResults()
}

async function generateReportCard(studentId, totalWorkingDays, attendance, remark) {
  if (!studentId || !currentExamId.value) {
    window.electronAPI.showErrorDialog('Please select a valid student and ensure exam is properly loaded.')
    return
  }
  
  try {
    const results = await window.electronAPI.generateReportCard({
      examId: currentExamId.value,
      academicYearId: CurrentYearId.value,
      studentId,
      totalWorkingDays, 
      attendance,      
      teachersRemark: remark,
      resultType: examType.value
    })
    
    if (results?.success) { 
      await window.electronAPI.showInfoDialog('Report card generated successfully!');
      await fetchReportCard(studentId, selectedStudentName.value)
      
    } else {
      window.electronAPI.showErrorDialog('Failed to generate report card. Please try again.')
    }
  } catch (error) {
    console.error('Error generating report:', error)
    window.electronAPI.showErrorDialog('An error occurred while generating the report card.')
  }
}

async function fetchReportCard(studentId, Name) {
  selectedStudentName.value = Name
 const reports = await window.electronAPI.getReportCard({
        examId: currentExamId.value,
        classId: selectedClassId.value,
        sectionId: selectedSectionId.value || 0,
        studentId,
        resultType: examType.value,
        academicYearId: CurrentYearId.value
      })
      if(reports?.success){ 
        studentData.value = reports.studentData || []
        marksData.value = reports.marksData || []
        resultData.value = reports.resultData || []
        reportCardData.value = reports.reportCardData || []
        activities.value = reports.activities || []
        modalVisible.value = true
      }
}

function downloadPDF() {
  const element = document.querySelector('.print-page') // or any specific container you want
  const opt = {
    margin: 0.05,
    filename: `ReportCard_${className.value}_${sectionName.value}_${selectedStudentName.value.trim()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF:{ unit: 'in', format: 'a4', orientation: 'portrait' }
  }

  html2pdf().set(opt).from(element).save()
}

function closeModal() {
  modalVisible.value = false
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

</script>

<style scoped>
.table-container {
  overflow-x: auto;
  margin-top: 1rem;
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


.modal-content.wide {
  width: 100%;  
  margin: 0;
  padding:0;
}

/* Optional: Make the modal-card fill its parent */
.modal-content.wide .modal-card {
  width: 100%;
  padding:0;
  margin: 0;
}
.modal-card-body {
  padding: 0;
}
.modal-card-head{
  height: 3rem;
}
.modal-card-foot{
  height: 3rem;
}

.print-page{
  padding: 1.5rem 2.5rem;
  background: white;
  color:black;
  margin:0;
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

.marks-table{
  border: 2px solid black;
  width:100%;
  border-collapse: collapse;
}

.marks-table td{ 
  border-collapse: collapse;
  border: .1px solid black;
  padding: 0.1rem;
  vertical-align: middle;
  font-size: 12px;
  text-align: center;
  color: black;
}
.marks-table th{
  border-collapse: true;
  border: 1px solid black;
  padding-left: 0.2rem;
  padding-right: 0.2rem;
  font-size: 12px;
  text-align: center;
  color: black;
  vertical-align: middle;
}

.report-card-b{
  border: 2px solid black;
  width:100%;
  border-collapse: collapse;
  height:100px;
}
.report-card-b th{
  border-collapse: true;
  border: 1px solid black;
  padding: 0.1rem 0.2rem;
  font-size: 12px;
  text-align: center;
  color: black;
  vertical-align: middle;
}
.report-card-b td{ 
  border-collapse: collapse;
  border: .1px solid black;
  padding: 0.1rem 0.2rem;
  vertical-align: middle;
  font-size: 12px;
  text-align: center;
  color: black;
}
.report-card-b th.summary{
  font-weight: 700;
  text-align: left;
}
.report-card-b th.summary-header{
  font-weight: 800;
}

.student-table{
  color: black;
  width:100%;
  margin-bottom: 0.25rem;
  margin-top: 1rem;
}
.student-table th{
  font-size: 14px;
  color: black;
  font-weight: 450;
  padding: 0.1rem;
  text-align: left;
  
}
.student-table td{ 
  padding: 0.1rem;
  font-size: 14px;
  color: black;
  text-align: left;
  font-weight: 500;
  vertical-align: bottom;
}

.report-table{
  color: black;
  width:100%;
  
  border-collapse: collapse;
  margin-bottom: 20px;
}
.report-table td{ 
  border-collapse: collapse;
  padding:0.5rem;
  font-size: 14px;
  text-align: center;
  color: black;
  text-align: left;
  width:250px;
  padding-bottom: 0;
}
.report-table th{
  border-collapse: true;
  padding:0.5rem;
  padding-left: 0.2rem;
  padding-right: 0.2rem;
  font-size: 12px;
  color: black;
  max-width:100px;
}
.report-table th.top{ 
  vertical-align: bottom;
  font-size: 12pt;
}
.report-table th.bottom{
  min-height: 50px;
  vertical-align: bottom;
  text-align: center;
  font-size: 12pt;
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

.watermark {
  position: relative;
}

/* Centered watermark in front of the tiled one */
.watermark::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;          /* adjust size */
  height: 300px;
  background: url('/sikul_logo_watermark.png') no-repeat center;
  background-size: contain;
  opacity: 1;         /* lighter for watermark feel */
  transform: translate(-50%, -50%);
  z-index: 2;            /* above ::before, below content */
  pointer-events: none;
  width: 400px;          /* increase size here */
  height: 400px; 
}

/* School Name tiled watermark */
.watermark::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/Wm_Report.png');
  background-repeat: repeat;
  opacity: 0.5;
  z-index: 1;            /* keep this lower */
  pointer-events: none;
}




</style>