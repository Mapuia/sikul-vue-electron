<template>
  <div class="student-details">

    <!-- Personal Information -->
    <div class="box">
      <h3 class="title is-5">Update Personal Information</h3>
      <table class="table sikul-table is-fullwidth">
        <tbody>

          <tr>
            <th>Regn. No.</th>
            <td>
              <input class="input" type="text" v-model="studentData.RegistrationNumber" />
            </td>
          </tr>

          <tr>
            <th>Name</th>
            <td>
              <input class="input " type="text" v-model="studentData.Name" required />
            </td>
          </tr>

          <tr>
            <th>Gender</th>
            <td>
              <div class="select  is-fullwidth">
                <select v-model="studentData.Gender">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </td>
          </tr>

          <tr>
            <th>Date of Birth</th>
            <td>
              <input class="input " type="date" v-model="studentData.DOB" />
            </td>
          </tr>
          <tr>
            <th>First Admission Date</th>
            <td>
              <input class="input " type="date" v-model="studentData.Creation_at" />
            </td>
          </tr>

          <tr>
            <th>Father's Name</th>
            <td>
              <input class="input " type="text" v-model="studentData.FathersName" />
            </td>
          </tr>

          <tr>
            <th>Mother's Name</th>
            <td>
              <input class="input " type="text" v-model="studentData.MothersName" />
            </td>
          </tr>

          <tr>
            <th>Contact</th>
            <td>
              <input class="input " type="tel" v-model="studentData.Contact" />
            </td>
          </tr>

          <tr>
            <th>Caste</th>
            <td>
              <div class="select  is-fullwidth">
                <select v-model="studentData.Caste">
                  <option>General</option>
                  <option value="ST">ST</option>
                  <option value="SC">SC</option>
                  <option value="OBC">OBC</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </td>
          </tr>

          <tr>
            <th>Religion</th>
            <td>
              <div class="select  is-fullwidth">
                <select v-model="studentData.Religion">
                  <option value="Christian">Christian</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </td>
          </tr>

          <tr>
            <th>Blood Group</th>
            <td>
              <div class="select  is-fullwidth">
                <select v-model="studentData.BloodGroup">
                  <option value="">Select Blood Group</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                  <option>O+</option>
                  <option>O-</option>
                </select>
              </div>
            </td>
          </tr>

          <tr>
            <th>Address</th>
            <td>
              <textarea class="input " v-model="studentData.Address"></textarea>
            </td>
          </tr>

          <tr>
            <th>PIN</th>
            <td>
              <input class="input " type="number" v-model.number="studentData.PIN" min="0" max="999999" />
            </td>
          </tr>

          <tr>
            <th>Height</th>
            <td>
              <input class="input " type="number" v-model.number="studentData.Height" min="0" max="250" />
            </td>
          </tr>

          <tr>
            <th>Weight</th>
            <td>
              <input class="input " type="number" v-model.number="studentData.Weight" min="0" max="200" step="0.1" />
            </td>
          </tr>
          <tr>
            <th>Admission Status</th>
            <td>
              <input class="input " type="text" v-model.number="studentData.Status" />
            </td>
          </tr>

        </tbody>
      </table>
    </div>

    <!-- Unique ID -->
    <div class="box">
      <h3 class="title is-5">UNIQUE ID</h3>
      <table class="table sikul-table is-fullwidth">
        <tbody>
          <tr>
            <th>PEN</th>
            <td>
              <input class="input " type="text" v-model="studentData.PEN" />
            </td>
          </tr>
          <tr>
            <th>APAAR</th>
            <td>
              <input class="input " type="text" v-model="studentData.APAR" />
            </td>
          </tr>
          <tr>
            <th>Aadhaar</th>
            <td>
              <input class="input " type="text" v-model="studentData.Aadhaar" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Actions -->
    <div class="field is-grouped is-grouped-right">
      <div class="control">
        <button class="button is-primary "
                @click="saveChanges"
                :disabled="isSaving">
          <span v-if="isSaving" class="icon ">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
          <span>Save Changes</span>
        </button>
      </div>
      <div class="control">
        <button class="button is-light " @click="$emit('cancel')">
          Cancel
        </button>
      </div>
    </div>

  </div>
</template>


<script setup>
import { ref, watch, onMounted } from 'vue';


const props = defineProps({
  student: { type: Object, required: true }

});

const emit = defineEmits(['save', 'cancel']);

// Initialize studentData 
const studentData = ref({ 
  ...props.student
});

watch(() => props.student, (newVal) => {
  studentData.value = { ...studentData.value, ...newVal };
  studentData.value.Creation_at = toYMD(studentData.value.Creation_at) // Convert to YMD for date input
}, { immediate: true });

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
  studentData.value.Creation_at = toYMD(studentData.value.Creation_at)
});

function toYMD(dateString) {
  if (!dateString) return '-';
  return dateString.split('T')[0];
}

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

// Watch for ClassId changes to load sections
watch(() => studentData.value.ClassId, fetchSections);

async function saveChanges() {
  isSaving.value = true;
  errorMessage.value = ''; // Clear previous errors
  const data = { ...studentData.value }
  // console.log("Data to save:", data);
  try {
    const confirmed = await window.electronAPI.showConfirmationDialog(`
    Are you sure you want to update this student? This will replace the existing Record.
    `);
    if (!confirmed) return;

    const response = await window.electronAPI.updateStudentPersonal(data);
    
    if (response.success) {
      // Emit both the success status and the message
      emit('save', { 
        success: true,
        data: studentData.value,
        message: response.message || 'Student Personal Info updated successfully'
      });
    } else {
      errorMessage.value = response.message || 'Failed to update student Personal Info';
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
.student-details .box {
  margin-bottom: 1.5rem;
  width: 100%;
}
.student-details p {
  margin-bottom: 0.5rem;
}
.tag {
  margin-left: 0.5rem;
}

.sikul-table td {
  padding-bottom: 3px;
}
</style>
