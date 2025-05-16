<template>
  <div class="form-container full ">
    <div>
      <h1 class="title is-4 has-text-centered mb-4">Create Result - {{ CurrentExamName }} ({{ CurrentYear }})</h1>
      <h2 class="subtitle is-5 has-text-centered mb-4">ExamType - {{ CurrentExamType }}</h2>
    </div>

    <div class="box form-container single">
      Calculate total marks.
    </div>
    
    
    <div class="is-flex ">

      <!-- Marks Entry Status Table -->
      <section class="box column mr-2">
        <div class="table-container">
          <table class="table is-fullwidth is-striped is-hoverable">
            <thead>
              <tr>
                <th>Class</th>
                <th>Section</th>
                <th>#Subjects Entered</th>
                <th>Mark Entry Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in classSectionStatus" :key="`${item.classId}-${item.sectionId}`">
                <td>{{ !["KG-I", "KG-II"].includes(item.className) ? "Class " + item.className : item.className }}</td>
                <td>Section - {{ item.sectionName }}</td>
                <td>
                  <span class="has-text-grey">{{ item.finishedSubjects }} of {{ item.totalSubjects }} ({{ item.completionPercentage }}%)</span>
                </td>
                <td>
                  <span class="tag is-small mr-2" :class="item.allFinished ? 'is-success' : 'is-dark'">
                    {{ item.allFinished ? 'Completed' : 'In Progress' }}
                  </span>
                  <p class="help is-size-8 mt-1 ">
                    <i>{{ item.allFinished ? 'Ready to generate results' : 'Complete mark entry first' }}</i>
                  </p>
                </td>
                <td>
                  <button v-if="item.allFinished && isCalculated && resultGenerated"
                    class="button is-small is-dark "
                    :disabled="resultGenerated"                  
                  >
                    Result Generated
                  </button>
                  <button v-else-if="item.allFinished && !isCalculated"
                    class="button is-small is-primary"
                    :disabled="!item.allFinished"
                    @click="calculateTotalMarks(item.classId, item.sectionId)"
                  >
                    {{ isCalculating ? "Calculating..." : "Calculate Total Marks" }}
                  </button>
                  <button v-else-if="item.allFinished && isCalculated"
                    class="button is-small is-success "
                    :disabled="isCalculating"
                    @click="generateResult(item.classId, item.sectionId)"
                  >
                    Generate Result
                  </button>
                  
                  <button v-else
                    class="button is-small is-danger"
                    :disabled="item.allFinished"
                    @click="goToMarkEntry(item.classId, item.sectionId)"
                  >
                    Mark Entry
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="box info-container ">
        <h2 class="subtitle">Instructions </h2>
        <div class="notification info is-dark">
          <ul class="bullet">
            <li>Click Calculate button to calculate the Cummulative Total marks for all the students.</li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'

const router = useRouter()
const { CurrentYearId, CurrentYear } = useAcademicYear()
const { CurrentExamId, CurrentExamType, CurrentExamName, loadActiveExam } = useActiveExam()

// State
const classSectionStatus = ref([])
const isLoading = ref(false)
const isCalculating = ref(false)
const isCalculated = ref(false)
const resultGenerated = ref(false)

// Fetch all required data
onMounted(async () => {
  isLoading.value = true
  await loadActiveExam()
  await fetchMarkEntryStatus()
  isLoading.value = false
})

// Fetch mark entry status for all class-section combinations
async function fetchMarkEntryStatus() {
  try {
    const status = await window.electronAPI.getmarkEntryStatus({
      academicYearId: CurrentYearId.value,
      examId: CurrentExamId.value
    })
    
    if (status.success) {
      classSectionStatus.value = status.data
    } else {
      console.error('Error fetching status:', status.error)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

function goToMarkEntry(classId, sectionId) {
  console.log('ID to pass from create result:', sectionId)
  router.push({
    name: 'MarksEntry',
    query: { 
      classId, 
      sectionId,
      examId: CurrentExamId.value,
      yearId: CurrentYearId.value
    }
  })
}

function calculateTotalMarks(classId, sectionId){
  isCalculating.value = true
   setTimeout(() => {
    isCalculated.value = true
    isCalculating.value = false;
  }, 3000); 
  // 1000ms = 1 second
}

function generateResult(classId, sectionId){
  resultGenerated.value = true;
  console.log("Result Generated")
}


</script>

<style scoped>
.table-container {
  overflow-x: auto;
}
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.help {
  display: inline-block;
}
</style>