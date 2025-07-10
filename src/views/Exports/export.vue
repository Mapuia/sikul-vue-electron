<template>
  <div class="form-container box wide">
    <div class="has-text-centered mb-4">
      <h1 class="title is-4">Export System Data for {{ CurrentYear }}</h1>      
    </div>

    <div class="box mt-6 is-flex is-flex-direction-horizontal is-justify-content-center">
      <table class="table" style="margin: 0 auto;">
        <tbody>          
          <tr>  
            <td class="has-text-weight-semibold">Export Master Data</td>
            <td>
              <button class="button is-primary is-small " @click="exportMasterData"><i class="fas fa-file-export mr-2"></i>Export Master Data</button>
            </td>
          </tr>
          <tr>
            <td class="has-text-weight-semibold">Export Current Year Exam Settings</td>
            <td>
              <button class="button is-primary is-small " @click="exportSettings"><i class="fas fa-file-export mr-2"></i>Export Settings</button>
            </td>
          </tr>
        </tbody>
      </table> 
    </div>

    <!-- Class and Section Selection -->
    <div class="box">
      <div class="has-text-centered mb-4">
        <h1 class="title is-4">Export Stydent Data for {{ CurrentYear }}</h1>
        <h2 class="subtitle is-5">Select Class and Section you want to export</h2>      
      </div>
      <div class="columns is-vcentered">
        <div class="column">
          <div class="field">
            <label class="label">Class</label>
              <div class="select is-fullwidth">
                <select v-model="selectedClassId" @change="fetchSections">
                  <option disabled value="">-- Select Class --</option>
                  <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                    {{ cls.ClassName }}
                  </option>
                </select>
              </div>
          </div>
        </div>
        <div class="column">
          <div class="field">
            <label class="label">Section</label>
              <div class="select is-fullwidth">
                <select v-model="selectedSectionId" :disabled="!selectedClassId || sections.length === 0" @change="fetchResults">
                  <option disabled value="">-- Select Section --</option>
                  <option v-for="sec in sections" :key="sec.Id" :value="sec.Id">
                    {{ sec.SectionName }}
                  </option>
                </select>
              </div>
          </div>
        </div>
      </div>
    </div>
    
      
    <div v-if="selected" class="box  is-flex is-flex-direction-column" style="display: flex; ">
      <p class="subtitle is-6">Selected Class: {{ className }} - Section: {{ sectionName }}, Date: {{ currentDate }} </p>      
      <table class="table " style="margin: 0 auto;">
        <tbody>
          <tr>
            <td class="has-text-weight-semibold">Export Student Data</td>
            <td class="has-text-right">
              <button class="button is-primary is-small" @click="exportStudent(className, sectionName)"><i class="fas fa-file-export mr-2"></i>Export</button>
            </td>
          </tr>
          <tr>
            <td class="has-text-weight-semibold">Export Half Yearly Examination Marks</td>
            <td class="has-text-right">
              <button class="button is-primary is-small" @click="exportHalfYearly(className, sectionName)"><i class="fas fa-file-export mr-2"></i>Export</button>
            </td>
          </tr>
          <tr>
            <td class="has-text-weight-semibold">Export Annual Examination Marks</td>
            <td class="has-text-right">
              <button class="button is-primary is-small" @click="exportAnnual(className, sectionName)"><i class="fas fa-file-export mr-2"></i>Export</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAcademicYear } from '../../composables/useAcademicYear'

const { CurrentYearId, CurrentYear } = useAcademicYear()

const route = useRoute()

const isLoading = ref(false)
const selected = ref(false)
const currentExamId = ref('')
const currentExamName = ref('')

const classes = ref([])
const sections = ref([])
const selectedClassId = ref('')
const selectedSectionId = ref('')
const examType = ref('')



const currentDate = ref(new Date().toLocaleDateString('en-IN', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
}))

async function getExam() {
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  currentExamId.value = result.exam.Id
  currentExamName.value = result.exam.ExamName
  //console.log("Current Exam:", currentExamName.value, currentExamId.value)
}

const className = computed(() => {
  const selectedClass = classes.value.find(cls => cls.Id === selectedClassId.value)
  return selectedClass ? selectedClass.ClassName : ''
})

