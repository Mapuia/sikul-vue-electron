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
              <option v-for="subject in subjects" :key="subject.Id" :value="subject.Id">
                {{ subject.SubjectName }}
              </option>
            </select>
          </div>
        </div>
      </aside>
      <div v-if="successMessage" class="notification is-success is-fullwidth fixed-notification " style="height:80px">
              {{ successMessage }}
            </div>

      <div class="main-content column">
        <div v-if="selectedClassId && selectedSectionId && selectedSubjectId">
          <div class="box">
            <div class="tab-heading has-text-weight-bold has-text-centered py-2 is-primary">
              {{ selectedSubjectName || "Select a Subject" }}
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
                          v-model="grades[student.StudentId]"
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
              <button class="button is-primary" @click="submitGrades">
                Submit Grades
              </button>
            </div>
            </div>
            <p v-else class="has-text-grey has-text-centered mt-4">
              No students found for this section.
            </p>       
            
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

const { CurrentYearId, CurrentYear} = useAcademicYear()
const { CurrentExamId, CurrentExamName, loadActiveExam } = useActiveExam()

console.log("Current Exam:",CurrentExamName.value)
const classes = ref([])
const sections = ref([])
const subjects = ref([])
const students = ref([])
const grades = ref({})

const selectedClassId = ref('')
const selectedSectionId = ref('')
const selectedSubjectId = ref('')
const successMessage = ref('')

const selectedSubjectName = computed(() => {
  return subjects.value.find(sub => sub.Id === selectedSubjectId.value)?.SubjectName || ''
})

watch(selectedClassId, async (classId) => {
  if (!classId) {
    sections.value = []
    subjects.value = []
    students.value = []
    grades.value = {}
    selectedSectionId.value = ''
    selectedSubjectId.value = ''
    return
  }

  const cls = classes.value.find(c => c.Id === classId)

  const secResult = await window.electronAPI.getSectionsByClass(cls.Id)
  if (secResult.success) sections.value = secResult.sections

  const subResult = await window.electronAPI.getCoScholastics()
  if (subResult.success) subjects.value = subResult.subjects

  selectedSectionId.value = ''
  selectedSubjectId.value = ''
  students.value = []
  grades.value = {}
})

watch(selectedSectionId, async () => {
  if (!selectedClassId.value || !selectedSectionId.value) return

  const result = await window.electronAPI.getStudentsByClassAndSection({
    classId: selectedClassId.value,
    sectionId: selectedSectionId.value,
  })

  if (result.success) {
    students.value = result.students
    grades.value = {}
    result.students.forEach(student => {
      grades.value[student.StudentId] = ''
    })
  } else {
    students.value = []
    grades.value = {}
  }
})

watch(selectedSubjectId, async () => {
  if (!selectedSubjectId.value || !students.value.length) return
  
  // Initialize empty grades
  students.value.forEach(student => {
    grades.value[student.StudentId] = ''
  });

  // Load existing grades if any
  await fetchExistingGrades();
});

async function fetchExistingGrades() {
  const result = await window.electronAPI.getCoScholasticMarks({
    examId: CurrentExamId.value,
    subjectId: selectedSubjectId.value,
    classId: selectedClassId.value,
    sectionId: selectedSectionId.value,
    academicYearId: CurrentYearId.value
  });

  if (result.success && result.grades.length > 0) {
    result.grades.forEach(grade => {
      grades.value[grade.StudentId] = grade.Score;
    });
  }
}

function gradeInvalid(id) {
  const val = grades.value[id]
  return !val || val.length === 0 || !/^[ABCabc]$/.test(val.trim())
}

async function submitGrades() {
  if (!selectedClassId.value || !selectedSectionId.value || !selectedSubjectId.value) {
    alert('Please select class, section, and subject.')
    return
  }

  const invalid = students.value.some(s => gradeInvalid(s.StudentId))
  if (invalid) {
    alert('Please enter valid grades (A, B, C) for all students.')
    return
  }

  const data = students.value.map(student => ({
    StudentId: student.StudentId,
    SubjectId: selectedSubjectId.value,
    ActiveExamId: CurrentExamId.value,
    AcademicYearId: CurrentYearId.value,
    Score: grades.value[student.StudentId].toUpperCase()
  }))

  const result = await window.electronAPI.saveCoScholasticMarks(data)
  if (result.success) {
    successMessage.value = 'Grades submitted successfully!'
    setTimeout(() => (successMessage.value = ''), 3000)
    selectedSubjectId.value = ''
    grades.value = {}
  } else {
    alert(`Failed to save grades: ${result.error}`)
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
.marks-entry-container {
  display: flex;
  gap: 1rem;
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

.notification {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 100;
}

input.input {
  width: 100px !important;
}
</style>
