<template>
  <div class="form-container single">
    <h1 class="title is-4 has-text-centered">Class-Subject Mapping</h1>

    <div v-if="errorMessage" class="notification is-danger fixed-notification">{{ errorMessage }}</div>
    <div v-if="successMessage" class="notification is-success fixed-notification">{{ successMessage }}</div>

    <div class="box">
      <!-- Select Class -->
      <div class="field">
        <label class="label">Select Class</label>
        <div class="control">
          <div class="select is-fullwidth"> <!-- Add is-fullwidth for better control -->
            <select v-model="selectedClass" required>
              <option value="">-- Select Class --</option>
              <option v-for="cls in classes" :key="cls.Id" :value="cls.Id" >
                {{ cls.ClassName }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Subject Limit Input -->
      <div class="field">
        <label class="label">Number of Subjects to Select</label>
        <div class="control">
          <input style="width:150px"
            class="input is-narrow"
            type="number"
            min="1"
            :max="subjects.length"
            v-model.number="maxSubjects"
            :disabled="!selectedClass"
            placeholder="Enter maximum number of subjects"
            required
          />
        </div>
        <p class="help">Selected: {{ selectedSubjects.length }} / {{ maxSubjects }}</p>
      </div>

      <!-- Select Subjects -->
      <div v-if="maxSubjects && selectedClass" class="field">
        <label class="label">Select Subjects</label>
        <div class="columns is-multiline">
          <div class="column is-one-third" v-for="subject in filteredSubjects" :key="subject.Id">
            <label class="checkbox">
              <input
                type="checkbox"
                :value="subject"
                v-model="selectedSubjects"
                :disabled="!canSelectMoreSubjects || isSubjectSelected(subject)"
              />
              {{ subject.SubjectName }} ({{ subject.SubjectCategory }})
            </label>
          </div>
        </div>
      </div>

      <!-- Selected Subjects Summary -->
      <div v-if="selectedSubjects.length" class="box mt-4">
        <h2 class="subtitle is-6">Selected Subjects:</h2>
        <ul>
          <li class="mt-3" v-for="subject in selectedSubjects" :key="subject.Id">
            {{ subject.SubjectName }} ({{ subject.SubjectCategory }})
            <button class="delete is-small ml-2 mt-1" @click="removeSubject(subject)"></button>
          </li>
        </ul>
      </div>

      <!-- Submit Button -->
      <div class="field mt-4">
        <div class="control">
          <button class="button is-primary" @click="submitMapping" :disabled="!canSubmit || isSubmitting">
            {{ isSubmitting ? 'Saving...' : 'Save Mapping' }}
          </button>
        </div>
      </div>
    </div>

    <div class="box mt-5">
      <h2 class="title is-5">Mapped Subjects (Class-wise)</h2>
      <div v-if="mappedSubjects.length">
        <div class="columns is-multiline">
          <div
            class="column is-half"
            v-for="cls in mappedSubjects"
            :key="cls.ClassId"
          >
            <div class="box">
              <h1 class="title is-6">Class {{ cls.ClassName }}</h1>
              <ul>
                <li v-for="subject in cls.Subjects" :key="subject.SubjectId">
                  {{ subject.SubjectName }} ({{ subject.SubjectCategory }})
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <p v-else>No mappings found.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'


const classes = ref([])
const subjects = ref([])
const selectedClass = ref('')
const selectedSubjects = ref([])
const mappedSubjects = ref([])
const maxSubjects = ref(null)
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

async function fetchClasses() {
  try {
    const response = await window.electronAPI.getClasses()
    if (response.success) classes.value = response.classes
    else errorMessage.value = 'Failed to fetch classes.'
  } catch (err) {
    errorMessage.value = err.message
  }
}

async function fetchSubjects() {
  try {
    const response = await window.electronAPI.getSubjects()
    if (response.success) subjects.value = response.subjects
    else errorMessage.value = 'Failed to fetch subjects.'
  } catch (err) {
    errorMessage.value = err.message
  }
}

async function fetchMappedSubjects() {
  try {
    const response = await window.electronAPI.getClassSubjectMappings()
    if (response.success) mappedSubjects.value = response.data
  } catch (err) {
    console.error('Error fetching mapped subjects:', err.message)
  }
}

const filteredSubjects = computed(() =>
  subjects.value.filter(subject =>
    !selectedSubjects.value.some(s => s.Id === subject.Id)
  )
)

const canSubmit = computed(() =>
  selectedClass.value &&
  selectedSubjects.value.length > 0 &&
  selectedSubjects.value.length <= maxSubjects.value
)

const canSelectMoreSubjects = computed(() =>
  maxSubjects.value === null || selectedSubjects.value.length < maxSubjects.value
)

watch(selectedClass, () => {
  selectedSubjects.value = []
  maxSubjects.value = null
})

function isSubjectSelected(subject) {
  return selectedSubjects.value.some(s => s.Id === subject.Id)
}

function removeSubject(subject) {
  selectedSubjects.value = selectedSubjects.value.filter(s => s.Id !== subject.Id)
}

function isClassMapped(classId) {
  return mappedSubjects.value.some(m => m.ClassId === classId)
}

async function submitMapping() {
  await handleSubmitMapping({
    selectedClass,
    selectedSubjects,
    errorMessage,
    successMessage,
    isSubmitting,
    fetchMappedSubjects,
    resetForm
  })
}

function resetForm() {
  selectedClass.value = ''
  selectedSubjects.value = []
  maxSubjects.value = null
}

async function handleSubmitMapping({
  selectedClass,
  selectedSubjects,
  errorMessage,
  successMessage,
  isSubmitting,
  fetchMappedSubjects,
  resetForm
}) {
  if (!selectedClass.value || selectedSubjects.value.length === 0) return

      isSubmitting.value = true
      errorMessage.value = ''
      successMessage.value = ''

  try {
    const mappings = selectedSubjects.value.map(subject => ({
      ClassId: selectedClass.value,
      SubjectId: subject.Id
    }))

    const response = await window.electronAPI.saveClassSubjectMappings(mappings)

    if (response.success) {
      successMessage.value = 'Class-Subject mapping saved successfully!'
      await fetchMappedSubjects()
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


onMounted(() => {
  fetchClasses()
  fetchSubjects()
  fetchMappedSubjects()
})
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: auto;
}
</style>
