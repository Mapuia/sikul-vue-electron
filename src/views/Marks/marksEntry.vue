<template>
  <div class="form-container full">
    <h1 class="title has-text-centered is-4">Marks Entry for {{ currentExamName }}</h1>
    <h2 class="subtitle has-text-centered">{{ examType ? "" : 'There is something wrong. Logout and login again'}}</h2>

    <div v-if="isMarkEntryDisabled">
      <div class="box single">
        <h2 class="subtitle has-text-centered">Mark Entry Disabled!</h2>
        <div class="notification is-danger">
          Final Result for Current Session <strong>{{ CurrentYear }}</strong> is Published. <br />       
          To enter marks for New Academic Year, Go to Manage Sessions to set new Academic Year.
        </div>
      </div>
    </div>
    <div v-else>
      <!--selected Tabs-->
      <div class="box columns mb-4">
        <div class="column">
          <div
            class="tab-button has-text-centered is-clickable p-3"
            :class="selected === 'Scholastic' ? 'has-background-success has-text-black' : ''"
            @click="selected = 'Scholastic'"
          >
            Scholastic Subjects
          </div>
        </div>
        <div class="column">
          <div
            class="tab-button has-text-centered is-clickable p-3"
            :class="selected === 'Co-Scholastic' ? 'has-background-primary has-text-black' : ''"
            @click="selected = 'Co-Scholastic'"
          >
            Co-Scholastic Activities
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
          <div class="field">
            <label class="label">{{ selected === "Scholastic" ? "Subject" : "Co-Scholastic Activities" }}</label>
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
        <div v-if="selected === 'Scholastic'" class="main-content box column p-5">
          <div v-if="studentloaded && selectedSubjectId">
            <div class="title tab-heading has-text-weight-bold is-primary is-flex is-justify-content-space-between ">
              <div>
                {{ selectedSubjectName }}
              </div>
              <div class="tags are-medium">
                <span class="tag ml-2">Pass Mark ({{ PassingPercentage }}%)</span>
              </div>
            </div>            
          
            <div v-if="students.length > 0 || students.length === 1" class="is-flex is-flex-direction-column">
              <table class="table is-bordered is-striped is-fullwidth">
                <thead>
                  <tr>
                    <th rowspan="2" style="width: 100px; vertical-align: middle">Roll No.</th>
                    <th rowspan="2" style="min-width: 150px; vertical-align: middle">Student Name</th>
                    <th colspan="3" class="has-text-centered">Marks Scored</th>
                    <th rowspan="2" class="has-text-centered " style="vertical-align: middle">Appeared
                      <p class="control is-small">Select All</p>
                      <label class="checkbox"> 
                        <input 
                          type="checkbox" 
                          v-model="selectAllAppeared"
                          @change="toggleAllAppeared"
                          :disabled="Result_Published || isMarkEntryDisabled"
                        >
                      </label>
                    </th>
                    <th rowspan="2" style="vertical-align: middle">Status</th>
                  </tr>
                  <tr>
                    <th class="has-text-centered" style="min-width: 100px;">
                      {{examType === "terminal" ? 'First' : 'Second'}} Periodic Test<br />
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
                    <td>
                      <input
                        :disabled="Result_Published || isMarkEntryDisabled || !appeared[student.StudentId]"
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
                        :disabled="Result_Published || isMarkEntryDisabled || !appeared[student.StudentId]"
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
                        :disabled="Result_Published || isMarkEntryDisabled"
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
                  <button class="button is-primary mr-2" @click="saveMarks" :disabled="Result_Published || isSaving">
                    <i class="fas fa-save mr-2"></i>
                    {{ Result_Published ? 'Results Published - Marks Locked' : isSaving ? 'Saving...' : 'Save' }}
                  </button>
                  <button class="button is-dark" @click="resetMarkData" :disabled="Result_Published || isSaving">
                    <i class="fas fa-times mr-2"></i>
                    Clear all Marks
                  </button>
                </div>
              </div>
            </div>            
          
            <div v-else class="notification is-info is-dark is-fullwidth has-text-centered">
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
        <div v-else class="main-content box column p-5">         
            <div v-if="studentloaded && selectedSubjectId" class="is-flex is-flex-direction-column">
              <div class="title tab-heading has-text-weight-bold">
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
                          :disabled="Result_Published || isMarkEntryDisabled"
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
                            v-model="Grades[student.StudentId]"                         
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
                        :disabled="Result_Published || isMarkEntryDisabled"
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
              <p v-else class="has-text-grey has-text-centered mt-4">
                No students found for this section.
              </p>       
            </div>
            <div v-else class="button is-info has-text-centered is-flex is-align-items-center is-flex-direction-column p-5">
              Select Class, Section and Co-Scholastic Activity to enter Grades
            </div>         
        </div>
        <!--End of Marks Entry-->
      </div>     
    </div> 
  </div>   
