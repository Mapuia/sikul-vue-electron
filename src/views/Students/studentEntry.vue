<template>
  <div class="form-container mid">
    <h1 class="title has-text-centered is-4">New Student Entry</h1>
    <h2 class="subtitle has-text-centered mb-4">Form</h2>
    <div v-if="message" class="notification is-primary fixed-notification" @click="message = ''">{{ message }}</div>

    <!-- Personal Info -->
    <div class="box ">
      <legend class="title is-5">Personal Information</legend>
      <table class="table is-fullwidth student-entry">
        <thead>
          <tr>
            <th>Full Name*</th>
            <td>
              <input 
                ref="nameInput" 
                class="input" 
                type="text" 
                v-model="form.name" 
                required 
                @keyup.enter="focusNext('fathersName')"
                :class="{ 'is-danger': errors.name }"
              />
              <p v-if="errors.name" class="help is-danger">{{ errors.name }}</p>
            </td>
          </tr>
          <tr>
            <th>Father's Name* (Guardian)</th>
            <td>
              <input 
                ref="fathersName" 
                class="input" 
                type="text" 
                v-model="form.fathersName" 
                required 
                @keyup.enter="focusNext('mothersName')"
                :class="{ 'is-danger': errors.fathersName }"
              />
              <p v-if="errors.fathersName" class="help is-danger">{{ errors.fathersName }}</p>
            </td>
          </tr>
          <tr>
            <th>Mother's Name</th>
            <td>
              <input 
                ref="mothersName" 
                class="input" 
                type="text" 
                v-model="form.mothersName" 
                @keyup.enter="focusNext('gender')"
              />
            </td>
          </tr>
          <tr>
            <th>Gender*</th>
            <td>
              <div class="select is-fullwidth" :class="{ 'is-danger': errors.gender }">
                <select 
                  ref="gender"
                  v-model="form.gender"
                  @keyup.enter="focusNext('dob')"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>  
              <p v-if="errors.gender" class="help is-danger">{{ errors.gender }}</p>
            </td>
          </tr>  
          <tr>
            <th>Date of Birth*</th>
            <td>
              <input 
                ref="dob"
                class="input" 
                type="date" 
                v-model="form.dob" 
                @keyup.enter="focusNext('contact')"
                :class="{ 'is-danger': errors.dob }"
              />
              <p v-if="errors.dob" class="help is-danger">{{ errors.dob }}</p>
            </td>
          </tr>
          <tr>
            <th>Contact (Mb)</th>
            <td>
              <input 
                ref="contact"
                class="input" 
                type="tel" 
                v-model="form.contact" 
                maxlength="10" 
                @keyup.enter="focusNext('address')"
                :class="{ 'is-danger': errors.contact }"
              />
              <p v-if="errors.contact" class="help is-danger">{{ errors.contact }}</p>
            </td>
          </tr>
          <tr>
            <th>Address*</th>
            <td>
              <textarea 
                type="input"
                ref="address"
                class="input" 
                placeholder="H.No, Street, Village, City, District, State" 
                v-model="form.address"
                @keyup.enter="focusNext('pen')"
                :class="{ 'is-danger': errors.address }"
              ></textarea>
              <p v-if="errors.address" class="help is-danger">{{ errors.address }}</p>
            </td>
          </tr>

          <tr>
            <th>PIN</th>
            <td>
              <input 
                ref="pin"
                class="input" 
                type="text" 
                v-model="form.pin" 
                maxlength="7" 
                @keyup.enter="focusNext('religion')"
                :class="{ 'is-danger': errors.pin }"
              />
              <p v-if="errors.pin" class="help is-danger">{{ errors.pin }}</p>
            </td>
          </tr>

          <tr>
            <th>Caste</th>
            <td>
              <div class="select is-fullwidth">
                <select 
                  ref="caste"
                  v-model="form.caste"
                  @keyup.enter="focusNext('religion')"                >
                  <option value="" disabled>Select Caste</option>
                  <option >General</option>
                  <option >ST</option>
                  <option >SC</option>
                  <option value="OBC">OBC</option>
                </select>
              </div>
            </td>
          </tr>
          <tr>
            <th>Religion</th>
            <td>
              <div class="select is-fullwidth">
                <select 
                  ref="religion"
                  v-model="form.religion"
                  @keyup.enter="focusNext('height')"
                >
                  <option value="">Select Religion</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Christianity">Christianity</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </td>
          </tr>
          <tr>
            <th>Height (cm)</th>
            <td>
              <input 
                ref="height"
                class="input" 
                type="number" 
                v-model.number="form.height" 
                @keyup.enter="focusNext('weight')"
              />
            </td>
          </tr>
          <tr>
            <th>Weight (kg)</th>
            <td>
              <input 
                ref="weight"
                class="input" 
                type="number" 
                v-model.number="form.weight" 
                @keyup.enter="focusNext('bloodGroup')"
              />
            </td>
          </tr>
          <tr>
            <th>Blood Group</th>
            <td>
              <div class="select is-fullwidth">
                <select 
                  ref="bloodGroup"
                  v-model="form.bloodGroup"
                  @keyup.enter="focusNext('classId')"
                >
                  <option disabled value="">Select Blood Group</option>
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
        </thead>
      </table>
    </div>
      
    <!-- Unique ID -->     
    <div class="box ">
      <legend class="title is-5">Unique ID</legend>
      <table class="table is-fullwidth student-entry">
        <thead>
          <tr>
            <th>PEN</th>
            <td>
              <input 
                ref="pen"
                class="input" 
                type="text" 
                v-model="form.pen" 
                maxlength="12" 
                @keyup.enter="focusNext('apar')"
                :class="{ 'is-danger': errors.pen }"
              />
              <p v-if="errors.pen" class="help is-danger">{{ errors.pen }}</p>
            </td>
          </tr>
          <tr>
            <th>APAR</th>
            <td>
              <input 
                ref="apar"
                class="input" 
                type="text" 
                v-model="form.apar" 
                maxlength="12" 
                @keyup.enter="focusNext('aadhaar')"
              />
            </td>
          </tr>
          <tr>
            <th>Aadhaar</th>
            <td>
              <input 
                ref="aadhaar"
                class="input" 
                type="text" 
                v-model="form.aadhaar" 
                maxlength="12" 
                @keyup.enter="focusNext('caste')"
              />
            </td>
          </tr>
        </thead>
      </table>
    </div>   
    <div class="box ">
      <legend class="title is-5">Admitted To</legend>
      <table class="table is-fullwidth student-entry">
        <thead>
          <tr>
            <th>Class</th>
            <td>
              <div class="select is-fullwidth" :class="{ 'is-danger': errors.classId }">
                <select 
                  ref="classId"
                  v-model.number="form.classId" 
                  @change="updateSectionOptions"
                  @keyup.enter="focusNext('sectionId')"                  
                >
                  <option disabled value="">Select Class</option>
                  <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                    {{ cls.ClassName }}
                  </option>
                </select>
              </div>
              <p v-if="errors.classId" class="help is-danger">{{ errors.classId }}</p>
            </td>
          </tr>
          <tr>
            <th>Section</th>
            <td>
              <div v-if="sectionOptions" class="select is-fullwidth" :class="{ 'is-danger': errors.sectionId }">
                <select 
                  ref="sectionId"
                  v-model.number="form.sectionId" 
                  :disabled="!form.classId || sectionOptions.length === 0"
                  @keyup.enter="focusNext('rollNo')"
                  
                >
                  <option disabled value="0" selected>Select Section</option>
                  <option v-for="sec in sectionOptions" :key="sec.Id" :value="sec.Id">
                    {{ sec.SectionName }}
                  </option>
                </select>
              </div>
              <div v-else class="select is-fullwidth">No Section</div>
              <p v-if="errors.sectionId" class="help is-danger">{{ errors.sectionId }}</p>
            </td>
          </tr>
          <tr>
            <th>Assign Roll No</th>
            <td>
              <input 
                ref="rollNo"
                class="input" 
                v-model="form.rollNo" 
                @keyup.enter="showConfirmation"
              />
            </td>
          </tr>
          <tr>
            <th>Admission Date</th>
            <td>
              <input 
                ref="admissionDate"
                class="input" 
                v-model="form.admissionDate" 
                type="date"
              />
            
            </td>
          </tr>
        </thead>
      </table>
        
      <!-- Buttons -->
      <div class="field is-grouped mt-4">
        <button class="button is-primary" @click="showConfirmation">Submit</button>
        <button class="button is-light" @click="router.push('/dashboard')">Cancel</button>
      </div>
     
 
    </div>   

    <!--Action-->

  <!--Modal Confirm Submission-->
  <div class="modal" :class="{ 'is-active': showModal }">
    <div class="modal-background" @click="showModal = false"></div>
    <div class="modal-card" style="width: 80%; max-width: 800px;">
      <header class="modal-card-head">
        <p class="modal-card-title">Confirm Student Details</p>
        <button class="delete" aria-label="close" @click="showModal = false"></button>
      </header>
      <section class="modal-card-body">
        <!-- Personal Info -->
        <div class="box">
          <legend class="title is-5">Personal Information</legend>
          <table class="sikul-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <td>{{ form.name }}</td>
              </tr>
              <tr>
                <th>Father's Name</th>
                <td>{{ form.fathersName }}</td>
              </tr>
              <tr>
                <th>Mother's Name</th>
                <td>{{ form.mothersName }}</td>
              </tr>
              <tr>
                <th>Gender</th>
                <td>{{ form.gender }}</td>
              </tr>
              <tr>
                <th>Date of Birth</th>
                <td>{{ formatDate(form.dob) }}</td>
              </tr>
              <tr>
                <th>Contact</th>
                <td>{{ form.contact }}</td>
              </tr>
              <tr>
                <th>Address</th>
                <td>{{ form.address }}</td>
              </tr>
              <tr>
                <th>PIN</th>
                <td>{{ form.pin }}</td>
              </tr>
            </thead>
          </table>
        </div>
        
        <!-- Unique ID -->
        <div class="box">
          <legend class="title is-5 bottom-border">Unique ID</legend>
          <table class="sikul-table">
            <thead>
              <tr>
                <th>PEN</th>
                <td>{{ form.pen }}</td>
              </tr>
              <tr>
                <th>APAR</th>
                <td>{{ form.apar }}</td>
              </tr>
              <tr>
                <th>Aadhaar</th>
                <td>{{ form.aadhaar }}</td>
              </tr>
            </thead>
          </table>
        </div>

        <!-- Additional Info -->
        <div class="box">
          <legend class="title is-5">Additional Information</legend>
          <table class="sikul-table">
            <thead>
              <tr>
                <th>Caste</th>
                <td>{{ form.caste }}</td>
              </tr>
              <tr>
                <th>Religion</th>
                <td>{{ form.religion }}</td>
              </tr>
              <tr>
                <th>Height</th>
                <td>{{ form.height }} cm</td>
              </tr>
              <tr>
                <th>Weight</th>
                <td>{{ form.weight }} kg</td>
              </tr>
              <tr>
                <th>Blood Group</th>
                <td>{{ form.bloodGroup }}</td>
              </tr>
            </thead>
          </table>
        </div>

        <!-- Admission Info -->
        <div class="box">
          <legend class="title is-5">Admission Details</legend>
          <table class="sikul-table">
            <thead>
              <tr>
                <th>Class</th>
                <td>{{ getClassName(form.classId) }}</td>
              </tr>
              <tr>
                <th>Section</th>
                <td>{{ getSectionName(form.sectionId) }}</td>
              </tr>
              <tr>
                <th>Roll No</th>
                <td>{{ form.rollNo }}</td>
              </tr>
              <tr>
                <th>Academic Year</th>
                <td>{{ CurrentYear }}</td>
              </tr>
            </thead>
          </table>
        </div>
      </section>
      <footer class="modal-card-foot has-text-right">
        <button class="button is-primary mr-2" @click="confirmSubmit">Confirm</button>
        <button class="button is-light" @click="showModal = false">Cancel</button>
      </footer>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAcademicYear } from '../../composables/useAcademicYear';

