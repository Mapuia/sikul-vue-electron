<template>
  <div class="form-container full">
    <h1 class="title has-text-centered">Marks Entry - {{ currentExam }}</h1>
    <hr class="thin-line" />

    <div class="marks-entry-container">
      <aside class="vertical-tabs">
        <div class="tab-heading has-text-weight-bold has-text-centered py-2 is-primary">Class</div>
        <ul>
          <li
            v-for="cls in classes"
            :key="cls.Id"
            :class="{ 'is-active': cls === selectedClass }"
            @click="selectClass(cls)"
          >
            Class - {{ cls.ClassName }}
          </li>
        </ul>
      </aside>

      <div class="main-content">
        <div v-if="selectedClass" class="mb-2">
          <h1 class="title is-4">Class: {{ selectedClass.ClassName }}</h1>
        </div>

        <div v-if="sections.length" class="mb-4 is-flex is-align-items-center">
          <label class="label mr-2">Section:</label>
          <div class="buttons">
            <label class="button is-small" v-for="sec in sections" :key="sec.Id">
              <input
                class="is-horizontal"
                type="radio"
                name="section"
                v-model="selectedSectionId"
                :value="sec.Id"
              />&nbsp;{{ sec.SectionName }}
            </label>
          </div>
        </div>

        <div v-if="subjects.length && selectedSectionId" class="mb-4">
          <label class="label">Select Subject:</label>
          <div class="select is-small">
            <select v-model="selectedSubjectId">
              <option disabled value="">-- Select Subject --</option>
              <option v-for="subject in subjects" :key="subject.Id" :value="subject.Id">
                {{ subject.SubjectName }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="selectedSubjectId" class="form-container wide">
          <div clas=" box ">
          <table class="table is-bordered is-striped is-fullwidth mt-3">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Student Name</th>
                <th>Marks ({{ selectedSubjectName }})</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.StudentId">
                <td>{{ student.RollNo }}</td>
                <td>{{ student.Name }}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    class="input is-small"
                    v-model.number="marks[student.StudentId]"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
          <button class="button is-primary mt-4" @click="submitMarks">
            Submit Marks
          </button>

          <div v-if="successMessage" class="notification is-success mt-3">
            {{ successMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'

import { useAcademicYear } from '../../composables/useAcademicYear'
const { currentYearId, currentYear } = useAcademicYear()

import { useActiveExam } from '../../composables/useActiveExam'
const { currentExamId, currentExam, loadActiveExam } = useActiveExam(currentYearId.value)

const classes = ref([])
const sections = ref([])
const subjects = ref([])
const students = ref([])
const marks = ref({})

const selectedClass = ref(null)
const selectedSectionId = ref('')
const selectedSubjectId = ref('')
const successMessage = ref('')

const selectedSubjectName = computed(() => {
  const subject = subjects.value.find(sub => sub.Id === selectedSubjectId.value)
  return subject ? subject.SubjectName : ''
})

async function fetchClasses() {
  const result = await window.electronAPI.getClasses()
  if (result.success) {
    classes.value = result.classes
  }
}

async function selectClass(cls) {
  selectedClass.value = cls;
  selectedSectionId.value = '';
  selectedSubjectId.value = '';
  sections.value = [];
  subjects.value = [];
  students.value = [];
  marks.value = {};

  const secResult = await window.electronAPI.getSectionsByClass(cls.Id);
  if (secResult.success) {
    sections.value = secResult.sections;
    console.log('Sections:', sections.value);
  }
  const subResult = await window.electronAPI.getSubjectssByClassId(cls.Id);
  if (subResult.success) {
    subjects.value = subResult.subjects;
    console.log('Subjects:', subjects.value);
  }
}

watch(selectedSectionId, async (newSectionId) => {
  console.log("Watch:SelectedSectionId:", newSectionId);
  if (!newSectionId || !selectedClass.value) {
    students.value = [];
    marks.value = {};
    return;
  }

  try {
    const studentResult = await window.electronAPI.getStudentsByClassAndSection({
      classId: selectedClass.value.Id,
      sectionId: newSectionId,
    });

    if (studentResult.success) {
      students.value = studentResult.students;

      console.log('Watch:', students.value)

      marks.value = {};
      students.value.forEach((student) => {
        marks.value[student.StudentId] = '';
      });
      //console.log('Students:', students.value);
    } else {
      students.value = [];
      marks.value = {};
      console.error('Error fetching students:', studentResult.error);
    }
    selectedSubjectId.value = '';
  } catch (error) {
    console.error("Error in watch(selectedSectionId):", error);
    students.value = [];
    marks.value = {};
  }
});

watch(selectedSubjectId, (newVal) => {
  console.log('Watch2:',selectedSubjectId)
  if (newVal && students.value.length) {
    if (Object.keys(marks.value).length === 0) {
      students.value.forEach(student => {
        marks.value[student.StudentId] = '';
      });
    }
  }
});

function submitMarks() {
  if (!selectedSubjectId.value || !selectedSectionId.value || !selectedClass.value) {
    console.warn('Please select a class, section, and subject before submitting.');
    return;
  }

  const data = students.value.map(student => ({
    StudentId: student.StudentId,
    SubjectId: selectedSubjectId.value,
    ExamId: currentExamId.value,
    AcademicYearId: currentYearId.value,
    MarksObtained: marks.value[student.StudentId] ?? '',
  }));

  console.log('Submitted Marks:', data);

  // Call the IPC channel to save marks
  window.electronAPI.saveMarks(data).then((result) => {
    if (result.success) {
      successMessage.value = 'Marks submitted successfully!';
      setTimeout(() => {
        successMessage.value = '';
      }, 3000);
    } else {
      alert(`Failed to save marks: ${result.error}`); // Basic error handling
    }
  });
}

onMounted(() => {
  loadActiveExam()
  fetchClasses()
})
</script>

<style scoped>
.marks-entry-container {
  display: flex;
  gap: 1.5rem;
}

.vertical-tabs {
  width: 130px;
  border: 1px solid #ddd;
}

.tab-heading {
  color: black;
  background-color: #00d1b2;
}

.vertical-tabs ul {
  list-style-type: none;
  padding-left: 0;
}

.vertical-tabs li {
  padding: 0.5rem;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.vertical-tabs li.is-active {
  background-color: white;
  color: rgb(24, 22, 22);
  font-weight: bold;
}

.thin-line {
  border: none;
  border-top: 1px solid #3c3b3b;
  margin-bottom: -0.5rem;
}
</style>