</template>

<script setup>
import { ref, watch, watchEffect,computed, onMounted, reactive } from 'vue'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const { CurrentYearId, CurrentYear, loadAcademicYear } = useAcademicYear()
const { 
  periodicMajorMaxMark,
  periodicMinorMaxMark,
  terminalMajorMaxMark,
  terminalMinorMaxMark,
  Terminal_Published,
  Annual_Published,
  PassingPercentage,      
  loadActiveExam 
} = useActiveExam()

const Final_Published = Annual_Published.value
const HalfYearly_Published = Terminal_Published.value
// Reactive state
const examType = ref('')
const currentExamId = ref('')
const currentExamName = ref('')
const selected = ref('Scholastic') // Default to Scholastic Subjects
const classes = ref([])
const sections = ref([])
const subjects = ref([])
const students = ref([])
const selectedClassId = ref('')
const selectedSectionId = ref('')
const selectedSubjectId = ref('')
const marksEntered = ref(false)

const Grades = ref({})

const periodicMarks = ref({})
const termMarks = ref({})
const statuses = ref({})
const appeared = ref({}) // Track if student appeared for exam
const Result_Published = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const isSaving = ref(false)
//const finished = ref(false)
const studentloaded = ref(false)
const selectAllAppeared = ref(false) // For toggling all appeared checkboxes
// Watch for selectAllAppeared changes to toggle all appeared checkboxes  

function toggleAllAppeared() {
  students.value.forEach(student => {
    appeared.value[student.StudentId] = selectAllAppeared.value
  })
}

// Routing from Navbar, set examType from query
watch(() => route.query.type, (newType) => {
  examType.value = newType
  getExam()
  fetchClasses() 
  selectedClassId.value = ''
  selectedSectionId.value = 0
  selectedSubjectId.value = ''
}, { immediate: true })

// Redirected from Results page, set examType from query
watch(() => route.query, (newQuery) => {
  if( newQuery.examType) {
    examType.value = newQuery.examType
    fetchClasses() 
    getExam()
  }
}, { immediate: true })

// On Page Load, get examId and examName
async function getExam() {
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  currentExamId.value = result.exam.Id
  currentExamName.value = result.exam.ExamName
  //console.log("CurrentExam Id: in get examId", currentExamId.value)
}

//Fetch available Classes
async function fetchClasses() {
  const result = await window.electronAPI.getClasses()
  if (result.success) classes.value = result.classes
}

// Initialization
onMounted(async () => {
  await Promise.all([
    loadAcademicYear(),
    loadActiveExam()       
  ])  
})

watch(selected, (newTab) => {
  // Reset all selections when switching tabs
  selectedClassId.value = null
  selectedSectionId.value = 0
  selectedSubjectId.value = null
  fetchClasses() // Fetch classes when 
  // Reset other related data
  students.value = []
  periodicMarks.value = {}
  termMarks.value = {}
  statuses.value = {}
  Grades.value = {}
  appeared.value = {}

  //console.log("Selected Tab:", selected.value)
  
})

// Watch for class changes
watch(selectedClassId, async (classId) =>{
  selectedSubjectId.value = ''
  if (!classId) {
    resetSectionData()    
    return
  } 
  marksEntered.value = false
  const secResult = await window.electronAPI.getSectionsByClassId(classId) 
  if (secResult.success) {
    sections.value = secResult.sections  
  }
  if (sections.value.length === 0){
    selectedSectionId.value = 0
    loadStudentsBySectionId()
    verifyResultStatus() 
    }    
    
    studentloaded.value = false 
    const result = await window.electronAPI.getSubjectsByClassId(selectedClassId.value, selected.value)
    if (result.success) subjects.value = result.subjects
})
// Computed properties
const selectedSubjectName = computed(() => {
    return subjects.value.find(sub => sub.Id === selectedSubjectId.value)?.SubjectName || ''
})

const selectedSubject = computed(() => {
  return subjects.value.find(subject => subject.Id === selectedSubjectId.value) || null
})

const selectedSubjectCategory = computed(() => {
  return selectedSubject.value?.SubjectCategory || null
})

const isMarkEntryDisabled = computed(() => {
  if(examType.value === 'annual') {
    return Final_Published
  }
  return HalfYearly_Published
})

