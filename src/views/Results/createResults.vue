<template>
    <div class="form-container wide">
      <h1 class="title has-text-centered">Publish Result</h1>
  
      <div class="box">
        <div class="field">
          <label class="label">Select Class</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="selectedClass" @change="onClassChange">
                <option disabled value="">-- Select Class --</option>
                <option v-for="cls in classes" :key="cls" :value="cls">{{ cls }}</option>
              </select>
            </div>
          </div>
        </div>
  
        <div v-if="selectedClass" class="notification is-info">
          <p><strong>Class:</strong> {{ selectedClass }}</p>
          <p><strong>No. of Students:</strong> {{ studentCount }}</p>
          <p><strong>No. of Exams Appeared:</strong> {{ examAppearedCount }}</p>
        </div>
  
        <div class="field mt-4">
          <button class="button is-primary" @click="generateResult">Generate Result</button>
        </div>
  
        <div v-if="results.length > 0" class="mt-5">
          <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
            <h2 class="subtitle is-6 has-text-weight-bold">
              Year: {{ academicYear }} | Exam: {{ examName }} | Class: {{ selectedClass }}
            </h2>
            <div>
              <button class="button is-small is-info mr-2" @click="printResult">Print</button>
              <button class="button is-small is-success" @click="downloadPDF">Download PDF</button>
            </div>
          </div>
  
          <table id="resultTable" class="table is-striped is-fullwidth">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Max Mark</th>
                <th>Mark Scored</th>
                <th>Percentage</th>
                <th>Division / Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(result, index) in results" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ result.name }}</td>
                <td>{{ result.maxMark }}</td>
                <td>{{ result.scored }}</td>
                <td>{{ result.percentage.toFixed(2) }}%</td>
                <td>{{ result.division }}</td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div v-if="successMessage" class="notification is-success mt-4">
          {{ successMessage }}
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import jsPDF from 'jspdf'
  import autoTable from 'jspdf-autotable'
  
  const academicYear = '2025-26'
  const examName = 'Annual'
  
  const classes = [
    'KG', 'I', 'II', 'III', 'IV', 'V',
    'VI', 'VII', 'VIII', 'IX', 'X'
  ]
  
  const selectedClass = ref('')
  const studentCount = ref(0)
  const examAppearedCount = ref(0)
  const results = ref([])
  const successMessage = ref('')
  
  function onClassChange() {
    studentCount.value = Math.floor(Math.random() * 40) + 10
    examAppearedCount.value = Math.floor(Math.random() * studentCount.value)
    results.value = []
    successMessage.value = ''
  }
  
  function generateResult() {
    const dummyStudents = Array.from({ length: studentCount.value }, (_, i) => {
      const max = 500
      const score = Math.floor(Math.random() * max)
      const percent = (score / max) * 100
      return {
        name: `Student ${i + 1}`,
        maxMark: max,
        scored: score,
        percentage: percent,
        division: getDivision(percent)
      }
    })
  
    dummyStudents.sort((a, b) => b.scored - a.scored)
    results.value = dummyStudents
    successMessage.value = 'Results generated and saved successfully.'
  }
  
  function getDivision(percentage) {
    if (percentage >= 75) return 'Distinction'
    if (percentage >= 60) return 'First'
    if (percentage >= 50) return 'Second'
    if (percentage >= 33) return 'Pass'
    return 'Fail'
  }
  
  function printResult() {
    window.print()
  }
  
  function downloadPDF() {
    const doc = new jsPDF()
    doc.text(`Result - ${academicYear} - ${examName} - Class ${selectedClass.value}`, 14, 16)
    autoTable(doc, {
      startY: 20,
      head: [['Rank', 'Student Name', 'Max Mark', 'Mark Scored', 'Percentage', 'Division']],
      body: results.value.map((res, i) => [
        i + 1,
        res.name,
        res.maxMark,
        res.scored,
        res.percentage.toFixed(2) + '%',
        res.division
      ])
    })
    doc.save(`Result_${academicYear}_${selectedClass.value}.pdf`)
  }
  </script>
  