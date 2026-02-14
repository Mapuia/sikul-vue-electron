<template>
  <div class="form-container wide">
    <h1 class="title has-text-centered is-4">Re-Admission / Enrollment</h1>
    <!-- <h1 class="subtitle has-text-centered is-6 mb-2">Select Class and Section OR Search</h1> -->
    <div class="box ">  
      <!-- <div class="box mb-2">      
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
      </div> -->
      <h2 class="title is-6 mb-2 has-text-centered">Search Students</h2>
      <div class="box" style="max-width: 600px; margin: 0 auto;">
        <div class="field has-addons">        
          <div class="control is-expanded">
            <input
              class="input"
              type="text"
              v-model="searchQuery"
              placeholder="Search by Name, PEN or APAR"
              @keyup.enter="searchStudents"
              @keydown.enter = "searchStudents"
            />
          </div>
          <div class="control">
            <button class="button is-primary" @click="searchStudents"  :disabled="isSearching">
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
        <div class="has-text-right mb-4"><i>{{ students.length }} records found.</i></div>
        
        <div class="table-container">
          <table class="table is-fullwidth is-striped is-hoverable">
            <thead>
              <tr> 
                <th>Registration No</th>             
                <th>Name</th>
                <th>Gender</th>
                <th>Father's Name</th>
                <th>Action</th>                  
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.Id">                
                <td clickable @click="viewLastAcademicRecords(student.Id)"><a>{{ student.RegistrationNumber || 'N/A' }}</a></td>          
                <td clickable @click="viewLastAcademicRecords(student.Id)"><a>{{ student.Name }}</a></td> 
                <td>{{ student.Gender }}</td>          
                <td>{{ student.FathersName }}</td>               
                <!-- <td><button class="button is-small is-primary" @click="viewLastAcademicRecords(student.Id)">View Latest Records</button></td>                 -->
                <td><button 
                  class="button is-small is-primary" 
                  @click="openPromotionModal(student.Id)"
                  :disabled="student.reAdmitted"
                  >{{ student.reAdmitted ? 'Admitted' : 'Re-Admit' }}</button></td>                
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
          <LastAdmissionInfo v-if="selectedStudent && modalMode === 'view'" :student="selectedStudent" :admission="selectedAdmission" />
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
          <p class="modal-card-title">Readmission </p>
          <button class="delete" aria-label="close" @click="showPromotionModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="student-promotion-form">         
            <div class="columns is-multiline">
              <h2 class="title is-5 mr-3 ">Latest Admission Details</h2>            
                <table class="sikul-table is-fullwidth is-striped">
                  <thead>   
                    <tr>
                      <th>Registration No.</th> 
                      <td>: {{selectedStudent?.RegistrationNumber || 'N/A'}}</td>
                    </tr>                  
                    <tr>
                      <th>Name</th> 
                      <td>: {{selectedStudent?.Name}}</td>
                    </tr>
                    
                    <tr>
                      <th>Father's Name</th> 
                      <td>: {{selectedStudent?.FathersName}}</td>
                    </tr>
                    <tr>
                      <th> Admitted to</th> 
                      <td>: Class {{admissionData.ClassName}}</td>
                    </tr>
                    <tr>
                      <th> Academic Year</th> 
                      <td>: {{admissionData?.YearName}}</td>
                    </tr>
                    
                    <tr>
                      <th>Admission Date</th> 
                      <td>: {{formatDate(admissionData?.Creation_at)}}</td>
                    </tr>
                    <tr>
                      <th>Admission Type</th> 
                      <td>: {{admissionData?.AdmissionType}}</td>
                    </tr>                   
                  </thead>
                </table>
            <div class="help is-danger" v-if="jumpReAdmission" >This student was not addmitted to previous Academic Year. i.e {{ PreviousYear }}</div> 
            <hr>
            <h2 v-if="!reAdmitted" class="title is-5 mr-3 ">Re-Admission for Academic Year {{ CurrentYear }} </h2>
            <i v-if="!reAdmitted" class=" is-danger" > (All fields are required)</i>
            </div>
            <div class="notification is-warning" v-if="reAdmitted">
              This student is already admitted for current Academic Year {{ CurrentYear }}.
            </div>
            
            <div v-if="!reAdmitted" class="columns is-multiline">
              
              <div class="column is-half">                
                <div class="field">
                  <label class="label">Class*</label>
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
                  <label class="label">Section*</label>
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
                  <label class="label">Roll Number*</label>
                  <div class="control">
                    <input class="input" type="number" v-model="newRollNo" placeholder="Enter new roll number" />
                  </div>
                </div>
                <div class="field">
                  <label class="label">Admission Type* </label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="admissionType" required>
                        <option value='' disabled>-- Select Admission Type --</option> 
                        <option value="Promoted">Promotion</option> 
                        <option value="Repeat">Repeat</option>
                      </select>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
         </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary mr-2" @click="reAdmitStudent()" :disabled="isSaving || reAdmitted">
            <span v-if="isSaving" class="icon is-small">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span>Process Admission</span>
          </button>
          <button class="button is-light" @click="showPromotionModal = false">Close</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, h } from 'vue';
import { useRouter } from 'vue-router';
import { useAcademicYear } from '../../composables/useAcademicYear';
import LastAdmissionInfo from '../../components/lastAdmissionInfo.vue';

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
const selectedStudent = ref({});
const selectedAdmission = ref([]);
const admissionData = ref({});
const lastResultData = ref({});
const reAdmitted = ref(false);
const jumpReAdmission = ref(false);

// Messages
const errorMessage = ref('');
const successMessage = ref('');
const searchQuery = ref('');
const isClassX = ref(false);


