<template>
  <div class="form-container full">
    <h1 class="title has-text-centered">{{ CurrentExamName}} - {{ CurrentYear }}</h1>
    <h2 class="subtitle has-text-centered">Student's Exams Mark Entry</h2>
    <hr class="thin-line" />
 
    <div class="marks-entry-container">
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

        <!-- Add these notification divs at the top of your template -->
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
              <span class="tag  ">Full Mark: {{ CurrentMaxMark }}</span>
              <span class="tag  ml-2">Pass Mark ({{ PassingPercentage }}%): {{ passMark }} </span>
            </div>
        </div>
        <div v-if="students.length > 0">
          <table class="table is-bordered is-striped is-fullwidth mt-4">
            <thead>
              <tr>
                <th style="width: 100px">Roll No.</th>
                <th>Student Name</th>
                <th>Marks Scored</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.StudentId">
                <td style="text-align: center;">{{ student.RollNo }}</td>
                <td>{{ student.Name }}</td>
                <td>
                  <input
                    type="number"
                    :min="0"
                    :max="CurrentMaxMark"
                    class="input is-small"
                    :class="{ 'is-danger': markInvalid(student.StudentId) }"
                    v-model.number="marks[student.StudentId]"
                    @keydown.enter="handleEnterKey($event, student.StudentId)"
                    @input="updateStatus(student.StudentId)"
                    :data-student-id="student.StudentId"
                  />
                </td>
                <td>
                  <span class="tag" :class="statuses[student.StudentId] === 'Pass' ? 'is-success' : 'is-danger'">
                    {{ statuses[student.StudentId] || 'N/A' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Left side: Checkbox -->
            <div class="control">
              <label class="checkbox">
                <input type="checkbox" v-model="finished" checked>
                Sikul Naupang exam zawng zawng enter kim vek a nih chuan tick tur.
              </label>
            </div>
          
          <div class="is-flex is-align-items-center is-justify-content-end">
          <!-- Right side: Buttons -->
            <div class="buttons">
              <button class="button is-primary mr-2" @click="saveMarks" :disabled="Result_Published || isSaving">
                <i class="fas fa-save mr-2"></i>
                {{ Result_Published ? 'Results Published - Marks Locked' : isSaving ? 'Saving...' : 'Save' }}
              </button>
              <button class="button is-light" @click="clearMarksAndSelection" :disabled="Result_Published || isSaving">
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
        <div class="subtitle">Steps to Enter Marks:</div>
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
                 
            </li>
            <li>Enter Marks obtained in the input box.
              
            </li>
            
          </ol>
        </div>
        <hr />
        <div class="subtitle">
          Information <span class="icon has-text-info">
           <i class="fas fa-info-circle"></i></span></div>
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
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'
import { useRoute } from 'vue-router'

const route = useRoute()

const { CurrentYearId, CurrentYear, loadAcademicYear } = useAcademicYear()
const { CurrentExamId, CurrentExamName, Result_Published, PassingPercentage, MajorMaxMark, MinorMaxMark, loadActiveExam } = useActiveExam()

// Reactive state
const classes = ref([])
const sections = ref([])
const subjects = ref([])
const students = ref([])
const marks = ref({})
const statuses = ref({})
const selectedClassId = ref('')
const selectedSectionId = ref('')
const selectedSubjectId = ref('')
const successMessage = ref('')
const errorMessage = ref('')
const isSaving = ref(false)
const finished = ref(false)
const sectionsLoaded = ref(false)
const studentsLoaded = ref(false)

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

const CurrentMaxMark = computed(() => {
  return selectedSubjectCategory.value === 'Major' ? MajorMaxMark.value : MinorMaxMark.value
})

const passMark = computed(() => {
  return (CurrentMaxMark.value * PassingPercentage.value / 100).toFixed(2)
})

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

  sectionsLoaded.value = false
  const [secResult, subResult] = await Promise.all([
    window.electronAPI.getSectionsByClassId(classId),
    window.electronAPI.getSubjectsByClassId(classId)
  ])

  if (secResult.success) {
    sections.value = secResult.sections
    sectionsLoaded.value = true
    
    // If sectionId came from route, ensure it's selected after sections load
    if (route.query.sectionId) {
      selectedSectionId.value = parseInt(route.query.sectionId)
    }
  }
  
  if (subResult.success) subjects.value = subResult.subjects

  resetStudentData()
}, { immediate: true })

// Watch for section changes
watch(selectedSectionId, async (sectionId) => {
  if (!selectedClassId.value || !sectionId) {
    resetStudentData()
    return
  }

  await loadStudents()
}, { immediate: true })

