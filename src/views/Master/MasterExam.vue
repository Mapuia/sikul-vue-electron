<template>
  <div class="form-container full">
    <h1 class="title has-text-centered">Exams - Master Entry</h1>

    <div class="buttons mt-4">
      <button class="button is-primary " @click="showAddForm = true" v-if="!showAddForm">
        Add New Exam
      </button>
    </div>

    <div class="box mt-4" v-if="showAddForm">
      <h2 class="subtitle">Add New Exam</h2>
      <form @submit.prevent="submitForm" @reset="resetForm">
        <div class="field">
          <label class="label">Exam Name</label>
          <div class="control">
            <input
              class="input"
              type="text"
              v-model="newExamName"
              placeholder="e.g., Name of Exam or Test"
              required
            />
          </div>
        </div>
      
        <div class="field">
          <label class="label">Description</label>
          <div class="control">
            <textarea
              class="textarea"
              v-model="newDescription"
              placeholder="Exam Description"
            ></textarea>
          </div>
        </div>

        <div class="field is-grouped mt-4">
          <div class="control">
            <button type="submit" class="button is-primary">Submit</button>
          </div>
          <div class="control">
            <button type="reset" class="button is-light" @click="showAddForm = false">Cancel</button>
          </div>
        </div>

        <div v-if="addErrorMessage" class="notification is-danger mt-4">
          {{ addErrorMessage }}
        </div>
      </form>
    </div>

    <div v-if="errorMessage" class="notification is-danger mt-4">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="notification is-success mt-4">
      {{ successMessage }}
    </div>

    <div class="box mt-4">
      <h2 class="subtitle">Exam List</h2>
      <div v-if="loading" class="notification is-info is-light has-text-centered">
        <span class="loader"></span>
      </div>
      <div v-else-if="exams.length > 0">
        <table class="table is-fullwidth">
          <thead>
            <tr>
              <th>ID</th>
              <th>Exam Name</th>
               <th>Description</th>
              <th class="has-text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exam in exams" :key="exam.Id">
              <td>{{ exam.Id }}</td>
              
              <td v-if="editingExamId !== exam.Id">{{ exam.ExamName }}</td>
              <td v-else>
                <input type="text" class="input" v-model="editExamName" />
              </td>
              
              <td v-if="editingExamId !== exam.Id">{{ exam.Description }}</td>
              <td v-else>
                <input type="text" class="input" v-model="editDescription" />
              </td>
              <td>
                <div class="buttons is-grouped is-justify-content-end">
                  <button
                    class="button is-small is-info"
                    @click="editExam(exam)"
                    v-if="editingExamId !== exam.Id"
                  >
                    Edit
                  </button>
                  <button
                    class="button is-small is-success"
                    @click="saveEdit(exam)"
                    v-else
                  >
                    <span class="icon is-small">
                      <i class="fas fa-check"></i>
                    </span>
                    <span>Save</span>
                  </button>
                  <button
                    class="button is-small is-warning"
                    @click="cancelEdit()"
                    v-if="editingExamId === exam.Id"
                  >
                    <span class="icon is-small">
                      <i class="fas fa-times"></i>
                    </span>
                    <span>Cancel</span>
                  </button>
                  <button class="button is-small is-danger" @click="deleteExam(exam.Id)">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="notification is-warning">
        No exams found.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const exams = ref([]);
const newExamName = ref('');
const newDescription = ref('');
const successMessage = ref('');
const errorMessage = ref('');
const addErrorMessage = ref('');
const showAddForm = ref(false);
const editingExamId = ref(null);
const editExamName = ref('');
const editDescription = ref('');
const loading = ref(false);

async function fetchExams() {
  loading.value = true;
  try {
    const response = await window.electronAPI.getExams();
    if (response.success) {
      exams.value = response.exams;
    } else {
      errorMessage.value = response.message || 'Failed to fetch exams.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function submitForm() { // Add Exam
  if (!newExamName.value.trim()) {
    addErrorMessage.value = 'Exam Name is required.';
    return;
  }  

  try {
    const response = await window.electronAPI.insertExam(
      newExamName.value.trim(),      
      newDescription.value
    );
    if (response.success) {
      successMessage.value = 'Exam added successfully.';
      addErrorMessage.value = '';
      showAddForm.value = false;
      newExamName.value = '';     
      newDescription.value = '';
      fetchExams(); // Refresh the exam list
      setTimeout(() => {
        successMessage.value = '';
      }, 3000);
    } else {
      addErrorMessage.value = response.message || 'Failed to add exam.';
    }
  } catch (err) {
    addErrorMessage.value = err.message;
  }
}

function resetForm() {
  newExamName.value = '';
  newDescription.value = '';
  addErrorMessage.value = '';
}

function editExam(exam) {
  editingExamId.value = exam.Id;
  editExamName.value = exam.ExamName;
  editDescription.value = exam.Description;
}

function cancelEdit() {
  editingExamId.value = null;
  editExamName.value = '';
  editDescription.value = '';
}

async function saveEdit(exam) {
    if (!editExamName.value.trim()) {
    errorMessage.value = 'Exam Name is required.';
    return;
  }
  

  try {
    const response = await window.electronAPI.updateExam(
      exam.Id,
      editExamName.value.trim(),
      editDescription.value
    );
    if (response.success) {
      successMessage.value = 'Exam updated successfully.';
      editingExamId.value = null;
      editExamName.value = '';
      editDescription.value = '';
      fetchExams(); // Refresh the exam list
      setTimeout(() => {
        successMessage.value = '';
      }, 3000);
    } else {
      errorMessage.value = response.message || 'Failed to update exam.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  }
}

async function deleteExam(examId) {
  const shouldDelete = await window.electronAPI.showConfirmationDialog(
    `Are you sure you want to delete this exam?`
  );
 // console.log("exam Id:", examIdToDelete)
  if (shouldDelete) {
    try {
      const response = await window.electronAPI.deleteExam(examId);
      if (response.success) {
        successMessage.value = `Exam deleted successfully.`;
        fetchExams(); // Refresh the exam list
        setTimeout(() => {
          successMessage.value = '';
        }, 3000);
      } else {
        errorMessage.value = response.message || 'Failed to delete exam.';
      }
    } catch (err) {
      errorMessage.value = err.message;
    }
  }
}

onMounted(() => {
  fetchExams();
});
</script>

<style scoped>


.title {
  margin-bottom: 1rem;
}

.subtitle {
  margin-bottom: 0.5rem;
}

.loader {
  border: 4px solid #f3f3f3;
  /* Light grey */
  border-top: 4px solid #3699ff;
  /* Blue */
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>