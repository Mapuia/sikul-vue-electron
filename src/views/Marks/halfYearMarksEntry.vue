<template>
  <div class="form-container full">
    <h1 class="title has-text-centered">Marks Entry</h1>
    <h2 class="subtitle has-text-centered">Half Yearly Exam</h2>
   
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
      <div class="box columns is-mobile">
        <div class="column">
          <div
            class="box has-text-centered is-clickable"
            :class="selected === 'scholastic' ? 'has-background-success has-text-black' : ''"
            @click="selected = 'scholastic'"
          >
            Scholastic Subjects
          </div>
        </div>
        <div class="column">
          <div
            class="box has-text-centered is-clickable"
            :class="selected === 'coscholastic' ? 'has-background-primary has-text-black' : ''"
            @click="selected = 'coscholastic'"
          >
            Co-Scholastic Activities
          </div>
        </div>
      </div>

      <!-- Scholastic Marks Entry -->
      <div v-if="selected === 'scholastic'" class="marks-entry-container">
        <aside class="left-panel box">
          <!-- Class Dropdown -->
          <div class="field">
            <label class="label">Class</label>
            <div class="select is-fullwidth is-small">
              <select v-model="selectedClassId">
                <option disabled value="">-- Select Class --</option>
                <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                  Class - {{ cls.ClassName }}
                </option>
              </select>
            </div>
          </div>

          <!-- Notifications -->
          <div v-if="successMessage" 
              class="notification is-success fixed-notification"
              @click="successMessage = ''">
              <button class="delete"></button>
              {{ successMessage }}
          </div>

          <div v-if="errorMessage" 
            class="notification is-danger fixed-notification"
              @click="errorMessage = ''">
              <button class="delete"></button>
              {{ errorMessage }}
          </div>

          <!-- Section Dropdown -->
          <div class="field">
            <label class="label">Section</label>
            <div class="select is-fullwidth is-small">
              <select v-model="selectedSectionId" :disabled="!selectedClassId">
                <option disabled value="">-- Select Section --</option>
                <option v-for="sec in sections" :key="sec.Id" :value="sec.Id">
                  {{ sec.SectionName }}
                </option>
              </select>
            </div>
          </div>

          <!-- Subject Dropdown -->
          <div class="field">
            <label class="label">Subject</label>
            <div class="select is-fullwidth is-small">
              <select v-model="selectedSubjectId" :disabled="!selectedSectionId">
                <option disabled value="">-- Select Subject --</option>
                <option v-for="subject in subjects" :key="subject.Id" :value="subject.Id">
                  {{ subject.SubjectName }} ({{ subject.SubjectCategory }})
                </option>
              </select>
            </div>
          </div>
        </aside>

        <div v-if="selectedClassId && selectedSectionId && selectedSubjectId" class="main-content box column p-5">
          <div class="title tab-heading has-text-weight-bold is-primary is-flex is-justify-content-space-between is-align-items-center">
            <div>
              {{ selectedSubjectName }}
            </div>
            <div class="tags are-medium">
              <span class="tag ml-2">Pass Mark ({{ PassingPercentage }}%)</span>
            </div>
          </div>
          
          <div v-if="students.length > 0">
            <table class="table is-bordered is-striped is-fullwidth mt-4">
              <thead>
                <tr>
                  <th rowspan="2" style="width: 100px; vertical-align: middle">Roll No.</th>
                  <th rowspan="2" style="min-width: 150px; vertical-align: middle">Student Name</th>
                  <th colspan="3" class="has-text-centered">Marks Scored</th>
                  <th rowspan="2" style="vertical-align: middle">Status</th>
                </tr>
                <tr>
                  <th class="has-text-centered" style="min-width: 100px;">
                    First Periodic Test<br />
                    (FM: {{ selectedSubjectCategory === 'Major' ? periodicMajorMaxMark : periodicMinorMaxMark }})
                  </th>
                  <th class="has-text-centered" style="min-width: 100px;">
                    Half Yearly Exam<br />
                    (FM: {{ selectedSubjectCategory === 'Major' ? terminalMajorMaxMark : terminalMinorMaxMark }})
                  </th>
                  <th class="has-text-centered">Total Marks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in students" :key="student.StudentId">
                  <td style="text-align: center;">{{ student.RollNo }}</td>
                  <td>{{ student.Name }}</td>
                  <!-- First Periodic -->
                  <td>
                    <input
                      :disabled="Result_Published || isMarkEntryDisabled"
                      type="number"
                      :min="0"
                      :max="selectedSubjectCategory === 'Major' ? periodicMajorMaxMark : periodicMinorMaxMark"
                      class="input is-small"
                      :class="{ 'is-danger': markInvalid(student.StudentId, 'periodic') }"
                      v-model.number="periodicMarks[student.StudentId]"
                      @keydown.enter="handleEnterKey($event, student.StudentId)"
                      @input="updateStatus(student.StudentId)"
                    />
                  </td>

                  <!-- Half Yearly -->
                  <td>
                    <input
                      :disabled="Result_Published || isMarkEntryDisabled"
                      type="number"
                      :min="0"
                      :max="selectedSubjectCategory === 'Major' ? terminalMajorMaxMark : terminalMinorMaxMark"
                      class="input is-small"
                      :class="{ 'is-danger': markInvalid(student.StudentId, 'terminal') }"
                      v-model.number="halfYearlyMarks[student.StudentId]"
                      @keydown.enter="handleEnterKey($event, student.StudentId)"
                      @input="updateStatus(student.StudentId)"
                    />
                  </td>

                  <!-- Total -->
                  <td class="has-text-centered">
                    <input
                      :disabled="true"
                      type="number"
                      class="input is-small"
                      :value="calculateTotal(student.StudentId)"
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

            <div class="control">
              <label class="checkbox">
                <input type="checkbox" v-model="finished" checked>
                Check to confirm all appeared students are entered.
              </label>
            </div>
                  
            <div class="is-flex is-align-items-center mt-3">
              <div class="buttons">
                <button class="button is-primary mr-2" @click="saveMarks" :disabled="Result_Published || isSaving">
                  <i class="fas fa-save mr-2"></i>
                  {{ Result_Published ? 'Results Published - Marks Locked' : isSaving ? 'Saving...' : 'Save' }}
                </button>
                <button class="button is-light" @click="resetMarkData" :disabled="Result_Published || isSaving">
                  <i class="fas fa-times mr-2"></i>
                  Cancel
                </button>
              </div>
            </div>
          </div>            

          <div v-else class="notification is-info is-dark is-fullwidth has-text-centered">
            No students found for this section.
          </div>            
        </div> 
        
        <div v-else class="box column is-flex is-flex-direction-column p-5">
          <div class="subtitle">Steps to Enter Marks for Scholastic Subjects:</div>
          <div class="px-5">
            <ol class="mb-5"> 
              <li>Select Class
                <span v-if="selectedClassId" class="icon has-text-info"><i class="fas fa-check"></i></span>
              </li>
              <li>Select Section 
                <span v-if="selectedSectionId" class="icon has-text-info"><i class="fas fa-check"></i></span>
              </li>
              <li>
                Select Subject
                <span v-if="selectedSubjectId" class="icon has-text-info"><i class="fas fa-check"></i></span>           
              </li>
              <li>Enter Marks obtained in the input box.
                <span v-if="marksEntered" class="icon has-text-info"><i class="fas fa-check"></i></span>
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
                Follow the same procedure to edit the marks in case of wrong entry.
              </li>
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
      <div v-else-if="selected === 'coscholastic'" class="marks-entry-container">
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
              <select v-model="selectedSectionId" :disabled="!selectedClassId">
                <option disabled value="">-- Select Section --</option>
                <option v-for="sec in sections" :key="sec.Id" :value="sec.Id">
                  {{ sec.SectionName }}
                </option>
              </select>
            </div>
          </div>

          <!-- Co-Scholastic Subject Dropdown -->
          <div class="field">
            <label class="label">Co-Scholastic Activities</label>
            <div class="select is-fullwidth is-small">
              <select v-model="selectedSubjectId" :disabled="!selectedSectionId">
                <option disabled value="">-- Select Activities --</option>
                <option v-for="subject in coScholasticSubjects" :key="subject.Id" :value="subject.Id">
                  {{ subject.SubjectName }}
                </option>
              </select>
            </div>
          </div>
        </aside>

        <div v-if="successMessage" class="notification is-success fixed-notification">
          <button class="delete" @click="successMessage = ''"></button>
          {{ successMessage }}
        </div>

        <div class="main-content box column p-5">
          <div v-if="selectedClassId && selectedSectionId && selectedSubjectId">
            <div class="tab-heading has-text-weight-bold has-text-centered py-2 is-primary">
              {{ selectedSubjectName }}
            </div>

            <div v-if="students.length > 0">
              <table class="table is-bordered is-striped is-fullwidth mt-4">
                <thead>
                  <tr>
                    <th style="width: 80px">Roll No.</th>
                    <th>Student Name</th>                   
                    <th style="width: 150px">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in students" :key="student.StudentId">
                    <td>{{ student.RollNo }}</td>
                    <td>{{ student.Name }}</td>
                 
                    <td>
                      <div class="select is-small is-fullwidth">
                        <select
                          v-model="newGrades[student.StudentId]"
                          :class="{ 'is-danger': gradeInvalid(student.StudentId) }"
                        >
                          <option disabled value="">-- Select Grade --</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>
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
          <div v-else class="button is-dark column has-text-centered is-flex is-align-items-center is-flex-direction-column p-5">
            Select Class, Section and Co-Scholastic Activity to enter Grades
          </div>
        </div>
      </div> 
    </div>     
  </div>    
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
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
  Terminal_Published,
  Annual_Published,
  PassingPercentage,      
  loadActiveExam 
} = useActiveExam()

