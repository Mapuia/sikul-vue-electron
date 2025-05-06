<template>
  <div class="form-container full">
    <h1 class="title has-text-centered">Active Exams</h1>
    <h2 class="subtitle has-text-centered">Academic Year: {{ currentYear }}</h2>

    <div class="buttons mt-4">
      <button class="button is-primary" v-if="!showForm" @click="showForm = true">
        Ceate New Exam
      </button>
    </div>

    <!-- Form for adding/editing exams -->
    <div class="box mt-4" v-if="showForm">
      <div class="field">
        <label class="label">Exam Name</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="form.ExamName">
              <option value="" disabled>Select Exam</option>
              <option v-for="exam in exams" :key="exam.Id" :value="exam.ExamName">
                {{ exam.ExamName }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">Major Max Mark</label>
        <div class="control">
          <input class="input" type="number" v-model.number="form.MajorMaxMark" />
        </div>
      </div>

      <div class="field">
        <label class="label">Minor Max Mark</label>
        <div class="control">
          <input class="input" type="number" v-model.number="form.MinorMaxMark" />
        </div>
      </div>

      <div class="field">
        <label class="label">Co-Scholastic Max Mark (Optional)</label>
        <div class="control">
          <input class="input" type="number" v-model.number="form.CoScholasticMaxMark" />
        </div>
      </div>

      <div class="field">
        <label class="checkbox">
          <input type="checkbox" v-model="form.IsActive" />
          Active
        </label>
      </div>

      <div class="field is-grouped">
        <div class="control">
          <button class="button is-link" @click="submitForm" :disabled="loading">
            {{ editingId ? 'Update Exam' : 'Add Exam' }}
          </button>
        </div>
        <div class="control">
          <button class="button is-light" @click="resetForm" :disabled="loading">
            Cancel
          </button>
        </div>
      </div>

      <p class="help is-danger" v-if="formError">{{ formError }}</p>
    </div>

    <!-- Notifications -->
    <div v-if="successMessage" class="notification is-success fixed-notification">{{ successMessage }}</div>
    <div v-if="errorMessage" class="notification is-danger fixed-notification">{{ errorMessage }}</div>

    <!-- Active Exams Table -->
    <div class="box mt-4">
      <h2 class="subtitle">Active Exams for {{ currentYear }}</h2>
      <div v-if="loading" class="notification is-info is-light has-text-centered">
        <span class="loader"></span> Loading...
      </div>
      <div v-else-if="activeExams.length > 0">
        <table class="table is-fullwidth is-striped">
          <thead class="has-text-centered">
            <tr>
              <th>Name of Exams</th>
              <th>Major Marks</th>
              <th>Minor Marks</th>
              <th>Co-Scholastic</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exam in activeExams" :key="exam.Id">
              <td>{{ exam.ExamName }}</td>
              <td>{{ exam.MajorMaxMark }}</td>
              <td>{{ exam.MinorMaxMark }}</td>
              <td>{{ exam.CoScholasticMaxMark || '-' }}</td>
              <td>
                <span class="tag" :class="exam.IsActive ? 'is-success' : 'is-warning'">
                  {{ exam.IsActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="buttons">
                  <button 
                    class="button is-small is-info" 
                    @click="editExam(exam)"
                    :disabled="loading"
                  >
                    Edit
                  </button>
                  <button class="button is-small is-danger" @click="deleteExam(exam)">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="notification is-warning">
        No active exams configured for this academic year.
      </div>
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
const editingId = ref(null);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const formError = ref('');

const form = ref({
  ExamName: '',
  MajorMaxMark: null,
  MinorMaxMark: null,
  CoScholasticMaxMark: null,
  IsActive: true
});

async function fetchActiveExams() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await window.electronAPI.getActiveExams(currentYearId.value);
    if (response.success) {
      activeExams.value = response.data.map(exam => ({
        ...exam,
        IsActive: exam.IsActive === 1
      }));
    } else {
      errorMessage.value = response.message || 'Failed to fetch active exams';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function fetchExams() {
  try {
    const response = await window.electronAPI.getExams();
    if (response.success) {
      exams.value = response.exams;
    } else {
      errorMessage.value = response.message || 'Failed to fetch exams';
    }
  } catch (err) {
    errorMessage.value = err.message;
  }
}

async function refreshData() {
  await Promise.all([fetchActiveExams(), fetchExams()]);
}

async function submitForm() {
  formError.value = '';

  if (!form.value.ExamName || form.value.MajorMaxMark === null || form.value.MinorMaxMark === null) {
    formError.value = 'Please fill in all required fields';
    return;
  }

  loading.value = true;

  try {
    const examData = {
      AcademicYearId: currentYearId.value,
      ExamName: form.value.ExamName,
      MajorMaxMark: form.value.MajorMaxMark,
      MinorMaxMark: form.value.MinorMaxMark,
      CoScholasticMaxMark: form.value.CoScholasticMaxMark || 0,
      IsActive: form.value.IsActive ? 1 : 0
    };

    let response;
    if (editingId.value) {
      examData.Id = editingId.value;
      response = await window.electronAPI.updateActiveExam(examData);
    } else {
      response = await window.electronAPI.insertActiveExam(examData);
    }

    if (response.success) {
      successMessage.value = editingId.value 
        ? 'Exam updated successfully!' 
        : 'Active exam added successfully!';
      resetForm();
      await refreshData();
    } else {
      formError.value = response.message || 'Operation failed. Please try again.';
    }
  } catch (err) {
    formError.value = err.message;
  } finally {
    loading.value = false;
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  }
}

function editExam(exam) {
  editingId.value = exam.Id;
  form.value = {
    ExamName: exam.ExamName,
    MajorMaxMark: exam.MajorMaxMark,
    MinorMaxMark: exam.MinorMaxMark,
    CoScholasticMaxMark: exam.CoScholasticMaxMark,
    IsActive: exam.IsActive
  };
  showForm.value = true;
}

async function deleteExam(exam) {
  const confirm = await window.electronAPI.showConfirmationDialog(
    `Are you sure you want to delete ${exam.ExamName}?`
  );
  if (!confirm) return;

  loading.value = true;
  try {
    const response = await window.electronAPI.deleteActiveExam(exam.Id);
    if (response.success) {
      successMessage.value = 'Exam deleted successfully!';
      await refreshData();
    } else {
      errorMessage.value = response.message || 'Failed to delete exam.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
    setTimeout(() => {
      successMessage.value = '';
      errorMessage.value = '';
    }, 3000);
  }
}

function resetForm() {
  form.value = {
    ExamName: '',
    MajorMaxMark: null,
    MinorMaxMark: null,
    CoScholasticMaxMark: null,
    IsActive: true
  };
  editingId.value = null;
  showForm.value = false;
  formError.value = '';
}

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
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

.buttons {
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tag {
  min-width: 70px;
  justify-content: center;
}

.table td, .table th {
  vertical-align: middle;
}
</style>
