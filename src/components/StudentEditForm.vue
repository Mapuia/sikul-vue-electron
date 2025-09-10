<template>
  <div class="student-edit-form">
    <h2 class="subtitile is-4">Academic Year ({{ studentData.YearName }})</h2>
    <div class="columns is-multiline">
      
      <!-- Basic Info -->
      <div class="column is-half">
        <div class="field">
          <label class="label">Name</label>
          <div class="control">
            <input class="input" type="text" v-model="studentData.Name" required />
          </div>
        </div>

        <div class="field">
          <label class="label">Gender</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="studentData.Gender" required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">Date of Birth</label>
          <div class="control">
            <input class="input" type="date" v-model="studentData.DOB" />
          </div>
        </div>
      </div>

      <!-- Identity -->
      <div class="column is-half">
        <div class="field">
          <label class="label">Aadhaar Number</label>
          <div class="control">
            <input class="input" type="text" v-model="studentData.Aadhaar" />
          </div>
        </div>

        <div class="field">
          <label class="label">APAR</label>
          <div class="control">
            <input class="input" type="text" v-model="studentData.APAR" />
          </div>
        </div>

        <div class="field">
          <label class="label">PEN</label>
          <div class="control">
            <input class="input" type="text" v-model="studentData.PEN" />
          </div>
        </div>
      </div>

      <!-- Parents -->
      <div class="column is-half">
        <div class="field">
          <label class="label">Father's Name</label>
          <div class="control">
            <input class="input" type="text" v-model="studentData.FathersName" />
          </div>
        </div>
      </div>

      <div class="column is-half">
        <div class="field">
          <label class="label">Mother's Name</label>
          <div class="control">
            <input class="input" type="text" v-model="studentData.MothersName" />
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div class="column is-half">
        <div class="field">
          <label class="label">Contact Number</label>
          <div class="control">
            <input class="input" type="tel" v-model="studentData.Contact" />
          </div>
        </div>
      </div>

      <div class="column is-full">
        <div class="field">
          <label class="label">Address</label>
          <div class="control">
            <textarea class="input" v-model="studentData.Address"></textarea>
          </div>
        </div>
      </div>

      <!-- Additional -->
      <div class="column is-half">
        <div class="field">
          <label class="label">Status</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="studentData.Status">
                <option value="Admitted">Admitted</option>
                <option value="Transferred">Transferred</option>
                <option value="Terminated">Terminated</option>
                <option value="Retained">Retained</option>
              </select>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">Caste ({{ studentData.Caste }})</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="studentData.Caste">
                <option>General</option>
                <option value="ST">ST</option>
                <option value="SC">SC</option>
                <option value="OBC">OBC</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="column is-half">
        <div class="field">
          <label class="label">Religion</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="studentData.Religion">
                <option value="Christian">Christian</option>
                <option value="Hindu">Hindu</option>
                <option value="Muslim">Muslim</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">Blood Group</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="studentData.BloodGroup">
                <option value="">Select Blood Group</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option>
                <option>O+</option><option>O-</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Physical -->
      <div class="column is-half">
        <div class="field">
          <label class="label">Height (cm)</label>
          <div class="control">
            <input class="input" type="number" v-model.number="studentData.Height" min="0" max="250" />
          </div>
        </div>
      </div>

      <div class="column is-half">
        <div class="field">
          <label class="label">Weight (kg)</label>
          <div class="control">
            <input class="input" type="number" v-model.number="studentData.Weight" min="0" max="200" step="0.1" />
          </div>
        </div>
      </div>
    </div>

    <!--Admission Details-->
    <div class="columns is-multiline">
      <div class="column is-half">                
        <div class="field">
          <label class="label">Class</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="studentData.ClassId">
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
              <select v-model="studentData.SectionId">
                <option disabled value="">-- Select Section --</option>
                <option v-for="sec in sections" :key="sec.Id" :value="sec.Id">
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
            <input class="input" type="number" v-model="studentData.RollNo" placeholder="Enter new roll number" />
          </div>
        </div>
        <div class="field">
          <label class="label">Admission Type ({{ studentData.AdmissionType }})</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="studentData.AdmissionType" required>
                  <option disabled selected>-- Select Admission Type --</option>                   
                  <option>New</option> 
                  <option>Promoted</option> 
                  <option>Repeat</option>
                  </select>
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- Actions -->
    <div class="field is-grouped is-grouped-right">
      <div class="control">
        <button class="button is-primary" @click="saveChanges" :disabled="isSaving">
          <span v-if="isSaving" class="icon is-small"><i class="fas fa-spinner fa-spin"></i></span>
          <span>Save Changes</span>
        </button>
      </div>
      <div class="control">
        <button class="button is-light" @click="$emit('cancel')">Cancel</button>
      </div>
    </div>

    
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';