// Reactive state
const selected = ref('scholastic')
const classes = ref([])
const sections = ref([])
const subjects = ref([])
const coScholasticSubjects = ref([])
const students = ref([])
const selectedClassId = ref('')
const selectedSectionId = ref('')
const selectedSubjectId = ref('')
const marksEntered = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const isSaving = ref(false)
const finished = ref(false)
const currentExamId = ref('')
//const existingGrades = ref({})
const newGrades = ref({})
const periodicMarks = ref({})
const halfYearlyMarks = ref({})
const statuses = ref({})

// Exam publish status
const Final_Published = Annual_Published.value
const HalfYearly_Published = Terminal_Published.value

watch(selected, (newTab) => {
  // Reset all selections when switching tabs
  //selectedClassId.value = null
  selectedSectionId.value = null
  selectedSubjectId.value = null
  
  // You might also want to reset other related data
  students.value = []
  periodicMarks.value = {}
  halfYearlyMarks.value = {}
  statuses.value = {}
  //existingGrades.value = {}
  newGrades.value = {}
})

// Computed properties
const selectedSubjectName = computed(() => {
  if (selected.value === "scholastic") {
    return subjects.value.find(sub => sub.Id === selectedSubjectId.value)?.SubjectName || ''
  } else if (selected.value === 'coscholastic') {
    return coScholasticSubjects.value.find(sub => sub.Id === selectedSubjectId.value)?.SubjectName || ''
  }
  return ''
})

