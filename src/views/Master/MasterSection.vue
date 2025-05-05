<template>
  <div class="form-container single">
    <h1 class="title has-text-centered">Section - Master Entry</h1>

    <div class="buttons mt-4">
      <button class="button is-primary" @click="showAddSectionForm = true" v-if="!showAddSectionForm">
        Add New
      </button>
    </div>

    <div class="box mt-4" v-if="showAddSectionForm">
      <h2 class="subtitle">Add New Section</h2>
      <form @submit.prevent="submitSectionForm" @reset="resetSectionForm">
        <div class="field">
          <label class="label">Section Name</label>
          <div class="control">
            <input
              class="input"
              type="text"
              v-model="newSectionName"
              placeholder="e.g. Section A, B, Science, Arts, etc."
            />
          </div>
        </div>

        <div class="field is-grouped mt-4">
          <div class="control">
            <button type="submit" class="button is-primary">Submit</button>
          </div>
          <div class="control">
            <button type="reset" class="button is-light" @click="showAddSectionForm = false">Cancel</button>
          </div>
        </div>

        <div v-if="addSectionErrorMessage" class="notification is-danger fixed-notification">
          {{ addSectionErrorMessage }}
        </div>
      </form>
    </div>

    <div class="box mt-4">
      <h2 class="subtitle">Section List</h2>
      <div v-if="loadingSections" class="notification is-info is-light has-text-centered">
        <span class="loader"></span>
      </div>
      <div v-else-if="sections.length > 0">
        <table class="table is-fullwidth">
          <thead>
            <tr>
              <th>Section ID</th>
              <th>Section Name</th>
              <th class="has-text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sectionItem in sections" :key="sectionItem.Id">
              <td >
                {{sectionItem.Id}}
              </td>
              <td v-if="editingSection !== sectionItem.SectionName">
                {{ sectionItem.SectionName }}
              </td>
              <td v-else>
                <input type="text" class="input" v-model="editSectionName" />
              </td>
              <td>
                <div class="buttons is-grouped is-justify-content-end">
                  <button
                    class="button is-small is-info"
                    @click="editSection(sectionItem)"
                    v-if="editingSection !== sectionItem.SectionName"
                  >
                    Edit
                  </button>
                  <button
                    class="button is-small is-success"
                    @click="saveEditSection(sectionItem)"
                    v-else
                  >
                    <span class="icon is-small">
                      <i class="fas fa-check"></i>
                    </span>
                    <span>Save</span>
                  </button>
                  <button
                    class="button is-small is-warning"
                    @click="cancelEditSection()"
                    v-if="editingSection === sectionItem.SectionName"
                  >
                    <span class="icon is-small">
                      <i class="fas fa-times"></i>
                    </span>
                    <span>Cancel</span>
                  </button>
                  <button class="button is-small is-danger" @click="deleteSection(sectionItem)">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="notification is-warning">
        No sections found.
      </div>
    </div>
        <div v-if="errorMessage" class="notification is-danger fixed-notification">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="notification is-success fixed-notification">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const sections = ref([]);
const newSectionName = ref('');
const addSectionErrorMessage = ref('');
const showAddSectionForm = ref(false);
const editingSection = ref(null);
const editSectionName = ref('');
const loadingSections = ref(false);
const errorMessage = ref(''); // General error message
const successMessage = ref(''); // General success message

// Function to check if a string contains only alphabetic characters
function isAlphabetOnly(str) {
  return /^[A-Za-z]+$/.test(str);
}

async function fetchSections() {
  loadingSections.value = true;
  try {
    const response = await window.electronAPI.getSections();
    if (response.success) {
      sections.value = response.sections;
    } else {
      errorMessage.value = response.message || 'Failed to fetch sections.';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loadingSections.value = false;
  }
}

async function submitSectionForm() { // Add Section
  const sectionName = newSectionName.value.trim();

  if (!sectionName) {
    addSectionErrorMessage.value = 'Section Name is required.';
    return;
  }

  if (!isAlphabetOnly(sectionName)) {
    addSectionErrorMessage.value = 'Section Name must contain only alphabetic characters.';
    return;
  }

  const upperCaseSectionName = sectionName.toUpperCase();

  try {
    const response = await window.electronAPI.insertSection(upperCaseSectionName);
    if (response.success) {
      successMessage.value = 'Section added successfully.';
      addSectionErrorMessage.value = '';
      showAddSectionForm.value = false;
      newSectionName.value = '';
      fetchSections(); // Refresh the section list
      setTimeout(() => {
        successMessage.value = '';
      }, 3000);
    } else {
      addSectionErrorMessage.value = response.message || 'Section name already exists.';
    }
  } catch (err) {
    addSectionErrorMessage.value = err.message;
  }
}

function resetSectionForm() {
  newSectionName.value = '';
  addSectionErrorMessage.value = '';
}

function editSection(sectionItem) {
  editingSection.value = sectionItem.SectionName;
  editSectionName.value = sectionItem.SectionName;
}

function cancelEditSection() {
  editingSection.value = null;
  editSectionName.value = '';
}

async function saveEditSection(sectionItem) {
  const sectionName = editSectionName.value.trim();

  if (!sectionName) {
    errorMessage.value = 'Section Name cannot be empty.';
    setTimeout(() => {
      errorMessage.value = '';
    }, 3000);
    return;
  }

  if (!isAlphabetOnly(sectionName)) {
    errorMessage.value = 'Section Name must contain only alphabetic characters.';
    setTimeout(() => {
      errorMessage.value = '';
    }, 3000);
    return;
  }

  const upperCaseSectionName = sectionName.toUpperCase();

  try {
    const response = await window.electronAPI.updateSection(sectionItem.Id, upperCaseSectionName);
    if (response.success) {
      successMessage.value = 'Section updated successfully.';
      editingSection.value = null;
      editSectionName.value = '';
      fetchSections(); // Refresh the section list
      setTimeout(() => {
        successMessage.value = '';
      }, 3000);
    } else {
      errorMessage.value = response.message || 'Failed to update section.';
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

async function deleteSection(sectionItem) {
  const shouldDelete = await window.electronAPI.showConfirmationDialog(
    `Are you sure you want to delete section "${sectionItem.SectionName}"?`
  );

  if (shouldDelete) {
    try {
      const response = await window.electronAPI.deleteSection(sectionItem.Id);
      if (response.success) {
        successMessage.value = `Section "${sectionItem.SectionName}" deleted successfully.`;
        fetchSections(); // Refresh the section list
        setTimeout(() => {
          successMessage.value = '';
        }, 3000);
      } else {
        errorMessage.value = response.message || 'Failed to delete section.';
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
  fetchSections(); // Fetch sections on component mount
});
</script>
