<template>
  <div class="form-container full">
    <h1 class="title has-text-centered">View Marks - {{ CurrentExamName }} ({{ CurrentYear }})</h1>
    <h2 class="subtitle has-text-centered">(Limitted Feature)</h2>
    <hr class="thin-line" />

    <div class="marks-entry-container">
      <!-- Vertical Tabs -->
      <aside class="vertical-tabs box">
        <div class="tab-heading has-text-weight-bold has-text-centered py-2 has-background-black">Class</div>
        <ul>
          <li class="py-1"
            v-for="cls in classes"
            :key="cls.Id"
            :class="{ 'is-active': cls.Id === selectedClassId }"
            @click="selectClass(cls)"
          >
            Class - {{ cls.ClassName }}
          </li>
        </ul>
      </aside>

      <!-- Main Content -->
      <div class="main-content">
        <div v-if="selectedClass" class="mb-2">
          <h1 class="title is-4">Class: {{ selectedClass.ClassName }}</h1>
        </div>  
        
        <!-- Section Selector -->
        <div v-if="selectedClass" class="mb-4 is-flex is-align-items-center">
          <label class="label mr-2">Section:</label>
          <div class="buttons">
            <button
              class="button is-small"
              v-for="sec in sections"
              :key="sec.Id"
              :class="{ 'is-active': sec.Id === selectedSectionId }"
              @click="selectSection(sec)"
            >
              {{ sec.SectionName }}
            </button>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div v-if="loading" class="notification is-info is-dark has-text-centered mt-4">
          <span class="loader"></span> Loading marks data...
        </div>

        <!-- Students + Marks Display Table -->
        <div v-if="!loading && selectedSectionId && studentMarks.length > 0">
          <div class="table-container-scroll">
            <table class="table is-bordered is-striped is-fullwidth marks-display-table">
              <thead>
                <tr>
                  <th style="background-color: #201f1f;" class="sticky-col left-col">Roll No.</th>
                  <th style="background-color: #201f1f; min-width: 180px;" class="sticky-col">Student Name</th>
                  <th 
                    v-for="subject in subjects" 
                    :key="subject.Id"
                    style="background-color: #201f1f; font-size: x-small;"
                    
                  >
                    {{ subject.SubjectName }} (Max:{{ subject.SubjectCategory === "Major" ? MajorMaxMark : MinorMaxMark }})
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in studentMarks" :key="student.StudentId">
                  <td style="background-color: #201f1f; text-align:end;" class="sticky-col left-col">
                    {{ student.RollNo }}
                  </td>
                  <td style="background-color: #201f1f;" class="sticky-col">
                    {{ student.Name }}
                  </td>
                  <td v-for="subject in subjects" :key="subject.Id">
                    <span 
                      v-if="getMarkForStudentSubject(student.StudentId, subject.Id)" 
                      class="mark-display"
                      :class="{
                        'has-text-danger': getMarkForStudentSubject(student.StudentId, subject.Id).MarksObtained < (getMarkForStudentSubject(student.StudentId, subject.Id).MaxMarks * 0.4),
                        'has-text-success': getMarkForStudentSubject(student.StudentId, subject.Id).MarksObtained >= (getMarkForStudentSubject(student.StudentId, subject.Id).MaxMarks * 0.4)
                      }"
                    >
                      {{ getMarkForStudentSubject(student.StudentId, subject.Id).MarksObtained }}
                    </span>
                    <span v-else class="has-text-grey">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- No Data Message -->
        <div v-if="!loading && selectedSectionId && studentMarks.length === 0" class="notification is-warning mt-4">
          No marks data found for selected class and section.
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
const { CurrentExamId, CurrentExamName, MinorMaxMark, MajorMaxMark, Result_Published, loadActiveExam } = useActiveExam()