const selectedSubject = computed(() => {
  return subjects.value.find(subject => subject.Id === selectedSubjectId.value) || null
})

const selectedSubjectCategory = computed(() => {
  return selectedSubject.value?.SubjectCategory || null
})

const isMarkEntryDisabled = computed(() => {
  return Final_Published || HalfYearly_Published
})

const Result_Published = computed(() => {
  return Final_Published || HalfYearly_Published
})

// Methods
const calculateTotal = (studentId) => {
  const periodic = periodicMarks.value[studentId] || 0
  const half = halfYearlyMarks.value[studentId] || 0
  return periodic + half
}

const markInvalid = (studentId, type) => {
  const val = type === 'periodic' 
    ? periodicMarks.value[studentId] 
    : halfYearlyMarks.value[studentId]
  
  if (val === undefined || val === null) return false
  
  const maxMark = selectedSubjectCategory.value === 'Major' 
    ? (type === 'periodic' ? periodicMajorMaxMark.value : terminalMajorMaxMark.value)
    : (type === 'periodic' ? periodicMinorMaxMark.value : terminalMinorMaxMark.value)
  
  return val < 0 || val > maxMark
}

const updateStatus = (studentId) => {
  const total = calculateTotal(studentId)
  const maxTotal = (selectedSubjectCategory.value === 'Major' 
    ? (periodicMajorMaxMark.value + terminalMajorMaxMark.value)
    : (periodicMinorMaxMark.value + terminalMinorMaxMark.value))
  
  const passMark = Math.ceil(maxTotal * (PassingPercentage.value / 100))
  statuses.value[studentId] = total >= passMark ? 'Pass' : 'Fail'
}

