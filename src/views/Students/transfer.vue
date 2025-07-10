<template>
  <div class="form-container single">
    <h1 class="title has-text-centered">Transfer Student</h1>
    <h2 class="subtitle has-text-centered">(Limited)</h2>

    <div class="box">
      <p>This page wil be used for recording and keeping track of Transfered and Passout Students...</p>

      <!-- Example input -->
      <div class="field mt-4">
        <label class="label">Search Student</label>
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
  window.electronAPI.showInfoDialog('This will be the upgraded feature of this Application.')
}

function reset() {
  sampleText.value = ''
  submitted.value = false
}
</script>

<style scoped>

</style>
