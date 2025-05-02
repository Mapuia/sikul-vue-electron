<template>
  <div class="form-container wide">
    <h1 class="title has-text-centered">Subject - Master Entry</h1>

    <div class="buttons mt-4">
      <button class="button is-primary" @click="showAddSubjectForm = true" v-if="!showAddSubjectForm">
        Add New
      </button>
    </div>

    <div class="box mt-4" v-if="showAddSubjectForm">
      <h2 class="subtitle">Add New Subject</h2>
      <form @submit.prevent="submitSubjectForm" @reset="resetSubjectForm">
        <div class="field">
          <label class="label">Subject Name</label>
          <div class="control">
            <input
              class="input"
              type="text"
              v-model="newSubjectName"
              @input="newSubjectName = newSubjectName.toUpperCase()"
              placeholder="e.g. MATHEMATICS, SCIENCE, HISTORY"
              required
            />
          </div>
          <p class="help is-danger" v-if="addSubjectErrorMessage">{{ addSubjectErrorMessage }}</p>
        </div>

        <div class="field">
          <label class="label">Subject Category</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="newSubjectCategory" required>
                <option value="" disabled>Select Category</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
                <option value="Co-Scholastics">Co-Scholastics</option>
              </select>
            </div>
          </div>
          <p class="help is-danger" v-if="addSubjectCategoryErrorMessage">{{ addSubjectCategoryErrorMessage }}</p>
        </div>

        <div class="field is-grouped mt-4">
          <div class="control">
            <button type="submit" class="button is-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="icon is-small">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              <span>Submit</span>
            </button>
          </div>
          <div class="control">
            <button type="reset" class="button is-light" @click="showAddSubjectForm = false">Cancel</button>
          </div>
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
      <h2 class="subtitle">Subject List</h2>
      <div v-if="loadingSubjects" class="notification is-info is-light has-text-centered">
        <span class="loader"></span>
      </div>
      <div v-else-if="subjects.length > 0">
        <table class="table is-fullwidth">
          <thead>
            <tr>
              <th>Subject ID</th>
              <th>Subject Name</th>
              <th>Subject Category</th>
              <th class="has-text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="subject in subjects" :key="subject.Id">
              <td>{{ subject.Id }}</td>
              <td v-if="editingId !== subject.Id">
                {{ subject.SubjectName }}
              </td>
              <td v-else>
                <input 
                  type="text" 
                  class="input" 
                  v-model="editSubjectName"
                  @input="editSubjectName = editSubjectName.toUpperCase()"
                  required
                />
              </td>
              <td v-if="editingId !== subject.Id">
                {{ subject.SubjectCategory }}
              </td>
              <td v-else>
                <div class="select is-fullwidth">
                  <select v-model="editSubjectCategory" required>
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                    <option value="Co-Scholastics">Co-Scholastics</option>
                  </select>
                </div>
              </td>
              <td class="has-text-right">
                <div class="buttons is-grouped is-justify-content-end">
                  <button
                    class="button is-small is-info"
                    @click="editSubject(subject)"
                    v-if="editingId !== subject.Id"
                    :disabled="isSubmitting"
                  >
                    Edit
                  </button>
                  <button
                    class="button is-small is-success"
                    @click="saveEditSubject(subject)"
                    v-else
                    :disabled="isSubmitting"
                  >
                    <span v-if="isSubmitting" class="icon is-small">
                      <i class="fas fa-spinner fa-spin"></i>
                    </span>
                    <span>Save</span>
                  </button>
                  <button
                    class="button is-small is-warning"
                    @click="cancelEditSubject()"
                    v-if="editingId === subject.Id"
                    :disabled="isSubmitting"
                  >
                    Cancel
                  </button>
                  <button 
                    class="button is-small is-danger" 
                    @click="deleteSubject(subject)"
                    :disabled="isSubmitting"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="notification is-warning">
        No subjects found.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const subjects = ref([]);
