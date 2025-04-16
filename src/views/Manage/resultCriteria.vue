<template>
    <div class="form-container wide">
      <h1 class="title has-text-centered">Set Result Criteria</h1>
  
      <div class="box">
        <ul>
            <li>Pass Mark Percentage</li>
            <li>Division Percentage</li>
            <li>Grade Percentage</li>
            <li>How to consider Simple pass</li>
            <li>Which Subject is Mandatory to Pass</li>
        </ul>
      
  
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
  