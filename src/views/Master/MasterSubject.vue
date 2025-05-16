<template>
  <div class="form-container full">
    <h1 class="title has-text-centered">Subject - Master Entry</h1>

    <div class="buttons mt-4">
      <button class="button is-primary" @click="showAddSubjectForm = true" v-if="!showAddSubjectForm">
        <i class="fas fa-soli fa-plus mr-2"></i>
        Add New
      </button>
    </div>

    <div class="box form-container single mt-3" v-if="showAddSubjectForm">
      <h2 class="subtitle">Add New Subject</h2>
      <form @submit.prevent="submitSubjectForm" @reset="resetSubjectForm">
        <div class="field">
          <label class="label">Subject Code</label>
          <div class="control">
            <input
              class="input"
              type="text"
              v-model="newSubjectCode"
              @input="newSubjectCode = newSubjectCode.toUpperCase()"
              placeholder="e.g. MATH, SCI, HIST etc..."
              
            />
          </div>
          <p class="help is-danger" v-if="addSubjectCodeErrorMessage">{{ addSubjectCodeErrorMessage }}</p>
        </div>
        <div class="field"> 
        <label class="label">Subject Name</label>
          <div class="control">
            <input
              class="input"
              type="text"
              v-model="newSubjectName"
              placeholder="e.g. Mathematics, Science etc..."
              
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

        <div class="field">
          <label class="label">Full Mark</label>
          <div class="control">
            <input
              class="input"
              type="text"
              v-model="newFullMark"
              placeholder="e.g. 100, 50 ..."
              
            />
          </div>
          <p class="help is-danger" v-if="addFullMarkErrorMessage">{{ addFullMarkErrorMessage }}</p>
        </div>

        <div class="field">
          <label class="label">Set as Core Subject</label>
          <div class="control">            
            <input type="checkbox" v-model="newIsCore" />
            Usually Maths & Science, Students need to score at least 25% to be promoted     
          </div>
          <p class="help is-danger" v-if="addIsCoreErrorMessage">{{ addIsCoreErrorMessage }}</p>
        </div>

       
        <div class="field">
          <label class="label">Display Order</label>
          <div class="control">
            <input
              class="input"
              type="text"
              v-model="newDisplayOrder"
              placeholder="e.g. 1, 2..."
              required
            />
          </div>  

          <p class="help is-danger" v-if="addDisplayOrderErrorMessage">{{ addDisplayOrderErrorMessage }}</p>
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

    <div v-if="errorMessage" class="notification is-danger fixed-notification">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="notification is-success fixed-notification">
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
              <th>Subject Code</th>
              <th>Subject Name</th>
              <th>Subject Category</th>
              <th>Full Mark</th>
              <th style="width: 150px">Core ?</th>
              <th>Display Order</th>
              <th class="has-text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="subject in subjects" :key="subject.Id">
              <td v-if="editingId !== subject.Id">
                {{ subject.SubjectCode }}
              </td>
              <td v-else>
                <input 
                  type="text" 
                  class="input"
                  v-model="editSubjectCode"          
                >
              </td>
              
              <td v-if="editingId !== subject.Id">
                {{ subject.SubjectName }}
              </td>
              <td v-else>
                <input 
                  type="text" 
                  class="input" 
                  v-model="editSubjectName"
                  @input="editSubjectName = editSubjectName()"
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

              <td v-if="editingId !== subject.Id">
                {{ subject.FullMark }}
              </td>
              <td v-else>
                <input 
                  type="number" 
                  class="input" 
                  v-model="editFullMark"                 
                  required
                />
              </td>

              <td v-if="editingId !== subject.Id">
                <span class="tag" :class="subject.IsCore? 'is-success': 'is-dark' " >{{ subject.IsCore? "Yes": "No" }}</span>
              </td>

              <td v-else>
                <input type="checkbox" v-model="editIsCore" />
                  Core subject?     
              </td>

              <td v-if="editingId !== subject.Id">
                {{ subject.DisplayOrder }}
              </td>
              <td v-else>
                <input 
                  type="number" 
                  class="input" 
                  v-model="editDisplayOrder"                 
                  required
                />
              </td>

              <td class="has-text-right">
                <div class="buttons is-grouped is-justify-content-end">
                  <button
                    class="button is-small is-info no-padding"
                    @click="editSubject(subject)"
                    v-if="editingId !== subject.Id"
                    :disabled="isSubmitting"
                  >
                     <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="button is-small is-success no-padding"
                    @click="saveEditSubject(subject)"
                    v-else
                    :disabled="isSubmitting"
                  >
                    <span v-if="isSubmitting" class="icon is-small">
                      <i class="fas fa-spinner fa-spin"></i>
                    </span>
                    <i class="fas fa-check"></i>
                  </button>
                  <button
                    class="button is-small is-warning no-padding"
                    @click="cancelEditSubject()"
                    v-if="editingId === subject.Id"
                    :disabled="isSubmitting"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                  <button 
                    class="button is-small is-danger no-padding" 
                    @click="deleteSubject(subject)"
                    :disabled="isSubmitting"
                  >
                    <i class="fas fa-trash-alt"></i>
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

// Reactive variables
const subjects = ref([]);
const loadingSubjects = ref(false);
const isSubmitting = ref(false);
const showAddSubjectForm = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Form fields for adding new subject
const newSubjectCode = ref('');
const newSubjectName = ref('');
const newSubjectCategory = ref('');
const newFullMark = ref('');
const newIsCore = ref(false);
const newDisplayOrder = ref('');

