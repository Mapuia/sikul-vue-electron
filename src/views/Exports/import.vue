<template>
  <div class="form-container box wide mt-6">
    <div v-if="canAccess(['deo','teacher'])">     

      <div class="mb-4 is-justify-content-center">
        <div class="has-text-centered mb-4">
        <h1 class="title is-4">Import System Data for {{ CurrentYear }}</h1> 
        <p class="help is-warning">(Import MasterData before Exam Settings)</p>    
        </div>
        <table class="table" style="margin: 0 auto;">
          <tbody>          
            <tr>  
              <td class="has-text-weight-semibold">Import Master Data</td>
              <td>
                <button class="button is-primary is-small" @click="importMasterData">
                  <i class="fas fa-file-import mr-2"></i>Import Master Data
                </button>
              </td>
            </tr>
            <tr>
              <td class="has-text-weight-semibold">Import Current Year Settings</td>
              <td>
                <button class="button is-primary is-small" @click="importSettings">
                  <i class="fas fa-file-import mr-2"></i>Import Settings
                </button>
                
              </td>
            </tr>
          </tbody>
        </table>    
      </div>

    </div>
    <!-- Class and Section Selection -->
    
    
    <div  class=" ">
      <div class="has-text-centered mb-4">
        <h1 class="title is-4">Import Student Data for {{ CurrentYear }}</h1>      
      </div>
      <table class="table" style="margin: 0 auto;">
        <tbody>
          <tr>
            <td class="has-text-weight-semibold">Import Student Data</td>
            <td class="has-text-right">
              <button class="button is-primary is-small" @click="importStudentData">
                <i class="fas fa-file-import mr-2"></i>Import
              </button>
            </td>
          </tr>
          <tr>
            <td class="has-text-weight-semibold">Import Half Yearly Examination Marks</td>
            <td class="has-text-right">
              <button class="button is-primary is-small" @click="importHalfYearlyData">
                <i class="fas fa-file-import mr-2"></i>Import
              </button>
            </td>
          </tr>
          <tr>
            <td class="has-text-weight-semibold">Import Annual Examination Marks</td>
            <td class="has-text-right">
              <button class="button is-primary is-small" @click="importAnnualData">
                <i class="fas fa-file-import mr-2"></i>Import
              </button>
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

const currentUser = ref('');
const userRole = ref('');

async function getUser(){
  const user = await window.electronAuth.getCurrentUser();
  if (user) {
    currentUser.value = user.username.charAt(0).toUpperCase() + user.username.slice(1);
    userRole.value = user.role;
  }
}

// Role-based access control
const canAccess = (requiredRoles) => {
  return requiredRoles.includes(userRole.value);
};

console.log('Current User:', currentUser.value);
console.log('User Role:', userRole.value);

// Helper function to show success message
function showSuccess(message, details = '') {
  window.electronAPI.showInfoDialog(`${message}\n\n${details}`)
}

// Helper function to show error
function showError(message) {
  window.electronAPI.showErrorDialog(`Error: ${message}`)
}

// Helper function to open file dialog
async function openImportDialog(acceptExtensions) {
  const { filePaths } = await window.electronAPI.openDialog({
    properties: ['openFile'],
    filters: [{ name: 'Data Files', extensions: acceptExtensions }]
  })
  return filePaths?.[0]
}

// Master Data Import
async function importMasterData() {
  try {
    const filePath = await openImportDialog(['json'])
    if (!filePath) return

    if (!confirm('Are you sure you want to import master data? This will overwrite existing data.')) {
      return
    }

    const result = await window.electronAPI.importMasterData(filePath)
    
    if (result.success) {
      showSuccess(
        'Master data imported successfully!',
        `Imported:
        ${result.results.classes.imported} classes,
        ${result.results.sections.imported} sections,
        ${result.results.subjects.imported} subjects,
        ${result.results.exams.imported} exams`
      )
      await fetchClasses() // Refresh classes after import
    } else {
      showError(`Import failed: ${result.message}`)
    }
  } catch (error) {
    console.error('Import error:', error)
    showError('Failed to import master data')
  }
}

