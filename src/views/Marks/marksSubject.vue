<template>
    <div class="form-container full">
      <h1 class="title has-text-centered">Marks Entry - Half Yearly Exam</h1>
  <div class="marks-entry-container">
    <div class="vertical-tabs">
      <h1 >Subjects</h1>
      <div
        v-for="subject in subjects"
        :key="subject"
        @click="selectSubject(subject)"
        :class="['tab-item', selectedSubject === subject ? 'active' : '']"
      >
        {{ subject }}
      </div>
    </div>

    <div class="main-content">
      <div v-if="selectedSubject">
        <h2 class="title is-4">{{ selectedSubject }} - Marks Entry</h2>

        <div class="filters is-flex is-align-items-center mb-4">
          <div class="mr-4">
            <label class="label">Class</label>
            <div class="select">
              <select v-model="selectedClass">
                <option disabled value="">--Select Class--</option>
                <option v-for="cls in classes" :key="cls">{{ cls }}</option>
              </select>
            </div>
          </div>

          <div class="mr-4">
            <label class="label">Section</label>
            <div class="select">
              <select v-model="selectedSection">
                <option disabled value="">--Select Section--</option>
                <option v-for="sec in sections" :key="sec">{{ sec }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Only show student table when both class and section are selected -->
        <div v-if="selectedClass && selectedSection">
          <table class="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Mark</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td>{{ student.name }}</td>
                <td>
                  <input
                    class="input"
                    type="number"
                    min="0"
                    max="100"
                    v-model="marks[student.id]"
                    placeholder="Enter mark"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const subjects = ["English", "Math", "Science", "Social Science", "Hindi"]
const classes = ["KG", "I", "II", "III", "IV", "V"]
const sections = ["A", "B"]

const selectedSubject = ref('')
const selectedClass = ref('')
const selectedSection = ref('')
const marks = ref({})

const students = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Alice Johnson" }
]

function selectSubject(subject) {
  selectedSubject.value = subject
  selectedClass.value = ''
  selectedSection.value = ''
  marks.value = {}
}
</script>

<style scoped>

</style>
