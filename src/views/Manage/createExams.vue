<template>
  <div class="form-container single">
    <h1 class="title has-text-centered">Active Exam Setup</h1>
    <h2 class="Subtitle has-text-centered"> {{currentYear}}</h2>
    <div class="buttons mt-4">
      <button class="button is-primary" v-if="!showForm" @click="showForm = true">
        Add New
      </button>
    </div>

    <div class="box mt-4" v-if="showForm">
      <h2 class="subtitle">Add New Active Exam</h2>
      <form @submit.prevent="submitForm" @reset="resetForm">
        <div class="field">
          <label class="label">Exam Name</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="selectedExamName" required>
                <option disabled value="">-- Select Exam --</option>
                <option v-for="exam in exams" :key="exam.Id" :value="exam.ExamName">
                  {{ exam.ExamName }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">Major Subject Max Marks</label>
          <div class="control">
            <input type="number" class="input" v-model.number="majorMark" required />
          </div>
        </div>

        <div class="field">
          <label class="label">Minor Subject Max Marks</label>
          <div class="control">
            <input type="number" class="input" v-model.number="minorMark" required />
          </div>
        </div>

        <div class="field">
          <label class="label">Co-Scholastic </label>
          <div class="control">
            <input type="text" class="input" v-model="coScholasticMark" />
          </div>
        </div>

        <div class="field is-grouped mt-4">
          <div class="control">
            <button type="submit" class="button is-primary">Submit</button>
          </div>
          <div class="control">
            <button type="reset" class="button is-light" @click="showForm = false">Cancel</button>
          </div>
        </div>

        <div v-if="formError" class="notification is-danger mt-4">
          {{ formError }}
        </div>
      </form>
    </div>

    <div v-if="successMessage" class="notification is-success mt-4">{{ successMessage }}</div>

    <div class="box mt-4">
      <h2 class="subtitle">Current Active Exams</h2>
      <div v-if="loading" class="notification is-info is-light has-text-centered">
        <span class="loader"></span>
      </div>
      <div v-else-if="activeExams">
        <table class="table is-fullwidth">
          <thead>
            <tr>
              <th>Exam Name</th>
              <th>Academic Year</th>
              <th>Major</th>
              <th>Minor</th>
              <th>Co-Scholastic</th>
              <th>Active?</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exam in activeExams" :key="exam.Id">
              <td>{{ exam.ExamName }}</td>
              <td>{{ exam.AcademicYearId }}</td>
              <td>{{ exam.MajorMaxMark }}</td>
              <td>{{ exam.MinorMaxMark }}</td>
              <td>{{ exam.CoScholasticMaxMark }}</td>
              <td>
                <span class="tag" :class="exam.isActive ? 'is-success' : 'is-light'">
                  {{ exam.IsActive ? 'Yes' : 'No' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="notification is-warning">No exams configured yet.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAcademicYear } from '../../composables/useAcademicYear';

const { currentYearId, currentYear } = useAcademicYear();

const activeExams = ref([]);
const exams = ref([]);
const showForm = ref(false);

const selectedExamName = ref('');
const majorMark = ref(null);
const minorMark = ref(null);
const coScholasticMark = ref(null);

const formError = ref('');
const successMessage = ref('');
const loading = ref(false);

async function fetchData() {
  loading.value = true;
  try {
    const [activeExamRes, examsRes] = await Promise.all([
      window.electronAPI.getActiveExams(),
      window.electronAPI.getExams()
    ]);
    console.log(examsRes);
    if (activeExamRes.success) activeExams.value = activeExamRes.activeExams;
    if (examsRes.success) exams.value = examsRes.exams; 
 
  } catch (err) {
    formError.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  formError.value = '';
  if (!selectedExamName.value || !majorMark.value || !minorMark.value ) {
    formError.value = 'Please fill in required fields.';
    return;
  }

  try {
    // Set existing IsActive = 0
    //await window.electronAPI.deactivateAllActiveExams(currentYearId);

    // Insert new Active Exam
    const response = await window.electronAPI.insertActiveExam({
      AcademicYearId: currentYearId,
      ExamName: selectedExamName.value,
      MajorMaxMark: majorMark.value,
      MinorMaxMark: minorMark.value,
      CoScholasticMaxMark: coScholasticMark.value,
      isActive: 1
    });

    if (response.success) {
      successMessage.value = 'Active Exam added successfully.';
      showForm.value = false;
      selectedExamName.value = '';
      majorMark.value = null;
      minorMark.value = null;
      coScholasticMark.value = null;
      fetchData();
      setTimeout(() => (successMessage.value = ''), 3000);
    } else {
      formError.value = response.message || 'Failed to insert.';
    }
  } catch (err) {
    formError.value = err.message;
  }
}

function resetForm() {
  selectedExamName.value = '';
  majorMark.value = null;
  minorMark.value = null;
  coScholasticMark.value = null;
  formError.value = '';
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.tag {
  margin-right: 0.25rem;
}
</style>
