//This Page is not required, Final Result is generated from Annual Result Page

<template>
  <div  class="form-container full"> 

    <div>
      <h1 class="title is-4 has-text-centered mb-4">Create Final Result ({{ CurrentYear }})</h1>
      <h2 class="subtitle is-5 has-text-centered mb-4">Create Result</h2>
    </div>
    <div v-if="!isGenerating" class="notification is-dark has-text-centered mb-5">
      <div class="is-flex">
        <!-- Marks Entry Status Table -->
        <section class="box column mr-2">
          <div class="table-container">
            <table class="table is-fullwidth is-striped is-hoverable">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Section</th>
                  <th >Half Yearly Examination</th>
                  <th >Annual Examination</th>
                  <th >Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in classSectionStatus" :key="`${item.classId}-${item.sectionId}`">
                  <td>{{ !["KG-I", "KG-II"].includes(item.className) ? "Class " + item.className : item.className }}</td>
                  <td>{{ item.sectionName ? item.sectionName : '-' }}</td>
                  <td>
                    <span class="has-text-grey">{{ item.finishedSubjects }} of {{ item.totalSubjects }} ({{ item.completionPercentage }}%)</span>
                  </td>
                  <td>                   
                    <p class="help is-size-8 mt-1">
                      <i>
                        {{ item.resultVerified
                          ? 'Result has been generated'
                          : item.finishedSubjects === item.totalSubjects
                            ? 'Ready to generate results'
                            : 'Mark Entry not completed' }}
                      </i>
                    </p>
                  </td>
                  <td v-if ="item.resultPublished">
                    <button
                      class="button is-small is-dark"
                      @click="loadModalResults(item.classId, item.sectionId)"
                    >
                      View Results
                    </button>

                  </td>
                  <td v-else>
                    <button
                      v-if="item.resultVerified"
                      class="button is-small is-dark"
                      disabled
                    >
                      Result Generated
                    </button>
                    <button
                      v-else-if="item.finishedSubjects === item.totalSubjects"
                      class="button is-small is-success"
                      :disabled="isGenerating || item.resultGenerating"
                      @click="generateResult(item.classId, item.sectionId, item.className, item.sectionName)"
                    >
                      <span v-if="item.resultGenerating">Generating...</span>
                      <span v-else>Generate Result</span>
                    </button>
                    <button
                      v-else
                      class="button is-small is-danger"
                      @click="goToMarkEntry( examType)"
                    >
                      Go to Mark Entry
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Instructions -->
        <section class="box info-container mb-5">
          <h2 class="subtitle has-text-centered">Instructions</h2>
          <div class="notification info is-dark">
            <ul class="bullet">
              <li class="mb-4">Complete mark entry for all subjects to enable result generation</li>
              <li class="mb-4">Cumulative totals are automatically calculated during mark entry</li>
              <li class="mb-4">Click "Generate Result" to finalize results</li>
              <li class="mb-4">Results must be generated once per exam/ class/ section</li>
              <li class="mb-4">Check box (Finished all students) in the Mark Entry must be check to enable Result generation</li>
            </ul>
          </div>
        </section>
      </div>
      
          <!-- Modal -->
      <!-- Modal Section (updated) -->
      <div class="modal" :class="{ 'is-active': modalVisible }">
        <div class="modal-background" @click="closeModal"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <h1 class="modal-card-title">{{ currentExamName }} Results for  
              CLASS - {{ modalClassName }},{{ modalSectionName ? ' SECTION - ' + modalSectionName : '' }} - {{ CurrentYear }}</h1>
            <h2></h2>
            <button class="delete" aria-label="close" @click="closeModal"></button>
          </header>
          <section class="modal-card-body">
            <div class="table-container">
              <table class="table is-fullwidth is-striped is-bordered is-hoverable">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Full Mark</th>
                    <th>Total Mark Obtained</th>
                    <th>Percentage</th>
                    <th>Division</th>                  
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(res, index) in modalResults" :key="index">
                    <td>{{ res.ResultStatus === 'Pass'? res.Rank : 'N.A.' }}</td>
                    <td>{{ res.Name }}</td>
                    <td>{{ res.RollNo }}</td>
                    <td>{{ res.TotalMaxMark }}</td>
                    <td>{{ res.TotalMarksObtained }}</td>
                    <td>{{ res.Percentage }}%</td>
                    <td>{{ res.Division }}</td>
                    
                    <td>
                      <span class="tag" :class="res.ResultStatus === 'Pass' ? 'is-success' : 'is-danger'">
                        {{ res.ResultStatus }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button is-dark" @click="closeModal">Close</button>
          </footer>
        </div>
      </div>
    </div>
   <div v-else class="notification is-danger has-text-centered mt-5">
      Current Exam is <strong>'{{ currentExamName }}'</strong>. No result is available.
    </div>
    
  </div>
  
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'

const { CurrentYearId, CurrentYear } = useAcademicYear()
const { 
  Terminal_Published,
  Annual_Published,
  PassingPercentage,      
  loadActiveExam 
} = useActiveExam()

const router = useRouter()
const route = useRoute()

const examType = ref('')
const currentExamId = ref('')
const currentExamName = ref('')
const classSectionStatus = ref([])
const isLoading = ref(false)
const isGenerating = ref(false)
const modalVisible = ref(false)
const modalResults = ref([])
const modalClassName = ref('')
const modalSectionName = ref('')

watch(() => route.query.type, (newType) => {
  examType.value = newType
  //console.log("Exam Type in watch:", examType.value)
  getExam()
  
}, { immediate: true })
watch(examType, async (newType) => {
  if (newType) {
    if( newType === 'final') currentExamName.value = 'Final'
    selectedClassId.value = ''
    selectedSectionId.value = ''
    
  }
}, { immediate: true })

async function getExam() {
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  currentExamId.value = result.exam.Id
  currentExamName.value = result.exam.ExamName
  //console.log("CurrentExam Id: in get examId", currentExamId.value)
  fetchMarkEntryStatus()
}

function goToMarkEntry(examType) {
  router.push({
    name: 'MarksEntry',
    query: {  
      type: examType,
    }
  })
  
}
onMounted(async () => {
     await loadActiveExam()   
})

async function fetchMarkEntryStatus() {
  try {
    const response = await window.electronAPI.getmarkEntryStatus(currentExamId.value)
    //console.log('currentExamId.value:', currentExamId.value)
    if (response.success) {
      // Add verification for each class/section
      const verifiedStatus = await Promise.all(
        response.data.map(async item => ({
          ...item,
          resultGenerating: false,
          //resultVerified: false
          resultVerified: await verifyResultsExist(item.classId, item.sectionId)
        }))
      )
      
      classSectionStatus.value = verifiedStatus
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

async function verifyResultsExist(classId, sectionId) {
  try {
    const result = await window.electronAPI.verifyResults({
      academicYearId: CurrentYearId.value,
      examId: currentExamId.value,
      classId,
      sectionId
    })
    return result?.success && result?.isVerified
  } catch (error) {
    console.error('Verification error:', error)
    return false
  }
}

//////////////////////////////////////className and sectionName is for Displaying in Modal
async function generateResult(classId, sectionId, className, sectionName) {
  
  sectionId = sectionId === '' ? 0 : sectionId
  try {
    //console.log('Generating results for:', className, sectionName)
    // Update UI state
    const index = classSectionStatus.value.findIndex(
      item => item.classId === classId && item.sectionId === sectionId
    )
    if (index !== -1) {
      classSectionStatus.value[index].resultGenerating = true
    }

    const response = await window.electronAPI.generateResults({
      academicYearId: CurrentYearId.value,
      examId: currentExamId.value,
      classId,
      sectionId
    })
    
    if (response.success) {
      await loadModalResults(classId, sectionId)
      modalVisible.value = true
    }
  } catch (error) {
    console.error('Generation error:', error)
    showNotification('danger', 'Error during result generation')
  }
}


//Load Results for Modal
async function loadModalResults(classId, sectionId) {
 
  //console.log('Loading results for:', modalClassName.value, modalSectionName.value)
  const secResult = await window.electronAPI.getSectionResults({
    academicYearId: CurrentYearId.value,
    examId: currentExamId.value,
    classId,
    sectionId
  })
  
  if (secResult) {
    modalResults.value = secResult.results
    const modalSummary = secResult.summary
    modalClassName.value = modalSummary.className
    modalSectionName.value = modalSummary.sectionName
    //console.log('Modal Summary:', modalSummary)
    
    //console.log('modalResults.value:', modalResults.value)
  } else {
    modalResults.value = []
    console.error('Failed to load section results:', result.message)
  }
}

function closeModal() {
  modalVisible.value = false
  modalResults.value = []
}

function showNotification(type, message) {
  alert(`${type.toUpperCase()}: ${message}`)
}
</script>

<style scoped>
.table-container {
  overflow-x: auto;
}
.table th, .table td {
  text-align: left;
}
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.help {
  display: inline-block;
}

.info-container {
  min-width: 300px;
  max-width: 350px;
  text-align: left;
}

.bullet {
  list-style-type: disc;
  padding-left: 1.5em;
}

.progress {
  width: 200px;
  margin-left: 1rem;
}

.modal-card {
  width: 90%;
  max-width: 1000px;
}
</style>

