<template>
    <div class="form-container wide">
      <h1 class="title has-text-centered">Marks Entry by Student-Wise.</h1>
  
      <div class="box">
        <p>This is a temporary Vue component for development/testing purposes.</p>
  
        <!-- Example input -->
        <div class="field mt-4">
          <label class="label">Sample Input</label>
          <div class="control">
            <input class="input" type="text" v-model="sampleText" placeholder="Type something..." />
          </div>
        </div>
  
        <!-- Example buttons -->
        <div class="buttons mt-4">
          <button class="button is-primary" @click="handleSubmit">Submit</button>
          <button class="button is-light" @click="reset">Reset</button>
        </div>
  
        <!-- Output display -->
        <div v-if="submitted" class="notification is-success mt-4">
          You submitted: <strong>{{ sampleText }}</strong>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const sampleText = ref('')
  const submitted = ref(false)
  
  function handleSubmit() {
    if (sampleText.value.trim()) {
      submitted.value = true
    }
  }
  
  function reset() {
    sampleText.value = ''
    submitted.value = false
  }
  </script>
  
  <style scoped>
  .container {
    max-width: 600px;
    margin: 0 auto;
  }
  </style>
  