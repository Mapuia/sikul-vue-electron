<template>
    <div class="form-container single">
      <h1 class="title has-text-centered">Section - Master Entry</h1>
  
      <div class="box">
        <form @submit.prevent="submitForm" @reset="resetForm">
          <div class="field">
            <label class="label">Section Name</label>
            <div class="control">
              <input
                class="input"
                type="text"
                v-model="sectionName"
                placeholder="e.g. A, B, C, etc."
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
  
  const sectionName = ref('')
  const successMessage = ref('')
  const errorMessage = ref('')
  
  function submitForm() {
    if (!sectionName.value.trim()) {
      errorMessage.value = 'Section Name is required.'
      successMessage.value = ''
      return
    }
  
    // Placeholder: Replace with DB insert logic or IPC call
    console.log('Submitted Section Name:', sectionName.value)
  
    successMessage.value = 'Section created successfully.'
    errorMessage.value = ''
    resetForm()
  }
  
  function resetForm() {
    sectionName.value = ''
    successMessage.value = ''
    errorMessage.value = ''
  }
  </script>
  