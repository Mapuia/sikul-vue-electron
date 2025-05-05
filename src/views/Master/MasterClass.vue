<template>
  <div class="form-container wide">
    <h1 class="title has-text-centered">Class - Master Entry</h1>

    <div class="buttons mt-4">
      <button class="button is-primary" @click="showAddForm = true" v-if="!showAddForm">
        Add New
      </button>
    </div>

    <div class="box mt-4" v-if="showAddForm">
      <h2 class="subtitle">Add New Class</h2>
      <form @submit.prevent="submitForm" @reset="resetForm">
        <div class="field">
          <label class="label">Class Name</label>
          <div class="control">
            <input
              class="input"
              type="text"
              v-model="newClassName"
              placeholder="e.g. Class Name I, II, III, KG-I, etc."
              @input="newClassName = newClassName.toUpperCase()"
              required
            />
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

        <div v-if="addErrorMessage" class="notification is-danger fixed-notification">
          {{ addErrorMessage }}
        </div>
      </form>
    </div>

    <div v-if="errorMessage" class="notification is-danger fixed-notification">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="notification is-successfixed-notification">
      {{ successMessage }}
    </div>

    <div class="box mt-4">
      <h2 class="subtitle">Class List</h2>
      <div v-if="loading" class="notification is-info is-light has-text-centered">
        <span class="loader"></span>
      </div>
      <div v-else-if="classes.length > 0">
        <table class="table is-fullwidth">
          <thead>
            <tr>
              <th>Class ID</th>
              <th>Class Name</th>
              <th>Sections</th>
              <th class="has-text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="classItem in classes" :key="classItem.Id">
              <td>{{ classItem.Id }}</td>
              <td v-if="editingClass !== classItem.Id">
                Class {{ classItem.ClassName }}
              </td>
              
              <td v-else>
                <input type="text" class="input" v-model="editClassName"  />
              </td>
              
              <td>
                <span v-for="section in sections" :key="section.Id" :value="section.Id" lass="tag is-info mr-1">
                  {{ section.SectionName }}
                </span>
                <span v-if="sections.length === 0" class="has-text-grey">
                 <i> Go to <b>Master -> [Class - Section Mapping]</b> to see Sections.</i>
                </span>
              </td>
              
              <td class="has-text-right">
                <div class="buttons is-grouped is-justify-content-end">
                  <button
                    class="button is-small is-info no-padding is-icon"
                    @click="editClass(classItem)"
                    v-if="editingClass !== classItem.Id"
                    title="Edit"
                  >
                    <i class="fas fa-pen"></i>
                  </button>

                  
                  <button
                    class="button is-small is-success no-padding"
                    @click="saveEdit(classItem)"
                    title="Save"
                    v-else
                  >
                    <span class="icon is-small">
                      <i class="fas fa-save"></i>
                    </span>
                   
                  </button>
                  <button
                    class="button is-small is-warning no-padding"
                    @click="cancelEdit()"
                    v-if="editingClass === classItem.Id"
                    title="Cancel">
                    
                      <i class="fas fa-times"></i>
                   
                  </button>
                  <button 
                    class="button is-small is-danger no-padding" 
                    @click="deleteClass(classItem)"
                    title="Delete">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="notification is-warning">
        No classes found.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const classes = ref([]);
const sections = ref([]);
const newClassName = ref('');
const successMessage = ref('');
const errorMessage = ref('');
const addErrorMessage = ref('');
const showAddForm = ref(false);
const editingClass = ref(null);
const editClassName = ref('');
const loading = ref(false);