// Settings Import
async function importSettings() {
  try {
    const filePath = await openImportDialog(['json'])
    if (!filePath) return

    if (!confirm('Are you sure you want to import settings? This will overwrite existing data.')) {
      return
    }
    const response = await window.electronAPI.importSettings({
      academicYearId: CurrentYearId.value,
      filePath: filePath
    })

    if (response.success) {
      showSuccess('Settings imported successfully!')
      location.reload()
    } else {
      showError(`Failed to import settings: ${response.message}`)
    }
  } catch (error) {
    console.error('Error importing settings:', error)
    showError('An error occurred while importing settings')
  }
}

// Student Data Import
async function importStudentData() {
  try {
    
    const filePath = await openImportDialog(['json'])
    if (!filePath) return

    if (!confirm('Are you sure you want to import students data? This will overwrite existing data.')) {
      return
    }

    const response = await window.electronAPI.importStudentData({      
      academicYearId: CurrentYearId.value,
      filePath: filePath
    })

    if (response.success) {
      showSuccess('Student data imported successfully!')
    } else {
      showError(`Failed to import student data: ${response.message}`)
    }
  } catch (error) {
    console.error('Error importing student data:', error)
    showError('An error occurred while importing student data')
  }
}

// Half Yearly Marks Import
async function importHalfYearlyData() {
  try {  

    examType.value = 'terminal'
    await getExam()
    
    const filePath = await openImportDialog(['json', 'csv'])
    if (!filePath) return

    const response = await window.electronAPI.importMarksData({
      examId: currentExamId.value,
      examType: 'terminal',
      academicYearId: CurrentYearId.value,
      filePath: filePath
    })

    if (response.success) {
      showSuccess('Half Yearly marks imported successfully!')
    } else {
      showError(`Failed to import marks: ${response.message}`)
    }
  } catch (error) {
    console.error('Error importing half yearly marks:', error)
    showError('An error occurred while importing marks')
  }
}

// Annual Marks Import
async function importAnnualData() {
  try {  

    examType.value = 'annual'
    await getExam()
    
    const filePath = await openImportDialog(['json', 'csv'])
    if (!filePath) return

    const response = await window.electronAPI.importMarksData({
      examId: currentExamId.value,
      examType: 'annual',
      academicYearId: CurrentYearId.value,
      filePath: filePath
    })

    if (response.success) {
      showSuccess('Annual marks imported successfully!')
    } else {
      showError(`Failed to import marks: ${response.message}`)
    }
  } catch (error) {
    console.error('Error importing annual marks:', error)
    showError('An error occurred while importing marks')
  }
}

// Existing component functions
async function getExam() {
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  currentExamId.value = result.exam.Id
  currentExamName.value = result.exam.ExamName
}

const className = computed(() => {
  const selectedClass = classes.value.find(cls => cls.Id === selectedClassId.value)
  return selectedClass ? selectedClass.ClassName : ''
})

const sectionName = computed(() => {
  const selectedSection = sections.value.find(sec => sec.Id === selectedSectionId.value)
  return selectedSection ? selectedSection.SectionName : ''
})

async function fetchClasses() {
  try {
    const response = await window.electronAPI.getClasses()
    if (response.success) {
      classes.value = response.classes
    }
  } catch (error) {
    console.error('Error fetching classes:', error)
    showError('Failed to load classes')
  }
}

async function fetchSections() {
  try {
    sections.value = []
    selectedSectionId.value = ''    
    const response = await window.electronAPI.getSectionsByClassId(selectedClassId.value)
    if (response.success) {
      sections.value = response.sections 
      
      if (sections.value.length === 1) {  
        selectedSectionId.value = sections.value[0].Id
      }
    }
  } catch (error) {
    console.error('Error fetching sections:', error)
    showError('Failed to load sections')
  }
}

watch(selectedClassId, async (newClassId) => {
  if (newClassId) {
    await fetchSections()
    if (sections.value.length < 2) {
      selectedSectionId.value = sections.value[0]?.Id || ''
      selected.value = true
    }
  } else {
    sections.value = []
    selectedSectionId.value = ''
  }
})

watch(selectedSectionId, (newSectionId) => {
  selected.value = !!newSectionId
})

onMounted(async () => {
  await getUser()
  await fetchClasses()
})
</script>

<style scoped>

</style>