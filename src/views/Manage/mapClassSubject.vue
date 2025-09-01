<template>
  <div class="form-container wide">
    <h1 class="title is-4 has-text-centered">Class-Subject Mapping</h1>

    <!-- Notifications -->
    <div v-if="errorMessage" class="notification is-danger fixed-notification" @click="errorMessage = ''">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="notification is-success fixed-notification" @click="successMessage = ''">
      {{ successMessage }}
    </div>

    <!-- Select Class -->
    <div class="box">
      <div class="field">
        <label class="label">Select Class</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="selectedClass" @change="loadClassSubjects" required>
              <option value="">-- Select Class --</option>
              <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                {{ cls.ClassName }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Two-column layout -->
    <div v-if="selectedClass" class="columns mt-4">
      <!-- Left Column: Mapped Subjects -->
      <div class="column">
        <div class="box">
          <h2 class="title is-6">Mapped Subjects</h2>

          <!-- If no mapped subjects -->
          <div v-if="mappedSubjects.length === 0">
            <p>No subjects mapped yet.</p>
            <button class="button is-link is-small mt-2" @click="showAvailable = true">
              Map Subjects
            </button>
          </div>

          <!-- If mapped subjects exist -->
          <div v-else>
            <ul>
              <li
                v-for="subject in mappedSubjects"
                :key="subject.Id"
                class="is-flex is-justify-content-space-between is-align-items-center mt-2"
              >
                <span>{{ subject.SubjectName }} ({{ subject.SubjectCategory }})</span>
                <span class="icon has-text-danger is-clickable" @click="removeSubject(subject)">
                  <i class="fas fa-minus"></i>
                </span>
              </li>
            </ul>
            <!-- Add More button -->
            <button class="button is-link is-small mt-3" @click="showAvailable = true">
              Add More Subjects
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: Available Subjects -->
      <div class="column" v-if="showAvailable">
        <div class="box">
          <h2 class="title is-6">Available Subjects</h2>
          <p v-if="unmappedSubjects.length === 0">No subjects available.</p>
          <ul>
            <li
              v-for="subject in unmappedSubjects"
              :key="subject.Id"
              class="is-flex is-align-items-center mt-2"
            >
              <span class="icon has-text-success is-clickable mr-2" @click="addSubject(subject)">
                <i class="fas fa-plus"></i>
              </span>
              <span>{{ subject.SubjectName }} ({{ subject.SubjectCategory }})</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Save Changes Button -->
    <div v-if="hasChanges" class="field mt-4">
      <div class="control">
        <button class="button is-primary mr-2" @click="saveChanges" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
        </button>
        <button class="button is-light" @click="CancelChanges" :disabled="isSubmitting">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const classes = ref([])
const selectedClass = ref('')
const mappedSubjects = ref([])
const unmappedSubjects = ref([])
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)
const hasChanges = ref(false)
const showAvailable = ref(false) // toggles available subjects column

// Fetch class list at startup
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

// Load subjects for the selected class
async function loadClassSubjects() {
  if (!selectedClass.value) return
  try {
    const response = await window.electronAPI.getSubjectsForClass(selectedClass.value)
    if (response.success) {
      mappedSubjects.value = response.mapped
      unmappedSubjects.value = response.unmapped
      hasChanges.value = false
      showAvailable.value = false // hide available by default
    } else {
      errorMessage.value = response.message || 'Failed to fetch subjects.'
    }
  } catch (err) {
    errorMessage.value = err.message
  }
}

// Add subject to mapped list
function addSubject(subject) {
  mappedSubjects.value.push(subject)
  unmappedSubjects.value = unmappedSubjects.value.filter(s => s.Id !== subject.Id)
  hasChanges.value = true
}

// Remove subject from mapped list
function removeSubject(subject) {
  unmappedSubjects.value.push(subject)
  mappedSubjects.value = mappedSubjects.value.filter(s => s.Id !== subject.Id)
  hasChanges.value = true
}

//Cancle Changes
async function CancelChanges() {
  if (!selectedClass.value) return
  await loadClassSubjects()
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = false
  hasChanges.value = false
}

// Save updated mappings
async function saveChanges() {
  if (!selectedClass.value) return

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const mappings = mappedSubjects.value.map(subject => ({
      ClassId: selectedClass.value,
      SubjectId: subject.Id
    }))

    const response = await window.electronAPI.saveClassSubjectMappings(mappings)
    if (response.success) {
      successMessage.value = 'Changes saved successfully!'
      hasChanges.value = false
    } else {
      errorMessage.value = response.message || 'Failed to save changes.'
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

onMounted(() => {
  fetchClasses()
})
</script>




<style scoped>
.container {
  max-width: 800px;
  margin: auto;
}
</style>
