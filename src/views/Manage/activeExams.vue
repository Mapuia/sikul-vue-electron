<template>
  <div class="form-container full">
    <h1 class="title has-text-centered is-4">Available Exams for Academic Year: {{ CurrentYear }}</h1>
    

    <div class="buttons mt-4">
      <button class="button is-primary" @click="prepareNewExam" :disabled="loading">
        <span class="fas fa-plus pr-3"></span> New Exam
      </button>
      <button class="button is-info" @click="fetchData" :disabled="loading">
        <span class="fas fa-sync pr-3"></span> Refresh
      </button>
    </div>

    <!-- Notifications -->
   
    <div v-if="successMessage" class="notification is-success fixed-notification" @click="successMessage = ''">
      <button class="delete" @click="successMessage = ''"></button>
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="notification is-danger fixed-notification" @click="errorMessage = ''">
      <button class="delete" @click="errorMessage = ''"></button>
      {{ errorMessage }}
    </div>


    <!-- Active Exams Table -->
    <div class="box mt-4">
      <div v-if="loading" class="notification is-info is-light has-text-centered">
        <span class="loader"></span> Loading...
      </div>
      <div v-else-if="activeExams.length > 0">
        <table class="table is-fullwidth is-striped">
          <thead>
            <tr>
              <th>Active Exam ID</th>
              <th>Exam Name</th>
              <th>Type</th>
              <th>Major Marks</th>
              <th>Minor Marks</th>
              <th>Passing %</th>
              <th>Published?</th>
              <th>Publish Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody class="has-text-centered">
            <tr v-for="exam in activeExams" :key="exam.Id">
              <td>{{ exam.Id }}</td>
              <td class="has-text-left">{{ exam.ExamName }}</td>
              <td>{{ exam.ExamType }}</td>
              
              <!-- MajorMaxMark -->
              <td v-if="editingId !== exam.Id">{{ exam.MajorMaxMark }}</td>
              <td v-else>
                <input class="input is-small" type="number" v-model.number="editForm.MajorMaxMark" min="0" step="1" required>
              </td>
              
              <!-- MinorMaxMark -->
              <td v-if="editingId !== exam.Id">{{ exam.MinorMaxMark }}</td>
              <td v-else>
                <input class="input is-small" type="number" v-model.number="editForm.MinorMaxMark" min="0" step="1" required>
              </td>
              
              <!-- PassingPercentage -->
              <td v-if="editingId !== exam.Id">{{ exam.PassingPercentage }}%</td>
              <td v-else>
                <input class="input is-small" type="number" v-model.number="editForm.PassingPercentage" min="0" max="100" step="1" required>
              </td>
                          
              
              <!-- Result_Published -->
              <td>
                
                  {{ exam.ExamType === 'periodic'? 'No Result' :exam.Result_Published ? 'Yes' : 'No' }}
            
              </td>
              <td>               
                  {{ exam.PublishDate  }}               
              </td>
              
              <!-- Actions -->
              <td>
                <div class="buttons">
                  <template v-if="editingId !== exam.Id">
                    <button class="button is-small is-info no-padding" @click="startEditing(exam)" title="Edit">
                      <span class="fas fa-edit"></span>
                    </button>
                    
                  </template>
                  <template v-else>
                    <button class="button is-small is-success no-padding" @click="saveEdit" :disabled="saving">
                      <span class="fas fa-check"></span>
                    </button>
                    <button class="button is-small is-warning no-padding" @click="cancelEdit" :disabled="saving">
                      <span class="fas fa-times"></span>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="notification is-warning">
        No active exams configured for this academic year.
      </div>
    </div>

    <!-- New Exam Modal -->
    <div class="modal" :class="{ 'is-active': showNewExamModal }">
      <div class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Create New Exam</p>
          <button class="delete" aria-label="close" @click="showNewExamModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">Exam</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="newExam.ExamId" required>
                  <option value="" disabled>Select Exam</option>
                  <option v-for="exam in availableExams" :key="exam.Id" :value="exam.Id">
                    {{ exam.ExamName }} ({{ exam.ExamType }})
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="columns">
            <div class="column">
              <div class="field">
                <label class="label">Major Max Mark</label>
                <div class="control">
                  <input class="input" type="number" v-model.number="newExam.MajorMaxMark" min="0" required>
                </div>
              </div>
            </div>
            <div class="column">
              <div class="field">
                <label class="label">Minor Max Mark</label>
                <div class="control">
                  <input class="input" type="number" v-model.number="newExam.MinorMaxMark" min="0" required>
                </div>
              </div>
            </div>
            <div class="column">
              <div class="field">
                <label class="label">Passing Percentage</label>
                <div class="control">
                  <input class="input" type="number" v-model.number="newExam.PassingPercentage" min="0" max="100" required>
                </div>
              </div>
            </div>
          </div>
          
          
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary mr-3" @click="createNewExam" :disabled="saving">
            <span v-if="saving" class="fas fa-spinner fa-spin"></span>
            Save
          </button>
          <button class="button " @click="showNewExamModal = false">Cancel</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAcademicYear } from '../../composables/useAcademicYear';
const { CurrentYearId, CurrentYear, loadAcademicYear } = useAcademicYear();

