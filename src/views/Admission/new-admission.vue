<template>
  <div class="form-container wide">
    <h1 class="title has-text-centered">New Admission {{ currentYear }}</h1>
    <div v-if="message" class="notification is-primary">{{ message }}</div>

    <!-- Personal Info -->
    <div class="box">
      <fieldset>
        <legend class="title is-5">Personal Information</legend>

        <div class="field">
          <label class="label">Full Name</label>
          <input class="input" type="text" v-model="form.fullName" required />
        </div>

        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">Gender</label>
              <div class="select is-fullwidth">
                <select v-model="form.gender" required>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label class="label">Date of Birth</label>
              <input class="input" type="date" v-model="form.dob" required />
            </div>
            <div class="field">
              <label class="label">Contact Number</label>
              <input class="input" type="tel" v-model="form.contactNumber" maxlength="10" />
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">Father's Name</label>
              <input class="input" type="text" v-model="form.fathersName" required />
            </div>
            <div class="field">
              <label class="label">Mother's Name</label>
              <input class="input" type="text" v-model="form.mothersName" required />
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">Address</label>
          <input class="input" v-model="form.address" />
        </div>
      </fieldset>
    </div>

    <!-- Unique ID -->
    <div class="box">
      <fieldset>
        <legend class="title is-5">Unique ID</legend>
        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">APAR</label>
              <input class="input" v-model="form.apar" maxlength="12" />
            </div>
            <div class="field">
              <label class="label">Aadhaar</label>
              <input class="input" v-model="form.aadhaar" maxlength="12" />
            </div>
            <div class="field">
              <label class="label">PEN</label>
              <input class="input" v-model="form.pen" maxlength="12" />
            </div>
          </div>
        </div>
      </fieldset>
    </div>

    <!-- Additional -->
    <div class="box">
      <fieldset>
        <legend class="title is-5">Additional Information</legend>
        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">Caste</label>
              <div class="select is-fullwidth">
                <select v-model="form.caste">
                  <option value="">Select Caste</option>
                  <option value="General">General</option>
                  <option value="SC/ST">SC/ST</option>
                  <option value="OBC">OBC</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label class="label">Religion</label>
              <div class="select is-fullwidth">
                <select v-model="form.religion">
                  <option value="">Select Religion</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Christianity">Christianity</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">Height (cm)</label>
              <input class="input" type="number" v-model.number="form.height" />
            </div>
            <div class="field">
              <label class="label">Weight (kg)</label>
              <input class="input" type="number" v-model.number="form.weight" />
            </div>
            <div class="field">
              <label class="label">Blood Group</label>
              <div class="select is-fullwidth">
                <select v-model="form.bloodGroup">
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
            </div>
          </div>
        </div>
      </fieldset>
    </div>

    <!-- Admission -->
    <div class="box">
      <fieldset>
        <legend class="title is-5">Admitted To</legend>
        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">Class</label>
              <div class="select is-fullwidth">
                <select v-model.number="form.classId" @change="updateSectionOptions">
                  <option disabled value="">Select Class</option>
                  <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                    {{ cls.ClassName }}
                  </option>
                </select>
              </div>
            </div>
            <div class="field">
              <label class="label">Section</label>
                <div class="select is-fullwidth">
                  <select v-model.number="form.sectionId" :disabled="!form.classId" @change="displaysection">
                    <option disabled value="">Select Section</option>
                    <option v-for="sec in sectionOptions" :key="sec.Id" :value="sec.Id">
                      {{ sec.SectionName }}
                    </option>
                  </select>
              </div>
            </div>
  

            <div class="field">
              <label class="label">Assign Roll No</label>
              <input class="input" v-model="form.rollNo" />
            </div>
          </div>
        </div>
      </fieldset>
    </div>

    <!-- Buttons -->
    <div class="box">
      <div class="field is-grouped mt-4">
        <button class="button is-primary" @click="handleSubmit">Submit</button>
        <button class="button is-light" @click="router.push('/students')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAcademicYear } from '../../composables/useAcademicYear';

const { currentYear } = useAcademicYear();
const router = useRouter();

interface Class {
  id: number;
  ClassName: string;
}

interface Section {
  id: number;
  SectionName: string;
}

interface Form {
  fullName: string;
  gender: string;
  dob: string;
  contactNumber: string;
  fathersName: string;
  mothersName: string;
  address: string;
  apar: string;
  aadhaar: string;
  pen: string;
  rollNo: string;
  caste: string;
  religion: string;
  height: number | null;
  weight: number | null;
  bloodGroup: string;
  classId: number | null;
  sectionId: number | null;
}

const classes = ref<Class[]>([]);
const sectionOptions = ref<Section[]>([]);
const message = ref('');
const form = reactive<Form>({
  fullName: '',
  gender: '',
  dob: '',
  contactNumber: '',
  fathersName: '',
  mothersName: '',
  address: '',
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
  sectionId: null,
});

async function fetchClasses() {
  try {
    const response = await window.electronAPI.getClasses();
    if (response.success) {
      classes.value = response.classes;
    } else {
      message.value = response.message || 'Failed to fetch classes.';
    }
  } catch (err: any) {
    message.value = err.message;
  }
}

const displaysection = async () => {
  console.log('Selected SectionId:', form.sectionId);////////////////////////////////////////////
}
const updateSectionOptions = async () => {
  console.log('Selected classId:', form.classId);////////////////////////////////////////////////
  if (!form.classId) {
    sectionOptions.value = [];
    form.sectionId = null;
    return;
  }

  try {
    const response = await window.electronAPI.getSectionsByClass(form.classId);
    if (response.success) {
      sectionOptions.value = response.sections;
      form.sectionId = null;
    } else {
      message.value = response.message || 'Failed to fetch sections.';
    }
  } catch (err: any) {
    message.value = err.message;
  }
};

const handleSubmit = async () => {
  if (
    !form.fullName || !form.gender || !form.dob ||
    !form.fathersName || !form.classId || !form.sectionId
  ) {
    message.value = 'Please fill in all required fields.';
    return;
  }
  if (form.contactNumber && form.contactNumber.length !== 10) {
    message.value = 'Contact number must be 10 digits long.';
    return;
  }

  try {
    const result = await window.electronAPI.insertStudentAndAdmission(form);
    if (result.success) {
      message.value = 'Student and Admission information added successfully!';
      Object.assign(form, {
        fullName: '',
        gender: '',
        dob: '',
        contactNumber: '',
        fathersName: '',
        mothersName: '',
        address: '',
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
        sectionId: null,
      });
      
    } else {
      message.value = result.message || 'Failed to add student.';
    }
  } catch (err: any) {
    message.value = err.message || 'An unexpected error occurred.';
  }
};

onMounted(() => {
  fetchClasses();
});
</script>