watch(Result_Published, (newVal) => {
  if(newVal) {
    router.push('/')   
    alert("Result is already Published, Mark Entry is disabled")   
  }
})
async function verifyResultStatus() { 
    const result = await window.electronAPI.verifyResultStatus({
            academicYearId: CurrentYearId.value,
            resultType: examType.value === 'terminal' ? examType.value : 'final', //if examType is not terminal, result will be final
            examId: currentExamId.value,
            classId: selectedClassId.value,
            sectionId: selectedSectionId.value
          })       
    if (result.success) {
      Result_Published.value = result.isPublished      
    }
}

// Methods
const calculateTotal = (studentId) => {
  const pmarks = periodicMarks.value[studentId] || 0 
  const tmarks = termMarks.value[studentId] || 0
  return pmarks + tmarks
}
watch(appeared, (newVal) => {
  for (const studentId in newVal) {
    if (newVal[studentId] === 0) {
      periodicMarks.value[studentId] = null;
      termMarks.value[studentId] = null;
    }
  }
}, { deep: true });

const markInvalid = (studentId, type) => {
  const val = type === 'periodic' 
    ? periodicMarks.value[studentId] 
    : termMarks.value[studentId];
  
  // If "Appeared" is not checked, null/undefined is allowed (not invalid)
  if (!appeared.value[studentId]) {
    return false; // Allow empty input
  }

  if(appeared.value[studentId] && (periodicMarks.value[studentId] === '' || termMarks.value[studentId] === '')) {
    return true; 
  }
  
  if (val === null || val === undefined) {
    return true; // Mark as invalid if empty
  }
  
  // Normal range validation (0 ≤ mark ≤ maxMark)
  const maxMark = selectedSubjectCategory.value === 'Major' 
    ? (type === 'periodic' ? periodicMajorMaxMark.value : terminalMajorMaxMark.value)
    : (type === 'periodic' ? periodicMinorMaxMark.value : terminalMinorMaxMark.value);
  
  return val < 0 || val > maxMark;
};

const updateStatus = (studentId) => {
  const total = calculateTotal(studentId)
  const maxTotal = (selectedSubjectCategory.value === 'Major' 
    ? (periodicMajorMaxMark.value + terminalMajorMaxMark.value)
    : (periodicMinorMaxMark.value + terminalMinorMaxMark.value))
  
  const passMark = Math.ceil(maxTotal * (PassingPercentage.value / 100))
  statuses.value[studentId] = total >= passMark ? 'Pass' : 'Fail'
}

const handleEnterKey = (event, studentId, type) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const currentIndex = students.value.findIndex(s => s.StudentId === studentId);

    if (type === 'periodic') {
      // Move to terminal input of the same student
      const terminalInput = document.querySelector(
        `input[data-student-id="${studentId}"][data-type="terminal"]`
      );
      if (terminalInput) terminalInput.focus();
    } else if (type === 'terminal' && currentIndex < students.value.length - 1) {
      // Move to periodic input of the next student
      const nextStudentId = students.value[currentIndex + 1].StudentId;
      const nextInput = document.querySelector(
        `input[data-student-id="${nextStudentId}"][data-type="periodic"]`
      );
      if (nextInput) nextInput.focus();
    }
  }
};

const resetSectionData = () => {
  sections.value = []
  subjects.value = []
  selectedSectionId.value = ''
  resetStudentData()
}

const resetStudentData = () => {
  students.value = []
  resetMarkData()
}

const resetMarkData = () => {
  periodicMarks.value = {}
  termMarks.value = {}
  statuses.value = {}
  appeared.value = {}
}

const resetGrades = () => {
  Grades.value = {}
}

// Watch for section changes
watch(selectedSectionId, async (sectionId) => {
  if (!selectedClassId.value || !sectionId) {
    resetStudentData()
    return
  }
  verifyResultStatus()
  loadStudentsBySectionId()
  studentloaded.value = false
})


// Watch for subject changes
watch(selectedSubjectId, async (subjectId) => {
  if (!subjectId) return
  if (selected.value === "Scholastic") {
    await loadExistingMarks()
  } else if (selected.value === "Co-Scholastic") {
    await loadExistingGrades()
  }
  studentloaded.value = true
  selectAllAppeared.value = false
  if (marksEntered.value === true){
      const confirmed = await window.electronAPI.showConfirmationDialog(
      "Marks/Grades are entered for the selected Subject. Are you sure you want to re-enter? All the existing Marks/Grades will be replaced."
      )
      if (!confirmed) {
        selectedSubjectId.value = ''
        studentloaded.value = false
      } 
    }
})