const newSubjectName = ref('');
const newSubjectCategory = ref('');
const addSubjectErrorMessage = ref('');
const addSubjectCategoryErrorMessage = ref('');
const showAddSubjectForm = ref(false);
const editingId = ref(null);
const editSubjectName = ref('');
const editSubjectCategory = ref('');
const loadingSubjects = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const isSubmitting = ref(false);

async function fetchSubjects() {
  loadingSubjects.value = true;
  errorMessage.value = '';
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

async function submitSubjectForm() {
  addSubjectErrorMessage.value = '';
  addSubjectCategoryErrorMessage.value = '';
  
  if (!newSubjectName.value.trim()) {
    addSubjectErrorMessage.value = 'Subject Name is required.';
    return;
  }
  if (!newSubjectCategory.value) {
    addSubjectCategoryErrorMessage.value = 'Subject Category is required.';
    return;
  }

  isSubmitting.value = true;
  try {
    const response = await window.electronAPI.insertSubject({
      subjectName: newSubjectName.value.trim(),
      subjectCategory: newSubjectCategory.value,
    });
    
    if (response.success) {
      successMessage.value = 'Subject added successfully.';
      resetSubjectForm();
      showAddSubjectForm.value = false;
      await fetchSubjects();
    } else {
      addSubjectErrorMessage.value = response.message || 'Failed to add subject.';
    }
  } catch (err) {
    addSubjectErrorMessage.value = err.message;
  } finally {
    isSubmitting.value = false;
    setTimeout(() => {
      successMessage.value = '';
      errorMessage.value = '';
    }, 3000);
  }
}

function resetSubjectForm() {
  newSubjectName.value = '';
  newSubjectCategory.value = '';
  addSubjectErrorMessage.value = '';
  addSubjectCategoryErrorMessage.value = '';
}

function editSubject(subject) {
  editingId.value = subject.Id;
  editSubjectName.value = subject.SubjectName;
  editSubjectCategory.value = subject.SubjectCategory;
}

function cancelEditSubject() {
  editingId.value = null;
  editSubjectName.value = '';
  editSubjectCategory.value = '';
}

async function saveEditSubject(subject) {
  errorMessage.value = '';
  
  if (!editSubjectName.value.trim()) {
    errorMessage.value = 'Subject Name cannot be empty.';
    return;
  }
  if (!editSubjectCategory.value) {
    errorMessage.value = 'Subject Category is required.';
    return;
  }

  isSubmitting.value = true;
  try {
    const response = await window.electronAPI.updateSubject({
      Id: subject.Id,
      subjectName: editSubjectName.value.trim(),
      subjectCategory: editSubjectCategory.value,
    });

    if (response.success) {
      successMessage.value = 'Subject updated successfully.';
      cancelEditSubject();
      await fetchSubjects();
    } else {
      errorMessage.value = response.message || 'Failed to update subject.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    isSubmitting.value = false;
    setTimeout(() => {
      successMessage.value = '';
      errorMessage.value = '';
    }, 3000);
  }
}

async function deleteSubject(subject) {
  const shouldDelete = await window.electronAPI.showConfirmationDialog(
    `Are you sure you want to delete subject "${subject.SubjectName}"?`
  );
  
  if (!shouldDelete) return;

  isSubmitting.value = true;
  try {
    const response = await window.electronAPI.deleteSubject(subject.Id);
    if (response.success) {
      successMessage.value = `Subject "${subject.SubjectName}" deleted successfully.`;
      await fetchSubjects();
    } else {
      errorMessage.value = response.message || 'Failed to delete subject.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    isSubmitting.value = false;
    setTimeout(() => {
      successMessage.value = '';
      errorMessage.value = '';
    }, 3000);
  }
}

onMounted(() => {
  fetchSubjects();
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

.buttons.is-grouped {
  flex-wrap: wrap;
  gap: 0.5rem;
}

.table td, .table th {
  vertical-align: middle;
}
</style>