async function fetchClasses() {
  loading.value = true;
  try {
    const Classes = await window.electronAPI.getClasses();
    console.log(Classes);
    if (Classes.success ) {
        classes.value = Classes.classes;     
     } else {
      errorMessage.value = 'Failed to fetch data.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
}
async function fetchSections() {
  loading.value = true;
  try {
    const Sections = await window.electronAPI.getSections();
    if (Sections.success ) {
        sections.value = Sections.sections;     
     } else {
      errorMessage.value = 'Failed to fetch data.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
}

function isUpperCaseRoman(str) {
  return /^[IVXLCDM]+$/.test(str) && str === str.toUpperCase();
}
const validClasses = ["Nursery", "KG-I", "KG-II", "Roman Numerals"];

async function submitForm() {
  const className = newClassName.value.trim();

  if (!className) {
    addErrorMessage.value = 'Class Name is required.';
    return;
  }

  const isValid = validClasses.includes(className) || isUpperCaseRoman(className);

  if (!isValid) {
    addErrorMessage.value =
      'Class Name must be KG-I, KG-II, or uppercase Roman numerals (e.g., I, II, III).';
    return;
  }

  try {
    const response = await window.electronAPI.insertClass(newClassName.value.trim());
    if (response.success) {
      successMessage.value = 'Class added successfully.';
      addErrorMessage.value = '';
      showAddForm.value = false;
      newClassName.value = '';
      fetchClasses();
      setTimeout(() => {
        successMessage.value = '';
      }, 3000);
    } else {
      addErrorMessage.value = response.message || 'Failed to add class.';
    }
  } catch (err) {
    addErrorMessage.value = err.message;
  }
}

function resetForm() {
  newClassName.value = '';
  addErrorMessage.value = '';
}

function editClass(classItem) {
  editingClass.value = classItem.Id;
  editClassName.value = classItem.ClassName;
}

function cancelEdit() {
  editingClass.value = null;
  editClassName.value = '';
}

async function saveEdit(classItem) {  // Changed parameter name to avoid shadowing
  const newName = editClassName.value.trim().toUpperCase();
  
  if (!newName) {
    errorMessage.value = 'Class Name cannot be empty.';
    setTimeout(() => {
      errorMessage.value = '';
    }, 3000);
    return;
  }

  // Fixed validation logic
  const isValid = validClasses.includes(newName) || isUpperCaseRoman(newName);
  console.log(newName);
  if (!isValid) {
    errorMessage.value = 'Class Name must be KG-I, KG-II, or uppercase Roman numerals (e.g., I, II, III).';
    setTimeout(() => {
      errorMessage.value = '';
    }, 3000);
    return;
  }

  try {
    const response = await window.electronAPI.updateClass(
      classItem.Id,  // Pass the ID
      newName        // Pass the new name
    );
    
    if (response.success) {
      successMessage.value = 'Class updated successfully.';
      editingClass.value = null;
      editClassName.value = '';
      fetchClasses();
      setTimeout(() => {
        successMessage.value = '';
      }, 3000);
    } else {
      errorMessage.value = response.message || 'Failed to update class.';
      setTimeout(() => {
        errorMessage.value = '';
      }, 3000);
    }
  } catch (err) {
    errorMessage.value = err.message;
    setTimeout(() => {
      errorMessage.value = '';
    }, 3000);
  }
}

async function deleteClass(classItem) {
  const shouldDelete = await window.electronAPI.showConfirmationDialog(
    `Are you sure you want to delete class "${classItem.ClassName}"?`
  );

  if (shouldDelete) {
    try {
      const response = await window.electronAPI.deleteClass(classItem.Id);
      if (response.success) {
        successMessage.value = `Class "${classItem.ClassName}" deleted successfully.`;
        fetchClasses();
        setTimeout(() => {
          successMessage.value = '';
        }, 3000);
      } else {
        errorMessage.value = response.message || 'Failed to delete class.';
        setTimeout(() => {
          errorMessage.value = '';
        }, 3000);
      }
    } catch (err) {
      errorMessage.value = err.message;
      setTimeout(() => {
        errorMessage.value = '';
      }, 3000);
    }
  }
}

onMounted(() => {
  fetchClasses();
});
</script>

<style scoped>
.tag {
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
}
</style>