const { CurrentYearId, CurrentYear, loadAcademicYear } = useAcademicYear()
const router = useRouter();
const currentDate = ref('')
const message = ref('');
const classes = ref([]);
const sectionOptions = ref([]);

// Refs for all input fields
const nameInput = ref(null);
const fathersName = ref(null);
const mothersName = ref(null);
const gender = ref(null);
const dob = ref(null);
const contact = ref(null);
const address = ref(null);
const pin = ref(null);
const pen = ref(null);
const apar = ref(null);
const aadhaar = ref(null);
const caste = ref(null);
const religion = ref(null);
const height = ref(null);
const weight = ref(null);
const bloodGroup = ref(null);
const classId = ref(null);
const sectionId = ref(0);
const rollNo = ref(null);

const errors = reactive({
  name: '',
  fathersName: '',
  gender: '',
  dob: '',
  contact: '',
  address: '',
  pin: '',
  classId: '',
  sectionId: 0
});

const form = reactive({
  name: '',
  gender: '',
  dob: '',
  contact: '',
  fathersName: '',
  mothersName: '',
  address: '',
  pin: '',
  apar: '',
  aadhaar: '',
  pen: '',
  rollNo: '',
  caste: '',
  religion: '',
  height: null,
  weight: null,
  bloodGroup: '',
  classId: null,
  sectionId: 0,
  academicYearId: CurrentYearId.value,
  admissionType: 'New',
  admissionDate: currentDate.value
});

