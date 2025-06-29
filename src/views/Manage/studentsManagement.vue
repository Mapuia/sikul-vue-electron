<template>
  <div class="container">
    <h1 class="title has-text-centered mb-4">Student Management</h1>

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

    <!-- No Results Message -->
    <div v-if="hasSearched && students.length === 0" class="box has-text-centered">
      <p>No students found matching your search criteria.</p>
    </div>
    <div v-else-if="hasSearched && students.length > 0" class="has-text-centered is flex pr-3">
      <p>Found {{ students.length }} student record(s).</p>
    </div>

    <!-- Search Results -->
    <div v-if="students.length > 0" class="mt-2">
      <div class="box">
        <h2 class="subtitle is-4">Student Records</h2>
        
        <div class="table-container">
          <table class="table is-fullwidth is-striped is-hoverable">
            <thead>
              <tr>                
                <th>Name</th>
                <th>Gender</th>
                <th>Class</th>
                <th>Section</th>
                <th>Roll No</th>
                <th>Year</th>
                <th>Status</th>
                <th class="has-text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td>{{ student.name }}</td>
                <td>{{ student.gender }}</td>
                <td>{{ student.className || '-' }}</td>
                <td>{{ student.sectionName || '-' }}</td>                
                <td>{{ student.rollNo || '-' }}</td>
                <td>{{ student.YearName }}</td>
                <td>
                  <span class="tag" :class="statusTagClass(student.status)">
                    {{ student.status }}
                  </span>
                </td>
                <td>
                  <div class="buttons is-justify-content-end">
                    <button 
                      class="button is-small is-info"
                      @click="viewStudentDetails(student.id)"
                      title="View Details"
                    >
                      <span class="icon">
                        <i class="fas fa-eye"></i>
                      </span>
                    </button>
                    <button 
                      class="button is-small is-warning"
                      @click="openEditModal(student.id)"
                      title="Edit Student Info"
                    >
                      <span class="icon">
                        <i class="fas fa-user-edit"></i>
                      </span>
                    </button>
                    <button 
                      class="button is-small is-primary"
                      @click="openAdmissionModal(student.id)"
                      title="Edit Admission"
                    >
                      <span class="icon">
                        <i class="fas fa-id-card-alt"></i>
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="notification is-danger fixed-notification has-text-centered" @click="errorMessage = ''">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="notification is-success fixed-notification has-text-centered" @click="successMessage = ''">
      {{ successMessage }}
    </div>

    <!-- Student Details Modal -->
    <div class="modal" :class="{ 'is-active': showDetailsModal }">
      <div class="modal-background" @click="closeModal"></div>
      <div class="modal-card" style="width: 80%; max-width: 1000px;">
        <header class="modal-card-head">
          <p class="modal-card-title">Student Details</p>
          <button class="delete" aria-label="close" @click="closeModal"></button>
        </header>
        <section class="modal-card-body">
          <StudentDetailsView v-if="selectedStudent && modalMode === 'view'" :student="selectedStudent" />
          <StudentEditForm 
            v-else-if="selectedStudent && modalMode === 'edit'" 
            :student="selectedStudent"
            @save="handleSave"
            @cancel="closeModal"
          />
        </section>
        <footer class="modal-card-foot" v-if="modalMode === 'view'">
          <button class="button" @click="closeModal">Close</button>
        </footer>
      </div>
    </div>

    <!-- Admission Edit Modal -->
    <div class="modal" :class="{ 'is-active': showAdmissionModal }">
      <div class="modal-background" @click="showAdmissionModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Student Admission for {{ CurrentYear }}</p>
          <button class="delete" aria-label="close" @click="showAdmissionModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="student-admission-form">
            <div class="columns is-multiline">              
                <table class="table is-fullwidth is-striped">
                  <thead>       
                    <tr>
                      <th>Name:</th> 
                      <td>{{admissionData.Name}}</td>
                    </tr>
                    <tr>
                      <th>APAR:</th> 
                      <td>{{admissionData.APAR}}</td>
                    </tr>
                    <tr>
                      <th>PEN:</th> 
                      <td>{{admissionData.PEN}}</td>
                    </tr>
                    <tr>
                      <th>Previous Class</th> 
                      <td>{{admissionData.ClassName}}</td>
                    </tr>    
                    <tr>
                      <th>Previous Result:</th> 
                      <td>{{admissionData.ResultStatus}}</td>
                    </tr>
                  </thead>
                </table>
             <h2 class="title is-5">Admit to:</h2>
             </div>
             <div class="columns is-multiline">
              <div class="column is-half">                
                <div class="field">
                  <label class="label">Class</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="admissionForm.classId" @change="fetchSectionsForAdmission">
                        <option disabled value="">-- Select Class --</option>
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
                      <select v-model="admissionForm.sectionId" :disabled="!admissionForm.classId || admissionSections.length === 0">
                        <option disabled value="">-- Select Section --</option>
                        <option v-for="sec in admissionSections" :key="sec.Id" :value="sec.Id">
                          {{ sec.SectionName }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>    
              <div class="column is-half">
                <div class="field">
                  <label class="label">Roll Number</label>
                  <div class="control">
                    <input class="input" type="number" v-model="admissionForm.rollNo" placeholder="Enter roll number" />
                  </div>
                </div>
                <div class="field">
                  <label class="label">Admission Type</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="admissionForm.admissionType" required>
                        <option disabled value="">-- Select Type --</option> 
                        <option value="Promoted">Promoted</option> 
                        <option value="Repeat">Repeat</option>
                        <option value="New">New Admission</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
         </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary mr-2" @click="updateAdmission" :disabled="isSaving">
            <span v-if="isSaving" class="icon is-small">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span>Update Admission</span>
          </button>
          <button class="button is-light" @click="showAdmissionModal = false">Cancel</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import StudentDetailsView from '@/components/StudentDetailsView.vue';
import StudentEditForm from '@/components/StudentEditForm.vue';
import { useAcademicYear } from '../../composables/useAcademicYear';
const { CurrentYearId, CurrentYear, loadAcademicYear } = useAcademicYear();

const router = useRouter();

// Search and student list data
const searchQuery = ref('');
const students = ref([]);
const isSearching = ref(false);
const hasSearched = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Modals and modes
const showDetailsModal = ref(false);
const showEditModal = ref(false);
const showAdmissionModal = ref(false);
const selectedStudent = ref(null);
const modalMode = ref('view'); // 'view' or 'edit'

// Admission data
const admissionData = ref({});
const admissionForm = ref({
  classId: '',
  sectionId: '',
  rollNo: '',
  admissionType: ''
});
const classes = ref([]);
const admissionSections = ref([]);
const isSaving = ref(false);

// Fetch classes on mount
onMounted(async () => {
  await loadAcademicYear();
  await fetchClasses();
});

async function fetchClasses() {
  try {
    const response = await window.electronAPI.getClasses();
    if (response.success) {
      classes.value = response.classes;
    } else {
      errorMessage.value = response.message || 'Failed to load classes';
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error fetching classes:', error);
  }
}

async function fetchSectionsForAdmission() {
  if (!admissionForm.value.classId) return;
  
  try {
    const response = await window.electronAPI.getSectionsByClassId(admissionForm.value.classId);
    if (response.success) {
      admissionSections.value = response.sections;
      // Reset section if not available in new list
      if (!admissionSections.value.some(sec => sec.Id === admissionForm.value.sectionId)) {
        admissionForm.value.sectionId = '';
      }
    } else {
      errorMessage.value = response.message || 'Failed to load sections';
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error fetching sections:', error);
  }
}

async function searchStudents() {
  if (!searchQuery.value.trim()) {
    return;
  }

  try {
    isSearching.value = true;
    const response = await window.electronAPI.searchStudents({
      query: searchQuery.value.trim(),
      yearId: CurrentYearId.value
    });
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
  students.value = [];
}

async function viewStudentDetails(studentId) {
  try {
    const response = await window.electronAPI.getStudentDetails(studentId, CurrentYearId.value);
    if (response.success) {
      selectedStudent.value = response.student;
      modalMode.value = 'view';
      showDetailsModal.value = true;
      errorMessage.value = '';
    } else {
      errorMessage.value = response.message || 'Failed to load student details';
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error fetching student details:', error);
  }
}

async function openEditModal(studentId) {
  try {
    const response = await window.electronAPI.getStudentDetails(studentId);
    if (response.success) {
      selectedStudent.value = response.student;
      modalMode.value = 'edit';
      showDetailsModal.value = true;
      errorMessage.value = '';
    } else {
      errorMessage.value = response.message || 'Failed to load student details for editing';
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error opening edit modal:', error);
  }
}

async function openAdmissionModal(studentId) {
  try {
    isSaving.value = true;
    const response = await window.electronAPI.getStudentAdmissionDetails(studentId, CurrentYearId.value);
    
    if (response.success) {
      admissionData.value = response.admission;
      
      // Initialize form with current admission data if exists
      if (response.admission) {
        admissionForm.value = {
          classId: response.admission.ClassId,
          sectionId: response.admission.SectionId,
          rollNo: response.admission.RollNo,
          admissionType: response.admission.AdmissionType
        };
        await fetchSectionsForAdmission();
      } else {
        // Reset form for new admission
        admissionForm.value = {
          classId: '',
          sectionId: '',
          rollNo: '',
          admissionType: 'Promoted'
        };
      }
      
      showAdmissionModal.value = true;
      errorMessage.value = '';
    } else {
      errorMessage.value = response.message || 'Failed to load admission details';
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error opening admission modal:', error);
  } finally {
    isSaving.value = false;
  }
}

async function updateAdmission() {
  if (!validateAdmissionForm()) return;

  try {
    isSaving.value = true;
    const admissionPayload = {
      AdmissionId: admissionData.value.admissionId,
      StudentId: admissionData.value.Id,
      AcademicYearId: CurrentYearId.value,
      ClassId: admissionForm.value.classId,
      SectionId: admissionForm.value.sectionId || 0,
      RollNo: admissionForm.value.rollNo,
      AdmissionType: admissionForm.value.admissionType
    };

    const response = await window.electronAPI.updateAdmission(admissionPayload);
    
    if (response.success) {
      showAdmissionModal.value = false;
      successMessage.value = 'Admission updated successfully';
      // Refresh student list
      await searchStudents();
    } else {
      throw new Error(response.message || 'Failed to update admission');
    }
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSaving.value = false;
  }
}

function validateAdmissionForm() {
  if (!admissionForm.value.classId) {
    errorMessage.value = 'Please select a class';
    return false;
  }
  if (!admissionForm.value.rollNo) {
    errorMessage.value = 'Please enter a roll number';
    return false;
  }
  if (!admissionForm.value.admissionType) {
    errorMessage.value = 'Please select admission type';
    return false;
  }
  return true;
}

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
</script>

<style scoped>
.container {
  padding: 2rem;
}

.table-container {
  overflow-x: auto;
}

.modal-card-body {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.buttons .button {
  margin: 0 0.25rem;
}

.student-admission-form {
  padding: 1rem;
}

.modal-card {
  max-width: 800px;
  width: 90%;
}



.table th, .table td {
  vertical-align: middle;
}
</style>