// Error messages for add form
const addSubjectCodeErrorMessage = ref('');
const addSubjectErrorMessage = ref('');
const addSubjectCategoryErrorMessage = ref('');
const addFullMarkErrorMessage = ref('');
const addIsCoreErrorMessage = ref('');
const addDisplayOrderErrorMessage = ref('');

// Edit-related states
const editingId = ref(null);
const editSubjectCode = ref('');
const editSubjectName = ref('');
const editSubjectCategory = ref('');
const editFullMark = ref('');
const editIsCore = ref(false);
const editDisplayOrder = ref('');

// Fetch subjects from backend
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

// Add new subject
async function submitSubjectForm() {
  // Clear previous error messages
  addSubjectCodeErrorMessage.value = '';
  addSubjectErrorMessage.value = '';
  addSubjectCategoryErrorMessage.value = '';
  addFullMarkErrorMessage.value = '';
  addDisplayOrderErrorMessage.value = '';
  errorMessage.value = '';
  successMessage.value = '';

  // Validate inputs
  if (!newSubjectCode.value.trim()) {
    addSubjectCodeErrorMessage.value = 'Subject Code is required.';
    return;
  }
  if (!newSubjectName.value.trim()) {
    addSubjectErrorMessage.value = 'Subject Name is required.';
    return;
  }
  if (!newSubjectCategory.value) {
    addSubjectCategoryErrorMessage.value = 'Subject Category is required.';
    return;
  }
  if (!newFullMark.value.trim() || isNaN(newFullMark.value)) {
    addFullMarkErrorMessage.value = 'Valid Full Mark is required.';
    return;
  }
  if (!newDisplayOrder.value.trim() || isNaN(newDisplayOrder.value)) {
    addDisplayOrderErrorMessage.value = 'Valid Display Order is required.';
    return;
  }

  isSubmitting.value = true;
  try {
    const subjectData = {
      subjectCode: newSubjectCode.value.trim().toUpperCase(),
      subjectName: newSubjectName.value.trim(),
      subjectCategory: newSubjectCategory.value,
      fullMark: parseInt(newFullMark.value),
      isCore: newIsCore.value ? 1 : 0,
      displayOrder: parseInt(newDisplayOrder.value)
    };

    const response = await window.electronAPI.insertSubject(subjectData);
    
    if (response.success) {
      // ... success handling ...
    } else {
      errorMessage.value = response.message || 'Failed to add subject.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    isSubmitting.value = false;
    setTimeout(() => {
      errorMessage.value = '';
      successMessage.value = '';
    }, 3000);
  }
}

// Reset new subject form
function resetSubjectForm() {
  newSubjectCode.value = '';
  newSubjectName.value = '';
  newSubjectCategory.value = '';
  newFullMark.value = '';
  newIsCore.value = false;
  newDisplayOrder.value = '';
}

// Start editing subject
function editSubject(subject) {
  editingId.value = subject.Id;
  editSubjectCode.value = subject.SubjectCode;
  editSubjectName.value = subject.SubjectName;
  editSubjectCategory.value = subject.SubjectCategory;
  editFullMark.value = subject.FullMark;
  editIsCore.value = subject.IsCore === 1;
  editDisplayOrder.value = subject.DisplayOrder;
}

// Cancel edit mode
function cancelEditSubject() {
  editingId.value = null;
  editSubjectCode.value = '';
  editSubjectName.value = '';
  editSubjectCategory.value = '';
  editFullMark.value = '';
  editIsCore.value = false;
  editDisplayOrder.value = '';
}

// Save edited subject
async function saveEditSubject(subject) {
  if (!editSubjectCode.value.trim()) {
    errorMessage.value = 'Subject Code cannot be empty.';
    return;
  }
  if (!editSubjectName.value.trim()) {
    errorMessage.value = 'Subject Name cannot be empty.';
    return;
  }
  if (!editSubjectCategory.value) {
    errorMessage.value = 'Subject Category is required.';
    return;
  }
  if (!editFullMark.value || isNaN(editFullMark.value)) {
    errorMessage.value = 'Valid Full Mark is required.';
    return;
  }
  if (!editDisplayOrder.value || isNaN(editDisplayOrder.value)) {
    errorMessage.value = 'Valid Display Order is required.';
    return;
  }

  isSubmitting.value = true;
  try {
    const response = await window.electronAPI.updateSubject({
      id: subject.Id,
      subjectCode: editSubjectCode.value.trim().toUpperCase(), // Add this
      subjectName: editSubjectName.value.trim(),
      subjectCategory: editSubjectCategory.value,
      fullMark: parseInt(editFullMark.value),
      isCore: editIsCore.value ? 1 : 0,
      displayOrder: parseInt(editDisplayOrder.value)
    });

    if (response.success) {
      successMessage.value = 'Subject updated successfully.';
      editingId.value = null;
      await fetchSubjects();
    } else {
      errorMessage.value = response.message || 'Failed to update subject.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    isSubmitting.value = false;
    setTimeout(() => {
      errorMessage.value = '';
      successMessage.value = '';
    }, 3000);
  }
}

// Delete subject
async function deleteSubject(subject) {
  if (!confirm(`Are you sure you want to delete ${subject.SubjectName}?`)) return;

  isSubmitting.value = true;
  try {
    const response = await window.electronAPI.deleteSubject(subject.Id);
    if (response.success) {
      successMessage.value = 'Subject deleted successfully.';
      await fetchSubjects();
    } else {
      errorMessage.value = response.message || 'Failed to delete subject.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    isSubmitting.value = false;
    setTimeout(() => {
      errorMessage.value = '';
      successMessage.value = '';
    }, 3000);
  }
}

// Load subjects on mount
onMounted(fetchSubjects);
</script>


<style scoped>

.buttons{
  justify-content: center;
}
</style>