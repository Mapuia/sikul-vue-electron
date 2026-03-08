<template>
  <div class="form-container full">
    

    <div v-if="isPublished">
      <div class="box single">
        <h2 class="subtitle has-text-centered">Mark Entry Disabled!</h2>
        <div class="notification is-danger">
          {{ currentExamName }} Result is Published on {{ publishDate }} <br />       
          <p class="has-text-weight-bold">You cannot enter marks after the Result is published.</p>
        </div>
      </div>
    </div>
    <div v-else>
      <h1 class="title has-text-centered is-4">Marks Entry for {{ currentExamName }} {{ CurrentYear }}</h1>
      <h2 class="subtitle has-text-centered">{{ examType ? "" : 'There is something wrong. Logout and login again'}}</h2>
      <!--selected Tabs-->
      <div class="box columns mb-4" v-if="examType !== 'selection'">
        <div class="column">
          <div
            class="tab-button has-text-centered is-clickable p-3"
            :class="selected === 'scholastic' ? 'has-background-success has-text-black' : ''"
            @click="selected = 'scholastic'"
          >
            Scholastic Subjects
          </div>
        </div>
        
        <div class="column">
          <div
            class="tab-button has-text-centered is-clickable p-3"
            :class="selected === 'coScholastic' ? 'has-background-primary has-text-black' : ''"
            @click="selected = 'coScholastic'"
          >
            Co-Scholastic Activities
          </div>
        </div>

        <div class="column">
          <div
            class="tab-button has-text-centered is-clickable p-3"
            :class="selected === 'attendance' ? 'has-background-success has-text-black' : ''"
            @click="selected = 'attendance'"
          >
            Attendance
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div v-if="successMessage" class="notification is-success fixed-notification pr-4" @click="successMessage = ''">
      
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="notification is-danger fixed-notification pr-4" @click="errorMessage = ''">
       
        {{ errorMessage }}
      </div>

      <div class="marks-entry-container">
        <aside class="left-panel box">
          <!-- Class Dropdown -->
          <div class="field">
            <label class="label">Class</label>
            <div class="select is-fullwidth is-small">
              <select v-model="selectedClassId">
                <option disabled value="" >-- Select Class --</option>
                <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                  Class - {{ cls.ClassName }}
                </option>
              </select>
            </div>
          </div>         

          <!-- Section Dropdown -->
          <div class="field">
            <label class="label">Section</label>
            <div class="select is-fullwidth is-small">
              <select v-model="selectedSectionId" :disabled="!selectedClassId || sections.length === 0">
                <option disabled value="">-- Select --</option>
                <option v-for="sec in sections" :key="sec.Id" :value="sec.Id">
                  {{ sec.SectionName }}
                </option>
              </select>
            </div>
          </div>

          <!-- Subject Dropdown -->
          <div v-if="selected != 'attendance'" class="field">
            <label class="label">{{ selected === "scholastic" ? "Subject" : "Co-Scholastic Activities" }}</label>
            <div class="select is-fullwidth is-small">
              <select v-model="selectedSubjectId" :disabled="!selectedClassId || !selectedSectionId && sections.length > 0">
                <option disabled value="">-- Select --</option>
                <option v-for="subject in subjects" :key="subject.Id" :value="subject.Id">
                  {{ subject.SubjectName }} {{ subject.SubjectCategory ? '(' + subject.SubjectCategory + ')' : '' }}
                </option>
              </select>
            </div>
          </div>
        </aside>
      
          <!-- Scholastic Marks Entry -->
        <div v-if="selected === 'scholastic'" class="main-content box column p-5">
          <div v-if="studentloaded && selectedSubjectId">
            <div class="title tab-heading has-text-weight-bold is-primary is-flex is-justify-content-space-between ">
              <div class="mb-3">
                {{ selectedSubjectName }} 
                
              </div>
              <div class="tags are-medium">
                <span class="tag ml-2">Pass Mark ({{ examType === 'selection' ? 35: PassingPercentage }}%)</span>
              </div>
            </div>            
                <label v-if="examType === 'selection'" class="checkbox"> 
                  <input 
                    type="checkbox" 
                    v-model="withoutInternalMarks"
                    @change="toggleWithoutInternalMarks"
                    :checked="withoutInternalMarks"                                       
                  > Check to proceed without Internal Marks
                </label>
            <div v-if="students.length > 0 || students.length === 1" class="is-flex is-flex-direction-column">
              <table class="table is-bordered is-striped is-fullwidth">
                <thead>
                  <tr>
                    <th rowspan="2" style="width: 100px; vertical-align: middle">Roll No.</th>
                    <th rowspan="2" style="min-width: 250px; vertical-align: middle">Student Name</th>
                    <th v-if="withoutInternalMarks" colspan="2" class="has-text-centered">Marks Scored</th>
                    <th v-else colspan="3" class="has-text-centered">Marks Scored</th>
                    <th rowspan="2" class="has-text-centered " style="vertical-align: middle">Appeared
                      <p class="control is-small">Select All</p>
                      <label class="checkbox"> 
                        <input 
                          type="checkbox" 
                          v-model="selectAllAppeared"
                          @change="toggleAllAppeared"                        
                        >
                      </label>
                    </th>
                    <th rowspan="2" style="vertical-align: middle">Status</th>
                  </tr>
                  <tr>
                    <th v-if="!withoutInternalMarks" class="has-text-centered" style="min-width: 100px;">
                      {{examType === "terminal" ? 'First Periodic Test' : examType === "annual" ? 'Second Periodic Test' : 'Internal'}}<br />
                      (FM: {{ selectedSubjectCategory === 'Major' ? periodicMajorMaxMark : periodicMinorMaxMark }})
                    </th>
                    <th class="has-text-centered" style="min-width: 100px;">
                      {{ currentExamName }}<br />
                      (FM: {{ selectedSubjectCategory === 'Major' ? terminalMajorMaxMark : terminalMinorMaxMark }})
                    </th>
                    <th class="has-text-centered">Total Marks</th>                 
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in students" :key="student.StudentId">
                    <td style="text-align: center;">{{ student.RollNo }}</td>
                    <td>{{ student.Name }}</td>
                    <!-- First Periodic Test Input -->
                    <td v-if="!withoutInternalMarks">
                      <input
                        :disabled="isPublished || !appeared[student.StudentId] || withoutInternalMarks"
                          type="number"
                          :class="{
                            'is-danger': markInvalid(student.StudentId, 'periodic'),
                            'is-light': !appeared[student.StudentId]
                          }"
                        :min="0"
                        :max="selectedSubjectCategory === 'Major' ? periodicMajorMaxMark : periodicMinorMaxMark"
                        class="input is-small"
                        
                        v-model.number="periodicMarks[student.StudentId]"
                        @keydown.enter="handleEnterKey($event, student.StudentId, 'periodic')"
                        @input="updateStatus(student.StudentId)"
                        data-type="periodic" 
                        :data-student-id="student.StudentId"
                      />
                    </td>

                    <!-- Marks Input -->
                    <td>
                      <input
                        :disabled="isPublished || !appeared[student.StudentId]"
                          type="number"
                          :class="{
                            'is-danger': markInvalid(student.StudentId, 'terminal'),
                            'is-light': !appeared[student.StudentId]
                          }"
                        :min="0"
                        :max="selectedSubjectCategory === 'Major' ? terminalMajorMaxMark : terminalMinorMaxMark"
                        class="input is-small"
                        
                        v-model.number="termMarks[student.StudentId]"
                        @keydown.enter="handleEnterKey($event, student.StudentId, 'terminal')" 
                        @input="updateStatus(student.StudentId)"
                        data-type="terminal" 
                        :data-student-id="student.StudentId"
                      />
                    </td>

                    <!-- Total -->
                    <td class="has-text-centered has-text-centered">
                      <input
                        :disabled="true"
                        type="number"
                        class="input is-small has-text-centered"
                        :value="calculateTotal(student.StudentId)"
                      />
                    </td>
                    <td class="has-text-centered has-text-centered">
                      <input
                        :checked="appeared[student.StudentId]"
                        :disabled="isPublished"
                        type="checkbox"
                        v-model="appeared[student.StudentId]"
                        :true-value="1"
                        :false-value="0"
                      />
                    </td>

                    <!-- Status -->
                    <td>
                      <span class="tag" :class="statuses[student.StudentId] === 'Pass' ? 'is-success' : 'is-danger'">
                        {{ statuses[student.StudentId] || 'N/A' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
                                
              <div class="is-flex is-align-items-center mt-3">
                <div class="buttons mt-2">
                  <button class="button is-primary mr-2" @click="saveMarks(true)" :disabled="isSaving">
                    <i class="fas fa-pencil-alt mr-2"></i>
                    {{ isSaving ? 'Saving...' : 'Save as Draft' }}
                  </button>
                  <button class="button is-primary mr-2" @click="saveMarks(false)" :disabled="isSaving">
                    <i class="fas fa-check-circle mr-2"></i>
                    {{ isSaving ? 'Saving...' : 'Submit Final Marks' }}
                  </button>
                  <button class="button is-dark" @click="resetMarkData" :disabled="isSaving">
                    <i class="fas fa-times mr-2"></i>
                    Clear all Marks
                  </button>
                </div>
              </div>
            </div>            
          
            <div v-else class="notification is-info is-danger is-fullwidth has-text-centered mt-4">
                No students found for this section.
            </div>            
          </div>
        
          <div v-else class="is-flex is-flex-direction-column p-5">
          <div class="subtitle">Steps to Enter Marks for Scholastic Subjects:</div>
            <div class="px-5">
              <ol class="mb-5"> 
                <li>Select Class
                  <span v-if="selectedClassId" class="icon has-text-info"><i class="fas fa-check"></i></span>
                </li>
                <li>Select Section if available.
                  <span v-if="selectedSectionId" class="icon has-text-info"><i class="fas fa-check"></i></span>
                </li>
                <li>
                  Select Subject
                  <span v-if="selectedSubjectId" class="icon has-text-info"><i class="fas fa-check"></i></span>           
                </li>
                <li>Enter Marks obtained in the input box.
                  <span v-if="marksEntered" class="icon has-text-info"><i class="fas fa-check"></i></span>
                </li>
                <li>Check "Select All" to select all students and uncheck "Un-Appeared student."
                  
                </li>
              </ol>
            </div>
          <hr />
          <div class="subtitle">
            Information <span class="icon has-text-info">
            <i class="fas fa-info-circle"></i></span>
          </div>
          <div class="px-5">
            <ol class="mb-5"> 
              
              <li>
                Student list for the selected section will be opened and enter the mark in the mark entry form.
              </li>
              <li>
                Pass/ Fail Status will be displayed automatically.
              </li>
              <li>
                Full Mark and Pass Marks are set up in the Master Data - Subjects and Exams.
              </li>
            </ol>
          </div>
          </div>              
        </div>
     
          <!-- Co-Scholastic Marks Entry -->
        <div v-if="selected === 'coScholastic'" class="main-content box column p-5">         
            <div v-if="studentloaded && selectedSubjectId" class="is-flex is-flex-direction-column">
              <div class="title tab-heading has-text-weight-bold mb-4">
                {{ selectedSubjectName }}
              </div>

              <div v-if="students.length > 0 || students.length === 1" class="is-flex is-flex-direction-column">
                <table class="table is-bordered is-striped is-fullwidth">
                  <thead>
                    <tr>
                      <th style="width: 80px">Roll No.</th>
                      <th >Student Name</th>
                      <th class="has-text-centered">Grade</th>           
                      <th class="has-text-centered">Appeared
                        <p class="control is-small">Select All</p>
                      <label class="checkbox"> 
                        <input 
                          type="checkbox" 
                          v-model="selectAllAppeared"
                          @change="toggleAllAppeared"
                          :disabled="isPublished"
                        >
                      </label>
                      </th>                   
                      
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="student in students" :key="student.StudentId">
                      <td>{{ student.RollNo }}</td>
                      <td>{{ student.Name }}</td>                      
                      <td>
                        <div class="select is-small is-fullwidth">
                          <select :disabled="!appeared[student.StudentId]"
                            v-model="grades[student.StudentId]"                         
                          >
                            <option disabled value="">-- Select Grade --</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      </td>
                      <td class="has-text-centered">
                      <input
                        :checked="appeared[student.StudentId]"
                        :disabled="isPublished"
                        type="checkbox"
                        v-model="appeared[student.StudentId]"
                        :true-value="1"
                        :false-value="0"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="is-flex is-justify-content-center mt-3">
                  <button 
                    class="button is-primary" 
                    @click="submitGrades"
                    :disabled="isSaving"
                  >
                    <span v-if="isSaving" class="icon is-small">
                      <i class="fas fa-spinner fa-spin"></i>
                    </span>
                    <span>{{ isSaving ? 'Saving...' : 'Submit Grades' }}</span>
                  </button>
                </div>
              </div>
              <p v-else class="notification is-info is-danger is-fullwidth has-text-centered mt-4">
                No students found for this section.
              </p>       
            </div>
            <div v-else class="button is-info has-text-centered is-flex is-align-items-center is-flex-direction-column p-5">
              Select Class, Section and Co-Scholastic Activity to enter Grades
            </div>         
        </div>

        <!-- Attendance -->
        <div v-if="selected === 'attendance'" class="main-content box column p-5">
                 
            <div v-if="studentloaded & selected === 'attendance'" class="is-flex is-flex-direction-column">
              <div class="title tab-heading has-text-weight-bold is-primary is-flex is-justify-content-space-between ">
              <div class="mb-3">
                Attendance
              </div>
              <div class="tags are-medium">
                <span class="tag ml-2">Total Working Days: {{ existingWorkingDays }}</span>
              </div>
            </div>      

              <div v-if="students.length > 0 || students.length === 1" class="is-flex is-flex-direction-column">
                <table class="table is-bordered is-striped is-fullwidth">
                  <thead>
                    <tr>
                      <th style="width: 80px">Roll No.</th>
                      <th >Student Name</th>
                      <th class="has-text-centered">Attendance</th>           
                      <th class="has-text-centered">Appeared
                        <p class="control is-small">Select All</p>
                      <label class="checkbox"> 
                        <input 
                          type="checkbox" 
                          v-model="selectAllAppeared"
                          @change="toggleAllAppeared"
                          :disabled="isPublished"
                        >
                      </label>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="student in students" :key="student.StudentId">
                      <td>{{ student.RollNo }}</td>
                      <td>{{ student.Name }}</td>                      
                      <td>
                        <input
                          :disabled="isPublished || !appeared[student.StudentId]"
                            type="number"
                            :class="{
                              'is-danger': attendanceInvalid(student.StudentId),
                              'is-light': !appeared[student.StudentId]
                            }"
                          :min="0"
                          :max="existingWorkingDays"
                          class="input is-small"
                          
                          v-model.number="attendance[student.StudentId]"
                          @keydown.enter="handleEnterKey1($event, student.StudentId)"                           
                          data-type="terminal" 
                          :data-student-id="student.StudentId"
                        />

                          <!-- <input class="input is-small has-text-centered" 
                          type="number" 
                          v-model="attendance[student.StudentId]" 
                          :disabled="!appeared[student.StudentId]" /> -->
                      </td>
                      <td class="has-text-centered">
                      <input
                        :checked="appeared[student.StudentId]"
                        :disabled="isPublished"
                        type="checkbox"
                        v-model="appeared[student.StudentId]"
                        :true-value="1"
                        :false-value="0"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="is-flex is-justify-content-center mt-3">
                  <button 
                    class="button is-primary" 
                    @click="submitAttendance"
                    :disabled="isSaving"
                  >
                    <span v-if="isSaving" class="icon is-small">
                      <i class="fas fa-spinner fa-spin"></i>
                    </span>
                    <span>{{ isSaving ? 'Saving...' : 'Submit Attendance' }}</span>
                  </button>
                </div>
              </div>
              <p v-else class="notification is-info is-danger is-fullwidth has-text-centered mt-4">
                No students found for this section.
              </p>       
            </div>
            <!-- <div 
              v-else-if="workingDays === null || workingDays === ''" 
              class="working-days-container"
            >
              <label class="label">Enter the Number of Working Days</label>
              <input 
                class="input" 
                type="number"
                v-model="noOfWorkingDays"
              />
              <button class="button is-primary mt-3" @click="submitWorkingDays()">Submit</button>
            </div> -->

            
            <div v-if="selectedClassId" class="box has-text-centered" >
              <h1 class="">
              Total Working Days: <b>{{ existingWorkingDays }}</b>
              </h1>
            </div>
            <div v-else class="button is-info has-text-centered is-flex is-align-items-center is-flex-direction-column p-5">
             Select Class and Section to enter the attendance.
            </div>

            <!-- Modal -->
            <div 
              class="modal" 
              :class="{ 'is-active': workingDaysModal }"
            >
              <div class="modal-background"></div>
              <div class="modal-card working-days-modal">
                <header class="modal-card-head">
                  <p class="modal-card-title">Working Days - {{ currentExamName }}</p>
                 
                </header>
                
                <section class="modal-card-body">                 
                  <label class="label">Enter the Number of total Working Days </label>                  
                  <input 
                    class="input"
                    type="number"
                    v-model="noOfWorkingDays"
                    
                  />                
                </section>

                <footer class="modal-card-foot is-justify-content-center">
                  <button class="button is-primary mr-1" @click="submitWorkingDays()">Submit</button>
                  <button class="button" @click="closeAndReturn">Cancel</button>
                </footer>
                
              </div>
            </div>      
        </div>
        <!--End of Marks Entry-->
      </div>     
    </div> 
  </div> 

  


</template>

<script setup>
import { ref, watch, computed, onMounted} from 'vue'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'
import { useRoute } from 'vue-router'
const route = useRoute()

const { CurrentYearId, CurrentYear, loadAcademicYear } = useAcademicYear()
const { 
  periodicMajorMaxMark,
  periodicMinorMaxMark,
  terminalMajorMaxMark,
  terminalMinorMaxMark,
  PassingPercentage,      
  loadActiveExam 
} = useActiveExam()

import { useResultStatus } from '../../composables/useResultStatus'
const { isPublished, publishDate, checkResultStatus } = useResultStatus()
import { useClassesSections } from '../../composables/useClassesSections'
const { classes, sections, loadClasses, loadSections } = useClassesSections()

// ============== REACTIVE STATE ==============
// Exam related
const examType = ref('')
const currentExamId = ref('')
const currentExamName = ref('')
// const Result_Published = ref(false)

// UI state
const withoutInternalMarks = ref(true)
const selected = ref('scholastic') // Default to Scholastic Subjects
const successMessage = ref('')
const errorMessage = ref('')
const isSaving = ref(false)
const studentloaded = ref(false)
const selectAllAppeared = ref(false)

// Data lists
// const classes = ref([])
// const sections = ref([])
const subjects = ref([])
const students = ref([])

// Selected values
const selectedClassId = ref('')
const selectedSectionId = ref('')
const selectedSubjectId = ref('')
const marksEntered = ref(false)

// Marks data
const periodicMarks = ref({})
const termMarks = ref({})
const statuses = ref({})
const appeared = ref({})
const grades = ref({})
const attendance = ref({})
const existingWorkingDays = ref(null)
const noOfWorkingDays = ref('')
const workingDaysModal = ref(false)

watch(() => route.query.type, async (newType) => {
  examType.value = newType
  await getExam()
  checkResultStatus(currentExamId.value, CurrentYearId.value)  
  fetchClasses() 
  resetSelections()  
  //fetchWorkingDays()
  selected.value = 'scholastic'
  if(newType === 'annual') {
    classes.value = classes.value.filter(cls => cls.ClassName !== 'X')
  }
    
}, { immediate: true })

// ============== COMPUTED PROPERTIES ==============
const resultName = computed(() => examType.value === 'terminal' ? 'Half Yearly' : examType.value === 'annual' ? 'Final Exam': 'Selection Test Result')

const selectedSubjectName = computed(() => 
  subjects.value.find(sub => sub.Id === selectedSubjectId.value)?.SubjectName || ''
)

const selectedSubject = computed(() => 
  subjects.value.find(subject => subject.Id === selectedSubjectId.value) || null
)

const selectedSubjectCategory = computed(() => 
  selectedSubject.value?.SubjectCategory || null
)

// const isMarkEntryDisabled = computed(() => {
//   if (examType.value === 'annual') return Final_Published.value
//   if (examType.value === 'terminal') return Terminal_Published.value
//   if (examType.value === 'selection') return false // or some other condition
//   return false
// })

function toggleWithoutInternalMarks() {
  // Clear periodic marks if toggled to without internal marks
  if (withoutInternalMarks.value) {
    for (const studentId in periodicMarks.value) {
      periodicMarks.value[studentId] = 0
    }
    //console.log("Without Internal Marks toggled ON", withoutInternalMarks.value)
  }  
}
//WORKING DAYS 
async function fetchWorkingDays(){ 
  const params = {
        yearId: CurrentYearId.value,
        classId: selectedClassId.value,
        term: examType.value
      }
  try{         
    const res = await window.electronAPI.getWorkingDays(params)
    // console.log("wORKINGDAYS  Data:", params)
    if(res.success){
        existingWorkingDays.value = res.workingDays
        if(existingWorkingDays.value === '' || existingWorkingDays.value === undefined) 
        workingDaysModal.value = true
    }         
    else return
      
  }catch(err){
    console.log("Something went Wrong", err.message)
  }
}

// ============== LIFECYCLE HOOKS ==============
onMounted(async () => {   
  await loadActiveExam()
  //checkResultStatus(currentExamId.value, CurrentYearId.value)
  //await fetchWorkingDays()    
  //console.log("Check for ExamId", currentExamName.value)
})
// ============== WATCHERS ==============
// Watch route changes



// Watch tab changes
watch(selected, async (newTab) => {
  await resetSelections()
  await fetchClasses()

  // console.log("Selected is activated", selected.value)
})

// Watch class changes
watch(selectedClassId, async (classId) => {
  // console.log('selected class Id:', selectedClassId.value)
  if(selected.value === 'attendance'){
    await fetchWorkingDays()
  }
  selectedSubjectId.value = ''
  if (!classId) {
    resetSectionData()    
    return
  } 
  
  selectedSectionId.value = ''
  marksEntered.value = false
  await fetchSections(classId)
  await fetchSubjects(classId)
  studentloaded.value = false 
  
})

// Watch section changes
watch(selectedSectionId, async (sectionId) => {
  if (!selectedClassId.value || !sectionId) {
    resetStudentData()
    return
  }
  // await verifyResultStatus()
  await loadStudentsBySectionId()
  if(selected.value !== 'attendance') {
    studentloaded.value = false
  }else {
    studentloaded.value = true
  }

})

// Watch subject changes
watch(selectedSubjectId, async (subjectId) => {
  if (!subjectId) return
  
  if (selected.value === "scholastic") {
    await loadExistingMarks()
  } else if (selected.value === "coScholastic") {
    await loadExistingGrades()
  }
  
  studentloaded.value = true
  selectAllAppeared.value = false
  
  if (marksEntered.value) {
    const confirmed = await window.electronAPI.showConfirmationDialog(
      `There are existing ${selected.value === "scholastic" ? "Marks" : "Grades"} entered for the selected Subject. 
      If you change the existing entries, the existing entries will be replaced. 
      You can continue adding more entries, existing entries will not be lost.`
    )
    if (!confirmed) {
      selectedSubjectId.value = ''
      studentloaded.value = false
    } 
  }
})

// Watch appeared status changes
watch(appeared, (newVal) => {
  for (const studentId in newVal) {
    if (newVal[studentId] === 0) {
      periodicMarks.value[studentId] = null
      termMarks.value[studentId] = null
    }
  }
}, { deep: true })


// ============== DATA FETCHING FUNCTIONS ==============
async function getExam() {
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  currentExamId.value = result.exam.Id
  currentExamName.value = result.exam.ExamName
  checkResultStatus(currentExamId.value, CurrentYearId.value) 
}

async function fetchClasses() {
  const result = await window.electronAPI.getClasses()
  if (result.success) {
    if (examType.value === 'selection') {      
      classes.value = result.classes.filter(cls => cls.ClassName === 'X')
      //console.log("Classes for Selection Test:", classes.value)
      if (classes.value.length > 0) {
        selectedClassId.value = classes.value[0].Id
      }
    } 
    else if (examType.value === 'annual') {      
      classes.value = result.classes.filter(cls => cls.ClassName !== 'X')
      //console.log("Classes for Annual Exam:", classes.value)      
    }
    else {     
      classes.value = result.classes
    }
  }
}

async function fetchSections(classId) {
  const secResult = await window.electronAPI.getSectionsByClassId(classId) 
  if (secResult.success) {
    sections.value = secResult.sections  
  }
  if (sections.value.length === 0) {
    selectedSectionId.value = 0
    await verifyResultStatus()
    await loadStudentsBySectionId()     
  }
}

async function fetchSubjects(classId) {  
  const result = await window.electronAPI.getSubjectsByClassId(classId, selected.value);
  if (result.success) {
    if (examType.value === 'selection' && classes.value.some(cls => cls.ClassName === 'X')) {
      // Filter out EVS subject for selection exam type and Class X
      subjects.value = result.subjects.filter(subject => subject.SubjectName !== 'EVS');
    } else {
      subjects.value = result.subjects;
    }
  }
}

async function loadStudentsBySectionId() {
  try {
    const result = await window.electronAPI.getStudentsByClassAndSection({ 
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value,
      AcademicYearId: CurrentYearId.value,
    })

    if (result.success) {
      students.value = await result.students
      resetMarkData()
    } else {
      resetStudentData()
    }
  } catch (error) {
    console.error('Error loading students:', error)
    resetStudentData()
  }
}

async function loadExistingMarks() {
  try {
    const result = await window.electronAPI.getMarksByExamSubject({
      examId: currentExamId.value,
      subjectId: selectedSubjectId.value,
      ClassId: selectedClassId.value,
      SectionId: selectedSectionId.value
    })
    
    periodicMarks.value = {}
    termMarks.value = {}
    
    result.forEach(mark => {
      periodicMarks.value[mark.StudentId] = mark.PeriodicMarksObtained || ''
      termMarks.value[mark.StudentId] = mark.TerminalMarksObtained || ''
      statuses.value[mark.StudentId] = mark.SubjectResult || "N.A."
      appeared.value[mark.StudentId] = mark.SubjectResult === 'N.A.' ? 0 : 1
    })
 
    marksEntered.value = result.length > 0
  } catch (error) {
    console.error("Failed to load marks:", error)
    errorMessage.value = "Failed to load existing marks"
    setTimeout(() => errorMessage.value = '', 3000)
  }
}

async function loadExistingGrades() {
  try {
    const result = await window.electronAPI.getCoScholasticMarks({
      examId: currentExamId.value,
      subjectId: selectedSubjectId.value,
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value || 0
    })
    
    grades.value = {}    
    if (result.success) {
      result.grades.forEach(grade => {
        grades.value[grade.StudentId] = grade.Grade
      })
      marksEntered.value = result.length > 0
    }   
  } catch (error) {
    console.error("Error loading existing grades:", error)
  }
}

// ============== RESET FUNCTIONS ==============
async function resetSelections() {
  selectedClassId.value = ''
  selectedSectionId.value = ''
  selectedSubjectId.value = ''
  resetStudentData()
  resetMarkData()
  resetGrades()
  studentloaded.value = false
  selectAllAppeared.value = false
  appeared.value = {}
  withoutInternalMarks.value = false
  workingDaysModal.value = false
}

function resetSectionData() {
  sections.value = []
  subjects.value = []
  selectedSectionId.value = ''
  resetStudentData()
}

function resetStudentData() {
  students.value = []
  resetMarkData()
}

function resetMarkData() {
  periodicMarks.value = {}
  termMarks.value = {}
  statuses.value = {}
  appeared.value = {}
}

function resetGrades() {
  grades.value = {}
}

// ============== MARK ENTRY FUNCTIONS ==============
function toggleAllAppeared() {
  students.value.forEach(student => {
    appeared.value[student.StudentId] = selectAllAppeared.value
  })
}

function calculateTotal(studentId) {
  const pmarks = periodicMarks.value[studentId] || 0 
  const tmarks = termMarks.value[studentId] || 0
  return pmarks + tmarks
}

function markInvalid(studentId, type) {
  const val = type === 'periodic' 
    ? periodicMarks.value[studentId] 
    : termMarks.value[studentId]
  
  if (!appeared.value[studentId]) return false
  
  if(appeared.value[studentId] && (periodicMarks.value[studentId] === '' || termMarks.value[studentId] === '')) {
    return true 
  }
  
  if (val === null || val === undefined) return true
  
  const maxMark = selectedSubjectCategory.value === 'Major' 
    ? (type === 'periodic' ? periodicMajorMaxMark.value : terminalMajorMaxMark.value)
    : (type === 'periodic' ? periodicMinorMaxMark.value : terminalMinorMaxMark.value)
  
  return val < 0 || val > maxMark
}
function studentInvalid(studentId, examType) {
  if (!appeared.value[studentId]) return false
  if(examType === 'selection') {
    if ((periodicMarks.value[studentId] === null || periodicMarks.value[studentId] === undefined || periodicMarks.value[studentId] === '')) {
      return false 
    }
    if(termMarks.value[studentId] === null || termMarks.value[studentId] === undefined || termMarks.value[studentId] === '') {
      return true 
    }
  }
  else {
    if ((periodicMarks.value[studentId] === null || periodicMarks.value[studentId] === undefined || periodicMarks.value[studentId] === '') ||
      (termMarks.value[studentId] === null || termMarks.value[studentId] === undefined || termMarks.value[studentId] === '')) {
    return true 
  }}
  
  const pmarks = periodicMarks.value[studentId]
  const tmarks = termMarks.value[studentId]
  
  const periodicMax = selectedSubjectCategory.value === 'Major' 
    ? periodicMajorMaxMark.value 
    : periodicMinorMaxMark.value
  const terminalMax = selectedSubjectCategory.value === 'Major' 
    ? terminalMajorMaxMark.value 
    : terminalMinorMaxMark.value
  
  return pmarks < 0 || pmarks > periodicMax || tmarks < 0 || tmarks > terminalMax
}

function attendanceInvalid(studentId) {
  const val = attendance.value[studentId]
  
  if (!appeared.value[studentId]) return false
  
  if (val === null || val === undefined) return true
      
  return val < 0 || val > existingWorkingDays.value
}

function updateStatus(studentId) {
  const total = calculateTotal(studentId)
  
  if(examType.value=== 'selection'){
    PassingPercentage.value = 35
    if(withoutInternalMarks.value) {
      periodicMajorMaxMark.value = 0
      periodicMinorMaxMark.value = 0   
    }
    
  }
  
  const maxTotal = (selectedSubjectCategory.value === 'Major' 
    ? (periodicMajorMaxMark.value + terminalMajorMaxMark.value)
    : (periodicMinorMaxMark.value + terminalMinorMaxMark.value))  
  const passMark = Math.ceil(maxTotal * (PassingPercentage.value / 100))
  
  statuses.value[studentId] = total >= passMark ? 'Pass' : 'Fail'
}

function handleEnterKey(event, studentId, type) {
  if (event.key === 'Enter') {
    event.preventDefault()
    const currentIndex = students.value.findIndex(s => s.StudentId === studentId)

    if (type === 'periodic') {
      const terminalInput = document.querySelector(
        `input[data-student-id="${studentId}"][data-type="terminal"]`
      )
      if (terminalInput) terminalInput.focus()
    } else if (type === 'terminal' && currentIndex < students.value.length - 1) {
      const nextStudentId = students.value[currentIndex + 1].StudentId
      const nextInput = document.querySelector(
        `input[data-student-id="${nextStudentId}"][data-type="periodic"]`
      )
      if (nextInput) nextInput.focus()
    }
  }
}

function handleEnterKey1(event, studentId) {
  if (event.key === 'Enter') {
    event.preventDefault()
    const currentIndex = students.value.findIndex(s => s.StudentId === studentId)   
    if (currentIndex < students.value.length - 1) {
      const nextStudentId = students.value[currentIndex + 1].StudentId
      const nextInput = document.querySelector(
        `input[data-student-id="${nextStudentId}"]`
      )
      if (nextInput) nextInput.focus()
    }
  }
}

// ============== DATA SAVING FUNCTIONS ==============
async function submitWorkingDays(){
  //console.log("button clicked")
  try{
    const workingDaysData = {
      yearId: CurrentYearId.value,
      classId: selectedClassId.value,
      term: examType.value,
      noOfWorkingDays: noOfWorkingDays.value
    }
    const res = await window.electronAPI.insertWorkingDays(workingDaysData)
    if(res.success)
    window.electronAPI.showInfoDialog(`Working Days entered successfully.`)
    workingDaysModal.value=false
    await fetchWorkingDays()

  }catch(error){
    window.electronAPI.showErrorDialog(`Error: ${error.message}`)
    console.error("Error submitting attendance:", error)
  }

}

async function submitAttendance() {
  if (!selectedClassId.value || selectedSectionId.value === '') {
    window.electronAPI.showInfoDialog('Please select class and section')
    return
  }

  const invalidStudents = students.value.filter(student => 
    attendanceInvalid(student.StudentId)
  )

  if (invalidStudents.length > 0) {
    errorMessage.value = 'Please enter valid Attendance for all appeared students'
    setTimeout(() => errorMessage.value = '', 5000)
    return
  }  
  
  isSaving.value = true
  try {
    const attendanceData = students.value
      .filter(student => appeared.value[student.StudentId])
      .map(student => ({
        StudentId: student.StudentId,             
        Attendance: attendance.value[student.StudentId] || 0
       
      }))

    const examData = {
      AcademicYearId: CurrentYearId.value,
      ActiveExamId: currentExamId.value,
      TotalWorkingDays: existingWorkingDays.value,
      ExamType: examType.value
    }

    const result = await window.electronAPI.saveAttendance(attendanceData, examData)

    if (result.success) {
      // successMessage.value = 'Attendance submitted successfully!'
      window.electronAPI.showInfoDialog('Attendance submitted successfully!')
      // selectedSectionId.value = ''
      // selectedClassId.value = ''
      // selected.value = 'attendance'
      setTimeout(() => successMessage.value = '', 3000)
      await loadStudentsBySectionId()
    } else {
      throw new Error(result.error || 'Failed to save attendance')
    }
  } catch (error) {
    window.electronAPI.showErrorDialog(`Error: ${error.message}`)
    console.error("Error submitting attendance:", error)
  } finally {
    isSaving.value = false
  }
}

async function submitGrades() {
  if (!selectedClassId.value || selectedSectionId.value === '' || !selectedSubjectId.value) {
    window.electronAPI.showInfoDialog('Please select class, section, and co-scholastic activity')
    return
  }
  
  isSaving.value = true
  try {
    const gradesData = students.value
      .filter(student => appeared.value[student.StudentId])
      .map(student => ({
        StudentId: student.StudentId,
        SubjectId: selectedSubjectId.value,
        ActiveExamId: currentExamId.value,
        Grade: grades.value[student.StudentId]
      }))
    
    const result = await window.electronAPI.saveCoScholasticMarks(gradesData)

    if (result.success) {
      successMessage.value = 'Grades submitted successfully!'
      setTimeout(() => successMessage.value = '', 3000)
      selectedSubjectId.value = ''
      await loadExistingGrades()
    } else {
      throw new Error(result.error || 'Failed to save grades')
    }
  } catch (error) {
    window.electronAPI.showErrorDialog(`Error: ${error.message}`)
    console.error("Error submitting grades:", error)
  } finally {
    isSaving.value = false
  }
}

async function saveMarks(isDraft = false) {
  const invalidStudents = students.value.filter(student => 
    studentInvalid(student.StudentId, examType.value === 'terminal' ? 'terminal' : examType.value === 'annual' ? 'annual' : 'selection')
  )

  if (!isDraft && invalidStudents.length > 0) {
    errorMessage.value = 'Please enter valid marks for all appeared students'
    setTimeout(() => errorMessage.value = '', 5000)
    return
  }  

  isSaving.value = true
  errorMessage.value = ''

  try {
    let periodicMax = selectedSubjectCategory.value === 'Major' 
      ? periodicMajorMaxMark.value 
      : periodicMinorMaxMark.value
    
    let terminalMax = selectedSubjectCategory.value === 'Major' 
      ? terminalMajorMaxMark.value 
      : terminalMinorMaxMark.value
    
    let totalMax = periodicMax + terminalMax
    if (withoutInternalMarks.value) {
      totalMax = terminalMax
      periodicMax = 0
    }
// console.log("Without Internal Marks while saving:", withoutInternalMarks.value)
// console.log("totalMax:", totalMax)
    const marksData = students.value
      .filter(student => !!appeared.value[student.StudentId])
      .map(student => {
        const periodicMarksObtained = periodicMarks.value[student.StudentId] || 0
        const terminalMarksObtained = termMarks.value[student.StudentId] || 0
        const totalMarksObtained = periodicMarksObtained + terminalMarksObtained
        return {
          StudentId: student.StudentId,        
          PeriodicMaxMark: periodicMax,
          TerminalMaxMark: terminalMax,
          TotalMaxMarks: totalMax,
          PeriodicMarksObtained: periodicMarksObtained,
          TerminalMarksObtained: terminalMarksObtained,
          TotalMarksObtained: totalMarksObtained,
          SubjectResult: statuses.value[student.StudentId]
        }
      })

    const subjectData = {
      YearId: CurrentYearId.value, 
      ExamId: currentExamId.value,   
      ExamType: examType.value,   
      ClassId: selectedClassId.value,
      SectionId: selectedSectionId.value === '' ? 0 : selectedSectionId.value,
      SubjectId: selectedSubjectId.value,
      WithoutInternalMarks: withoutInternalMarks.value
    }
    // console.log("Marks Data to be saved:", marksData)
    const result = await window.electronAPI.saveMarks({marksData, subjectData})
    if (result.success) {
      if (isDraft) {
        successMessage.value = 'Draft saved successfully!'
        selectedSubjectId.value = ''
      } else {
        successMessage.value = 'Marks submitted successfully!'
        selectedSubjectId.value = ''
        marksEntered.value = true
        studentloaded.value = true
      }
      setTimeout(() => successMessage.value = '', 3000)
    } else {
      throw new Error(result.message || 'Failed to save marks.....') 
    }
  } catch (err) {
    errorMessage.value = err.message
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    isSaving.value = false
  }
}


// ============== UTILITY FUNCTIONS ==============
// function closeModal() {
//   if(noOfWorkingDays.value === null || noOfWorkingDays.value === ''){
//     window.electronAPI.showConfirmationDialog("Please enter the number of working days to proceed.")
//     return
//   }  
// }

function closeAndReturn(){
  selected.value = 'scholastic'
}

// async function verifyResultStatus() { 
//   const result = await window.electronAPI.verifyResultStatus({
//     academicYearId: CurrentYearId.value,
//     resultType: examType.value === 'terminal' ? examType.value : 
//                examType.value === 'selection' ? 'selection' : 'final',
//     examId: currentExamId.value,
//     classId: selectedClassId.value,
//     sectionId: selectedSectionId.value
//   })       
  
//   if (result.success) {
//     Result_Published.value = result.isPublished
//     return    
//   }
// }
</script>

<style scoped>
.marks-entry-container {
  display: flex;
  gap: 1rem;
  min-height: 500px;
}

.left-panel {
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.title{
  padding-bottom: 0rem;
  margin-bottom: 0rem;
  
}
.main-content {
  flex: 1;
  width:100%
}
.columns{
  padding: 0.5rem;
  margin: 0;
}

.tab-button{
 border: 1px solid rgb(126, 126, 126);
 border-radius: 10px;
}

.thin-line {
  border: none;
  border-top: 1px solid #3c3b3b;
}

.is-clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.is-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}




</style>