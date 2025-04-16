<template>
    <div class="form-container single">
      <h1 class="title has-text-centered">Exam Name - Master Entry</h1>
  
      <div class="box">
        <form @submit.prevent="submitForm" @reset="resetForm">
          <div class="field">
            <label class="label">Exam Name</label>
            <div class="control">
              <input
                class="input"
                type="text"
                v-model="examName"
                placeholder="e.g. Periodic, Half Yearly, Annual"
                required
              />
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
  
  const examName = ref('')
  const successMessage = ref('')
  const errorMessage = ref('')
  
  function submitForm() {
    if (!examName.value.trim()) {
      errorMessage.value = 'Exam Name is required.'
      successMessage.value = ''
      return
    }
  
    // Placeholder for actual DB or IPC logic
    console.log('Submitted Exam Name:', examName.value)
  
    successMessage.value = 'Exam name created successfully.'
    errorMessage.value = ''
    resetForm()
  }
  
  function resetForm() {
    examName.value = ''
    successMessage.value = ''
    errorMessage.value = ''
  }
  </script>
  