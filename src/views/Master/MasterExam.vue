<template>
  <div class="form-container wide">
    <h1 class="title has-text-centered">Exams - Master Data</h1>

    <div class="buttons mt-3">
      <button class="button is-primary " @click="showAddForm = true" v-if="!showAddForm">
        <i class="fas fa-solid fa-plus mr-2"></i>
        Add New Exam
      </button>
    </div>

    <div class="box form-container single" v-if="showAddForm">
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
          <label class="label">Exam Type (Important for result calculation)</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="newExamType" required>
                <option disabled value="">-- Select Exam Type --</option>
                <option>Periodic1</option>
                <option>Periodic2</option>
                <option>Term</option>
                <option>Annual</option>
              </select>
            </div>
          </div>
        </div>
      
        <div class="field">
          <label class="label">Description</label>
          <div class="control">
            <input
              class="input"
              v-model="newDescription"
              placeholder="Exam Description"
            ></input>
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

        <div v-if="addErrorMessage" class="notification is-danger fixed-notification" @click="addErrorMessage = ''">
          {{ addErrorMessage }}
        </div>
      </form>
    </div>

    <div v-if="errorMessage" class="notification is-danger fixed-notification" @click="errorMessage = ''">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="notification is-success fixed-notification" @click="successMessage = ''">
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
              <th>Exam Type</th>
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

              <td v-if="editingExamId !== exam.Id">{{ exam.ExamType }}</td>
              <td v-else>
                <div class="select is-fullwidth">
                  <select v-model="editExamType" required>
                    <option disabled value="">-- Select Exam Type --</option>                    
                    <option >periodic</option>
                    <option >terminal</option>
                    <option >annual</option>
                   
                  </select>
                </div>
              </td>
              
              <td v-if="editingExamId !== exam.Id">{{ exam.Description }}</td>
              <td v-else>
                <input type="text" class="input" v-model="editDescription" />
              </td>
              <td>
                <div class="buttons is-grouped is-justify-content-end">
                  <button
                    class="button is-small is-info no-padding"
                    @click="editExam(exam)"
                    v-if="editingExamId !== exam.Id"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="button is-small is-success no-padding"
                    @click="saveEdit(exam)"
                    v-else
                  >
                    <span class="icon is-small">
                      <i class="fas fa-check"></i>
                    </span>
                   
                  </button>
                  <button
                    class="button is-small is-warning no-padding"
                    @click="cancelEdit()"
                    v-if="editingExamId === exam.Id"
                  >
                    <span class="icon is-small">
                      <i class="fas fa-times"></i>
                    </span>
                 
                  </button>
                  <button class="button is-small is-danger no-padding" @click="deleteExam(exam.Id)">
                    <i class="fas fa-trash"></i>
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
const newExamType = ref('');
const newDescription = ref('');
const successMessage = ref('');
const errorMessage = ref('');
const addErrorMessage = ref('');
const showAddForm = ref(false);
const editingExamId = ref(null);
const editExamName = ref('');
const editExamType = ref('');
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
      newExamType.value,      
      newDescription.value
    );
    if (response.success) {
      successMessage.value = 'Exam added successfully.';
      addErrorMessage.value = '';
      showAddForm.value = false;
      newExamName.value = '';     
      newExamType.value = '';     
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
  newExamType.value = '';
  newDescription.value = '';
  addErrorMessage.value = '';
}

function editExam(exam) {
  editingExamId.value = exam.Id;
  editExamName.value = exam.ExamName;
  editExamType.value = exam.ExamType;
  editDescription.value = exam.Description;
}

function cancelEdit() {
  editingExamId.value = null;
  editExamName.value = '';
  editExamType.value = '';
  editDescription.value = '';
}

async function saveEdit(exam) {
  if (!editExamName.value.trim()) {
    errorMessage.value = 'Exam Name is required.';
    return;
  }
 
  if (!editExamType) {
    errorMessage.value = 'Select Exam Type.';
    return;
  }
  
  try {
    const response = await window.electronAPI.updateExam(
      exam.Id,
      editExamName.value.trim(),
      editExamType.value,
      editDescription.value
    );
    if (response.success) {
      successMessage.value = 'Exam updated successfully.';
      editingExamId.value = null;
      editExamName.value = '';
      editExamType.value = '';
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

.buttons {
  justify-content: center;
}
</style>