<template>
  <div class="form-container full">
    <h1 class="title has-text-centered">{{ CurrentExamName }} - {{ CurrentYear }}</h1>
    <h2 class="subtitle has-text-centered">Co-Scholastic Grade Entry</h2>
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

      <div class="main-content column">
        <div v-if="selectedClassId && selectedSectionId && selectedSubjectId">
          <div class="box">
            <div class="tab-heading has-text-weight-bold has-text-centered py-2 is-primary">
              {{ selectedSubjectName }}
            </div>

            <div v-if="students.length > 0">
              <table class="table is-bordered is-striped is-fullwidth mt-4">
                <thead>
                  <tr>
                    <th style="width: 80px">Roll No.</th>
                    <th>Student Name</th>
                    <th style="width: 150px">Existing Grade</th>
                    <th style="width: 150px">New Grade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in students" :key="student.StudentId">
                    <td>{{ student.RollNo }}</td>
                    <td>{{ student.Name }}</td>
                    <td>
                      <span class="tag is-info" v-if="existingGrades[student.StudentId]">
                        {{ existingGrades[student.StudentId] }}
                      </span>
                      <span v-else class="has-text-grey">Not graded</span>
                    </td>
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
        </div>
        <div v-else class="button is-dark column has-text-centered is-flex is-align-items-center is-flex-direction-column p-5">
          Select Class, Section and Co-Scholastic Activity to enter Grades
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'

const { CurrentYearId, CurrentYear } = useAcademicYear()
const { CurrentExamId, CurrentExamName, loadActiveExam } = useActiveExam()

const classes = ref([])
const sections = ref([])
const coScholasticSubjects = ref([])
const students = ref([])
const existingGrades = ref({})
const newGrades = ref({})
const selectedClassId = ref('')
const selectedSectionId = ref('')
const selectedSubjectId = ref('')
const successMessage = ref('')
const isSaving = ref(false)

const selectedSubjectName = computed(() => {
  return coScholasticSubjects.value.find(sub => sub.Id === selectedSubjectId.value)?.SubjectName || ''
})

watch(selectedClassId, async (classId) => {
  if (!classId) {
    resetSelections()
    return
  }

  const [secResult, subResult] = await Promise.all([
    window.electronAPI.getSectionsByClassId(classId),
    window.electronAPI.getCoScholastics()
  ])

  if (secResult.success) sections.value = secResult.sections
  
  if (subResult.success) coScholasticSubjects.value = subResult.subjects
  else resetSelections()
})

watch(selectedSectionId, async () => {
  if (!selectedClassId.value || !selectedSectionId.value) return

  const result = await window.electronAPI.getStudentsByClassAndSection({
    classId: selectedClassId.value,
    sectionId: selectedSectionId.value,
  })

  if (result.success) {
    students.value = result.students
    resetGrades()
  } else {
    students.value = []
    resetGrades()
  }
})

watch(selectedSubjectId, async () => {
  if (!selectedSubjectId.value || !students.value.length) return
  await loadExistingGrades()
})

async function loadExistingGrades() {
  try {
    const result = await window.electronAPI.getCoScholasticMarks({
      examId: CurrentExamId.value,
      subjectId: selectedSubjectId.value,
      academicYearId: CurrentYearId.value
    })

    existingGrades.value = {}
    newGrades.value = {}
    
    if (result.success) {
      result.grades.forEach(grade => {
        existingGrades.value[grade.StudentId] = grade.Grade
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

function gradeInvalid(id) {
  const val = newGrades.value[id]
  return !val || !['A', 'B', 'C'].includes(val)
}

async function submitGrades() {
  if (!validateSelections()) return
  
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
      ActiveExamId: CurrentExamId.value,
      AcademicYearId: CurrentYearId.value,
      Grade: newGrades.value[student.StudentId]
    }))
    //console.log('Grade:',data)
    const result = await window.electronAPI.saveCoScholasticMarks(data)
    
    if (result.success) {
      successMessage.value = 'Grades submitted successfully!'
      setTimeout(() => successMessage.value = '', 3000)
      await loadExistingGrades() // Refresh existing grades after save
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

function validateSelections() {
  if (!selectedClassId.value || !selectedSectionId.value || !selectedSubjectId.value) {
    alert('Please select class, section, and co-scholastic activity')
    return false
  }
  return true
}

function resetSelections() {
  sections.value = []
  coScholasticSubjects.value = []
  students.value = []
  existingGrades.value = {}
  newGrades.value = {}
  selectedSectionId.value = ''
  selectedSubjectId.value = ''
}

function resetGrades() {
  existingGrades.value = {}
  newGrades.value = {}
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
  flex-grow: 1;
}

.thin-line {
  border: none;
  border-top: 1px solid #3c3b3b;
}

.notification.fixed-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  max-width: 400px;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.tag {
  min-width: 30px;
  justify-content: center;
}

.table td, .table th {
  vertical-align: middle;
}
</style>