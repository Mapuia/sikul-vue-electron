<template>
  <div class="form-container wide">
    

    <!-- Selection -->
    <div class="box">
      <h1 class="title has-text-centered is-4">Student Management</h1>
    <h1 class="subtitle has-text-centered is-6 mb-2">Select Class and Section OR Search</h1>
      <div class=" mb-2">
        <div class="columns is-vcentered">
          <div class="column">
            <label class="label is-normal">Class</label>
            <div class="select is-fullwidth">
              <select v-model="selectedClassId" @change="fetchSections">
                <option disabled value="">-- Select Class --</option>
                <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">{{ cls.ClassName }}</option>
              </select>
            </div>
          </div>

          <div class="column">
            <label class="label is-normal">Section</label>
            <div class="select is-fullwidth">
              <select v-model="selectedSectionId" :disabled="!selectedClassId || sections.length ===0" @change="fetchExistingStudents">
                <option disabled value="">-- Select Section --</option>
                <option v-for="sec in sections" :key="sec.Id" :value="sec.Id">{{ sec.SectionName }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Search -->
      <h2 class="title is-6 has-text-centered">OR</h2>
      <div class="" style="max-width: 600px; margin: 0 auto;">
        <div class="field has-addons">
          <div class="control is-expanded">
            <input
              class="input"
              type="text"
              v-model="searchQuery"
              placeholder="Search by Name, PEN or APAR"
              @keyup.enter="searchStudents"
            />
          </div>
          <div class="control">
            <button class="button is-primary" @click="searchStudents" :disabled="isSearching">
              <span v-if="!isSearching">Search</span>
              <span v-else>Searching...</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No Result -->
    <div v-if="hasSearched && students.length === 0" class="box has-text-centered">
      <p>No students found matching your search criteria.</p>
    </div>

    <!-- Notifications -->
    <div v-if="errorMessage" class="notification is-danger fixed-notifications" @click="errorMessage = ''">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="notification is-success fixed-notifications" @click="successMessage = ''">
    {{ successMessage }}
    </div>
    

    <!-- Student Table -->
    <div v-if="students.length > 0" class="mt-2">
      <div class="box">
        <h2 class="subtitle is-4">Students ({{ students.length }} Records) </h2>
        <div class="table-container">
          <table class="table is-fullwidth is-striped is-hoverable">
            <thead>
              <tr>
                <th v-if="!hasSearched">Roll No</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Class</th>
                <th>Section</th>
                <th v-if="hasSearched">RollNo</th>
                
                <th class="has-text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td v-if="!hasSearched">{{ student.rollNo || '-' }}</td>
                <td>{{ student.name }}</td>
                <td>{{ student.gender }}</td>
                <td>{{ student.className || '-' }}</td>
                <td>{{ student.sectionName || '-' }}</td>
                <td v-if="hasSearched">{{ student.rollNo || '-' }}</td>
                <td>
                  <div class="buttons is-right">
                    <button class="button no-padding is-small is-info" @click="viewStudentDetails(student.id)" title="View">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="button no-padding is-small is-warning" @click="openEditModal(student.id)" title="Edit">
                      <i class="fas fa-user-edit"></i>
                    </button>
                    <button
                        class="button no-padding is-small is-danger"
                        @click="confirmDeleteStudent(student.id)"
                        title="Delete"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else> 
      <div v-if="(selectedClassId && selectedSectionId != 0) || selectedSectionId || hasSearched" class="notification is-danger fixed-notifications">
      <p >No Students found</p>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal" :class="{ 'is-active': showModal }">
      <div class="modal-background" @click="closeModal"></div>
      <div class="modal-card" style="width: 90%; max-width: 1000px;">
        <header class="modal-card-head">
          <p class="modal-card-title">Student Information</p>
          <button class="delete" aria-label="close" @click="closeModal"></button>
        </header>
        <section class="modal-card-body">
          <StudentDetailsView v-if="selectedStudent && modalMode === 'view'" :student="selectedStudent" :admission="admission" />
          <StudentEditForm
            v-if="selectedStudent && modalMode === 'edit'"
            :student="selectedStudent"
            :admission="admission"
            :yearId="CurrentYearId"
            @save="handleSave"
            @cancel="closeModal"
          />
        </section>
        <footer class="modal-card-foot" v-if="modalMode === 'view'">
          <button class="button" @click="closeModal">Close</button>
        </footer>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue';
import StudentDetailsView from '@/components/StudentDetailsView.vue';
import StudentEditForm from '@/components/StudentEditForm.vue';
import { useAcademicYear } from '@/composables/useAcademicYear';

const { CurrentYearId, loadAcademicYear } = useAcademicYear();

const classes = ref([]);
const sections = ref([]);
const students = ref([]);
const selectedClassId = ref('');
const selectedSectionId = ref('');
const searchQuery = ref('');
const isSearching = ref(false);
const hasSearched = ref(false);

const selectedStudent = ref(null);
const admission = ref(null);
const showModal = ref(false);
const modalMode = ref('view');

const errorMessage = ref('');
const successMessage = ref('');

async function fetchClasses() {
  const res = await window.electronAPI.getClasses();
  if (res.success) classes.value = res.classes;
}

async function fetchSections() {
  if (!selectedClassId.value) return;
  const res = await window.electronAPI.getSectionsByClassId(selectedClassId.value);
  if (res.success){
    sections.value = res.sections
    if(res.sections.length===0){
      selectedSectionId.value = 0;
      await fetchExistingStudents();
    }    
  }  
}

watch(selectedClassId, async (classId) =>{
  if(selectedSectionId) fetchExistingStudents()
  else{
    const secResult = await window.electronAPI.getSectionsByClassId(classId) 
    if (secResult.success) {
      sections.value = secResult.sections  
    }
    if (sections.value.length === 0){
      selectedSectionId.value = 0
      fetchExistingStudents();
    }
  }       
})

async function fetchExistingStudents() {
  hasSearched.value = false
  const res = await window.electronAPI.getStudentsByClassSectionsId({
    YearId: CurrentYearId.value,
    ClassId: selectedClassId.value,
    SectionId: selectedSectionId.value
  });
  if (res.success) students.value = res.students;
}

async function searchStudents() {
  if (!searchQuery.value.trim()) return;
  isSearching.value = true;
  
  try {
    const res = await window.electronAPI.searchStudents({
      query: searchQuery.value.trim(),
      yearId: CurrentYearId.value
    });
    if (res.success) {
      students.value = res.students;
      hasSearched.value = true;
      
    } else {
      errorMessage.value = res.message || 'Search failed';
    }
    if(hasSearched.value){
    selectedClassId.value = ''
      selectedSectionId.value = ''
    }  
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    isSearching.value = false;
  }
}

async function viewStudentDetails(studentId) {
  const res = await window.electronAPI.getStudentDetails(studentId, CurrentYearId.value);
  if (res.success) {
    selectedStudent.value = res.student;
    admission.value = res.admission;
    modalMode.value = 'view';
    showModal.value = true;

    //console.log("Students", res.student)
  } else {
    errorMessage.value = res.message || 'Could not load student details.';
  }
}

async function openEditModal(studentId) {
  const res = await window.electronAPI.getStudentDetails(studentId, CurrentYearId.value);
  if (res.success) {
    selectedStudent.value = res.student;
    admission.value = res.admission;
    
    modalMode.value = 'edit';
    showModal.value = true;
  } else {
    errorMessage.value = res.message || 'Could not load student details.';
  }
}

async function handleSave(result) {
  if (result.success) {
    showNotification(result.message, 'success');
    showModal.value = false;
    if (hasSearched.value) {
      await searchStudents();
    } else {
      await fetchExistingStudents();
    }
  } else {
    showNotification(result.message, 'danger');
  }
}

function closeModal() {
  showModal.value = false;
  selectedStudent.value = null;
  admission.value = null;
  modalMode.value = 'view';
}

async function confirmDeleteStudent(studentId) {
  try {
    const confirmed = await window.electronAPI.showConfirmationDialog('Are you sure you want to delete this student? This action cannot be undone.');
    if (!confirmed) return;

    const res = await window.electronAPI.deleteStudent(studentId);
    if (res.success) {
      showNotification('Student deleted successfully!', 'success');
      await fetchExistingStudents();
    } else {
      showNotification(res.message || 'Failed to delete student', 'danger');
    }
  } catch (error) {
    console.error('Error during delete:', error);
    showNotification('An unexpected error occurred while deleting the student.', 'danger');
  }
}

function showNotification(message, type = 'success', timeout = 5000) {
  if (type === 'success') {
    successMessage.value = message;
    errorMessage.value = '';
  } else {
    errorMessage.value = message;
    successMessage.value = '';
  }
  
  // Clear the message after timeout
  const timer = setTimeout(() => {
    if (type === 'success') {
      successMessage.value = '';
    } else {
      errorMessage.value = '';
    }
  }, timeout);
  
  // Return a function to manually clear the notification if needed
  return () => clearTimeout(timer);
}

onMounted(async () => {
  await loadAcademicYear();
  await fetchClasses();
});
</script>


<style scoped>
.student-promotion-form {
  padding: 1rem;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th, .table td {
  padding: 0.5em 0.75em;
   text-align: left; 
}

.table th { 
  font-weight: bold;
  max-width: 100px;
}

.fixed-notifications {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  cursor: pointer;
}

.modal-card {
  max-width: 800px;
  width: 80%;
}

.modal-card-body {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
</style>