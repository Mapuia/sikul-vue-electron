<template>
  <div v-if="resultPublished" class="form-container box wide">
    <div class="has-text-centered mb-4">
      <h1 class="title is-4">Final Result, {{ CurrentYear }}</h1>
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
      <p>{{ resultName }} has not been published.</p>      
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
              <textarea class="textarea" v-model="currentTeachersRemark"></textarea>
            </div>

            <div class="field is-grouped is-grouped-right">
              <div class="control">
                <button class="button is-light" @click="inputModalVisible = false">Cancel</button>
              </div>
              <div class="control">
                <button class="button is-primary" 
                        @click="proceedToGenerateReportCard">
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
            <div class="print-container pt-3 pb-2" >
              <section class="modal-card-body  print-page watermark pb-6">
                <div class="header-wrapper has-text-centered  mb-3" style="position: relative;">
                  
                  <!-- Headings -->
                  <h1 class="title print-title mt-3">CALVARY HIGHER SECONDARY SCHOOL</h1>
                  <h2 class="subtitle print-subtitle m-0"><i>(Tripura Presbyterian School)</i></h2>
                  <img src="/sikul_logo.png" alt="School Logo" style="display: block; margin: 3px auto; height: 60px;" />

                  <h2 class="subtitle print-subtitle  m-0">Affiliated to TBSE, School Code: 2C018</h2>
                  <h2 class="subtitle print-subtitle  m-0">Mission Compound, Tuidu. Gomati District, Tripura – 799101 </h2>
                  <h2 class="subtitle print-subtitle m-0">Phone No: (+91) 8787793883, email: calvaryhighschool2019@gmail.com</h2>
                  <h2 class="subtitle print-subtitle ">Academic Session : {{ CurrentYear }}</h2>
                  <h1 class="title print-title is-5 mt-2">REPORT CARD (Final)</h1>
                </div>

                <div class="table-container">
                  <table class="student-table">
                    <tbody>
                      <tr>
                        <th class="">Name:</th>
                        <td class="">{{ studentData.Name }}</td>
                    
                        <th class="">Class:</th>
                        <td class="">{{className}} &nbsp; {{sectionName ? 'Section '+ sectionName : ''}}</td>
                      
                        <th class="">Roll No:</th>
                        <td class="">{{ studentData.RollNo }}</td>
                      </tr>
                      <tr>
                        <th class="" style="width:120px">Father's Name:</th>
                        <td class="">{{ studentData.FathersName }}</td>
                        <th class="">PEN:</th>
                        <td class="">{{ studentData.PEN }}</td>
                        <th class="">APAR:</th>
                        <td class="">{{ studentData.APAR }}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table class="marks-table mb-4">
                    <thead>
                    <tr>
                      <th rowspan="2" >SUBJECTS</th>
                      <th rowspan="2" style="max-width: 30px;">FULL MARK</th>
                      <th rowspan="2" style="max-width: 30px;">PASS MARK</th>
                      <th colspan="3" >HALF YEARLY</th>
                      <th colspan="3" >ANNUAL</th>
                      <th colspan="4" >FINAL</th>
                    </tr>
                    <tr>
                      <th class="smaller-header" style="max-width: 30px;">1st PR</th>
                      <th class="smaller-header">HY</th>
                      <th class="smaller-header">Total</th>
                      
                      <th class="smaller-header" style="max-width: 30px;">2nd PR</th>
                      <th class="smaller-header">AN</th>
                      <th class="smaller-header">Total</th>
                     
                      <th class="smaller-header">FM</th>
                      <th class="smaller-header">PM</th>
                      <th class="smaller-header">Total</th>
                      <th class="smaller-header">Result</th>
                    </tr>
                  </thead>
                    <tbody> 
                      <tr v-for="mark in marksData" :key="mark.SubjectId" class="total has-text-centered">
                        <th style="text-align: left;">{{ mark.SubjectName?.toUpperCase() }}</th>
                        <td>{{ mark.FullMark }}</td>
                        <td>{{ mark.PassMark }}</td>
                        <td>{{ mark.FirstPeriodicMarks ?? '-' }}</td>
                        <td>{{ mark.TerminalMarks ?? '-' }}</td>
                        <td><b><span :class="mark.TerminalTotal >= mark.PassMark ? '' : 'has-text-danger'">
                          {{ mark.TerminalTotal }}</span></b></td>
                       
                        <td> {{ mark.SecondPeriodicMarks }}</td>
                        <td>{{ mark.AnnualMarks }}</td>
                        <td><b><span :class="mark.AnnualTotalMarks >= mark.PassMark ? '' : 'has-text-danger'">
                          {{ mark.AnnualTotalMarks }}</span></b></td>
                        <td>{{ mark.finalFullMark }}</td>
                        <td> {{ mark.finalPassMark }}</td>
                        <td> <b> <span :class="mark.finalMarks >= mark.finalPassMark ? '' : 'has-text-danger'">
                          {{ mark.finalMarks }} </span></b></td>
                        <td > <span class="tag" :class="mark.finalMarks >= mark.finalPassMark ? 'is-light' : 'is-danger'">
                          {{ mark.finalMarks >= mark.finalPassMark ? 'PASS' : 'FAIL' }}</span></td>                        
                      </tr>
                      <tr>
                        <th>Total</th>
                        <td><b>{{ totalMarks.fullMark }}</b></td>
                        <td><b>{{ totalMarks.passMark }}</b></td>
                        <td>-</td>
                        <td>-</td>
                        <td><b>{{ totalMarks.terminalTotal }}</b></td>
                        <td>-</td>
                        <td>-</td>
                        <td><b>{{ totalMarks.annualTotal }}</b></td>
                        <td><b>{{ totalMarks.finalFullMark }}</b></td>
                        <td><b>{{ totalMarks.finalPassMark }}</b></td>
                        <td><b>{{ totalMarks.finalMarks }}</b></td>
                        <td><span class="tag" :class="resultData.finalResult?.ResultStatus === 'Fail'? 'is-danger' : 'is-success'">
                          {{resultData.finalResult?.ResultStatus}}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="columns" >
                  <div class="column is-half is-flex is-flex-direction-column is-justify-content-flex-end">
                      <table class="report-card-b">
                        <tbody>
                          <tr>
                            <th colspan="4" class="summary-header">COSCHOLASTIC ACTIVITIES</th>
                          </tr>
                          <tr>                           
                            <th class="summary-header has-text-left">ACTIVITY NAMES</th>
                            <th style="max-width:60px;">HALF YEARLY</th>            
                            <th style="max-width:60px;">ANNUAL</th>
                          </tr>
                          <tr v-for="activity in activities" :key="activity.Id">
                            <th class = "summary">{{ activity.ActivityName }}</th>
                            <td>{{ activity.terminalGrade }}</td>
                            <td>{{ activity.annualGrade }}</td>
                          </tr>
                        </tbody>
                      </table>                       
                  </div>
                  <div class="column is-half is-flex is-flex-direction-column">   
                      <table class="result-summary">
                        <tbody>
                          <tr> 
                            <th colspan="3" class="has-text-centered"><b>RESULTS</b></th>
                          </tr>  
                          <tr> 
                            <th class=""><b>PARAMETERS</b></th>
                            <th class="has-text-centered"><b>HALF YEARLY</b></th>
                            <th class="has-text-centered" style="min-width:80px"><b>FINAL</b></th>
                          </tr>  
                          <tr>
                            <th >Percentage</th>
                            <td>{{ Number(resultData.terminal?.Percentage).toFixed(2) }}</td>
                            <td>{{ Number(resultData.finalResult?.Percentage).toFixed(2) }}</td>
                            
                          </tr>
                          <tr>
                            <th class = "summary">Division</th>
                            <td>{{resultData.terminal?.Division}}</td>                             
                            <td>{{resultData.finalResult?.Division}}</td>                             
                          </tr>
                          <tr>
                            <th class = "summary">Position</th>
                            <td>{{resultData.terminal?.Rank}}</td>                        
                            <td>{{resultData.finalResult?.Rank}}</td>                        
                          </tr>
                          <tr>
                            <th class = "summary">Result</th>
                            <td>{{resultData.terminal?.ResultStatus}}</td>                         
                            <td>{{resultData.finalResult?.ResultStatus}}</td>                         
                          </tr>
                          <tr>
                            <th  >Total No. of Students:</th>
                            <td  class="bottom">
                              <span>{{ reportCardData?.TerminalNoOfStudents }}</span>                                 
                            </td>
                            <td class="bottom">                                
                              <span>{{ reportCardData?.AnnualNoOfStudents }}</span> 
                            </td>
                          </tr>
                          </tbody>
                      </table> 
                  </div>
                </div>
                <div class="columns" style="margin-top: -20px;">
                  <div class="column is-half is-flex is-flex-direction-column">
                      <table class="report-card-b ">
                        <tbody>                            
                          <tr>
                            <th class="summary-header">ATTENDANCE REPORT</th>
                            <th >HALF YEARLY</th>
                            <th >ANNUAL</th>
                            <th >FINAL</th>
                          </tr>
                          <tr>
                            <th class = "summary">No. of Working Days</th>
                            <td>{{reportCardData?.TerminalWorkingDays}}</td>
                            <td>{{reportCardData?.AnnualWorkingDays}}</td>
                            <td>{{reportCardData?.TotalWorkingDays }}</td>
                          </tr>
                          <tr>  
                            <th class = "summary">No. of Days Present</th>
                            <td>{{reportCardData?.TerminalPresentDays}}</td>
                            <td>{{reportCardData?.AnnualPresentDays}}</td>
                            <td>{{reportCardData?.TotalPresentDays }}</td>
                          </tr>
                        </tbody>
                      </table>
                  </div>
                  <div class="column is-half is-flex is-flex-direction-column">  
                    <table class="report-card-c">
                      <tbody>
                        <tr>
                          <th >Name of Class Teacher:</th>
                          <td >
                            <span v-if="classTeacher.name">{{ classTeacher.name }}</span>
                            <span v-else>Class Teacher's Name</span>
                          </td>
                        </tr>
                        <tr>
                          <th >Class Teacher's Remark:</th>
                          <td >
                            <span>{{ reportCardData.remarks }} </span> 
                          </td>
                        </tr>
                      </tbody>
                    </table>                       
                  </div>
                </div>
                <div class="columns is-flex is-justify-content-space-between is-align-items-center mx-1 mt-6">
                  <div>Date: {{ currentDate }}</div>
                  <div class="mr-6 is-size-7">Signature of {{ head.designation || "Principal" }}</div>
                </div>                
                <div class="help is-flex is-justify-content-center has-text-centered mt-7">
                  * This is a computer-generated report card.
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