function formatDate(dateString) {
  if (!dateString || dateString === '-') return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}
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
    if (response.success) newClasses.value = response.classes;
  } catch (error) {
    errorMessage.value = 'Failed to load classes';
  }
}

// async function fetchSections() {
//   if (!selectedClassId.value) return;
  
//   try {
//     sections.value = [];
//     selectedSectionId.value = '';   
    
//     const response = await window.electronAPI.getSectionsByClassId(selectedClassId.value);
//     if (response.success) {
//       sections.value = response.sections;
//       noSections.value = sections.value.length === 0;
//       if (noSections.value) selectedSectionId.value = 0;
//     }
//   } catch (error) {
//     errorMessage.value = 'Failed to load sections';
//   }
// }

async function fetchNewClasses() {
  try {
    const response = await window.electronAPI.fetchUpperClasses(admissionData.value.ClassName);
    if (response.success) {      
      newClasses.value = response.classes;
    }
  } catch (error) {
    errorMessage.value = 'Failed to load classes';
  }
}

async function fetchNewSections() {
  if (!newClassId.value) return;
  //console.log('Fetching sections for ClassId:', newClassId.value);
  try {
    newSections.value = [];
    newSectionId.value = '';   
    
    const response = await window.electronAPI.getSectionsByClassId(newClassId.value);
    if (response.success) {
      newSections.value = response.sections;
      noSections.value = newSections.value.length === 0;
      if (noSections.value) newSectionId.value = 0;
      //console.log('Fetched Sections for Promotion:', newSections.value);
    }
  } catch (error) {
    errorMessage.value = 'Failed to load sections';
  }
}

async function fetchExistingStudents() {
  try {
    isSearching.value = true;
    const response = await window.electronAPI.getStudentsByClassSectionId({
      YearId: PreviousYearId.value,
      ClassId: selectedClassId.value,
      SectionId: selectedSectionId.value
    });
    if (response.success) students.value = response.students;
    else errorMessage.value = response.message || 'Failed to fetch existing students';
    // console.log('Fetched Students:', students.value);
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
    const response = await window.electronAPI.searchStudentsforReAdmission({
      query: searchQuery.value.trim(),
      CurrentYearId: CurrentYearId.value
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



// ==================
// Student Operations
// ==================


async function viewLastAcademicRecords(studentId) {
  try {
    // Fetch latest admission details for the student to determine current class and promotion eligibility
    const response = await window.electronAPI.getLastAcademicRecords(studentId);
    // console.log('Admission Details:', response);
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

async function openPromotionModal(studentId) {
  try {
    //Fetch latest admission details for the student to determine current class and promotion eligibility
    const response = await window.electronAPI.getPreviousAdmission(studentId, CurrentYearId.value, PreviousYearId.value);
    if (response.success) {
      selectedStudent.value = response.student;
      admissionData.value = response.admission; 
      reAdmitted.value = response.reAdmitted;
      jumpReAdmission.value = response.jumpReAdmission;
      showPromotionModal.value = true;

      console.log('Jump Re-Admission Status:', jumpReAdmission.value);

      errorMessage.value = '';
      await fetchNewClasses();
      if(jumpReAdmission.value) {
        fetchClasses()
      }

      
    } else {
      errorMessage.value = response.message || 'Failed to load student details for promotion';
    }
  } catch (error) {
    errorMessage.value = error.message;
  }
}

async function reAdmitStudent() {
  if (!newClassId.value || !newRollNo.value) {
    errorMessage.value = 'Please select a class and enter a roll number';
    return;
  }
  if (!admissionType.value ) {
    errorMessage.value = 'Please select an admission type and enter a roll number';
    return;
  }

  isSaving.value = true;
  try {
      const confirmed = await window.electronAPI.showConfirmationDialog(
      `Are you sure you want to re-admit ${selectedStudent.value.Name}? 
      to Class: ${newClasses.value.find(c => c.Id === newClassId.value)?.ClassName} for Academic Year: ${CurrentYear.value}?`
    );
    if (!confirmed) return;
    console.log('Re-admission data being sent:', {
      StudentId: selectedStudent.value.Id, //Student Id
      ClassId: newClassId.value,
      SectionId: newSectionId.value || 0,
      RollNo: newRollNo.value,
      AcademicYearId: CurrentYearId.value,
      AdmissionType: admissionType.value,
      PreviousYearId: PreviousYearId.value
    });

    const response = await window.electronAPI.reAdmitStudent({
      StudentId: selectedStudent.value.Id,
      ClassId: newClassId.value,
      SectionId: newSectionId.value || 0,
      RollNo: newRollNo.value,
      AcademicYearId: CurrentYearId.value,
      AdmissionType: admissionType.value,
      PreviousYearId: PreviousYearId.value //Required to update previous record with readmission info
    });
    
    if (response.success) {
      showPromotionModal.value = false;
      await searchStudents(); // Refresh the student list to reflect changes
      successMessage.value = 'Student readmitted successfully';
    } else {
      throw new Error(response.error || 'Failed to readmit student');
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

watch(selectedClassId, async (ClassId) => {
  if (ClassId) {
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

watch(newClassId, async (newId) => {
  if (newId) {
    await fetchNewSections();     
    noSections.value = newSections.value.length < 2;
    if (noSections.value) newSectionId.value = 0;
  } else {
    newSections.value = [];
    newSectionId.value = '';    
  }
});

</script>

<style scoped>
.student-promotion-form {
  padding: 1rem;
}

.sikul-table {
  width: 100%;
  border-collapse: collapse;
  
}

.sikul-table th, .sikul-table td {
  padding: 0.25em 0;
   text-align: left; 
}

.sikul-table th { 
  font-weight: 470;
  width: 250px;
}
.sikul-table td { 
  font-weight: 700;
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