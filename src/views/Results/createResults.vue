<template>
  <div class="form-container wide">
    <div v-if="Publishable">
    <h1 class="title is-4 has-text-centered">Create Result - {{ currentExamName }} ({{ currentYear }})</h1>
      </div>
      <div v-else><h1 class="title is-4 has-text-centered">{{ currentExamName }} ({{ currentYear }})</h1>
        <h2 class="subtitle is-5 has-text-centered mb-2">Result is not Published!</h2>
      </div>
    <section class="box">
    
      <h1 class="title is-4 has-text-centered">Statistics</h1>

      <div v-if="errorMessage" class="notification is-danger fixed-notification">
        {{ errorMessage }}
      </div>

      <div v-if="loading" class="has-text-centered">
        <button class="button is-loading is-light is-info">Loading</button>
      </div>

      <div v-else>
        <table class="table is-striped is-hoverable is-fullwidth">
          <thead>
            <tr>
              <th>Class</th>
              <th>Section</th>
              <th>No. of Students</th>
              <th>No. of Appearance</th>
              <th>Percentage</th>
              <th class="has-text-centered">Action</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="cls in classSectionStats" :key="cls.ClassId">
              <tr v-for="(section, index) in cls.Sections" :key="cls.ClassId + '-' + section.SectionId">
                <!-- Merge Class column -->
                <td v-if="index === 0" :rowspan="cls.Sections.length">{{ cls.ClassName }}</td>
                <td>{{ section.SectionName }}</td>
                <td>{{ section.TotalStudents }}</td>
                <td>{{ section.StudentsAppeared }}</td>
                <td>{{ section.TotalStudents > 0 ? ((section.StudentsAppeared / section.TotalStudents) * 100).toFixed(2) + '%' : "N.A" }}</td>
                
                <!-- Merge Action button column -->
                <td v-if="index === 0" :rowspan="cls.Sections.length ">
                  <div v-if="PublishedResult" class="buttons is-flex is-flex-direction-column">
                  <button class="button is-primary is-small " @click="createResult(cls.ClassId, cls.ClassName)">
                    Create Result
                  </button>
                  <button class="button is-light is-small " @click="createResult(cls.ClassId)">
                    View Result
                  </button>
                  </div>
                  <div v-else class="mt-4 is-flex is-justify-content-center is-align-items-center">
                    <i><small>No Action</small></i>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>
 
 
 <!--Section for Result Creation--> 
    <section class="box">
      <button class="button is-primary"></button>
    </section>

  </div> 
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'

const { currentYearId, currentYear} = useAcademicYear()
const { currentExamId, currentExamName, Publishable, Result_Published, loadActiveExam } = useActiveExam()

const classSectionStats = ref([])
const errorMessage = ref('')
const loading = ref(false)

console.log("Create Result !:", currentExamId.value) 

async function fetchClassSectionStats() {
  if (!currentYearId.value || !currentExamId.value) return

  loading.value = true
  errorMessage.value = ''
  try {
    const response = await window.electronAPI.getClassSectionStats({
      academicYearId: currentYearId.value,
      activeExamId: currentExamId.value
    })
    if (response.success) {
      classSectionStats.value = response.data
    } else {
      errorMessage.value = 'Failed to load class-section statistics.'
    }
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadActiveExam()
  fetchClassSectionStats()
})

watch([currentYearId, currentExamId], ([yearId, examId]) => {
  if (yearId && examId) {
    fetchClassSectionStats()
  } else {
    errorMessage.value = 'Failed to load class-section statistics.'
  }
})

// Handler for Create Result button
function createResult(classId,clsName,) {
  console.log('Creating result for class:', clsName)
 alert("Result is created for Class: " + clsName)
}
</script>
