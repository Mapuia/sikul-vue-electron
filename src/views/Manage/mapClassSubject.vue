<template>
  <div class="form-container wide">
    <h1 class="title has-text-centered"> Class - Subject Mapping</h1>
    <div class="box">
    <form @submit.prevent="submitForm">
      <div class="columns">
        <!-- Left Column -->
        <div class="column is-half">
          <!-- Class Input -->
          <div class="field">
            <label class="label">Class Name</label>
            <div class="control">
              <input
                class="input"
                type="text"
                v-model="form.className"
                placeholder="Enter Class (e.g., I, II, III)"
                @input="form.className = form.className.toUpperCase()"
                required
              />
            </div>
          </div>

          <!-- Number of Subjects -->
          <div class="field">
            <label class="label">Number of Subjects</label>
            <div class="control">
              <input
                class="input"
                type="number"
                :value="selectedSubjects.length"
                readonly
              />
            </div>
          </div>

          <!-- Selected Subjects -->
          <div class="field">
            <label class="label">Selected Subjects</label>
            <ul v-if="selectedSubjects.length">
              <li v-for="(subject, index) in selectedSubjects" :key="index">
                {{ subject }}
              </li>
            </ul>
            <p v-else>No subjects selected</p>
          </div>
        </div>

        <!-- Right Column -->
        <div class="column is-half">
          <label class="label">Select Subjects</label>
          <div
            v-for="(subject, index) in subjectList"
            :key="index"
            class="mb-2"
          >
            <label class="checkbox">
              <input
                type="checkbox"
                :value="subject.SubjectName"
                v-model="form.subjects"
              />
              {{ subject.SubjectName }} ({{ subject.Category }})
            </label>
          </div>

          <!-- Buttons below checkbox list -->
          <div class="field is-grouped mt-4">
            <div class="control">
              <button type="submit" class="button is-primary">Submit</button>
            </div>
            <div class="control">
              <button type="button" class="button is-light" @click="resetForm">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'

const subjectList = [
  { SubjectName: 'MATHEMATICS', Category: 'Major' },
  { SubjectName: 'ENGLISH', Category: 'Major' },
  { SubjectName: 'ENGLISH - I', Category: 'Major' },
  { SubjectName: 'ENGLISH - II', Category: 'Major' },
  { SubjectName: 'LANGUAGE', Category: 'Major' },
  { SubjectName: 'SCIENCE', Category: 'Major' },
  { SubjectName: 'SOCIAL SCIENCE', Category: 'Major' },
  { SubjectName: 'EVS', Category: 'Minor' },
  { SubjectName: 'GENERAL KNOWLEDGE', Category: 'Minor' },
  { SubjectName: 'MORAL SCIENCE', Category: 'Minor' },
  { SubjectName: 'COMPUTER', Category: 'Minor' },
  { SubjectName: 'ART EDUCATION', Category: 'Minor' },
  { SubjectName: 'CONVERSATION', Category: 'Minor' },
  { SubjectName: 'RHYMES', Category: 'Minor' }
]

const form = reactive({
  className: '',
  subjects: []
})

const selectedSubjects = computed(() => form.subjects)

const submitForm = () => {
  console.log('Form Submitted:', {
    className: form.className,
    selectedSubjects: form.subjects
  })
  // Further implementation to be added later
}

const resetForm = () => {
  form.className = ''
  form.subjects = []
}
</script>

<style scoped>
ul {
  list-style: disc;
  margin-left: 1.5rem;
}
</style>
