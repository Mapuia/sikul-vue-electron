<template>
  <div class="student-edit">

    <!-- Academic Year Header -->
    <div class="box">
      <h3 class="title is-5">
        Academic Year ({{ studentData.YearName }})
      </h3>
    </div>

    <!-- ============================= -->
    <!-- 🔒 STUDENT INFORMATION (READ ONLY) -->
    <!-- ============================= -->

    <div class="box">      
      <table class="table is-fullwidth">
        <tbody>

          <tr>
            <th>Registration Number</th>
            <td>{{ studentData.RegistrationNumber || '-' }}</td>
          </tr>
          <tr>
            <th>Name</th>
            <td>{{ studentData.Name || '-' }}</td>
          </tr>

          <tr>
            <th>Father's Name</th>
            <td>{{ studentData.FathersName || '-' }}</td>
          </tr>

        </tbody>
      </table>
    </div>


    <!-- ============================= -->
    <!-- ✏️ EDITABLE ADMISSION DETAILS -->
    <!-- ============================= -->

    <div class="box">
      <h3 class="title is-6">Update Admission Details</h3>
      <table class="table is-fullwidth">
        <tbody>

          <!-- Registration Number (Now First + Editable) -->
          <tr>
            <th>Registration Number</th>
            <td>
              <input class="input is-small"
                     type="text"
                     v-model="studentData.RegistrationNumber"
                     placeholder="Enter registration number" />
            </td>
          </tr>          

          <!-- Admission Date -->
          <tr>
            <th>Admission Date</th>
            <td>
              <input class="input is-small"
                     type="date"
                     v-model="studentData.Creation_at" />
            </td>
          </tr>

          <tr>
            <th>Class</th>
            <td>
              <div class="select is-small is-fullwidth">
                <select v-model="studentData.ClassId">
                  <option disabled value="">-- Select Class --</option>
                  <option v-for="cls in classes"
                          :key="cls.Id"
                          :value="cls.Id">
                    {{ cls.ClassName }}
                  </option>
                </select>
              </div>
            </td>
          </tr>

          <tr>
            <th>Section</th>
            <td>
              <div class="select is-small is-fullwidth">
                <select v-model="studentData.SectionId">
                  <option disabled value="">-- Select Section --</option>
                  <option v-for="sec in sections"
                          :key="sec.Id"
                          :value="sec.Id">
                    {{ sec.SectionName }}
                  </option>
                </select>
              </div>
            </td>
          </tr>

          <tr>
            <th>Roll Number</th>
            <td>
              <input class="input is-small"
                     type="number"
                     v-model="studentData.RollNo"
                     placeholder="Enter roll number" />
            </td>
          </tr>  

          <tr>
            <th>Admission Type</th>
            <td>
              <div class="select is-small is-fullwidth">
                <select v-model="studentData.AdmissionType">
                  <option disabled value="">-- Select Admission Type --</option>
                  <option>New</option>
                  <option>Promoted</option>
                  <option>Repeat</option>
                </select>
              </div>
            </td>
          </tr>

        </tbody>
      </table>
    </div>


    <!-- ============================= -->
    <!-- ACTION BUTTONS -->
    <!-- ============================= -->

    <div class="field is-grouped is-grouped-right">
      <div class="control">
        <button class="button is-primary is-small"
                @click="saveChanges"
                :disabled="isSaving">
          <span v-if="isSaving" class="icon is-small">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
          <span>Save Changes</span>
        </button>
      </div>

      <div class="control">
        <button class="button is-light is-small"
                @click="$emit('cancel')">
          Cancel
        </button>
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
  await getClasses();
  await fetchSections();
});

// Fetch classes >= current class (e.g., "KG-II" → ["KG-II", "Class I", ...])
async function getClasses() {
  if (!studentData.value.ClassName) return;
  
  const res = await window.electronAPI.getClasses();
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
  studentData.value.Creation_at = toYMD(studentData.value.Creation_at) // Convert to YMD for date input
}, { immediate: true });

// Watch for ClassId changes to load sections
watch(() => studentData.value.ClassId, fetchSections);

function toYMD(dateString) {
  if (!dateString) return '-';
  return dateString.split('T')[0];
}
async function saveChanges() {
  isSaving.value = true;
  errorMessage.value = ''; // Clear previous errors
  const data = { ...studentData.value }
  try {
    const confirmed = await window.electronAPI.showConfirmationDialog(`
    Are you sure you want to update this student ${studentData.value.Name}? This will replace the existing Record.
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

function formatDate(dateValue) {
  if (!dateValue) return '-'

  const date = new Date(dateValue)

  if (isNaN(date)) return '-'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}.${month}.${year}`
}
</script>

<style scoped>
.student-edit-form {
  padding: 1rem;
}

.sikul-table th {
  width: 200px;
  padding-bottom: 5px;
  font-weight: 450;
}
.sikul-table td{
  font-weight: 700;
  padding-bottom: 5px;
}

.student-edit{
  width: 70%;
  margin: 0 auto;
}
</style>
