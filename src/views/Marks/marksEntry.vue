<template>
  <!-- Template remains exactly the same as your original -->
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
                {{ subject.SubjectName }}
              </option>
            </select>
          </div>
        </div>
      </aside>

      <!-- Marks Entry Content -->
       <div v-if="successMessage" class="notification is-success fixed-notification">
          {{ successMessage }}
        </div> 
        <div v-if="errorMessage" class="notification is-danger fixed-notification">
          {{ errorMessage }}
        </div> 
      <div v-if="selectedClassId && selectedSectionId && selectedSubjectId" class="main-content box column">
              
            <div class="title tab-heading has-text-weight-bold has-text-centered py-2 is-primary">
              {{ selectedSubjectName }} 
              <span v-if="CurrentMaxMark" class="tag is-info ml-2 mb-2 is-light">(Full Mark: {{ CurrentMaxMark }})</span>
            </div>

            <div v-if="students.length > 0">
              <table class="table is-bordered is-striped is-fullwidth mt-4">
                <thead>
                  <tr>
                    <th style="width: 100px">Roll No.</th>
                    <th>Student Name</th>
                    <th >Marks Scored</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in students" :key="student.StudentId">
                    <td>{{ student.RollNo }}</td>
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
                        :data-student-id="student.StudentId"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
                  <div class="is-flex is-justify-content-center mt-5">
                  <button class="button is-primary" @click="saveMarks" :disabled="Result_Published || isSaving">
                    {{ Result_Published ? 'Results Published - Marks Locked' : isSaving ? 'Saving...' : 'Save' }}
                  </button>
                  </div>
            </div>            

            <div v-else class="notification is-warning is-fullwidth has-text-centered ">
              No students found for this section.
            </div>            
      </div> 
      <div v-else class="button is-dark column has-text-centered is-flex is-align-items-center is-flex-direction-column p-5">
        Select Class, Section and Subjects to enter Marks
        <br />
       <i>One Subject one Section at a time.</i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'

const { CurrentYearId, CurrentYear } = useAcademicYear()
const { CurrentExamId, CurrentExamName, MinorMaxMark, MajorMaxMark, Result_Published, loadActiveExam } = useActiveExam()

const classes = ref([])
const sections = ref([])
const subjects = ref([])
const students = ref([])
const marks = ref({})
const selectedClassId = ref('')
const selectedSectionId = ref('')
const selectedSubjectId = ref('')
const successMessage = ref('')
const errorMessage = ref('')
const isSaving = ref(false)

// Computed properties remain the same
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

watch(selectedClassId, async (classId) => {
  if (!classId) {
    sections.value = []
    subjects.value = []
    students.value = []
    marks.value = {}
    selectedSectionId.value = ''
    selectedSubjectId.value = ''
    return
  }

  const cls = classes.value.find(c => c.Id === classId)

  const secResult = await window.electronAPI.getSectionsByClass(cls.Id)
  if (secResult.success) sections.value = secResult.sections

  const subResult = await window.electronAPI.getSubjectssByClassId(cls.Id)
  if (subResult.success) subjects.value = subResult.subjects

  selectedSectionId.value = ''
  selectedSubjectId.value = ''
  students.value = []
  marks.value = {}
})

watch(selectedSectionId, async () => {
  if (!selectedClassId.value || !selectedSectionId.value) return

  const result = await window.electronAPI.getStudentsByClassAndSection({ 
    classId: selectedClassId.value,
    sectionId: selectedSectionId.value,
  })

  if (result.success) {
    students.value = result.students
    marks.value = {}
    result.students.forEach(student => {
      marks.value[student.StudentId] = ''
    })
  } else {
    students.value = []
    marks.value = {}
  }
})

watch(selectedSubjectId, loadExistingMarks)

// Validation functions
function markInvalid(id) {
  const val = marks.value[id]
  return val === '' || isNaN(val) || val < 0 || val > CurrentMaxMark.value
}

function validateAllMarks() {
  const invalidEntries = []
  
  students.value.forEach(student => {
    const mark = marks.value[student.StudentId]
    if (mark === '' || isNaN(mark) || mark < 0 || mark > CurrentMaxMark.value) {
      invalidEntries.push({
        name: student.Name,
        rollNo: student.RollNo,
        mark: mark
      })
    }
  })

  return invalidEntries
}

// Mark loading and submission
async function loadExistingMarks() {
  if (!selectedSubjectId.value || !students.value.length) return;

  try {
    const result = await window.electronAPI.getMarksByExamSubject({
      examId: CurrentExamId.value,
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value,
      subjectId: selectedSubjectId.value,
      academicYearId: CurrentYearId.value
    });

    const marksLookup = result.reduce((acc, mark) => {
      acc[mark.StudentId] = mark.MarksObtained
      return acc
    }, {})

    students.value.forEach(student => {
      marks.value[student.StudentId] = marksLookup[student.StudentId] ?? ''
    })

  } catch (error) {
    console.error("Failed to load marks:", error)
    errorMessage.value = "Failed to load existing marks"
    setTimeout(() => errorMessage.value = '', 3000)
  }
}

async function saveMarks() {
  // Validate required selections
  if (!selectedClassId.value || !selectedSectionId.value || !selectedSubjectId.value) {
    errorMessage.value = 'Please select class, section, and subject'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  // Validate marks
  const invalidEntries = validateAllMarks()
  if (invalidEntries.length > 0) {
    const invalidList = invalidEntries.map(e => 
      `${e.name} (Roll No: ${e.rollNo}) - Entered: ${e.mark}`
    ).join('\n')
    
    errorMessage.value = `Invalid marks found:\n${invalidList}\n\nPlease enter values between 0 and ${CurrentMaxMark.value}`
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
      MarksObtained: parseFloat(marks.value[student.StudentId])    
    }))

    const result = await window.electronAPI.saveMarks(data)
    
    if (result.success) {
      successMessage.value = 'Marks submitted successfully!'
      setTimeout(() => successMessage.value = '', 3000)
      selectedSectionId.value = ''
      selectedSubjectId.value = ''
      students.value = []
      marks.value = {}
    } else {
      throw new Error(result.error || 'Failed to save marks')
    }
  } catch (err) {
    errorMessage.value = err.message
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    isSaving.value = false
  }
}

// Other functions remain the same
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

async function fetchClasses() {
  const result = await window.electronAPI.getClasses()
  if (result.success) classes.value = result.classes
}

onMounted(() => {
  loadActiveExam()
  fetchClasses()
})
</script>

<style scoped>
/* Your existing styles remain the same */
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

.notification.fixed-notification {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 100;
  max-width: 400px;
}
</style>