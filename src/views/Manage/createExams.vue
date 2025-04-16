<template>
    <div class="form-container single">
      <h1 class="title has-text-centered">
        Create Exam<span class="tag is-info is-light ml-2">{{ form.academicYear }}</span>
        </h1>
        <p>Created Exams for current Year will appear here.</p>
        <p>"After Result has been declared, then only create Exam"</p>
  
      <div class="box">
        <form @submit.prevent="submitForm" @reset="resetForm">
          <div class="field">
            <label class="label">Name of Exam</label>
            <div class="control">
              <input
                class="input"
                type="text"
                v-model="form.name"
                required
                placeholder="e.g. Half Yearly, Annual"
              />
            </div>
          </div>
  
          <div class="field">
            <label class="label">Major Max Marks</label>
            <div class="control">
              <input
                class="input"
                type="number"
                v-model.number="form.majorMax"
                required
                min="1"
              />
            </div>
          </div>
  
          <div class="field">
            <label class="label">Minor Max Marks</label>
            <div class="control">
              <input
                class="input"
                type="number"
                v-model.number="form.minorMax"
                required
                min="1"
              />
            </div>
          </div>
  
          <div class="field">
            <label class="label">Co-Scholastics Max Marks</label>
            <div class="control">
              <input
                class="input"
                type="number"
                v-model.number="form.coScholasticMax"
                required
                min="1"
              />
            </div>
          </div>
  
          <div class="field is-horizontal">
            <div class="field-body">
              <div class="field">
                <label class="label">Start Date</label>
                <div class="control">
                  <input
                    class="input"
                    type="date"
                    v-model="form.startDate"
                    required
                  />
                </div>
              </div>
  
              <div class="field">
                <label class="label">End Date</label>
                <div class="control">
                  <input
                    class="input"
                    type="date"
                    v-model="form.endDate"
                    required
                  />
                </div>
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
  import { ref, onMounted } from 'vue'
  
  const form = ref({
    academicYear: '',
    name: '',
    majorMax: null,
    minorMax: null,
    coScholasticMax: null,
    startDate: '',
    endDate: ''
  })
  
  const successMessage = ref('')
  const errorMessage = ref('')
  
  // Simulated fetching of academic year from main process
  onMounted(() => {
    // This should be fetched via IPC in a real app
    form.value.academicYear = '2025-26'
  })
  
  function submitForm() {
    try {
      const payload = {
        ...form.value,
        resultPublished: false // default
      }
  
      console.log('Form submitted:', payload)
  
      // Placeholder for actual IPC or API handling
  
      successMessage.value = 'Exam entry submitted successfully.'
      errorMessage.value = ''
    } catch (err) {
      successMessage.value = ''
      errorMessage.value = 'Failed to submit exam entry.'
    }
  }
  
  function resetForm() {
    form.value.name = ''
    form.value.majorMax = null
    form.value.minorMax = null
    form.value.coScholasticMax = null
    form.value.startDate = ''
    form.value.endDate = ''
    successMessage.value = ''
    errorMessage.value = ''
  }
  </script>
  