<template>
  <div class="form-container single">
    <h1 class="title is-4 has-text-centered">Class-Section Mapping</h1>

    <div v-if="errorMessage" class="notification is-danger">{{ errorMessage }}</div>
    <div v-if="successMessage" class="notification is-success">{{ successMessage }}</div>

    <div class="box">
      <form @submit.prevent="submitMapping">
        <!-- Select Class -->
        <div class="field">
          <label class="label">Select Class</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model="selectedClass" required>
                <option value="">-- Select Class --</option>
                <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                  Class {{ cls.ClassName }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Select Sections -->
        <div v-if="selectedClass" class="field">
          <label class="label">Select Sections</label>
          <div class="columns is-multiline">
            <div class="column is-one-third" v-for="section in sections" :key="section.Id">
              <label class="checkbox">
                <input
                  type="checkbox"
                  :value="section"
                  v-model="selectedSections"
                />
                {{ section.SectionName }}
              </label>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="field mt-4">
          <div class="control">
            <button 
              class="button is-primary" 
              type="submit"
              :disabled="!canSubmit || isSubmitting"
            >
              <span v-if="isSubmitting" class="icon">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              <span>Save Mapping</span>
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Mapped Sections Table -->
    <div class="box mt-5">
      <h2 class="title is-5">Mapped Class-Sections</h2>
      <div class="table-container">
        <table class="table is-fullwidth is-striped">
          <thead>
            <tr>
              <th>Class</th>
              <th>Sections</th>
              <th class="has-text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mapping in mappedSections" :key="mapping.ClassId">
              <td>Class {{ mapping.ClassName }}</td>
              <td>
                <div class="tags">
                  <span 
                    v-for="section in mapping.Sections" 
                    :key="section.SectionId"
                    class="tag is-info"
                  >
                    {{ section.SectionName }}
                  </span>
                </div>
              </td>
              <td class="has-text-right">
                <button 
                  class="button is-small is-danger"
                  @click="deleteMapping(mapping.ClassId)"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!mappedSections.length" class="has-text-grey">No mappings found.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const classes = ref([])
const sections = ref([])
const selectedClass = ref('')
const selectedSections = ref([])
const mappedSections = ref([])
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

// Fetch data
async function fetchClasses() {
  try {
    const response = await window.electronAPI.getClasses()
    if (response.success) {
      classes.value = response.classes
    } else {
      errorMessage.value = 'Failed to fetch classes.'
    }
  } catch (err) {
    errorMessage.value = err.message
  }
}

async function fetchSections() {
  try {
    const response = await window.electronAPI.getSections()
    if (response.success) {
      sections.value = response.sections
    } else {
      errorMessage.value = 'Failed to fetch sections.'
    }
  } catch (err) {
    errorMessage.value = err.message
  }
}

async function fetchMappedSections() {
  try {
    const response = await window.electronAPI.getClassSectionMappings()
    if (response.success) {
      mappedSections.value = response.data
    }
  } catch (err) {
    console.error('Error fetching mapped sections:', err)
  }
}

const canSubmit = computed(() => {
  return selectedClass.value && selectedSections.value.length > 0
})

// Form submission
async function submitMapping() {
  if (!canSubmit.value) return

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const mappings = selectedSections.value.map(section => ({
      ClassId: selectedClass.value,
      SectionId: section.Id
    }))

    const response = await window.electronAPI.saveClassSectionMappings(mappings)
    
    if (response.success) {
      successMessage.value = 'Class-Section mapping saved successfully!'
      await fetchMappedSections()
      resetForm()
    } else {
      errorMessage.value = response.message || 'Failed to save mappings.'
    }
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isSubmitting.value = false
    setTimeout(() => {
      successMessage.value = ''
      errorMessage.value = ''
    }, 5000)
  }
}

async function deleteMapping(classId) {
  const confirm = await window.electronAPI.showConfirmationDialog(
    'Are you sure you want to delete this mapping?'
  )
  
  if (!confirm) return

  try {
    const response = await window.electronAPI.deleteClassSectionMapping(classId)
    if (response.success) {
      successMessage.value = 'Mapping deleted successfully!'
      await fetchMappedSections()
    } else {
      errorMessage.value = response.message || 'Failed to delete mapping.'
    }
  } catch (err) {
    errorMessage.value = err.message
  }
}

function resetForm() {
  selectedClass.value = ''
  selectedSections.value = []
}

onMounted(() => {
  fetchClasses()
  fetchSections()
  fetchMappedSections()
})
</script>

<style scoped>
.tags {
  flex-wrap: wrap;
  gap: 0.5rem;
}

.table-container {
  overflow-x: auto;
}


</style>