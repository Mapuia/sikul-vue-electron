<template>
  <div class="form-container single">
    <h1 class="title has-text-centered">Academic Year {{ CurrentYear }}</h1>

    <!-- Academic Year Form -->
    <form v-if="concluded" @submit.prevent="submitForm" class="box">
      <div class="field">
        <label class="label">Year</label>
        <div class="control">
          <input
            id="baseYearInput"
            v-model="baseYear"
            class="input"
            type="text"
            placeholder="e.g. 2025"
          >
        </div>

        <label class="label">Academic Year</label>
        <div class="control">
          <input
            id="yearInput"
            v-model="academicYear"
            @input="formatYear"
            @blur="autoFillDates"
            class="input"
            type="text"
            disabled
          >
        </div>
      </div>

      <div class="field is-horizontal">
        <div class="field-body">
          <div class="field">
            <label class="label">Start Date</label>
            <div class="control">
              <input id="startDateInput" v-model="startDate" class="input" type="date">
            </div>
          </div>

          <div class="field">
            <label class="label">End Date</label>
            <div class="control">
              <input id="endDateInput" v-model="endDate" class="input" type="date">
            </div>
          </div>
        </div>
      </div>

      <div class="field mt-5">
        <div class="control">
          <button id="addYearButton" class="button is-primary is-fullwidth">Submit</button>
        </div>
      </div>

      <div class="field mt-3">
        <div class="control">
          <button class="button is-success is-outlined is-fullwidth" @click="resetForm">Reset</button>
        </div>
      </div>

      <div id="message" class="notification fixed-notification" v-if="message.text" :class="message.type">
        {{ message.text }}
      </div>
    </form>

    <!-- Not Concluded Message -->
    <div v-else class="box">
      <p>Check if the Year {{ CurrentYear }} has been concluded all the results has been published. 
        Create New Academic Year only after conclufing the previous Year.</p>
      <button v-if="resultout" class="button is-primary mt-5 is-fullwidth" @click="concludeYear">
        Click to create New Academic Year.
      </button>
    </div>
  </div>

  <!-- Academic Years Table -->
  <div class="box form-container wide">
    <h2 class="subtitle">All Academic Years</h2>
    <table class="table is-striped is-fullwidth">
      <thead>
        <tr>
          <th>Year</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Status</th>
        <th class="has-text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="year in academicYears" :key="year.id">
          <td>{{ year.yearName }}</td>
          <td>{{ year.startDate }}</td>
          <td>{{ year.endDate }}</td>
          <td>
            <span class="tag" :class="year.isActive ? 'is-success' : 'is-dark'">
              {{ year.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>

          <td class="has-text-right">
            <div class="button is-small is-danger mr-2 " @click="deleteYear(year.id)">
              <span class="fas fa-solid fa-trash-alt mr-2"></span>Delete
            </div>
            <div v-if="year.isActive" class="button is-small is-warning" @click="toggleActiveStatus(year)">
              <span class="fas fa-toggle-on mr-2"></span>Deactivate
            </div>
            <div v-else class="button is-small is-success" @click="toggleDeActiveStatus(year)">
              <span class="fas fa-toggle-on mr-2"></span>Activate
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAcademicYear } from '../../composables/useAcademicYear'

const { CurrentYear } = useAcademicYear()

// State
const concluded = ref(false)
const resultout = ref(true)
const baseYear = ref('')
const academicYear = ref('')
const startDate = ref('')
const endDate = ref('')
const academicYears = ref([])
const message = ref({ text: '', type: '' })

// Handlers
function concludeYear() {
  concluded.value = true
}

function formatYear() {
  const value = baseYear.value.replace(/\D/g, '')

  if (value.length === 4) {
    const start = parseInt(value)
    const end = start + 1

    academicYear.value = `${start}-${end}`
    startDate.value = `${start}-04-01`
    endDate.value = `${end}-03-31`
  } else {
    academicYear.value = ''
    startDate.value = ''
    endDate.value = ''
  }
}

function autoFillDates() {
  formatYear()
}

function submitForm() {
  if (!academicYear.value || !startDate.value || !endDate.value) {
    showMessage("All fields are required.", "is-danger")
    return
  }

  const data = {
    yearName: academicYear.value,
    baseYear: baseYear.value,
    startDate: startDate.value,
    endDate: endDate.value
  }

  window.electronAPI.addAcademicYear(data).then(result => {
    if (result.success) {
      showMessage("Academic year added successfully.", "is-success")
      resetForm()
      window.electronAPI.notifyAcademicYearAdded()
      loadAllAcademicYears()
    } else {
      showMessage(result.message || "Failed to add academic year.", "is-danger")
    }
  }).catch(err => {
    showMessage("Unexpected error: " + err.message, "is-danger")
  })
}

function resetForm() {
  baseYear.value = ''
  academicYear.value = ''
  startDate.value = ''
  endDate.value = ''
}

function showMessage(msg, type) {
  message.value = { text: msg, type }
  setTimeout(() => {
    message.value = { text: '', type: '' }
  }, 3000)
}

function loadAllAcademicYears() {
  window.electronAPI.getAcademicYears().then(response => {
    if (response.success) {
      academicYears.value = response.result.sort((a, b) =>
        b.yearName.localeCompare(a.yearName)
      );
    } else {
      showMessage("Failed to load academic years: " + response.message, "is-danger");
    }
  }).catch(err => {
    showMessage("Failed to load academic years: " + err.message, "is-danger");
  });
}

function deleteYear(id) {
  if (!confirm("Are you sure you want to delete this academic year?")) return

  window.electronAPI.deleteAcademicYear(id).then(result => {
    if (result.success) {
      showMessage("Academic year deleted.", "is-success")
      loadAllAcademicYears()
    } else {
      showMessage(result.message || "Failed to delete academic year.", "is-danger")
    }
  }).catch(err => {
    showMessage("Error: " + err.message, "is-danger")
  })
}

function toggleActiveStatus(year) {
  const newStatus = !year.isActive
  window.electronAPI.setAcademicYearActiveStatus({ id: year.id, isActive: newStatus }).then(result => {
    if (result.success) {
      showMessage(`Academic year ${newStatus ? 'activated' : 'deactivated'}.`, "is-success")
      loadAllAcademicYears()
    } else {
      showMessage(result.message || "Failed to update status.", "is-danger")
    }
  }).catch(err => {
    showMessage("Error: " + err.message, "is-danger")
  })
}

watch(baseYear, formatYear)
onMounted(loadAllAcademicYears)
</script>