const props = defineProps({
  student: { type: Object, required: true },
  admission: { type: Object, required: true }
});

const emit = defineEmits(['save', 'cancel']);

// Initialize studentData with both student and admission data
const studentData = ref({ 
  ...props.student,
  ...props.admission 
});

const classes = ref([]); // Stores filtered classes (>= current class)
const sections = ref([]);
const isSaving = ref(false);
const errorMessage = ref('');
const selectedClassId = ref('')
const selectedSectionId = ref('')

// Load upper classes on component mount
onMounted(async () => {
  await loadUpperClasses();
  await fetchSections();
});

// Fetch classes >= current class (e.g., "KG-II" → ["KG-II", "Class I", ...])
async function loadUpperClasses() {
  if (!studentData.value.ClassName) return;
  
  const res = await window.electronAPI.fetchUpperClasses(studentData.value.ClassName);
  if (res.success) {
    classes.value = res.classes;
  } else {
    errorMessage.value = res.error || "Failed to load classes";
  }
}

watch(selectedClassId, async (classId) =>{
    if (!classId) {
    selectedSectionId.value=''   
    return
  }  
  const secResult = await window.electronAPI.getSectionsByClassId(classId) 
  if (secResult.success) {
    sections.value = secResult.sections  
  }
  if (sections.value.length === 0){
    selectedSectionId.value = 0
    
    }        
   
})

// Fetch sections when class changes
async function fetchSections() {
  if (!studentData.value.ClassId) return;
  const res = await window.electronAPI.getSectionsByClassId(studentData.value.ClassId);
  if (res.success) sections.value = res.sections;
}

// Update studentData when props change
watch(() => props.student, (newVal) => {
  studentData.value = { ...studentData.value, ...newVal };
}, { immediate: true });

watch(() => props.admission, (newVal) => {
  studentData.value = { ...studentData.value, ...newVal };
}, { immediate: true });

// Watch for ClassId changes to load sections
watch(() => studentData.value.ClassId, fetchSections);

async function saveChanges() {
  isSaving.value = true;
  errorMessage.value = ''; // Clear previous errors
  const data = { ...studentData.value }
  try {
    const confirmed = await window.electronAPI.showConfirmationDialog(`
    Are you sure you want to update this student? This will replace the existing Record.
    `);
    if (!confirmed) return;

    const response = await window.electronAPI.updateStudent(data);
    
    if (response.success) {
      // Emit both the success status and the message
      emit('save', { 
        success: true,
        data: studentData.value,
        message: response.message || 'Student updated successfully'
      });
    } else {
      errorMessage.value = response.message || 'Failed to update student';
      // Emit the error to parent if needed
      emit('save', { 
        success: false,
        message: response.message 
      });
    }
  } catch (error) {
    errorMessage.value = error.message || 'An unexpected error occurred';
    emit('save', { 
      success: false,
      message: error.message 
    });
  } finally {
    isSaving.value = false;
  }
}


</script>

<style scoped>
.student-edit-form {
  padding: 1rem;
}
</style>