// Data loading functions
async function loadStudentsBySectionId() {
  try {
    console.log("Load Student by Section ID:", selectedClassId.value, "Year:", CurrentYearId.value)
    const result = await window.electronAPI.getStudentsByClassAndSection({ 
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value,
      AcademicYearId: CurrentYearId.value,
    })

    if (result.success) {
      students.value = await result.students
      //console.log("Students length:", students.value.length)      
  
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
    //console.log("Loading students for class:", selectedClassId.value, "section:", selectedSectionId.value)
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
     Grades.value = {}    
    if (result.success) {
      result.grades.forEach(grade => {
        Grades.value[grade.StudentId] = grade.Grade
        //appeared.value[grade.StudentId]= grade.Appeared
      })
      marksEntered.value = result.length > 0
    }   
  } catch (error) {
    console.error("Error loading existing grades:", error)
  }
}

async function submitGrades() {
  if (!selectedClassId.value || selectedSectionId.value === '' || !selectedSubjectId.value) {
    alert('Please select class, section, and co-scholastic activity')
    return
  }
  isSaving.value = true
  try {
    const gradesData = students.value
      .filter(student => appeared.value[student.StudentId])
      .map(student => {
        const grades = Grades.value[student.StudentId];
        return {
          StudentId: student.StudentId,
          SubjectId: selectedSubjectId.value,
          ActiveExamId: currentExamId.value,
          Grade: grades
        };
      })
    //console.log("Data to save:", gradesData)
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
    alert(`Error: ${error.message}`)
    console.error("Error submitting grades:", error)
  } finally {
    isSaving.value = false
  }
}

async function saveMarks() {
  const invalidStudents = students.value.filter(student => 
    markInvalid(student.StudentId, 'periodic') || 
    markInvalid(student.StudentId, examType.value === 'terminal' ? 'terminal' : 'annual')
  );
  
  if (invalidStudents.length > 0) {
    errorMessage.value = 'Please enter valid marks for all appeared students';
    setTimeout(() => errorMessage.value = '', 5000);
    return;
  }  
  isSaving.value = true;
  errorMessage.value = '';

  try {
    // Calculate max marks based on subject category
    const periodicMax = selectedSubjectCategory.value === 'Major' 
      ? periodicMajorMaxMark.value 
      : periodicMinorMaxMark.value;
    
    const terminalMax = selectedSubjectCategory.value === 'Major' 
      ? terminalMajorMaxMark.value 
      : terminalMinorMaxMark.value;
    
    const totalMax = periodicMax + terminalMax;

    const marksData = students.value
    .filter(student => !!appeared.value[student.StudentId]) // Only include students who appeared   
    .map(student => {
      const periodicMarksObtained = periodicMarks.value[student.StudentId] || 0;
      const terminalMarksObtained = termMarks.value[student.StudentId] || 0;
      const totalMarksObtained = periodicMarksObtained + terminalMarksObtained;
      return {
        StudentId: student.StudentId,        
        PeriodicMaxMark: periodicMax,
        TerminalMaxMark: terminalMax,
        TotalMaxMarks: totalMax,
        PeriodicMarksObtained: periodicMarksObtained,
        TerminalMarksObtained: terminalMarksObtained,
        TotalMarksObtained: totalMarksObtained,
        SubjectResult: statuses.value[student.StudentId]
      };
    });
    //console.log(appeared.value)
    //These are the subject details to be saved. It means the marks are saved for this subject
    if (marksData.length === 0) {
      throw new Error('No marks data to save');
    }
    const subjectData = {
      YearId: CurrentYearId.value, 
      ExamId: currentExamId.value,   
      ExamType: examType.value,   
      ClassId: selectedClassId.value,
      SectionId: selectedSectionId.value === '' ? 0 : selectedSectionId.value,
      SubjectId: selectedSubjectId.value
    };
    //console.log("Subject Data:", subjectData)
    if (!subjectData.YearId || !subjectData.ExamId || subjectData.ClassId === '' || !subjectData.SubjectId) {
      throw new Error('Incomplete subject data');
    }

    const result = await window.electronAPI.saveMarks({marksData, subjectData});
    if (result.success) {
      selectedSubjectId.value = '';
      successMessage.value = 'Marks submitted successfully!';
      setTimeout(() => successMessage.value = '', 3000);
      marksEntered.value = true;
      studentloaded.value = true

    } else {
      throw new Error(result.message || 'Failed to save marks.....'); 
    }
  } catch (err) {
    errorMessage.value = err.message;
    setTimeout(() => errorMessage.value = '', 5000);
  } finally {
    isSaving.value = false;
  }
}
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