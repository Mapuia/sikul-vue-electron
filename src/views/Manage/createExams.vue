<template>
  <div class="form-container full">
    <h1 class="title has-text-centered">Active Exams</h1>
    <h2 class="subtitle has-text-centered">Academic Year: {{ currentYear }}</h2>

    <div class="buttons mt-4">
      <button class="button is-primary" v-if="!showForm" @click="showForm = true" title="Create New Exam">
         <span class="fas fa-plus pr-3"></span> New
      </button>
    </div>

    <!-- Form for adding/editing exams -->
    <div class="box mt-4 single" v-if="showForm">
      <div class="field">
        <label class="label">Exam Name</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="form.ExamId">
              <option value="" disabled>Select Exam</option>
              <option v-for="exam in exams" :key="exam.Id" :value="exam.Id">
                {{ exam.ExamName }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">Major Max Mark</label>
        <div class="control">
          <input class="input" type="number" v-model.number="form.MajorMaxMark" required/>
        </div>       
      </div>

      <div class="field">
        <label class="label">Minor Max Mark</label>
        <div class="control">
          <input class="input" type="number" v-model.number="form.MinorMaxMark" required />
        </div>        
      </div>

      <div class="field is-grouped">
        <label class="checkbox">
          <input type="checkbox" v-model="form.IsActive" />
          Set Active
        </label>
      </div>

      <div class="field is-grouped">
        <div class="control">
          <button class="button is-link" @click="submitForm" :disabled="loading">
            {{ editingId ? 'Update Exam' : 'Save Exam' }}
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
      <h2 class="subtitle">Available Exams for {{ currentYear }}</h2>
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
              <th>Status</th>           
              <th>Published?</th>
              <th>Published Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exam in activeExams" :key="exam.Id">
              <td>{{ exam.ExamName }}</td>
              <td>{{ exam.MajorMaxMark }}</td>
              <td>{{ exam.MinorMaxMark }}</td>         
              <td>
                <span class="tag" :class="exam.IsActive ? 'is-success' : 'is-dark'">
                  {{ exam.IsActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <span class="tag" :class="exam.Result_Published ? 'is-success' : 'is-dark'">
                  {{ exam.Result_Published ? 'Published' : 'Not Published' }}
                </span>
              </td>
              <td>
            
                  {{ exam.PublishDate }}
              
              </td>
              <td>
                <div class="buttons">
                  <button 
                    class="button is-small is-info no-padding" 
                    @click="editExam(exam)"
                    :disabled="loading"
                    title="Edit this Exam"
                  >
                    <span class="fas fa-edit"></span>
                  </button>
                  <button class="button is-small is-danger no-padding" @click="deleteExam(exam)" title="Delete Exam">
                    <span class="fas fa-trash-alt"></span>
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
  ExamId: '', // Will be set from the dropdown
  MajorMaxMark: 20, // Default values
  MinorMaxMark: 10,  
  IsActive: false,
  Result_Published: false
});

async function fetchActiveExams() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await window.electronAPI.getActiveExams(currentYearId.value);
    console.log("API Response:", response); // Debug log
    
    if (response.success) {
      activeExams.value = response.exams;
      console.log("Active exams set:", activeExams.value); // Debug log
    } else {
      errorMessage.value = response.message || 'Failed to fetch active exams';
    }
  } catch (err) {
    console.error("Fetch error:", err); // Debug log
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
  
  // Debug logging before validation
  console.log("Form inputs:", {
    ExamId: form.value.ExamId,
    MajorMaxMark: form.value.MajorMaxMark,
    MinorMaxMark: form.value.MinorMaxMark   
  });

  // Validate required fields
  if (!form.value.ExamId) {
    formError.value = 'Please select an exam';
    return;
  }
  
  if (form.value.MajorMaxMark === null || form.value.MajorMaxMark === '') {
    formError.value = 'Please enter major subject max marks';
    return;
  }
  
  if (form.value.MinorMaxMark === null || form.value.MinorMaxMark === '') {
    formError.value = 'Please enter minor subject max marks';
    return;
  }

  // Additional validation if needed
  if (form.value.MajorMaxMark < 0 || form.value.MinorMaxMark < 0) {
    formError.value = 'Marks cannot be negative';
    return;
  }

  loading.value = true;

  try {
    const selectedExam = exams.value.find(e => e.Id === form.value.ExamId);
    if (!selectedExam) {
      throw new Error('Selected exam not found');
    }

    const examData = {
      AcademicYearId: currentYearId.value,
      ExamId: form.value.ExamId,
      MajorMaxMark: Number(form.value.MajorMaxMark),
      MinorMaxMark: Number(form.value.MinorMaxMark),    
      IsActive: form.value.IsActive ? 1 : 0,      
      Result_Published: form.value.Result_Published ? 1 : 0
    };

    console.log("Submitting:", examData); // Debug output

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
        : 'Exam configuration added successfully!';
      resetForm();
      setTimeout(() => successMessage.value = '', 3000);
      await refreshData();
    } else {
      formError.value = response.message || 'Operation failed. Please try again.';
    }
  } catch (err) {
    console.error("Submission error:", err);
    formError.value = err.message;
  } finally {
    loading.value = false;
  }
}

function editExam(exam) {
  editingId.value = exam.Id;
  form.value = {
    ExamId: exam.ExamId,
    MajorMaxMark: exam.MajorMaxMark,
    MinorMaxMark: exam.MinorMaxMark,
    IsActive: exam.IsActive === 1,    
    Result_Published: exam.Result_Published === 1
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
    ExamId: '',
    MajorMaxMark: '',
    MinorMaxMark: '',   
    IsActive: false,
    Result_Published: false
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
