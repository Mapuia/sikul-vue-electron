<template>
  <div v-if="isPublished" class="form-container wide">
    <div class="notification is-success has-text-centered">
      <p>{{ resultName }} are published for Academic Session {{ CurrentYear }}.</p>
      <p>Publish Date: {{ publishDate }}</p>
    </div>
    <div class="has-text-centered mb-5">
      <button v-if = "canAccess(['admin'])" class = "button is-danger ml-3 is-small"
            @click="unPublishResults"
          ><i class = "fas fa-undo mr-2"></i>
            Unpublish Results
          </button>
    </div>
  </div>
  <div v-else class="form-container full"> 
    <div>
      <h1 class="title is-4 has-text-centered mb-4">Create and Publish {{ resultName }} ({{ CurrentYear }})</h1>      
    
    </div>

    <div v-if="!isGenerating" class=" has-text-centered mb-5">
      <div class = "box is-flex is-flex-direction-column is-align-items-center">
        
        <div class="is-flex is-align-items-center">
          <!-- Label -->
          <label class="label mb-0 mr-3">Confirm Result Publish Date on:</label>          
          <!-- Date Input -->
          <input
            type="date"
            v-model="currentDate"
            @change="handleDateChange"
            class="input mr-3"
            style="max-width: 160px; width: 160px;"
          />          
          <!-- Button -->
          <button
            class="button is-primary"            
            @click="publishResult"
          >
            <span v-if="isLoading">Publishing...</span>
            <span v-else>
              <i class="fas fa-paper-plane mr-2"></i>Confirm
            </span>
          </button>
          <help class="ml-3">Tip: Publish Result only when all results are generated.</help>
        </div>
        
      </div>

      <div class="is-flex">
        <!-- Marks Entry Status Table -->
        <section class="box column mr-5 ">
          <h1 class="subtitle is-5 mb-1">Marks Entry Status</h1>
          <p class="mb-3">Only the classes with marks entered is displayed here.</p>
          <div class="table-container">
            <table class="table is-fullwidth is-striped is-hoverable">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Section</th>
                  <th >#Subjects Entered</th>
                  <th >Mark Entry Status</th>
                  <th class="has-text-centered">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredClassSectionStatus" :key="`${item.classId}-${item.sectionId}`">
                  <td>{{ !["KG-I", "KG-II"].includes(item.className) ? "Class " + item.className : item.className }}</td>
                  <td>{{ item.sectionName ? item.sectionName : '-' }}</td>
                  <td>
                    <span class="has-text-grey">{{ item.finishedSubjects }} of {{ item.totalSubjects }} ({{ item.completionPercentage }}%)</span>
                  </td>

                  <td v-if="item.resultStatus.isPublished">
                    <span class="tag is-primary">Published</span>                    
                  </td>
                  <td v-if="item.resultStatus.isPublished" class="has-text-centered">
                    <button
                      class="button is-small is-warning"
                      @click="loadModalResults(item.classId, item.sectionId, item.resultStatus.isPublished)"
                    > <i class = "fas fa-eye mr-2"></i>
                      View Results
                    </button>                    
                  </td>
                  
                  <td v-if="!item.resultStatus.isPublished">
                    <p class="help is-size-8 mt-1" :class="item.resultStatus.isVerified? 'is-info' : item.finishedSubjects === item.totalSubjects ? 'is-warning':'is-danger'">
                      <i>
                        {{ item.resultStatus.isVerified
                          ? 'Result generated on ' + new Date(item.resultStatus.lastModifiedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })                                               : item.finishedSubjects === item.totalSubjects
                            ? 'Ready to generate results'
                            : 'Mark Entry not completed' }}
                      </i>  
                    </p>
                  </td>
                  <td v-if="!item.resultStatus.isPublished && item.resultStatus.isVerified" class="has-text-centered">
                    <button
                      class="button is-small is-primary mr-2 "
                      :disabled="isGenerating || item.resultGenerating"
                      @click="generateResult(item.classId, item.sectionId)"
                    >
                      <span v-if="item.resultGenerating">Generating...</span>
                      <span v-else><i class="fas fa-redo mr-2"></i>Re-Generate Result</span>
                    </button>
                    <button
                      class="button is-small is-info"
                      @click="loadModalResults(item.classId, item.sectionId)"
                    ><i class = "fas fa-eye mr-2 mt-1"></i>
                      View Results
                    </button>
                    
                  </td>
                  <td v-else-if="!item.resultStatus.isPublished && item.finishedSubjects === item.totalSubjects" class="has-text-centered">                                      
                    <button
                      class="button is-small is-success"
                      :disabled="isGenerating || item.resultGenerating"
                      @click="generateResult(item.classId, item.sectionId)"
                    >
                      <span v-if="item.resultGenerating">Generating...</span>
                      <span v-else>Generate Result</span>
                    </button>
                  </td>
                  <td v-else-if ="!item.resultStatus.isPublished && item.finishedSubjects < item.totalSubjects" class="has-text-centered">
                    <button                 
                      class="button is-small is-danger"
                      @click="goToMarkEntry(examType)"                      
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
          <div class="help notification">
            <ul class="bullet">
              <li class="mb-4">Complete mark entry for all subjects to enable result generation.</li>
              <li class="mb-4">Click "Generate Result" to create results Class and Section Wise.</li>
              <li class="mb-4">Results must be generated once per exam/ class/ section.</li>
              <li class="mb-4">To confirm result is published, Select the Publish Date or Today's Date will be selected by default.</li>
              <li class="mb-4">Click Confirm to lock the results.</li>
              <li class="mb-4">Only Admin can unpublish the results. (Result should not be unpublished without the Approvals of the Principal.)</li>
            </ul>
          </div>
        </section>
      </div>
      
      <!-- Modal Section -->
      <div class="modal" :class="{ 'is-active': modalVisible }">
        <div class="modal-background" @click="closeModal"></div>
        <div class="modal-card">
          <header class="modal-card-head has-text-left">
            <h1 class="modal-card-title">{{ resultName }} for  
              CLASS - {{ modalClassName }} {{ modalSectionName ? '(' + modalSectionName + ')': '' }} ({{ CurrentYear }})</h1>
            <h2>Status: {{ modalPublished ? 'Published' : 'Not Published' }}</h2>
            <button class="delete ml-2" aria-label="close" @click="closeModal"></button>
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
                    <th>Mark Scored</th>
                    <th>Percentage</th>
                    <th>Division</th>                  
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(res, index) in modalResults" :key="index">
                    <td>{{ res.Rank }}</td>
                    <td>{{ res.Name }}</td>
                    <td>{{ res.RollNo }}</td>
                    <td>{{ res.TotalMaxMark }}</td>
                    <td>{{ res.TotalMarksObtained }}</td>
                    <td>{{ res.Percentage }}%</td>
                    <td>{{ res.Division }}</td>                    
                    <td>
                      <span class="tag" :class="res.ResultStatus === 'Pass' ? 'is-success' : res.ResultStatus === 'Fail'? 'is-danger' : 'is-warning'">
                        {{ res.ResultStatus }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <footer class="modal-card-foot is-flex is-justify-content-flex-end">
            <button class="button is-dark mr-2" @click="closeModal">Close</button>
                
          </footer>
        </div>
      </div>
    </div>
    <div v-else class="notification is-success has-text-centered mt-5">
      Generating results, please wait...
    </div>    
  </div>  
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'
const { CurrentYearId, CurrentYear } = useAcademicYear()
const { PassingPercentage, loadActiveExam } = useActiveExam()

import { useResultStatus } from '../../composables/useResultStatus'
const { isPublished, publishDate, checkResultStatus } = useResultStatus()

import { useResultNames } from '../../composables/useResultNames'
const { resultName, resultType, setResultName } = useResultNames()

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
const modalClassId = ref('')
const modalSectionId = ref('')
const modalPublished = ref(false)
const currentDate = ref('')
const userRole = ref('')

onMounted(async () => {
  await loadActiveExam()
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  currentDate.value = formattedDate; 
  checkResultStatus(currentExamId.value, CurrentYearId.value)
  fetchMarkEntryStatus()
  getUser()      
})

watch(() => route.query.type, async(newType) => {
  examType.value = newType
  await getExam()  
  setResultName(newType)
  fetchMarkEntryStatus()

}, { immediate: true })


async function getExam() {
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  currentExamId.value = result.exam.Id
  currentExamName.value = result.exam.ExamName
  // checkResultStatus(currentExamId.value, CurrentYearId.value) 
}

async function getUser() {
  const user = await window.electronAuth.getCurrentUser()
  if (user) {    
    userRole.value = user.role
  }
}

const canAccess = (requiredRoles) => {
  return requiredRoles.includes(userRole.value)
}

const filteredClassSectionStatus = computed(() => {
  return classSectionStatus.value.filter(item => item.finishedSubjects !== 0);
})
//console.log("Filtered Class Section Status:", filteredClassSectionStatus.value)


// async function checkPublishStatus() {
//   try {
//     // Get counts from both tables
//     const status = await window.electronAPI.getPublishStatus({
//       academicYearId: CurrentYearId.value,
//       activeExamId: currentExamId.value      
//     })
//     // markEntryCount.value = status.markEntryCount
//     // resultStatusCount.value = status.resultStatusCount
//     publishDate.value = status.publishDate || ''
//     if(publishDate.value){
//       resultPublished.value = true
//     }
//     else {
//       resultPublished.value = false
//     }

//   } catch (error) {
//     console.error("Error checking publish status:", error)    
//   }
// }

async function publishResult() {
 // if (!canPublish.value) {
 //   window.electronAPI.showInfoDialog("Cannot publish results - not all results are generated")
 //   return
 // }
 // As per the request by school admin, allow publishing even if not all results are generated

  isLoading.value = true
  try {
    const response = await window.electronAPI.publishResults({
      academicYearId: CurrentYearId.value,
      activeExamId: currentExamId.value,
      publishDate: currentDate.value
    })

    if (response.success) {
      window.electronAPI.showInfoDialog("Results published successfully.")
      // You might want to refresh the status after publishing
      //checkPublishStatus()
      checkResultStatus(currentExamId.value, CurrentYearId.value)
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

function unPublishResults(){
  window.electronAPI.showConfirmationDialog("Are you sure you want to unpublish the results?")
    .then(async (confirmed) => {
      if (confirmed) {
        try {
          const response = await window.electronAPI.unpublishResults({
            academicYearId: CurrentYearId.value,
            activeExamId: currentExamId.value
          })
          if (response.success) {
          //  location.reload('/result/create?type=' + examType.value) //reload the page
            window.electronAPI.showInfoDialog("Results unpublished successfully.")
            checkResultStatus(currentExamId.value, CurrentYearId.value)
            fetchMarkEntryStatus()
            
          } else {
            window.electronAPI.showErrorDialog("Failed to unpublish results: " + (response.message || "Unknown error"))
          }
        } catch (error) {
          console.error("Error unpublishing results:", error)
          window.electronAPI.showErrorDialog("An error occurred while unpublishing results")
        }
      }
    })
}

function goToMarkEntry(examType) {
  router.push({
    path: '/marks/marks-entry',
    query: {  
      type: examType,
    }
  })  
}


async function fetchMarkEntryStatus() {
  try {
    const response = await window.electronAPI.getmarkEntryStatus(currentExamId.value, examType.value)
    if (response.success) {
      const verifiedStatus = await Promise.all(
        response.data.map(async item => ({
          ...item,
          resultGenerating: false,
          resultStatus: await window.electronAPI.verifyResultStatus({
            academicYearId: CurrentYearId.value,
            resultType:  resultType.value,//if examType is not terminal, result will be final
            examId: currentExamId.value,
            classId: item.classId,
            sectionId: item.sectionId || 0
          })
        }))
      )
      console.log("isPublished:", isPublished.value)
      if( examType.value === 'selection'){
        classSectionStatus.value = verifiedStatus.filter(item => item.className === 'X')
      }   else {
        classSectionStatus.value = verifiedStatus
      }

    }
  } catch (error) {
    console.error('Error:', error)
  }
}

//className and sectionName is for Displaying in Modal
async function generateResult(classId, sectionId) {  
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
    //console.log("Passing Percentage in API:", PassingPercentage.value)
    const response = await window.electronAPI.generateResults({
      academicYearId: CurrentYearId.value,
      examType: examType.value,
      resultType: resultType.value,  //if examType is not terminal, result will be final
      examId: currentExamId.value,
      classId,
      sectionId,
      PassingPercentage: PassingPercentage.value
    })
    
    if (response.success) {
      isGenerating.value = false
      classSectionStatus.value[index].resultGenerating = false
      await loadModalResults(classId, sectionId, isPublished.value)
      modalVisible.value = true
      isGenerating.value = false
      fetchMarkEntryStatus()      
      showSuccess('Results generated successfully')
    }
    //console.log('Failed to generate result')
  } catch (error) {
    console.error('Generation error:', error)
    showError('Error during result generation')
  }
}

//Load Results for Modal
async function loadModalResults(classId, sectionId, isPublished) {
  modalVisible.value = true 
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
    modalClassId.value = classId
    modalSectionId.value = sectionId
    modalPublished.value = isPublished
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

function showSuccess(message) {
  window.electronAPI.showInfoDialog(`SUCCESS: ${message}`)
}
function showError(message) {
  window.electronAPI.showErrorDialog(`ERROR: ${message}`)
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