const { CurrentYearId, CurrentYear } = useAcademicYear()
const { PassingPercentage, loadActiveExam } = useActiveExam()

const route = useRoute()
const userRole = ref('')
const isLoading = ref(false)
const modalVisible = ref(false)

const examType= ref('annual')
const currentExamId = ref('')
//const currentExamName = ref('')
const subjects = ref([])
const activities = ref([])
const classes = ref([])
const sections = ref([])
const selectedClassId = ref('')
const selectedSectionId = ref('')

const results = ref([])

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
const resultData = ref({
  terminal: {
    Percentage: 0,
    Division: '',
    Rank: '',
    ResultStatus: ''
  },
  finalResult: {
    Percentage: 0,
    Division: '',
    Rank: '',
    ResultStatus: ''
  }
})
const reportCardData = ref([])
const totalMarks = ref([])

const classTeacher = ref({ name: '', designation: '' })
const head = ref({ name: '', designation: '' })

const currentDate = ref(new Date().toLocaleDateString('en-IN', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
}))


const className = computed(() => {
  const selectedClass = classes.value.find(cls => cls.Id === selectedClassId.value)
  return selectedClass ? selectedClass.ClassName : ''
})

const sectionName = computed(() => {
  const selectedSection = sections.value.find(sec => sec.Id === selectedSectionId.value)
  return selectedSection ? selectedSection.SectionName : ''
})

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
      console.log("Class Teacher:", classTeacher.value)
    }
  } catch (error) {
    console.error('Error fetching teacher:', error)
  }
}

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

