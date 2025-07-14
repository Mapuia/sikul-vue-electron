<template>
  <div class="form-container wide">
    <h1 class="title has-text-centered is-4">Signatories - Master Entry</h1>

    <!-- Notification System -->
    <transition name="slide-fade">
      <div v-if="notification.show" class="notification fixed-notification" :class="notification.type">
        <button class="delete" @click="notification.show = false"></button>
        {{ notification.message }}
      </div>
    </transition>

    <div class="buttons mt-4">
      <button class="button is-primary" @click="openAddForm" v-if="!showAddForm && !editingSignatory">
        <i class="fas fa-solid fa-plus mr-2"></i>
        Add New
      </button>
    </div>

    <!-- Add Signatory Form -->
    <div class="modal" :class="{ 'is-active': showAddForm }">
      <div class="modal-background" @click="closeAddForm"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Add New Signatory</p>
          <button class="delete" aria-label="close" @click="closeAddForm"></button>
        </header>
        <section class="modal-card-body">
          <form @submit.prevent="submitForm">
            <div class="field">
              <label class="label">Signatory Type</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="newSignatory.SignatoryType" required>
                    <option value="" disabled>Select Type</option>
                    <option value="ClassTeacher">Class-Teacher</option>
                    <option value="Head">Head</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-if="newSignatory.SignatoryType === 'ClassTeacher'">
              <div class="field">
                <label class="label">Class</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="newSignatory.ClassId" @change="fetchSections(newSignatory.ClassId)">
                      <option value="" disabled >Select Class</option>
                      <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                        {{ cls.ClassName }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="field">
                <label class="label">Section</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="newSignatory.SectionId">
                      <option value="" disabled="!sections.length">Select Section</option>
                      <option v-for="sec in sections" :key="sec.Id" :value="sec.Id">
                        {{ sec.SectionName }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="label">Designation</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="newSignatory.Designation" required>
                    <option value="" disabled>Select Designation</option>
                    <option value="Class Teacher" :disabled="newSignatory.SignatoryType === 'Head'">Class Teacher</option>
                    <option value="Headmaster" :disabled="newSignatory.SignatoryType === 'ClassTeacher'">Headmaster</option>
                    <option value="Headmistress" :disabled="newSignatory.SignatoryType === 'ClassTeacher'">Headmistress</option>
                    <option value="Principal" :disabled="newSignatory.SignatoryType === 'ClassTeacher'">Principal</option>                
                  </select>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="label">Name</label>
              <div class="control">
                <input class="input" type="text" v-model="newSignatory.Name" required placeholder="Enter full name" />
              </div>
            </div>

            <div class="field">
              <label class="label">Signature Image (Optional)</label>
              <div class="control">
                <input class="input" type="text" v-model="newSignatory.SignatureImage" placeholder="Path to signature image" />
              </div>
            </div>

            <div class="field">
              <label class="checkbox">
                <input type="checkbox" v-model="newSignatory.IsActive"> Active
              </label>
            </div>
          </form>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="submitForm">Submit</button>
          <button class="button" @click="closeAddForm">Cancel</button>
        </footer>
      </div>
    </div>

    <!-- Edit Signatory Modal -->
    <div class="modal" :class="{ 'is-active': editingSignatory }">
      <div class="modal-background" @click="cancelEdit"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Edit Signatory</p>
          <button class="delete" aria-label="close" @click="cancelEdit"></button>
        </header>
        <section class="modal-card-body">
          <form @submit.prevent="saveEdit(editingSignatory)">
            <div class="field">
              <label class="label">Signatory Type</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="editSignatory.SignatoryType" required>
                    <option value="" disabled>Select Type</option>
                    <option value="ClassTeacher">Teacher</option>
                    <option value="Head">Head</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-if="editSignatory.SignatoryType === 'ClassTeacher'">
              <div class="field">
                <label class="label">Class</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="editSignatory.ClassId">
                      <option value="" disabled>Select Class</option>
                      <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                        {{ cls.ClassName }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="field">
                <label class="label">Section</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select v-model="editSignatory.SectionId">
                      <option value="" disabled>Select Section</option>
                      <option v-for="sec in sections" :key="sec.Id" :value="sec.Id">
                        {{ sec.SectionName }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="label">Designation</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="editSignatory.Designation" required>
                    <option value="" disabled>Select Designation</option>
                    <option value="Class Teacher">Class Teacher</option>
                    <option value="Headmaster">Headmaster</option>
                    <option value="Headmistress">Headmistress</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="label">Name</label>
              <div class="control">
                <input class="input" type="text" v-model="editSignatory.Name" required placeholder="Enter full name" />
              </div>
            </div>

            <div class="field">
              <label class="label">Signature Image (Optional)</label>
              <div class="control">
                <input class="input" type="text" v-model="editSignatory.SignatureImage" placeholder="Path to signature image" />
              </div>
            </div>

            <div class="field">
              <label class="checkbox">
                <input type="checkbox" v-model="editSignatory.IsActive"> Active
              </label>
            </div>
          </form>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="saveEdit">Save Changes</button>
          <button class="button" @click="cancelEdit">Cancel</button>
        </footer>
      </div>
    </div>

    <!-- Signatory Table -->
    <div class="box mt-4">
      <h2 class="subtitle">Signatories List</h2>
      
      <div v-if="loading" class="notification is-info is-light has-text-centered">
        Loading signatories...
      </div>
      <div v-else-if="signatories.length > 0">
        <table class="table is-fullwidth is-hoverable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Designation</th>
              <th>Type</th>              
              <th>Status</th>
              <th class="has-text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="signatory in signatories" :key="signatory.Id">
              <td>{{ signatory.Name }}</td>
              <td>{{ signatory.Designation }} {{ signatory.ClassName ? '( ' + signatory.ClassName : '' }} 
                {{ signatory.ClassName ? signatory.SectionName || '' ? '- ' + signatory.SectionName + '  )': ')' : '' }}</td>
              <td>{{ signatory.SignatoryType }}</td>
            
              <td>
                <span class="tag" :class="signatory.IsActive ? 'is-success' : 'is-danger'">
                  {{ signatory.IsActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="has-text-right">
                <div class="buttons is-grouped is-justify-content-end">
                  <button class="button is-small is-info" @click="openEditModal(signatory)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="button is-small is-danger" @click="deleteSignatory(signatory)">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="notification is-warning">
        No signatories found.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const signatories = ref([]);
const classes = ref([]);
const sections = ref([]);
const loading = ref(false);
const showAddForm = ref(false);
const editingSignatory = ref(null);

// Notification system
const notification = ref({
  show: false,
  message: '',
  type: 'is-success' // can be 'is-success', 'is-danger', 'is-warning', etc.
});

const newSignatory = ref({
  ClassId: '',
  SectionId: 0,
  SignatoryType: '',
  Designation: '',
  Name: '',
  SignatureImage: '',
  IsActive: true
});

const editSignatory = ref({
  ClassId: '',
  SectionId: '',
  SignatoryType: '',
  Designation: '',
  Name: '',
  SignatureImage: '',
  IsActive: true
});

// Watch for changes in signatory type
watch(() => newSignatory.value.SignatoryType, (type) => {
  if (type !== 'ClassTeacher') {
    newSignatory.value.ClassId = '';
    newSignatory.value.SectionId = '';
  }
});

watch(() => editSignatory.value.SignatoryType, (type) => {
  if (type !== 'ClassTeacher') {
    editSignatory.value.ClassId = '';
    editSignatory.value.SectionId = '';
  }
});

// Show notification
function showNotification(message, type = 'is-success') {
  notification.value = {
    show: true,
    message,
    type
  };
  setTimeout(() => {
    notification.value.show = false;
  }, 5000);
}

// Form handlers
function openAddForm() {
  showAddForm.value = true;
  resetForm();
}

function closeAddForm() {
  showAddForm.value = false;
}

function openEditModal(signatory) {
  editingSignatory.value = signatory.Id;
  editSignatory.value = { ...signatory };
}

function cancelEdit() {
  editingSignatory.value = null;
}

async function fetchSignatories() {
  loading.value = true;
  try {
    const response = await window.electronAPI.getSignatories();
    if (response.success) {
      signatories.value = response.signatories;
    }
  } finally {
    loading.value = false;
  }
}

async function fetchClasses() {
  const response = await window.electronAPI.getClasses();
  if (response.success) classes.value = response.classes;
}

async function fetchSections() {
  const response = await window.electronAPI.getSectionsByClassId(newSignatory.value.ClassId);
  if (response.success) sections.value = response.sections;
}

async function submitForm() {
  if (!newSignatory.value.Name) {
    showNotification('Name is required', 'is-danger');
    return;
  }
  
  const res = await window.electronAPI.insertSignatory({ ...newSignatory.value });
  
  if (res.success) {
    showNotification('Signatory added successfully');
    closeAddForm();
    resetForm();
    fetchSignatories();
  } else {
    showNotification(res.message || 'Failed to add signatory', 'is-danger');
  }
}

function resetForm() {
  newSignatory.value = {
    ClassId: '',
    SectionId: '',
    SignatoryType: '',
    Designation: '',
    Name: '',
    SignatureImage: '',
    IsActive: true
  };
}

async function saveEdit() {
  if (!editSignatory.value.Name) {
    showNotification('Name is required', 'is-danger');
    return;
  }
  
  const res = await window.electronAPI.updateSignatory(editingSignatory.value, { ...editSignatory.value });
  
  if (res.success) {
    showNotification('Signatory updated successfully');
    editingSignatory.value = null;
    fetchSignatories();
  } else {
    showNotification(res.message || 'Failed to update signatory', 'is-danger');
  }
}

async function deleteSignatory(signatory) {
  const confirmed = await window.electronAPI.showConfirmationDialog(
    `Delete signatory "${signatory.Name}"?`
  );
  
  if (confirmed) {
    const res = await window.electronAPI.deleteSignatory(signatory.Id);
    if (res.success) {
      showNotification('Signatory deleted successfully');
      fetchSignatories();
    } else {
      showNotification(res.message || 'Failed to delete signatory', 'is-danger');
    }
  }
}

onMounted(() => {
  fetchClasses();
  fetchSignatories();
});
</script>

<style scoped>

.modal-card {
  width: 80%;
  max-width: 800px;
}

.modal-card-body {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

/* Animation for notifications */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

.table td, .table th {
  vertical-align: middle;
}

.buttons {
  justify-content: center;
}
</style>