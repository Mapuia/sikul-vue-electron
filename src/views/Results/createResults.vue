<template>
  <div  class="form-container full"> 
    <div>
      <h1 class="title is-4 has-text-centered mb-4">{{ resultName }} Result for Academic Session {{ CurrentYear }}</h1>
      
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
                  <th >#Subjects Entered</th>
                  <th >Mark Entry Status</th>
                  <th class="has-text-centered">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in classSectionStatus" :key="`${item.classId}-${item.sectionId}`">
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
                    >
                      View Only
                    </button>                    
                  </td>
                  
                  <td v-if="!item.resultStatus.isPublished">
                    <p class="help is-size-8 mt-1" :class="item.resultStatus.isVerified? 'is-info' : item.finishedSubjects === item.totalSubjects ? 'is-warning':'is-danger'">
                      <i>
                        {{ item.resultStatus.isVerified
                          ? 'Result generated'
                          : item.finishedSubjects === item.totalSubjects
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
                      <span v-else>Re-Generate Result</span>
                    </button>
                    <button
                      class="button is-small is-info"
                      @click="loadModalResults(item.classId, item.sectionId, item.resultStatus.isPublished)"
                    >
                      View & Publish
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
          <div class="help notification  ">
            <ul class="bullet">
              <li class="mb-4">Complete mark entry for all subjects to enable result generation</li>
              <li class="mb-4">Check box (Finished all students) in the Mark Entry must be check to enable Result generation</li>
              <li class="mb-4">Cumulative totals are automatically calculated during mark entry</li>
              <li class="mb-4">Click "Generate Result" to create results Class and Section Wise</li>
              <li class="mb-4">Results must be generated once per exam/ class/ section</li>
              <li class="mb-4">After Result are generated, Publish button will appear</li>
              <li class="mb-4">Once Results are published, they cannot be modified unless unpublished by Admin</li>
              <li class="mb-4">Click "View Results" to see the generated results</li>
            </ul>
          </div>
        </section>
      </div>
      
      <!-- Modal Section -->
      <div class="modal" :class="{ 'is-active': modalVisible }">
        <div class="modal-background" @click="closeModal"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <h1 class="modal-card-title">{{ resultName }} Results for  
              CLASS - {{ modalClassName }},{{ modalSectionName ? ' SECTION - ' + modalSectionName : '' }} ({{ CurrentYear }})</h1>
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
                <button              
                    :disabled="modalPublished"
                    class="button"
                    :class="modalPublished ? 'is-dark' : 'is-primary'"
                    @click="publishResult(modalClassId, modalSectionId)"
                >
                    {{ modalPublished ? 'Published' : 'Publish Result'}}
                </button>  
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
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'

const { CurrentYearId, CurrentYear } = useAcademicYear()
const { PassingPercentage, loadActiveExam } = useActiveExam()

const router = useRouter()
const route = useRoute()

const examType = ref('')
const resultName = ref('')
const currentExamId = ref('')
const currentExamName = ref('')
const classSectionStatus = ref([])
//const isResult = ref('')
const isLoading = ref(false)
const isGenerating = ref(false)
const modalVisible = ref(false)
const modalResults = ref([])
const modalClassName = ref('')
const modalSectionName = ref('')
const modalClassId = ref('')
const modalSectionId = ref('')
const modalPublished = ref('')

watch(() => route.query.type, (newType) => {
  examType.value = newType
  getExam()
  resultName.value = newType === 'terminal'? 'Half Yearly' : 'Final'  
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
    if (response.success) {
      const verifiedStatus = await Promise.all(
        response.data.map(async item => ({
          ...item,
          resultGenerating: false,
          resultStatus: await window.electronAPI.verifyResultStatus({
            academicYearId: CurrentYearId.value,
            resultType: examType.value === 'terminal' ? examType.value : 'final', //if examType is not terminal, result will be final
            examId: currentExamId.value,
            classId: item.classId,
            sectionId: item.sectionId || 0
          })
        }))
      )     
      classSectionStatus.value = verifiedStatus
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
      resultType: examType.value === 'terminal' ? examType.value : 'final',  //if examType is not terminal, result will be final
      examId: currentExamId.value,
      classId,
      sectionId,
      PassingPercentage: PassingPercentage.value
    })
    const isPublished = false
    if (response.success) {
      await loadModalResults(classId, sectionId, isPublished)
      modalVisible.value = true
      isGenerating.value = false
      fetchMarkEntryStatus()
      showNotification('success', 'Results generated successfully')
    }
    //console.log('Failed to generate result')
  } catch (error) {
    console.error('Generation error:', error)
    showNotification('danger', 'Error during result generation')
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

function publishResult(classId, sectionId) {
 //console.log('Published: ', classId, sectionId)
  window.electronAPI.publishResults({
    academicYearId: CurrentYearId.value,
    examId: currentExamId.value,
    classId,
    sectionId
  })
  .then(response => {
    if (response.success) {
      showNotification('success', 'Results published successfully')
      fetchMarkEntryStatus() // Refresh status after publishing
      closeModal()
    } else {
      showNotification('danger', response.message || 'Failed to publish results')
    }
  })
  .catch(error => {
    console.error('Publish error:', error)
    showNotification('danger', 'Error during result publishing')
  })
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