// Watch for subject changes
watch(selectedSubjectId, async (subjectId) => {
  if (!subjectId || !students.value.length) return
  await loadExistingMarks()
})

// Methods
async function loadStudents() {
  studentsLoaded.value = false
  try {
    const result = await window.electronAPI.getStudentsByClassAndSection({ 
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value,
    })

    if (result.success) {
      students.value = result.students
      resetMarkData()
      studentsLoaded.value = true
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
      examId: CurrentExamId.value,
      subjectId: selectedSubjectId.value,
      academicYearId: CurrentYearId.value
    })

    const marksLookup = result.reduce((acc, mark) => {
      acc[mark.StudentId] = mark.MarksObtained
      return acc
    }, {})
    
    students.value.forEach(student => {
      marks.value[student.StudentId] = marksLookup[student.StudentId] ?? ''
      updateStatus(student.StudentId)
    })
  } catch (error) {
    console.error("Failed to load marks:", error)
    errorMessage.value = "Failed to load existing marks"
    setTimeout(() => errorMessage.value = '', 3000)
  }
}

function updateStatus(studentId) {
  const mark = marks.value[studentId]
  if (mark === '' || isNaN(mark)) {
    statuses.value[studentId] = ''
    return
  }
  statuses.value[studentId] = mark >= passMark.value ? 'Pass' : 'Fail'
}

function markInvalid(id) {
  const val = marks.value[id]
  return val === '' || isNaN(val) || val < 0 || val > CurrentMaxMark.value
}

function validateAllMarks() {
  return students.value.every(student => !markInvalid(student.StudentId))
}

async function saveMarks() {
  if (!validateAllMarks()) {
    errorMessage.value = 'Please enter valid marks for all students (0-' + CurrentMaxMark.value + ')'
    setTimeout(() => errorMessage.value = '', 5000)
    return
  }
  
  isSaving.value = true
  errorMessage.value = ''

  try {
    const data = students.value.map(student => ({
      StudentId: student.StudentId,
      SubjectId: selectedSubjectId.value,
      ActiveExamId: CurrentExamId.value,
      AcademicYearId: CurrentYearId.value,
      MaxMark: CurrentMaxMark.value,
      MarksObtained: parseFloat(marks.value[student.StudentId]),
      Status: statuses.value[student.StudentId]
    }));

    const subjectData = {
      YearId: CurrentYearId.value, 
      ExamId: CurrentExamId.value,   
      ClassId: selectedClassId.value,
      SectionId: selectedSectionId.value,
      SubjectId: selectedSubjectId.value,
      Finished: Boolean(finished.value)
    }

    const result = await window.electronAPI.saveMarks(data, subjectData);
    
    if (result.success) {
      selectedSubjectId.value = ''
      successMessage.value = 'Marks submitted successfully!'
      setTimeout(() => successMessage.value = '', 3000)
    } else {
      throw new Error(result.message || 'Failed to save marks')
    }
  } catch (err) {
    errorMessage.value = err.message
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    isSaving.value = false
  }
}

function handleEnterKey(event, studentId) {
  if (event.key === 'Enter') {
    event.preventDefault()
    const currentIndex = students.value.findIndex(s => s.StudentId === studentId)
    if (currentIndex < students.value.length - 1) {
      const nextInput = document.querySelector(`input[data-student-id="${students.value[currentIndex + 1].StudentId}"]`)
      if (nextInput) nextInput.focus()
    }
  }
}

function clearMarksAndSelection() {
  marks.value = {}
  statuses.value = {}
  selectedSubjectId.value = ''
}

function resetSectionData() {
  sections.value = []
  subjects.value = []
  sectionsLoaded.value = false
  resetStudentData()
}

function resetStudentData() {
  students.value = []
  studentsLoaded.value = false
  resetMarkData()
}

function resetMarkData() {
  marks.value = {}
  statuses.value = {}
  selectedSubjectId.value = ''
}

// Initialization
onMounted(async () => {
  await Promise.all([
    loadAcademicYear(),
    loadActiveExam(),
    fetchClasses()
  ])
})

async function fetchClasses() {
  const result = await window.electronAPI.getClasses()
  if (result.success) classes.value = result.classes
}
</script>

<style scoped>
/* Your existing styles */
.marks-entry-container {
  display:flex;
  gap: 1rem;
  min-height: 500px;
}

.left-panel {
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.thin-line {
  border: none;
  border-top: 1px solid #3c3b3b;
}

</style>