const sectionName = computed(() => {
  const selectedSection = sections.value.find(sec => sec.Id === selectedSectionId.value)
  return selectedSection ? selectedSection.SectionName : ''
})

onMounted(async () => {
  await fetchClasses()
})

async function fetchClasses() {
  try {
    const response = await window.electronAPI.getClasses()
    if (response.success) {
      classes.value = response.classes
    }
  
  } catch (error) {
    console.error('Error fetching classes:', error)
  }
}

watch(selectedClassId, async (newClassId) => {
  if (newClassId) {
    await fetchSections()
    if (sections.value.length < 2) {
      selectedSectionId.value = 0
      selected.value = true
    }
  } else {
    sections.value = []
    selectedSectionId.value = ''
    results.value = []
  }
})

async function fetchSections() {
  try {
    sections.value = []
    selectedSectionId.value = 0    
    const response = await window.electronAPI.getSectionsByClassId(selectedClassId.value)
    if (response.success) {
      sections.value = response.sections 
      
      if (sections.value.length === 0) {  
        selectedSectionId.value = 0
      }
    }
    
  } catch (error) {
    console.error('Error fetching sections:', error)
  }
}

watch(selectedSectionId, async (newSectionId) => {
  if (newSectionId) {
    selected.value = true
  }
})

async function exportSettings() {
  try {
    const response = await window.electronAPI.exportSettings(CurrentYearId.value)
    if (response.success) {
      window.electronAPI.showInfoDialog('Settings exported successfully.')
    } else {
      window.electronAPI.showErrorDialog('Failed to export settings.')
    }
  } catch (error) {
    console.error('Error exporting settings:', error)
    window.electronAPI.showErrorDialog('An error occurred while exporting settings.')
  }
}
async function exportMasterData() {
  try {
    const response = await window.electronAPI.exportMasterData()
    if (response.success) {
      window.electronAPI.showInfoDialog('Master Data exported successfully.')
    } else {
      window.electronAPI.showErrorDialog('Failed to export Master Data.')
    }
  } catch (error) {
    console.error('Error exporting Master Data:', error)
    window.electronAPI.showErrorDialog('An error occurred while exporting Master Data.')
  }
}
//fetch all from Admissions for selectedClassId and SelectedSectionId for CurrentYearId
//then fetch Student Details from Students table of the StudentId from the fetched Admissions Data
async function exportStudent(className, sectionName) {
  const response = await window.electronAPI.exportStudentData({
    classId: selectedClassId.value,
    sectionId: selectedSectionId.value,
    academicYearId: CurrentYearId.value,
    className: className,
    sectionName: sectionName || 0
  })

  if (response.success) {
    window.electronAPI.showInfoDialog('Student data exported successfully.')
  } else {
    window.electronAPI.showErrorDialog('Failed to export student data.')
  }
}

//examtype.value = 'terminal', use getExam() to get ExamId
//fetch marks and all cummulative marks for selectedClassId and SelectedSectionId ExamId for CurrentYearId 
async function exportHalfYearly(className, sectionName) {
  examType.value = 'terminal'
  await getExam() // this will set currentExamId

  const response = await window.electronAPI.exportMarksData({
    examId: currentExamId.value,
    examType: 'terminal',
    classId: selectedClassId.value,
    sectionId: selectedSectionId.value,
    academicYearId: CurrentYearId.value,
    className: className,
    sectionName: sectionName || 0
  })

  if (response.success) {
    window.electronAPI.showInfoDialog('Half Yearly exam data exported.')
  } else {
    window.electronAPI.showErrorDialog('Export failed.')
  }
}

//examtype.value = 'annual' use getExam() to get ExamId
//fetch marks and all cummulative marks and finalCumulative marks for selectedClassId and SelectedSectionId and ExamId for CurrentYearId 
async function exportAnnual(className, sectionName) {
  examType.value = 'annual'
  await getExam()

  const response = await window.electronAPI.exportMarksData({
    examId: currentExamId.value,
    examType: 'annual',
    classId: selectedClassId.value,
    sectionId: selectedSectionId.value,
    academicYearId: CurrentYearId.value,
    className: className,
    sectionName: sectionName || 0
  })

  if (response.success) {
    window.electronAPI.showInfoDialog('Annual exam data exported.')
  } else {
    window.electronAPI.showErrorDialog('Export failed.')
  }
}

</script>

<style scoped>


</style>