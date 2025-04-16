<template>
    <div class="form-container single">
      <h1 class="title has-text-centered">Class - Master Entry</h1>
  
      <div class="box">
        <form @submit.prevent="submitForm" @reset="resetForm">
          <div class="field">
            <label class="label">Class Name</label>
            <div class="control">
              <input
                class="input"
                type="text"
                v-model="className"
                placeholder="e.g. Class I, Class II, KG, etc."
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
  
  const className = ref('')
  const successMessage = ref('')
  const errorMessage = ref('')
  
  function submitForm() {
    if (!className.value.trim()) {
      errorMessage.value = 'Class Name is required.'
      successMessage.value = ''
      return
    }
  
    // Placeholder: Replace with DB insert logic or IPC call
    console.log('Submitted Class Name:', className.value)
  
    successMessage.value = 'Class created successfully.'
    errorMessage.value = ''
    resetForm()
  }
  
  function resetForm() {
    className.value = ''
    successMessage.value = ''
    errorMessage.value = ''
  }
  </script>
  