onMounted(async () => {
  await loadActiveExam()
  await fetchClasses()
  await getUser()
  await fetchHeadSignatory()
})

async function getUser() {
  const user = await window.electronAuth.getCurrentUser()
  if (user) {    
    userRole.value = user.role
  }
}
const canAccess = (requiredRoles) => {
  return requiredRoles.includes(userRole.value)
}

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
      fetchNoOfStudents()
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
    //console.log ('ExamId to fetch:', currentExamId.value)  
    if (resultsResponse) {
      results.value = resultsResponse.results;
    //  console.log ('Result Data:', results.value)
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
    window.electronAPI.showInfoDialog('Please select a valid student and ensure exam is properly loaded.')
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
      resultType: 'final' //The Page is dedicated for Final Result
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
  selectedStudentName.value = Name;

  try {
    const reports = await window.electronAPI.getFinalReportCard({
      examId: currentExamId.value,
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value || 0,
      studentId,
      resultType: 'final',
      academicYearId: CurrentYearId.value,
      PassingPercentage: PassingPercentage.value
    });

    if (reports?.success) {
      studentData.value = reports.studentData || {};
      marksData.value = reports.finalMarksData || [];

      // Corrected result data assignment
      resultData.value = {
        terminal: {
          Percentage: reports.resultData?.terminal?.Percentage || 0,
          Division: reports.resultData?.terminal?.Division || '',
          Rank: reports.resultData?.terminal?.Rank || '',
          ResultStatus: reports.resultData?.terminal?.ResultStatus || ''
        },
        finalResult: {
          Percentage: reports.resultData?.finalResult?.Percentage || 0,
          Division: reports.resultData?.finalResult?.Division || '',
          Rank: reports.resultData?.finalResult?.Rank || '',
          ResultStatus: reports.resultData?.finalResult?.ResultStatus || ''
        }
      };

      totalMarks.value = reports.totalMarks || {};
      reportCardData.value = reports.attendanceData || {};
      activities.value = reports.activities || [];
      modalVisible.value = true;
    }
  } catch (error) {
    console.error('Error fetching report card:', error);
    window.electronAPI.showErrorDialog('Failed to load report card data');
  }
}


