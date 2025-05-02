<template>
  <div class="form-container wide">
    <h1 class="title has-text-centered">New Admission {{ currentYear }}</h1>
    <div v-if="message" class="notification is-primary">{{ message }}</div>

    <div class="box">
      <fieldset>
        <legend class="title is-5">Personal Information</legend>

        <div class="field">
          <label class="label">Full Name</label>
          <div class="control">
            <input class="input" type="text" v-model="form.fullName" placeholder="Full Name" required />
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">Gender</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="form.gender" required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="label">Date of Birth</label>
              <div class="control">
                <input class="input" type="date" v-model="form.dob" required />
              </div>
            </div>

            <div class="field">
              <label class="label">Contact Number</label>
              <div class="control">
                <input class="input" type="tel" v-model="form.contactNumber" maxlength="10" placeholder="Contact Number" />
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">Father's Name</label>
              <div class="control">
                <input class="input" type="text" v-model="form.fathersName" placeholder="Father's Name" required />
              </div>
            </div>

            <div class="field">
              <label class="label">Mother's Name</label>
              <div class="control">
                <input class="input" type="text" v-model="form.mothersName" placeholder="Mother's Name" required />
              </div>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">Address</label>
          <div class="control">
            <input class="input" v-model="form.address" placeholder="Address"></input>
          </div>
        </div>
      </fieldset>
    </div>

    <div class="box">
      <fieldset>
        <legend class="title is-5">Unique ID</legend>
        <div class="field is-horizontal">
          <div class="field-body">
             
            <div class="field">
              <label class="label">APAR</label>
              <div class="control">
                <input class="input" type="text" v-model="form.apar" maxlength="12" placeholder="APAR" />
              </div>
            </div>
            <div class="field">
              <label class="label">Aadhaar Number</label>
              <div class="control">
                <input class="input" type="text" v-model="form.aadhaar" maxlength="12" placeholder="Aadhaar Number" />
              </div>
            </div>
            <div class="field">
              <label class="label">PEN</label>
              <div class="control">
                <input class="input" type="text" v-model="form.pen" maxlength="12" placeholder="PEN" />
              </div>
            </div>
          </div>
        </div>
      </fieldset>
    </div>

    <div class="box">
      <fieldset>
        <legend class="title is-5">Additional Information</legend>

        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">Caste</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="form.caste">
                    <option value="">Select Caste</option>
                    <option value="General">General</option>
                    <option value="SC/ST">SC/ST</option>
                    <option value="OBC">OBC</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="label">Religion</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="form.religion">
                    <option value="">Select Religion</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Muslim">Muslim</option>
                    <option value="Sikh">Sikh</option>
                    <option value="Christianity">Christianity</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">Height (in cm)</label>
              <div class="control">
                <input class="input" type="number" v-model="form.height" placeholder="Height in cm" />
              </div>
            </div>

            <div class="field">
              <label class="label">Weight (in kg)</label>
              <div class="control">
                <input class="input" type="number" v-model="form.weight" placeholder="Weight in kg" />
              </div>
            </div>

            <div class="field">
              <label class="label">Blood Group</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="form.bloodGroup">
                    <option value="" disabled>Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </fieldset>
    </div>

    <div class="box">
      <fieldset>
        <legend class="title is-5">Admitted To</legend>
        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label class="label">Class</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="form.className" @change="updateSectionOptions">
                    <option disabled value="">Select Class</option>
                    <option v-for="cls in classes" 
                    :key="cls.id" 
                    :value="cls.ClassName">
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
                  <select v-model="form.section" :disabled="!form.className">
                    <option disabled value="">Select Section</option>
                    <option v-for="sec in sectionOptions" :key="sec.SectionName" :value="sec.sectionName">{{ sec.SectionName }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="field">
              <label class="label">Assign Roll No</label>
              <div class="control">
                <input class="input" type="text" v-model="form.rollNo" placeholder="Roll No" />
              </div>
            </div>
          </div>
        </div>
      </fieldset>
    </div>

    <div class="box">
      <div class="field is-grouped mt-4">
        <div class="control">
          <button class="button is-primary " @click="handleSubmit">Submit</button>
        </div>
        <div class="control">
            <button type="reset" class="button is-light" @click="showAddForm = false">Cancel</button>
         
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAcademicYear } from '../../composables/useAcademicYear';

const { currentYear } = useAcademicYear()

const classes = ref<Class[]>([]);
const errorMessage = ref('');

async function fetchClasses() {
  try {
    const response = await window.electronAPI.getClasses();
    if (response.success) {
      classes.value = response.classes;
    } else {
      errorMessage.value = response.message || 'Failed to fetch classes.';
    }
  } catch (err: any) {
    errorMessage.value = err.message;
  }
}

interface Class {
  id: number;
  ClassName: string;
}

interface Section {
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
  className: string;
  section: string;
}

const router = useRouter();
const message = ref('');
const sectionOptions = ref<Section[]>([]);

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
  className: '',
  section: '',
});

const handleSubmit = async () => {
  try {
    if (
      !form.fullName ||
      !form.gender ||
      !form.dob ||
      !form.fathersName ||
      !form.mothersName ||
      !form.className ||
      !form.section
    ) {
      message.value = 'Please fill in all required fields.';
      return;
    }
    if (form.contactNumber && form.contactNumber.length !== 10) {
      message.value = "Contact number must be 10 digits long.";
      return;
    }

    const result = await window.electronAPI.insertStudentAndAdmission(form);

    if (result && result.success) {
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
        className: '',
        section: '',
      });
      router.push('/students');
    } else {
      message.value = result?.message || 'Failed to add student and admission information.';
    }
  } catch (error: any) {
    message.value = error.message || 'An unexpected error occurred.';
  }
};

const updateSectionOptions = async () => {
  if (!form.className) {
    sectionOptions.value = [];
    return;
  }

  try {
    const response = await window.electronAPI.getSections(form.className);
    if (response.success) {
      sectionOptions.value = response.sections;
    } else {
      message.value = response.message || 'Failed to fetch sections.';
    }
  } catch (error: any) {
    message.value = error.message || 'Failed to fetch sections.';
  }
};

onMounted(() => {
  fetchClasses();
});

</script>

