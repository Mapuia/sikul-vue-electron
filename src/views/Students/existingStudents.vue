<template>
  <div class="form-container wide">
    <h1 class="title has-text-centered is-4">Re-Admission / Enrollment</h1>
    <h1 class="subtitle has-text-centered is-6 mb-2">Select Class and Section OR Search</h1>
    <div class="box ">  
      <div class="box mb-2">      
        <div class="columns is-vcentered">
          <div class="column">
            <div class="field is-horizontal">
              <label class="label is-normal mr-3 pt-2">Class</label>
              <div class="select is-fullwidth">
                <select v-model="selectedClassId" @change="fetchSections">
                  <option disabled value="">-- Select Class --</option>
                  <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                  {{ cls.ClassName }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div class="column">
            <div class="field is-horizontal">
              <label class="label is-normal mr-3 pt-2">Section</label>
              <div class="select is-fullwidth">
                <select v-model="selectedSectionId" :disabled="!selectedClassId || sections.length === 0" @change="fetchExistingStudents">
                  <option disabled value="">-- Select Section --</option>
                  <option v-for="sec in sections" :key="sec.Id" :value="sec.Id">
                    {{ sec.SectionName }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div> 
      </div>
      <h2 class="title is-6 mb-2 has-text-centered">OR</h2>
      <div class="box" style="max-width: 600px; margin: 0 auto;">
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
    <!-- No Results Message -->
    <div v-if="hasSearched && students.length === 0" class="box has-text-centered">
      <p>No students found matching your search criteria.</p>
    </div>

    <div v-if="errorMessage" class="notification is-danger fixed-notifications" @click="errorMessage = ''">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="notification is-success fixed-notifications" @click="successMessage = ''">
      {{ successMessage }}
    </div>

    <!-- Search Results -->
    <div v-if="students.length > 0" class="mt-2">
      <div class="box">
        <h2 class="subtitle is-4">Student Records</h2>
        
        <div class="table-container">
          <table class="table is-fullwidth is-striped is-hoverable">
            <thead>
              <tr> 
                <th>Roll No</th>             
                <th>Name</th>
                <th>Gender</th>
                <th>Class</th>
                <th>Section</th>                               
                <th class="has-text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">                
                <td>{{ student.rollNo || '-' }}</td>
                <td>{{ student.name }}</td>
                <td>{{ student.gender }}</td>
                <td>{{ student.className || '-' }}</td>
                <td>{{ student.sectionName || '-' }}</td>               

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
                      class="button is-small is-warning"
                      @click="openPromotionModal(student)"
                      title="Promote to Next Class"
                    >
                      <span class="icon">
                        <i class="fas fa-arrow-up"></i>
                      </span>
                      <span>Re-Admit</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>    

    <!-- Student Details Modal -->
    <div class="modal" :class="{ 'is-active': showDetailsModal }">
      <div class="modal-background" @click="closeModal"></div>
      <div class="modal-card" style="width: 80%; max-width: 1000px;">
        <header class="modal-card-head">
          <p class="title modal-card-title">Student Details</p>
          <button class="delete" aria-label="close" @click="closeModal"></button>
        </header>
        <section class="modal-card-body">
          <StudentDetailsView v-if="selectedStudent && modalMode === 'view'" :student="selectedStudent" :admission="selectedAdmission" />
        </section>
        <footer class="modal-card-foot" v-if="modalMode === 'view'">
          <button class="button" @click="closeModal">Close</button>
        </footer>
      </div>
    </div>

    <!-- Promotion Modal -->
    <div class="modal" :class="{ 'is-active': showPromotionModal }">
      <div class="modal-background" @click="showPromotionModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Student Re-Admission for {{ CurrentYear }}</p>
          <button class="delete" aria-label="close" @click="showPromotionModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="student-promotion-form">
            <div class="columns is-multiline">              
                <table class="table is-fullwidth is-striped">
                  <thead>       
                    <tr>
                      <th>Name:</th> 
                      <td>{{promotionData.Name}}</td>
                    </tr>
                    <tr>
                      <th>APAR:</th> 
                      <td>{{promotionData.APAR}}</td>
                    </tr>
                    <tr>
                      <th>PEN:</th> 
                      <td>{{promotionData.PEN}}</td>
                    </tr>
                    <tr>
                      <th>Previous Class</th> 

                      <td>{{promotionData.ClassName}} </td>
                    </tr>    
                    <tr>
                      <th>Previous Result:</th> 
                      <td>{{promotionData.ResultStatus}}</td>
                    </tr>
                  </thead>
                </table>
             <h2 class="title is-5">Re-Admit to:</h2>
            </div>
            <div class="columns is-multiline">
              <div class="column is-half">                
                <div class="field">
                  <label class="label">New Class</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="newClassId">
                        <option disabled value="">-- Select Class --</option>
                        <option v-for="cls in newClasses" :key="cls.Id" :value="cls.Id">
                          {{ cls.ClassName }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="field">
                  <label class="label">New Section</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="newSectionId" :disabled="!newClassId || newSections.length === 0">
                        <option disabled value="">-- Select Section --</option>
                        <option v-for="sec in newSections" :key="sec.Id" :value="sec.Id">
                          {{ sec.SectionName }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>    
              <div class="column is-half">
                <div class="field">
                  <label class="label">New Roll Number</label>
                  <div class="control">
                    <input class="input" type="number" v-model="newRollNo" placeholder="Enter new roll number" />
                  </div>
                </div>
                <div class="field">
                  <label class="label">Re-Admission Type</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="admissionType" required>
                        <option disabled selected>-- Select Admission Type --</option> 
                        <option>Promoted</option> 
                        <option>Repeat</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
         </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary mr-2" @click="promoteStudent" :disabled="isSaving">
            <span v-if="isSaving" class="icon is-small">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span>Admit</span>
          </button>
          <button class="button is-light" @click="showPromotionModal = false">Cancel</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import StudentDetailsView from '@/components/StudentDetailsView.vue';
import { useAcademicYear } from '../../composables/useAcademicYear';

// Composables
const { CurrentYearId, CurrentYear, PreviousYearId, PreviousYear, loadAcademicYear } = useAcademicYear();
const router = useRouter();

// ======================
// Reactive State
// ======================

// Data Collections
const classes = ref([]);
const sections = ref([]);
const students = ref([]);
const newClasses = ref([]);
const newSections = ref([]);

// Selection Refs
const selectedClassId = ref('');
const selectedSectionId = ref('');
const newClassId = ref('');
const newSectionId = ref('');
const newRollNo = ref('');
const admissionType = ref('');

// UI State
const isSearching = ref(false);
const hasSearched = ref(false);
const noSections = ref(false);
const showDetailsModal = ref(false);
const showPromotionModal = ref(false);
const isSaving = ref(false);
const modalMode = ref('view'); // 'view' | 'promote'

// Student Data
const selectedStudent = ref(null);
const selectedAdmission = ref(null);
const promotionData = ref({});

// Messages
const errorMessage = ref('');
const successMessage = ref('');
const searchQuery = ref('');

// ======================
// Computed Properties
// ======================

const className = computed(() => {
  const selectedClass = classes.value.find(cls => cls.Id === selectedClassId.value);
  return selectedClass ? selectedClass.ClassName : '';
});

const sectionName = computed(() => {
  const selectedSection = sections.value.find(sec => sec.Id === selectedSectionId.value);
  return selectedSection ? selectedSection.SectionName : '';
});

// ======================
// Data Fetching Methods
// ======================

async function fetchClasses() {
  try {
    const response = await window.electronAPI.getClasses();
    if (response.success) classes.value = response.classes;
  } catch (error) {
    errorMessage.value = 'Failed to load classes';
  }
}

async function fetchSections() {
  if (!selectedClassId.value) return;
  
  try {
    sections.value = [];
    selectedSectionId.value = '';   
    
    const response = await window.electronAPI.getSectionsByClassId(selectedClassId.value);
    if (response.success) {
      sections.value = response.sections;
      noSections.value = sections.value.length === 0;
      if (noSections.value) selectedSectionId.value = 0;
    }
  } catch (error) {
    errorMessage.value = 'Failed to load sections';
  }
}

async function fetchNewClasses() {
  try {
    const response = await window.electronAPI.fetchUpperClasses(className.value);
    if (response.success) newClasses.value = response.classes;
  } catch (error) {
    errorMessage.value = 'Failed to load classes';
  }
}

async function fetchNewSections() {
  if (!newClassId.value) return;
  
  try {
    newSections.value = [];
    newSectionId.value = '';   
    
    const response = await window.electronAPI.getSectionsByClassId(newClassId.value);
    if (response.success) {
      newSections.value = response.sections;
      noSections.value = newSections.value.length === 0;
      if (noSections.value) newSectionId.value = 0;
    }
  } catch (error) {
    errorMessage.value = 'Failed to load sections';
  }
}

async function fetchExistingStudents() {
  try {
    isSearching.value = true;
    const response = await window.electronAPI.getStudentsByClassSectionsId({
      YearId: PreviousYearId.value,
      ClassId: selectedClassId.value,
      SectionId: selectedSectionId.value
    });
    if (response.success) students.value = response.students;
    else errorMessage.value = response.message || 'Failed to fetch existing students';
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSearching.value = false;
  }
}

// ==================
// Search Functionality
// ==================

async function searchStudents() {
  if (!searchQuery.value.trim()) return;

  try {
    isSearching.value = true;
    const response = await window.electronAPI.searchStudents({
      query: searchQuery.value.trim(),
      yearId: PreviousYearId.value
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
    students.value = [];
  } finally {
    isSearching.value = false;
  }
}

async function refreshStudents() {
  searchQuery.value = '';
  hasSearched.value = false;
  await fetchExistingStudents();
}

// ==================
// Student Operations
// ==================

async function viewStudentDetails(studentId) {
  try {
    const response = await window.electronAPI.getStudentDetails(studentId, PreviousYearId.value);
    if (response.success) {
      selectedStudent.value = response.student;
      selectedAdmission.value = response.admission;
      modalMode.value = 'view';
      showDetailsModal.value = true;
      errorMessage.value = '';
    } else {
      errorMessage.value = response.message || 'Failed to load student details';
    }
  } catch (error) {
    errorMessage.value = error.message;
  }
}

async function openPromotionModal(student) {
  try {
    const response = await window.electronAPI.getPreviousAdmission(student.id, PreviousYearId.value);
    if (response.success) {
      promotionData.value = response.admission;      
      newRollNo.value = promotionData.value.Rank;
      showPromotionModal.value = true;
      errorMessage.value = '';
      await fetchNewClasses();
    } else {
      errorMessage.value = response.message || 'Failed to load student details for promotion';
    }
  } catch (error) {
    errorMessage.value = error.message;
  }
}

async function promoteStudent() {
  if (!newClassId.value || !newRollNo.value) {
    errorMessage.value = 'Please select a class and enter a roll number';
    return;
  }

  isSaving.value = true;
  try {
    const response = await window.electronAPI.promoteStudent({
      StudentId: promotionData.value.studentId,
      ClassId: newClassId.value,
      SectionId: newSectionId.value || 0,
      RollNo: newRollNo.value,
      AcademicYearId: CurrentYearId.value,
      AdmissionType: admissionType.value,
      PreviousYearId: PreviousYearId.value
    });
    
    if (response.success) {
      showPromotionModal.value = false;
      successMessage.value = 'Student promoted successfully';
    } else {
      throw new Error(response.message || 'Failed to promote student');
    }
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSaving.value = false;
  }
}

// ==================
// UI Helpers
// ==================

function closeModal() {
  showDetailsModal.value = false;
  selectedStudent.value = null;
  modalMode.value = 'view';
}

function statusTagClass(admissionType) {
  switch (admissionType) {
    case 'New': return 'is-success';
    case 'Transferred': return 'is-info';
    case 'Terminated': return 'is-danger';
    case 'Retained': return 'is-warning';
    default: return 'is-light';
  }
}

function openNewAdmission() {
  router.push({ name: 'NewAdmission' });
}

// ==================
// Lifecycle & Watchers
// ==================

onMounted(async () => {
  await loadAcademicYear();
  await fetchClasses();
});

watch(selectedClassId, async (newClassId) => {
  if (newClassId) {
    await fetchSections();
    noSections.value = sections.value.length < 2;
    if (noSections.value) {
      selectedSectionId.value = 0;    
      await fetchExistingStudents();
    }
  } else {
    sections.value = [];
    selectedSectionId.value = '';
    students.value = [];
  }
});

watch(newClassId, async (selectedClassId) => {
  if (selectedClassId) {
    await fetchNewSections();     
    noSections.value = newSections.value.length < 2;
    if (noSections.value) newSectionId.value = 0;
  } else {
    newSections.value = [];
    newSectionId.value = '';    
  }
});

watch(selectedSectionId, (newSectionId) => {
  if (newSectionId) fetchExistingStudents();
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