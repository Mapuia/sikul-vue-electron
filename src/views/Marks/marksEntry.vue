<template>
  <div class="form-container full">
    <h1 class="title has-text-centered">Marks Entry - {{ActiveExam}}</h1>
    <hr class="thin-line" />

    <div class="marks-entry-container">
      <aside class="vertical-tabs">
        <div class="tab-heading has-text-weight-bold has-text-centered py-2 is-primary">Class</div>
        <ul>
          <li
            v-for="cls in classes"
            :key="cls.ClassName"
            :class="{ 'is-active': cls.ClassName === selectedClass }"
            @click="selectClass(cls.ClassName)"
          >
            Class - {{ cls.Id }}
          </li>
        </ul>
      </aside>

      <div class="main-content">
        <div v-if="selectedClass" class="mb-2">
          <h1 class="title is-4">Class: {{ selectedClass }}</h1>
        </div>

        <div v-if="selectedClass" class="mb-4 is-flex is-align-items-center">
          <label class="label mr-2">Section:</label>
          <div class="buttons">
            <label class="button is-small" v-for="sec in sections" :key="sec.SectionName">
              <input class="is-horizontal" type="radio" name="section" v-model="selectedSection" :value="sec.SectionName" /> &nbsp;{{ sec.SectionName }}
            </label>
          </div>
        </div>

        <div v-if="selectedSection" class="mb-4">
          <label class="label mr-2">Subject:</label>
          <div class="control">
            <div class="select">
              <select v-model="selectedSubject" @change="loadStudentsAndInitializeMarks">
                <option value="" disabled>Select Subject</option>
                <option v-for="sub in subjects" :key="sub.Id" :value="sub.Id">
                  {{ sub.SubjectName }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="selectedSubject && students.length > 0">
          <div class="table-container-scroll">
            <table class="table is-bordered is-striped is-fullwidth marks-entry-table">
              <thead>
                <tr>
                  <th style="background-color: #201f1f;" class="sticky-col left-col">Roll No.</th>
                  <th style="background-color: #201f1f;" class="sticky-col">Student Name</th>
                  <th>{{ selectedSubject }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(student, sIndex) in students" :key="student.id">
                  <td style="background-color: #201f1f; text-align:end;" class="sticky-col left-col">{{ sIndex + 1 }}</td>
                  <td style="background-color: #201f1f;" class="sticky-col">{{ student.name }}</td>
                  <td>
                    <input
                      class="input is-small"
                      type="number"
                      min="0"
                      max="100"
                      v-model.number="marks[sIndex]"
                      :ref="el => setInputRef(sIndex, el)"
                      @keydown.enter.prevent="focusNext(sIndex)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="field is-grouped mt-4">
            <div class="control">
              <button class="button is-primary" @click="submitMarks">Submit Marks</button>
            </div>
          </div>

          <div v-if="successMessage" class="notification is-success mt-4">
            {{ successMessage }}
          </div>
        </div>
        <div v-else-if="selectedSection && !selectedSubject">
          <div class="notification is-info">Please select a subject.</div>
        </div>
        <div v-else-if="selectedSection && selectedSubject && students.length === 0">
          <div class="notification is-warning">No students found for the selected class and section.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const inputRefs = ref({});

function setInputRef(row, el) {
  inputRefs.value[row] = el;
}

function focusNext(currentRow) {
  if (inputRefs.value[currentRow + 1]) {
    inputRefs.value[currentRow + 1].focus();
  }
}

const ActiveExam = ref();
const classes = ref([]);
const sections = ref([]);
const subjects = ref([]);

const selectedClass = ref('');
const selectedSection = ref('');
const selectedSubject = ref('');
const students = ref([]);
const marks = ref([]);
const successMessage = ref('');
const loadingSubjects = ref(false);

async function fetchSubjects() {
  loadingSubjects.value = true;
  try {
    const response = await window.electronAPI.getSubjects();
    if (response.success) {
      subjects.value = response.subjects;
    } else {
      errorMessage.value = response.message || 'Failed to fetch subjects.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loadingSubjects.value = false;
  }
}

async function fetchActiveExam(){
  try {
    const response = await window.electronAPI.getActiveExam();
    if (response && response.success) {
      ActiveExam.value = response.ActiveExam;
    } else {
      console.error('No Active Exam', response?.message);
    }
  } catch (error) {
    console.error('Error fetching exam:', error);
  }
}


async function fetchClasses() {
  try {
    const response = await window.electronAPI.getClasses();
    if (response && response.success) {
      classes.value = response.classes;
    } else {
      console.error('Failed to fetch classes:', response?.message);
    }
  } catch (error) {
    console.error('Error fetching classes:', error);
  }
}

async function fetchSections() {
  try {
    const response = await window.electronAPI.getSections();
    if (response.success) {
      sections.value = response.sections;
    } else {
      errorMessage.value = response.message || 'Failed to fetch sections.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } 
}



async function loadStudentsAndInitializeMarks() {
  if (!selectedClass.value || !selectedSection.value || !selectedSubject.value) {
    students.value = [];
    marks.value = [];
    return;
  }
  try {
    const response = await window.electronAPI.getStudentsByClassAndSection(selectedClass.value, selectedSection.value); // Implement this
    if (response && response.success && response.students) {
      students.value = response.students;
      marks.value = students.value.map(() => null); // Initialize marks for the selected subject
      successMessage.value = '';
    } else {
      console.error('Failed to fetch students:', response?.message);
      students.value = [];
      marks.value = [];
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    students.value = [];
    marks.value = [];
  }
}

function selectClass(cls) {
  selectedClass.value = cls;
  selectedSection.value = '';
  selectedSubject.value = '';
  students.value = [];
  marks.value = [];
  successMessage.value = '';
  fetchSections();
  fetchSubjects(cls);
}

watch(selectedSection, () => {
  selectedSubject.value = ''; // Reset subject when section changes
  students.value = [];
  marks.value = [];
  successMessage.value = '';
  if (selectedSection.value && selectedClass.value && selectedSubject.value) {
    loadStudentsAndInitializeMarks();
  }
});

async function submitMarks() {
  if (!selectedClass.value || !selectedSection.value || !selectedSubject.value || students.length === 0) {
    // Handle cases where necessary data is missing
    return;
  }

  const submittedMarks = students.value.map((student, index) => ({
    studentId: student.id, // Assuming your student objects have an 'id'
    studentName: student.name,
    class: selectedClass.value,
    section: selectedSection.value,
    subject: selectedSubject.value,
    marks: marks.value[index],
  }));

  console.log('Submitted Marks:', submittedMarks);

  try {
    const response = await window.electronAPI.saveMarks(submittedMarks); // Implement this in your backend
    if (response && response.success) {
      successMessage.value = 'Marks submitted successfully.';
      // Optionally reset the form or clear marks.value
    } else {
      console.error('Failed to save marks:', response?.message);
      // Optionally display an error message to the user
    }
  } catch (error) {
    console.error('Error saving marks:', error);
    // Optionally display an error message to the user
  }
}

onMounted(() => {
  fetchClasses();
  fetchSubjects();
  fetchActiveExam();
});
</script>

<style scoped>
/* Your existing styles remain the same */
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

.table-container-scroll {
  overflow-x: auto;
}

.sticky-col {
  position: sticky;
  left: 0;
  z-index: 1;
}
</style>