function validateForm() {
  let isValid = true;
  
  // Reset errors
  Object.keys(errors).forEach(key => errors[key] = '');
  
  // Validate required fields
  if (!form.name.trim()) {
    errors.name = 'Full name is required';
    isValid = false;
  }
  
  if (!form.fathersName.trim()) {
    errors.fathersName = "Father's name is required";
    isValid = false;
  }
  
  if (!form.gender) {
    errors.gender = 'Gender is required';
    isValid = false;
  }
  
  if (!form.dob) {
    errors.dob = 'Date of birth is required';
    isValid = false;
  } else {
    // Validate date is not in the future
    const dobDate = new Date(form.dob);
    const today = new Date();
    if (dobDate > today) {
      errors.dob = 'Date of birth cannot be in the future';
      isValid = false;
    }
  }
  
  if (form.contact && !/^\d{10}$/.test(form.contact)) {
    errors.contact = 'Contact must be 10 digits';
    isValid = false;
  }
  
  if (!form.address.trim()) {
    errors.address = 'Address is required';
    isValid = false;
  }

  if (!form.classId) {
    errors.classId = 'Class is required';
    isValid = false;
  }
  
  if (!form.sectionId) {
    const isSection =  window.electronAPI.getSectionsByClassId(form.classId)
    if(!isSection.success) {
      isValid = true;
      form.sectionId = 0;
    }else{
    errors.sectionId = 'Section is required';
    isValid = false;
    }
  }
  
  return isValid;
}

