<template>
  <div class="form-container single">
    <h1 class="title has-text-centered is-4">Academic Session</h1>
    <h2 class="subtitle has-text-centered">Current Academic Year {{ CurrentYear }}</h2>

    <!-- Academic Year Form -->
    <form v-if="showForm" @submit.prevent="submitForm" class="box">
      <h2 class="subtitle has-text-centered">Create New Academic Year</h2>
      <div class="field">
        <label class="label">Enter Year</label>
        <div class="control">
          <input
            id="baseYearInput"
            v-model="baseYear"
            class="input"
            type="text"
            placeholder="e.g. 2025"
          >
        </div>

        <label class="label mt-3">Academic Year</label>
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
    <div><button class="button is-danger" @click="cancelForm">Cancel</button></div>
    </form>
  </div>      
  
  <div v-if="message.text" class="notification" :class="message.type" @click="message.text = ''">
        {{ message.text }}
  </div>

  <!-- Academic Years Table -->
  <div v-if="!showForm" class="box form-container wide">
    <div class="columns is-vcentered mb-3">
      <div class="column is-6">
        <p class="subtitle has-text-left">All Academic Years</p>
      </div>
      <div class="column is-6">
        <p class="has-text-right">
          <button class="button is-primary is-small" @click="showNewYearForm">New</button>
        </p>
      </div>
    </div>
    <div v-if="loading" class="notification is-info is-light has-text-centered">
      Loading academic years...
    </div>
    <table v-else class="table is-striped is-fullwidth">
      <thead>
        <tr>
          <th>Academic Year</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Status</th>
          <th class="has-text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="year in academicYears" :key="year.id">
          <td>{{ year.yearName }}</td>
          <td>{{ formatDisplayDate(year.startDate) }}</td>
          <td>{{ formatDisplayDate(year.endDate) }}</td>
          <td>
            <span class="tag" :class="year.isActive ? 'is-success' : 'is-dark'">
              {{ year.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td class="has-text-right">
            <div class="buttons is-justify-content-end">
              <button 
                v-if="!year.isActive" 
                class="button is-small is-success"
                @click="activateAcademicYear(year.id)"
                :disabled="activatingId === year.id"
              >
                <span v-if="activatingId !== year.id" class="fas fa-toggle-on mr-2"></span>
                <span v-else class="fas fa-spinner fa-spin mr-2"></span>
                Set as Active
              </button>
             
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'

const { CurrentYear, loadAcademicYear } = useAcademicYear()
const { Annual_Published } = useActiveExam()

// State
const showForm = ref(false)
const baseYear = ref('')
const academicYear = ref('')
const startDate = ref('')
const endDate = ref('')
const academicYears = ref([])
const message = ref({ text: '', type: '' })
const loading = ref(false)
const activatingId = ref(null)
const deletingId = ref(null)

// Handlers
function showNewYearForm() {
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  resetForm()
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

async function submitForm() {
  if (!academicYear.value || !startDate.value || !endDate.value) {
    showMessage("All fields are required", "is-danger")
    return
  }

  try {
    const data = {
      yearName: academicYear.value,
      startDate: startDate.value,
      endDate: endDate.value
    }

    const result = await window.electronAPI.addAcademicYear(data)
    
    if (result.success) {
      showMessage("Academic year added successfully", "is-success")
      resetForm()
      await loadAcademicYear() // Refresh current year from composable
      await loadAllAcademicYears()
    } else {
      showMessage(result.message || "Failed to add academic year", "is-danger")
    }
  } catch (err) {
    showMessage("Error adding academic year: " + err.message, "is-danger")
  }
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

function formatDisplayDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN')
}

async function loadAllAcademicYears() {
  try {
    loading.value = true
    const response = await window.electronAPI.getAcademicYears()
    
    if (response.success) {
      academicYears.value = response.result.sort((a, b) => 
        new Date(b.startDate) - new Date(a.startDate)
    )} else {
      showMessage("Failed to load academic years", "is-danger")
    }
  } catch (err) {
    showMessage("Error loading academic years: " + err.message, "is-danger")
  } finally {
    loading.value = false
  }
}

async function deleteAcademicYear(id) {
  try {
    const confirmed = await window.electronAPI.showConfirmationDialog(
      "Are you sure you want to delete this academic year? All associated data will be lost."
    )
    if (!confirmed) return

    deletingId.value = id
    const result = await window.electronAPI.deleteAcademicYear(id)
    
    if (result.success) {
      showMessage("Academic year deleted", "is-success")
      await loadAcademicYear() // Refresh current year from composable
      await loadAllAcademicYears()
    } else {
      showMessage(result.message || "Failed to delete academic year", "is-danger")
    }
  } catch (err) {
    showMessage("Error deleting academic year: " + err.message, "is-danger")
  } finally {
    deletingId.value = null
  }
}

async function activateAcademicYear(id) {
  try {
    activatingId.value = id
    const result = await window.electronAPI.activateAcademicYear(id)
    
    if (result.success) {
      showMessage("Academic year activated", "is-success")
      await loadAcademicYear() // Refresh current year from composable
      await loadAllAcademicYears()
    } else {
      showMessage(result.message || "Failed to activate academic year", "is-danger")
    }
  } catch (err) {
    showMessage("Error activating academic year: " + err.message, "is-danger")
  } finally {
    activatingId.value = null
  }
}

// Initialize
onMounted(() => {
  loadAllAcademicYears()
})

watch(baseYear, formatYear)
</script>

<style scoped>

.buttons {
  justify-content: flex-end;
}

.button.is-small {
  font-size: 0.75rem;
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>