// Data
const activeExams = ref([]);
const availableExams = ref([]);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const showNewExamModal = ref(false);
const editingId = ref(null);

// Forms
const newExam = ref({
  ExamId: '',
  MajorMaxMark: 20,
  MinorMaxMark: 10,
  PassingPercentage: 40,
  IsActive: true
});

const editForm = ref({
  MajorMaxMark: 0,
  MinorMaxMark: 0,
  PassingPercentage: 40
});

// Methods
async function fetchData() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const [activeExamsRes, examsRes] = await Promise.all([
      window.electronAPI.getActiveExams(CurrentYearId.value),
      window.electronAPI.getExams()
    ]);
    //console.log("Year ID for fetching ActiveExams:",CurrentYearId.value)
    if (activeExamsRes.success && examsRes.success) {
      activeExams.value = activeExamsRes.exams
      availableExams.value = examsRes.exams
    } else {
      errorMessage.value = activeExamsRes.message || examsRes.message || 'Failed to load data';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function prepareNewExam() {
  await fetchData();
  newExam.value = {
    ExamId: '',
    ExamName: '',
    MajorMaxMark: '',
    MinorMaxMark: '',
    PassingPercentage: 40,
    IsActive: true
  };
  showNewExamModal.value = true;
}

async function deactivateCurrentExams() {
  try {
    const response = await window.electronAPI.deactivateAllActiveExams(CurrentYearId.value);
    if (!response.success) {
      throw new Error(response.message || 'Failed to deactivate current exams');
    }
  } catch (err) {
    throw err;
  }
}

async function createNewExam() {
  if (!newExam.value.ExamId) {
    errorMessage.value = 'Please select an exam';
    return;
  }

  saving.value = true;
  try {
    // Deactivate current exams if new one is being set as active
    if (newExam.value.IsActive) {
      await deactivateCurrentExams();
    }

    const response = await window.electronAPI.insertActiveExam({
      AcademicYearId: CurrentYearId.value,
      ExamId: newExam.value.ExamId,
      MajorMaxMark: newExam.value.MajorMaxMark,
      MinorMaxMark: newExam.value.MinorMaxMark,
      PassingPercentage: newExam.value.PassingPercentage,
      IsActive: newExam.value.IsActive ? 1 : 0,
      Result_Published: 0
    });

    if (response.success) {
      successMessage.value = 'Active Exam created successfully!';
      showNewExamModal.value = false;
      await fetchData();
    } else {
      errorMessage.value = response.message || 'Failed to create exam';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    saving.value = false;
  }
}

function startEditing(exam) {
  editingId.value = exam.Id;
  editForm.value = {
    MajorMaxMark: exam.MajorMaxMark,
    MinorMaxMark: exam.MinorMaxMark,
    PassingPercentage: exam.PassingPercentage
  };
}

function cancelEdit() {
  editingId.value = null;
}

async function saveEdit() {
  if (!editForm.value.MajorMaxMark || editForm.value.MajorMaxMark < 0) {
    errorMessage.value = 'Invalid major marks';
    return;
  }
  if (!editForm.value.MinorMaxMark || editForm.value.MinorMaxMark < 0) {
    errorMessage.value = 'Invalid minor marks';
    return;
  }
  if (!editForm.value.PassingPercentage || editForm.value.PassingPercentage < 0 || editForm.value.PassingPercentage > 100) {
    errorMessage.value = 'Invalid passing percentage';
    return;
  }

  saving.value = true;
  try {
    const response = await window.electronAPI.updateActiveExam({
      Id: editingId.value,
      MajorMaxMark: editForm.value.MajorMaxMark,
      MinorMaxMark: editForm.value.MinorMaxMark,
      PassingPercentage: editForm.value.PassingPercentage
    });

    if (response.success) {
      successMessage.value = 'Active Exam updated successfully!';
      editingId.value = null;
      await fetchData();
    } else {
      errorMessage.value = response.message || 'Failed to update exam';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(exam) {
  const confirmed = await window.electronAPI.showConfirmationDialog(
    `Are you sure you want to delete ${exam.ExamName}?`
  );
  if (!confirmed) return;

  loading.value = true;
  try {
    const response = await window.electronAPI.deleteActiveExam(exam.Id);
    if (response.success) {
      successMessage.value = 'Exam deleted successfully!';
      await fetchData();
    } else {
      errorMessage.value = response.message || 'Failed to delete exam';
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function setActiveExam(Id){
  try {
    await window.electronAPI.deactivateAllActiveExams(CurrentYearId.value);
    const response = window.electronAPI.activateExam(Id)
    //console.log('Activate:', response)
    if(response){
      await fetchData();
      successMessage.value = 'Exam activated successfully!';
    }else{
      errorMessage.value = response.message || 'Failed to activate exam';
    }
  }catch{
    errorMessage.value = err.message;
  }
}

// Lifecycle
onMounted(async () => {
  await loadAcademicYear();
  await fetchData();
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

.table td, .table th {
  vertical-align: middle;
}


.input.is-small {
  width: 80px;
}

.buttons {
  justify-content: center;
}

.modal-card {
  width: 600px;
}
</style>