const classes = ref([])
const sections = ref([])
const subjects = ref([])
const studentMarks = ref([])
const allMarks = ref([])
const selectedClassId = ref('')
const selectedClass = ref(null)
const selectedSectionId = ref('')
const loading = ref(false)

// Fetch classes on mount
onMounted(async () => {
  await loadActiveExam()
  const result = await window.electronAPI.getClasses()
  if (result.success) classes.value = result.classes
})

// Class selection
function selectClass(cls) {
  selectedClass.value = cls
  selectedClassId.value = cls.Id
  selectedSectionId.value = ''
  studentMarks.value = []
  allMarks.value = []
}

// Section selection
function selectSection(sec) {
  selectedSectionId.value = sec.Id
}

// Watch for class selection changes
watch(selectedClassId, async (classId) => {
  if (!classId) {
    sections.value = []
    subjects.value = []
    studentMarks.value = []
    allMarks.value = []
    selectedSectionId.value = ''
    return
  }

  loading.value = true
  try {
    // Fetch sections and subjects in parallel
    const [secResult, subResult] = await Promise.all([
      window.electronAPI.getSectionsByClass(classId),
      window.electronAPI.getSubjectssByClassId(classId)
    ])

    if (secResult.success) sections.value = secResult.sections
    if (subResult.success) subjects.value = subResult.subjects
  } catch (error) {
    console.error("Error fetching sections/subjects:", error)
  } finally {
    loading.value = false
  }
})

// Watch for section selection changes
watch(selectedSectionId, async (sectionId) => {
  if (!selectedClassId.value || !sectionId) {
    studentMarks.value = []
    allMarks.value = []
    return
  }

  loading.value = true
  try {
    // Fetch students and marks in parallel
    const [studentsResult, marksResult] = await Promise.all([
      window.electronAPI.getStudentsByClassAndSection({
        classId: selectedClassId.value,
        sectionId: sectionId
      }),
      window.electronAPI.getMarksByClassSection({
        classId: selectedClassId.value,
        sectionId: sectionId,
        academicYearId: CurrentYearId.value,
        examId: CurrentExamId.value
      })
    ])

    if (studentsResult.success) {
      studentMarks.value = studentsResult.students
    }

    if (marksResult.success) {
      allMarks.value = marksResult.marks
      console.log("Fetched marks:", allMarks.value) // Debug log
    }
  } catch (error) {
    console.error("Error fetching data:", error)
  } finally {
    loading.value = false
  }
})

// Helper function to get marks for a specific student and subject
function getMarkForStudentSubject(studentId, subjectId) {
  return allMarks.value.find(mark => 
    mark.StudentId === studentId && 
    mark.SubjectId === subjectId
  )
}
</script>

<style scoped>
.marks-entry-container {
  display: flex;
  gap: 1rem;
  min-height: 500px;
}

.vertical-tabs {
  width: 200px;
  border-radius: 4px;
  padding: 0.5rem;
}

.vertical-tabs ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.vertical-tabs li {
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 0.25rem;
}

.vertical-tabs li:hover {
  background: hsl(171, 100%, 41%);
  color:black;
}

.vertical-tabs li.is-active {
  background: #3273dc;
  color: white;
}

.main-content {
  flex: 1;
}

.table-container-scroll {
  overflow-x: auto;
  max-height: 70vh;
  overflow-y: auto;
}

.marks-display-table {
  min-width: 800px;
}

.sticky-col {
  position: sticky;
  left: 0;
  background-color: #201f1f;
  color: white;
  z-index: 1;
}

.left-col {
  left: 0;
  z-index: 2;
}

.mark-display {
  font-weight: bold;
}

.loader {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.buttons .button.is-small.is-active {
  background-color: #3273dc;
  color: white;
}

.thin-line {
  border: none;
  border-top: 1px solid #3c3b3b;
}

.has-text-danger {
  color: #ff3860;
}

.has-text-success {
  color: #23d160;
}

.has-text-grey {
  color: #7a7a7a;
}
</style>