const handleEnterKey = (event, studentId) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    const currentIndex = students.value.findIndex(s => s.StudentId === studentId)
    if (currentIndex < students.value.length - 1) {
      const nextInput = document.querySelector(`input[data-student-id="${students.value[currentIndex + 1].StudentId}"]`)
      if (nextInput) nextInput.focus()
    }
  }
}


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
  halfYearlyMarks.value = {}
  statuses.value = {}
  selectedSubjectId.value = ''
}

const resetGrades = () => {
  //existingGrades.value = {}
  newGrades.value = {}
}

const gradeInvalid = (id) => {
  const val = newGrades.value[id]
  return !val || !['A', 'B', 'C'].includes(val)
}

// Watch for route changes to set initial values
watch(() => route.query, (newQuery) => {
  if (newQuery.classId) {
    selectedClassId.value = parseInt(newQuery.classId)
  }
  if (newQuery.sectionId && selectedClassId.value) {
    selectedSectionId.value = parseInt(newQuery.sectionId)
  }
}, { immediate: true })

// Watch for class changes
watch(selectedClassId, async (classId) => {
  if (!classId) {
    resetSectionData()
    return
  }
  
  selectedSectionId.value = ''
  
  const secResult = await window.electronAPI.getSectionsByClassId(classId)
   
  if (secResult.success) {
    sections.value = secResult.sections    
  }

  if(selected.value === "scholastic"){
    const subResult = await window.electronAPI.getSubjectsByClassId(classId)
    if (subResult.success) subjects.value = subResult.subjects
  }
  else if(selected.value === "coscholastic"){
    const cosResult = await window.electronAPI.getCoScholastics()
    if (cosResult.success) coScholasticSubjects.value = cosResult.subjects
  }

  resetStudentData()
})

// Watch for section changes
watch(selectedSectionId, async (sectionId) => {
  if (!selectedClassId.value || !sectionId) {
    resetStudentData()
    return
  }
  await loadStudents()
})

// Watch for subject changes
watch(selectedSubjectId, async (subjectId) => {
  if (!subjectId || !students.value.length) return
  
  if (selected.value === "scholastic") {
    await loadExistingMarks()
  } else if (selected.value === "coscholastic") {
    await loadExistingGrades()
  }
})