function downloadPDF() {
  
  const element = document.querySelector('.print-page') // or any specific container you want
  const opt = {
    margin:       0.05,
    filename:     `Final_ReportCard_${ className.value }_${ sectionName.value }_${ selectedStudentName.value }.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  }

  html2pdf().set(opt).from(element).save()
}
function closeModal() {
  modalVisible.value = false

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
  font-weight: 400;
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
  padding: 0.05rem;
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
}

.result-summary{
 color: black;
  width:100%;
  border-collapse: collapse;
  height:178px;
  border: 2px solid black;
}
.result-summary th{
  font-size: 14px;
  color: black;
  font-weight: 420;
  padding-left: 0.2rem;
  padding-right: 0.2rem;
  text-align: left;
  vertical-align: middle;
  border: 1px solid black;
}
.result-summary td{
  padding-left: 0.2rem;
  padding-right: 0.2rem;
  font-size: 14px;
  text-align: center;
  color: black;
  font-weight: 700;
  vertical-align: middle;
  border: 1px solid black;
}
.report-card-c{  
  width:100%;
  border-collapse: collapse;
  min-height:60px;
}
.report-card-c th{
  font-size: 14px;
  color: black;
  font-weight: 420;
  padding-left: 0.2rem;
  padding-right: 0.2rem;
  text-align: left;
  vertical-align: middle;
  width: 160px;
}
.report-card-c td{
  font-size: 14px;
  color: black;
  font-weight: 420;
  padding-left: 0.2rem;
  padding-right: 0.2rem;
  text-align: left;
  vertical-align: middle;
}

.report-table {
  color: black;
  width:100%;
  border-collapse: collapse;
  margin-bottom: 5px;
  margin-top: 50px;
}
.report-table td{ 
  border-collapse: collapse;
  padding:0.5rem;
  font-size: 12px;
  text-align: center;
  color: black;
  text-align: left;
}
.report-table th{
  border-collapse: true;
  padding:0.5rem;
  padding-left: 0.2rem;
  padding-right: 0.2rem;
  font-size: 13px;
  color: black;
  max-width:100px;
}
.report-table th.top{ 
  vertical-align: top; 
}
.report-table th.bottom{
  min-height: 50px;
  vertical-align: bottom;
  text-align: center;

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

.watermark::before {
  content: "";
  position: absolute; /* Covers entire viewport */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/Wm_Report.png');
  background-repeat: repeat; /* This tiles the image */
  opacity: 0.5; /* Adjust transparency as needed */
  z-index: 9999; /* Ensure it stays on top but behind content */
  pointer-events: none; /* Allows interaction with page elements */
}

</style>