//////////////////////////////////////////////////////////////////////////Modal Block
const showModal = ref(false);

function showConfirmation() {
  if (!validateForm()) {
    return;
  }
  showModal.value = true;
}

function confirmSubmit() {
  showModal.value = false;
  handleSubmit(); // Call your existing submit function
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN'); // Format for Indian date
}

function getClassName(classId) {
  if (!classId) return '';
  const cls = classes.value.find(c => c.Id === classId);
  return cls ? cls.ClassName : '';
}

function getSectionName(sectionId) {
  if (!sectionId) return '';
  const sec = sectionOptions.value.find(s => s.Id === sectionId);
  return sec ? sec.SectionName : '';
}

function focusNext(fieldName) {
  const fieldRefs = {
    name: nameInput,
    fathersName: fathersName,
    mothersName: mothersName,
    gender: gender,
    dob: dob,
    contact: contact,
    address: address,
    pin: pin,
    pen: pen,
    apar: apar,
    aadhaar: aadhaar,
    caste: caste,
    religion: religion,
    height: height,
    weight: weight,
    bloodGroup: bloodGroup,
    classId: classId,
    sectionId: sectionId,
    rollNo: rollNo
  };
  
  if (fieldRefs[fieldName]) {
    nextTick(() => {
      if (fieldRefs[fieldName].value) {
        if (fieldRefs[fieldName].value.$el) {
          // For select elements wrapped in components
          fieldRefs[fieldName].value.$el.focus();
        } else {
          // For regular input elements
          fieldRefs[fieldName].value.focus();
        }
      }
    });
  }
}

async function fetchClasses() {
  const response = await window.electronAPI.getClasses();
  if (response.success) {
    classes.value = response.classes;
  } else {
    message.value = response.message || 'Failed to fetch classes.';
  }
}

async function updateSectionOptions() {
  if (!form.classId) {
    sectionOptions.value = [];
    return;
  }
  const response = await window.electronAPI.getSectionsByClassId(form.classId);
  if (response.success) {
    sectionOptions.value = response.sections;
    //console.log('Sections for class', form.classId, ':', sectionOptions.value);
  } else {
    message.value = response.message || 'Failed to fetch sections.';
  }
}

async function handleSubmit() {
  if (!validateForm()) {
    // Focus on the first error field
    const firstErrorField = Object.keys(errors).find(key => errors[key]);
    if (firstErrorField) {
      focusNext(firstErrorField);
    }
    return;
  }

  //console.log('Submitting form', form);

  try {
    const cleanForm = {
      ...form,
      aadhaar: form.aadhaar === '' ? null : form.aadhaar,
      apar: form.apar === '' ? null : form.apar,
      pen: form.pen === '' ? null : form.pen
    };
    const plainForm = JSON.parse(JSON.stringify(cleanForm));
    //console.log('Sanitized Form:', plainForm);

    const response = await window.electronAPI.insertStudentAndAdmission(plainForm);
    //console.log('Response:', response);

    if (response.success) {
      router.push({
        path: '/admission/success',
        query: {
          admissionId: response.admissionId,
          studentName: form.name,
          className: classes.value.find(c => c.Id === form.classId)?.ClassName || '',
          sectionName: sectionOptions.value.find(s => s.Id === form.sectionId)?.SectionName || '',
          rollNo: form.rollNo,
          academicYear: CurrentYear.value
        }
      });
    } else {
      message.value = response.message || 'Failed to admit student.';
    }
  } catch (err) {
    console.error('Submission error:', err);
    message.value = err.message || 'Unexpected error.';
  }
}

onMounted(async() => {
  await loadAcademicYear();
  
  form.academicYearId = CurrentYearId.value;
  fetchClasses();
  const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      currentDate.value = formattedDate;
      form.admissionDate = formattedDate
  // Focus on name input when page loads
  nextTick(() => {
    if (nameInput.value) {
      nameInput.value.focus();
    }
  });
});
</script>

<style scoped>
.table{
  border: 1px solid #565555;
}
.table th{
  width: 300px;
}

</style>