// Data loading functions
async function loadStudents() {
  try {
    const result = await window.electronAPI.getStudentsByClassAndSection({ 
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value,
    })

    if (result.success) {
      students.value = result.students
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
    })

    periodicMarks.value = {}
    halfYearlyMarks.value = {}
    
    result.forEach(mark => {
      periodicMarks.value[mark.StudentId] = mark.PeriodicMarksObtained || 0
      halfYearlyMarks.value[mark.StudentId] = mark.TerminalMarksObtained || 0
      statuses.value[mark.StudentId] = mark.SubjectResult || "N.A."
      
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
      subjectId: selectedSubjectId.value      
    })

    //existingGrades.value = {}
    newGrades.value = {}
    
    if (result.success) {
      result.grades.forEach(grade => {
        //existingGrades.value[grade.StudentId] = grade.Grade
        newGrades.value[grade.StudentId] = grade.Grade
      })
    }

    // Initialize empty grades for students without existing grades
    students.value.forEach(student => {
      if (!newGrades.value[student.StudentId]) {
        newGrades.value[student.StudentId] = ''
      }
    })
  } catch (error) {
    console.error("Error loading existing grades:", error)
  }
}

async function submitGrades() {
  if (!selectedClassId.value || !selectedSectionId.value || !selectedSubjectId.value) {
    alert('Please select class, section, and co-scholastic activity')
    return
  }
  
  const invalidStudents = students.value.filter(s => gradeInvalid(s.StudentId))
  if (invalidStudents.length > 0) {
    alert(`Please select valid grades (A, B, or C) for all students`)
    return
  }

  isSaving.value = true
  try {
    const data = students.value.map(student => ({
      StudentId: student.StudentId,
      SubjectId: selectedSubjectId.value,
      ActiveExamId: currentExamId.value,
      Grade: newGrades.value[student.StudentId]
    }))
    
    const result = await window.electronAPI.saveCoScholasticMarks(data)
    
    if (result.success) {
      successMessage.value = 'Grades submitted successfully!'
      setTimeout(() => successMessage.value = '', 3000)
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
    markInvalid(student.StudentId, 'terminal')
  );
  
  if (invalidStudents.length > 0) {
    errorMessage.value = 'Please enter valid marks for all students';
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

    const marksData = students.value.map(student => {
      const periodicMarksObtained = periodicMarks.value[student.StudentId] || 0;
      const terminalMarksObtained = halfYearlyMarks.value[student.StudentId] || 0;
      const totalMarksObtained = periodicMarksObtained + terminalMarksObtained;
      
      return {
        ActiveExamId: currentExamId.value,
        StudentId: student.StudentId,
        SubjectId: selectedSubjectId.value,
        PeriodicMaxMark: periodicMax,
        TerminalMaxMark: terminalMax,
        TotalMaxMarks: totalMax,
        PeriodicMarksObtained: periodicMarksObtained,
        TerminalMarksObtained: terminalMarksObtained,
        TotalMarksObtained: totalMarksObtained,
        SubjectResult: statuses.value[student.StudentId] || 'Fail',
        Remark: finished.value ? 'All marks entered' : 'Partial marks entered'
      };
    });
    //console.log(marksData)

    const subjectData = {
      YearId: CurrentYearId.value, 
      ExamId: currentExamId.value,   
      ClassId: selectedClassId.value,
      SectionId: selectedSectionId.value,
      SubjectId: selectedSubjectId.value,
      Finished: Boolean(finished.value)
    };

    const result = await window.electronAPI.saveMarks({marksData, subjectData});
    if (result.success) {
      selectedSubjectId.value = '';
      successMessage.value = 'Marks submitted successfully!';
      setTimeout(() => successMessage.value = '', 3000);
      marksEntered.value = true;
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

async function getExamId() {
  const result = await window.electronAPI.getExamIdByType("terminal", CurrentYearId.value)
  currentExamId.value = result.exam.Id
  //console.log("CurrentExam Id:", currentExamId.value)
}


async function fetchClasses() {
  const result = await window.electronAPI.getClasses()
  if (result.success) classes.value = result.classes
}

// Initialization
onMounted(async () => {
  await Promise.all([
    loadAcademicYear(),
    loadActiveExam(),
    fetchClasses(),
    getExamId()
  ])
})
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

.main-content {
  flex: 1;
}



.tab-heading {
  border-radius: 4px;
  padding: 0.5rem 1rem;
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