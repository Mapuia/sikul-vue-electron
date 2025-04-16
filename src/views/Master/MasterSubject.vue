<template>
  <div class="form-container single">
    <h1 class="title has-text-centered">Subject - Master Entry</h1>

    <div class="box">
      <form @submit.prevent="submitForm" @reset="resetForm">
        <div class="field">
          <label class="label">Subject Name</label>
          <div class="control">
            <input
              class="input"
              type="text"
              v-model="form.subjectName"
              required
              placeholder="Enter subject name"
            />
          </div>
        </div>

        <div class="field">
          <label class="label">Category</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="form.category" required>
                <option disabled value="">-- Select Category --</option>
                <option>Major</option>
                <option>Minor</option>
                <option>CoScholastic</option>
              </select>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">Mandatory (Simple Pass turin Pass ngei ngei a ngai em?)</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="form.mandatory">
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          </div>
        </div>

        <div class="field is-grouped mt-4">
          <div class="control">
            <button type="submit" class="button is-primary">Submit</button>
          </div>
          <div class="control">
            <button type="reset" class="button is-light">Reset</button>
          </div>
        </div>

        <div v-if="successMessage" class="notification is-success mt-4">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="notification is-danger mt-4">
          {{ errorMessage }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const form = ref({
  subjectName: '',
  category: '',
  mandatory: 'No' // default value
})

const successMessage = ref('')
const errorMessage = ref('')

function submitForm() {
  try {
    const payload = { ...form.value }

    console.log('Form submitted:', payload)

    // Placeholder for actual submission logic

    successMessage.value = 'Subject entry submitted successfully.'
    errorMessage.value = ''
  } catch (err) {
    successMessage.value = ''
    errorMessage.value = 'Failed to submit subject entry.'
  }
}

function resetForm() {
  form.value.subjectName = ''
  form.value.category = ''
  form.value.mandatory = 'No'
  successMessage.value = ''
  errorMessage.value = ''
}
</script>
