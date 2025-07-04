<template>
  <div class="student-edit-form">
    <div class="columns is-multiline">
      <!-- Basic Info -->
      <div class="column is-half">
        <div class="field">
          <label class="label">Name</label>
          <div class="control">
            <input class="input" type="text" v-model="formData.Name" required />
          </div>
        </div>

        <div class="field">
          <label class="label">Gender</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="formData.Gender" required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">Date of Birth</label>
          <div class="control">
            <input class="input" type="date" v-model="formData.DOB" />
          </div>
        </div>
      </div>

      <!-- Identity -->
      <div class="column is-half">
        <div class="field">
          <label class="label">Aadhaar Number</label>
          <div class="control">
            <input class="input" type="text" v-model="formData.Aadhaar" />
          </div>
        </div>

        <div class="field">
          <label class="label">APAR</label>
          <div class="control">
            <input class="input" type="text" v-model="formData.APAR" />
          </div>
        </div>

        <div class="field">
          <label class="label">PEN</label>
          <div class="control">
            <input class="input" type="text" v-model="formData.PEN" />
          </div>
        </div>
      </div>

      <!-- Parents -->
      <div class="column is-half">
        <div class="field">
          <label class="label">Father's Name</label>
          <div class="control">
            <input class="input" type="text" v-model="formData.FathersName" />
          </div>
        </div>
      </div>

      <div class="column is-half">
        <div class="field">
          <label class="label">Mother's Name</label>
          <div class="control">
            <input class="input" type="text" v-model="formData.MothersName" />
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div class="column is-half">
        <div class="field">
          <label class="label">Contact Number</label>
          <div class="control">
            <input class="input" type="tel" v-model="formData.Contact" />
          </div>
        </div>
      </div>

      <div class="column is-full">
        <div class="field">
          <label class="label">Address</label>
          <div class="control">
            <textarea class="input" v-model="formData.Address"></textarea>
          </div>
        </div>
      </div>

      <!-- Additional -->
      <div class="column is-half">
        <div class="field">
          <label class="label">Status</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="formData.Status">
                <option value="Admitted">Admitted</option>
                <option value="Transferred">Transferred</option>
                <option value="Terminated">Terminated</option>
                <option value="Retained">Retained</option>
              </select>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">Caste</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="formData.Caste">
                <option value="General">General</option>
                <option value="SC/ST">ST/SC</option>
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
              <select v-model="formData.Religion">
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
              <select v-model="formData.BloodGroup">
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
            <input class="input" type="number" v-model.number="formData.Height" min="0" max="250" />
          </div>
        </div>
      </div>

      <div class="column is-half">
        <div class="field">
          <label class="label">Weight (kg)</label>
          <div class="control">
            <input class="input" type="number" v-model.number="formData.Weight" min="0" max="200" step="0.1" />
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

    <!-- Error -->
    <div v-if="errorMessage" class="notification is-danger mt-2" @click="errorMessage = ''">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  student: { type: Object, required: true },
  admission: { type: Object, required: true }
});

const emit = defineEmits(['save', 'cancel']);

const formData = ref({ ...props.student }); // flatten structure
const isSaving = ref(false);
const errorMessage = ref('');

watch(() => props.student, (newVal) => {
  formData.value = { ...newVal };
});

async function saveChanges() {
  isSaving.value = true;
  try {
    const response = await window.electronAPI.updateStudent(formData.value);
    if (response.success) {
      emit('save', formData.value);
    } else {
      throw new Error(response.message || 'Failed to update student');
    }
  } catch (error) {
    errorMessage.value = error.message;
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
