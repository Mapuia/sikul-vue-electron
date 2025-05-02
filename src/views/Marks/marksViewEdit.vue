<template>
  <div class="form-container full">
    <h1 class="title has-text-centered">Marks Entry - Half Yearly Exam</h1>
    <hr class="thin-line" />

    <div class="marks-entry-container">
      <!-- Vertical Tabs -->
      <aside class="vertical-tabs">
        <div class="tab-heading has-text-weight-bold has-text-centered py-2 is-primary">Class</div>
        <ul>
          <li
            v-for="cls in classes"
            :key="cls"
            :class="{ 'is-active': cls === selectedClass }"
            @click="selectClass(cls)"
          >
            Class - {{ cls }}
          </li>
        </ul>
      </aside>

      <!-- Main Content -->
      <div class="main-content">
        <div v-if="selectedClass" class="mb-2">
          <h1 class="title is-4">Class: {{ selectedClass }}</h1>
        </div>  
        <!-- Section Selector -->
        <div v-if="selectedClass" class="mb-4 is-flex is-align-items-center">
          <label class="label mr-2">Section:</label>
          <div class="buttons">
            <label class="button is-small" v-for="sec in sections" :key="sec">
              <input class="is-horizontal" type="radio" name="section" v-model="selectedSection" :value="sec" /> &nbsp;{{ sec }}
            </label>
          </div>
        </div>

        <!-- Students + Marks Entry Table -->
        <div v-if="selectedSection">
          <div class="table-container-scroll">
            <table class="table is-bordered is-striped is-fullwidth marks-entry-table">
              <thead>
                <tr>
                  <th style="background-color: #201f1f; " class="sticky-col left-col">Roll No.</th>
                  <th style="background-color: #201f1f; ;" class="sticky-col">Student Name</th>
                  <th v-for="subject in subjects" :key="subject">{{ subject }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(student, sIndex) in students" :key="student.id">
                  <td style="background-color: #201f1f; text-align:end;" class="sticky-col left-col">{{ sIndex + 1 }}</td>
                  <td style="background-color: #201f1f;" class="sticky-col">{{ student.name }}</td>
                  <td v-for="(subject, subIndex) in subjects" :key="subIndex">
                    <input
                      class="input is-small"
                      type="number"
                      min="0"
                      max="100"
                      v-model.number="marks[sIndex][subject]"
                      :ref="el => setInputRef(sIndex, subject, el)"
                      @keydown.enter.prevent="focusNext(sIndex, subject)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          <!-- Submit Button -->
          <div class="field is-grouped mt-4">
            <div class="control">
              <button class="button is-primary" @click="submitMarks">Submit Marks</button>
            </div>
          </div>

          <!-- Messages -->
          <div v-if="successMessage" class="notification is-success mt-4">
            {{ successMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, watch } from 'vue'

const inputRefs = ref({})

function setInputRef(row, subject, el) {
  if (!inputRefs.value[subject]) {
    inputRefs.value[subject] = []
  }
  inputRefs.value[subject][row] = el
}

function focusNext(currentRow, subject) {
  const subjectRefs = inputRefs.value[subject]
  if (subjectRefs && subjectRefs[currentRow + 1]) {
    subjectRefs[currentRow + 1].focus()
  }
}


const classes = [
  'KG - I', 'KG - II', 'I', 'II', 'III', 'IV', 'V',
  'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
]
const sections = ['A', 'B', 'C']
const subjects = ['English', 
    'Math', 
    'Science',
    'Social Science',
    'EVS',
    'Language',
    'Social Science',
    'EVS',
    'Language',
    'Social Science',
    'EVS',
    'Language',
    'Social Science',
    'EVS',
    'Language',
    'Social Science',
    'EVS',
    'Language',
    'English - I',
    'English - II'
    
  ]

const selectedClass = ref('')
const selectedSection = ref('')
const students = ref([])
const marks = ref([])
const successMessage = ref('')

function selectClass(cls) {
  selectedClass.value = cls
  selectedSection.value = ''
  students.value = []
  marks.value = []
  successMessage.value = ''
}

// Watch for section selection and load dummy students
watch(selectedSection, () => {
  students.value = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
    { id: 3, name: 'Vanlalawmpuia' },
    { id: 3, name: 'Vanlalchhanhima' },
    { id: 3, name: 'Vanlalchhuanawma Khiangte' }
  ]

  marks.value = students.value.map(() => {
    const markEntry = {}
    subjects.forEach(sub => (markEntry[sub] = null))
    return markEntry
  })
})

function submitMarks() {
  const submitted = students.value.map((student, i) => ({
    studentId: student.id,
    studentName: student.name,
    class: selectedClass.value,
    section: selectedSection.value,
    marks: marks.value[i]
  }))

  console.log('Submitted Marks:', submitted)
  successMessage.value = 'Marks submitted successfully.'
}
</script>

<style scoped>
.marks-entry-layout {
  display: flex;
  gap: 1.5rem;
  padding-left: -2rem;
  
}

.vertical-tabs {
  width: 130px;
  border: 1px solid #ddd;
}

.tab-heading{
  color: black;
  background-color: #00d1b2;
}

.vertical-tabs ul {
  list-style-type: none;
  padding-left: 0;
}

.vertical-tabs li {
  padding: 0.5rem;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.vertical-tabs li.is-active {
  background-color: white;
  color: rgb(24, 22, 22);
  font-weight: bold;
}

.thin-line {
  border: none;
  border-top: 1px solid #3c3b3b; 
  margin-bottom: -0.5rem;
}
</style>
