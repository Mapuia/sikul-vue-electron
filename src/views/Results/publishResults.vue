<template>
  <div class="form-container single"> 
    <div>
      <h1 class="title has-text-centered is-4">Publish Result for {{ currentExamName }}</h1>
      <h2 class="subtitle has-text-centered">{{ examType ? "" : 'There is something wrong. Logout and login again'}}</h2>
    </div>
    
    <div class="box">      
        <table class="table is-fullwidth">
          <thead>
            <tr>              
              <th>No of Mark Entry.</th>
              <td> {{ markEntryCount }}</td>
            </tr>
            <tr>
              <th>Generated Results</th>
              <td>{{ resultStatusCount }}</td>
            </tr>
          </thead>
        </table>
      <div class="notification is-warning" v-if="!canPublish"> 
        <p class="has-text-weight-bold">Cannot publish results</p>
        <p> There are {{ markEntryCount - resultStatusCount }} sections left to generate results.</p>
      </div>
      
      <div class="notification is-info" v-else>
        All results are generated and ready for publication.
      </div>
      
      <div class="field is-grouped is-grouped-centered mt-5">
        <div class="control">
          <button 
            class="button is-primary" 
            :disabled="!canPublish || isLoading"
            @click="publishResult"
          >
            <span v-if="isLoading">Publishing...</span>
            <span v-else>Publish Result</span>
          </button>
        </div>
      </div>
    </div>
  </div>  
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'
import { useRoute } from 'vue-router'

const route = useRoute()

const { CurrentYearId, loadAcademicYear } = useAcademicYear()
const { loadActiveExam } = useActiveExam()

// Reactive state
const examType = ref('')
const currentExamId = ref('')
const currentExamName = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const markEntryCount = ref(0)
const resultStatusCount = ref(0)

// Computed property to check if we can publish
const canPublish = computed(() => {
  return markEntryCount.value > 0 && 
         markEntryCount.value === resultStatusCount.value && 
         resultStatusCount.value > 0
})

watch(() => route.query.type, (newType) => {
  examType.value = newType
  getExam() 
}, { immediate: true })

onMounted(async () => {
  await loadAcademicYear()
  await loadActiveExam()
})

async function getExam() {
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  currentExamId.value = result.exam.Id
  currentExamName.value = result.exam.ExamName
  await checkPublishStatus()
}

async function checkPublishStatus() {
  try {
    // Get counts from both tables
    const counts = await window.electronAPI.getPublishStatusCounts({
      academicYearId: CurrentYearId.value,
      activeExamId: currentExamId.value
    })

    markEntryCount.value = counts.markEntryCount
    resultStatusCount.value = counts.resultStatusCount   
   
  } catch (error) {
    console.error("Error checking publish status:", error)
    
  }
}

async function publishResult() {
  if (!canPublish.value) {
    window.electronAPI.showInfoDialog("Cannot publish results - not all results are generated")
    return
  }

  isLoading.value = true
  try {
    const response = await window.electronAPI.publishResults({
      academicYearId: CurrentYearId.value,
      activeExamId: currentExamId.value,
      examType: examType.value
    })

    if (response.success) {
      window.electronAPI.showInfoDialog("Results published successfully!")
      // You might want to refresh the status after publishing
      await checkPublishStatus()
    } else {
      window.electronAPI.showErrorDialog("Failed to publish results: " + (response.message || "Unknown error"))
    }
  } catch (error) {
    console.error("Error publishing results:", error)
    window.electronAPI.showErrorDialog("An error occurred while publishing results")
  } finally {
    isLoading.value = false
  }
}
</script>