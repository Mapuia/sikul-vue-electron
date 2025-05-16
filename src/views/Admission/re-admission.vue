<template>
  <div class="container">
    <h1 class="title has-text-centered mb-4">Re-Admission</h1>

    <!-- Search Box -->
    <div class="box mb-4" style="max-width: 600px; margin: 0 auto;">
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

    <!-- Action Buttons -->
    <div class="buttons is-centered mb-4">
      <button class="button is-success" @click="openNewAdmission">
        <span class="icon">
          <i class="fas fa-user-plus"></i>
        </span>
        <span>New Admission</span>
      </button>
      <button class="button is-info" @click="refreshStudents">
        <span class="icon">
          <i class="fas fa-sync-alt"></i>
        </span>
        <span>Refresh</span>
      </button>
    </div>

    <!-- No Results Message -->
    <div v-if="hasSearched && students.length === 0" class="box has-text-centered">
      <p>No students found matching your search criteria.</p>
    </div>
    <div v-else-if="hasSearched && students.length > 0" class="has-text-right is flex pr-3">
      <p>Found {{ students.length }} student record(s).</p>
    </div>

    <!-- Search Results -->
    <div v-if="students.length > 0" class="mt-4">
      <div class="box">
        <h2 class="subtitle is-4">Student Records</h2>
        
        <div class="table-container">
          <table class="table is-fullwidth is-striped is-hoverable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Class</th>
                <th>Section</th>
                <th>Roll No</th>
                <th>Status</th>
                <th class="has-text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td>{{ student.id }}</td>
                <td>{{ student.name }}</td>
                <td>{{ student.gender }}</td>
                <td>{{ student.className || '-' }}</td>
                <td>{{ student.sectionName || '-' }}</td>
                <td>{{ student.rollNo || '-' }}</td>
                <td>
                  <span class="tag" :class="statusTagClass(student.status)">
                    {{ student.status }}
                  </span>
                </td>
                <td>
                  <div class="buttons is-justify-content-end">
                    <button 
                      class="button is-small is-info no-padding"
                      @click="viewStudentDetails(student.id)"
                      title="View Details"
                    >
                      <span class="icon">
                        <i class="fas fa-eye"></i>
                      </span>
                    </button>
                    <button 
                      class="button is-small is-warning "
                      @click="openReAdmit(student.id)"
                      title="Re-Admit"
                    >
                      <span class="icon">
                        <i class="fas fa-id-badge"></i>
                        <i class="fas fa-plus mx-2"></i>
                        
                      </span>
                      <i class="mx-2">Re-admit</i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="notification is-danger fixed-notification">
      {{ errorMessage }}
    </div>

    <!-- Student Details Modal -->
    <div class="modal" :class="{ 'is-active': showDetailsModal }">
      <div class="modal-background" @click="closeModal"></div>
      <div class="modal-card" style="width: 80%; max-width: 1000px;">
        <header class="modal-card-head">
          <p class="modal-card-title">Admission Details</p>
          <button class="delete" aria-label="close" @click="closeModal"></button>
        </header>
        <section class="modal-card-body">
          <StudentDetailsView v-if="selectedStudent && modalMode === 'view'" :student="selectedStudent" />
          <ReAdmissionForm 
            v-else-if="selectedStudent && modalMode === 're-admission'" 
            :readmission="selectedStudent"
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import StudentDetailsView from '@/components/StudentDetailsView.vue';
import ReAdmissionForm from '@/components/re-admissionForm.vue';
import { useAcademicYear } from '../../composables/useAcademicYear';
const { CurrentYearId, CurrentYear, loadAcademicYear } = useAcademicYear();

const router = useRouter();

const searchQuery = ref('');
const students = ref([]);
const isSearching = ref(false);
const hasSearched = ref(false);
const showDetailsModal = ref(false);
const selectedStudent = ref(null);
const errorMessage = ref('');
const modalMode = ref('view'); //

async function fetchAllStudents() {
  try {
    isSearching.value = true;
    const response = await window.electronAPI.getAllStudents();
    if (response.success) {
      students.value = response.students;
    } else {
      errorMessage.value = response.message || 'Failed to fetch students';
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error fetching students:', error);
  } finally {
    isSearching.value = false;
  }
}

async function searchStudents() {
  if (!searchQuery.value.trim()) {
    await fetchAllStudents();
    return;
  }

  try {
    isSearching.value = true;
    const response = await window.electronAPI.searchStudents(searchQuery.value.trim());
    if (response.success) {
      students.value = response.students;
      hasSearched.value = true;
    } else {
      errorMessage.value = response.message || 'Search failed';
      students.value = [];
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Search error:', error);
    students.value = [];
  } finally {
    isSearching.value = false;
  }
}

async function refreshStudents() {
  searchQuery.value = '';
  hasSearched.value = false;
  await fetchAllStudents();
}

async function viewStudentDetails(studentId) {
  try {
    const response = await window.electronAPI.getStudentDetails(studentId, CurrentYearId.value);
    if (response.success) {
      selectedStudent.value = response.student;
      modalMode.value = 'view';
      showDetailsModal.value = true;
      errorMessage.value = '';
      console.log('Vew Student:', selectedStudent.value);
    } else {
      errorMessage.value = response.message || 'Failed to load student details';
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error fetching student details:', error);
  }
}

async function openReAdmit(studentId) {
  try {
    const response = await window.electronAPI.getStudentAdmissionDetails(studentId, CurrentYearId.value);
    if (response.success) {
      selectedStudent.value = response.admission;
      modalMode.value = 're-admission';
      showDetailsModal.value = true;
      errorMessage.value = '';

      console.log('Readdmission:',selectedStudent.value)
    } else {
      errorMessage.value = response.message || 'Failed to load student details for re-Admission';
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error opening Re-Admission modal:', error);
  }
}


//This will Update Admission Table only.
async function handleSave(updatedStudent) {
  try {
    const response = await window.electronAPI.updateStudent(updatedStudent);
    if (response.success) {
      // Update the local students list
      const index = students.value.findIndex(s => s.id === updatedStudent.id);
      if (index !== -1) {
        students.value[index] = { ...students.value[index], ...updatedStudent };
      }
      closeModal();
      errorMessage.value = '';
    } else {
      errorMessage.value = response.message || 'Failed to update student';
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error saving student:', error);
  }
}

function closeModal() {
  showDetailsModal.value = false;
  selectedStudent.value = null;
  modalMode.value = 'view';
}

function statusTagClass(status) {
  switch (status) {
    case 'Admitted': return 'is-success';
    case 'Transferred': return 'is-info';
    case 'Terminated': return 'is-danger';
    case 'Retained': return 'is-warning';
    default: return 'is-light';
  }
}

function openNewAdmission() {
  router.push({ name: 'NewAdmission' });
}

onMounted(async () => {
  await fetchAllStudents();
});
</script>

<style scoped>
.container {
  padding: 2rem;
}

.table-container {
  overflow-x: auto;
}

.modal-card-body {
  max-height: 100vh;
  overflow-y: auto;
}

</style>