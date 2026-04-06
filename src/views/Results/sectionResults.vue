<template>
  <div class="form-container box wide">
    <div class="no-print">
      <div class="has-text-centered mb-4">
        <h1 class="title is-4">{{ resultName }}, {{ CurrentYear }}</h1>
        <h2 class="subtitle is-5" v-if="resultType !== 'selection' && resultType !== 'provisional'">Select Class and Section</h2>
      </div>

      <div class="box">
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
    </div>

    <div v-if="isLoading" class="has-text-centered mt-4 no-print">
      <progress class="progress is-medium is-primary" max="100"></progress>
      <p>Loading results...</p>
    </div>

    <div v-if="results && resultSummary" class="result-container">
      <div v-if="selectedClassId && results.length > 0" class="print-container"> 
        <div class="has-text-centered mt-4 no-print">
          <button class="button is-primary" @click="downloadPDF">Download PDF</button>
        </div> 
        <div class="print-page"> 
          <div class="header-wrapper has-text-centered mb-4" style="position: relative;">
            <img src="/sikul_logo.png" alt="School Logo" style="position: absolute; top: 0; left: 0; height: 60px;" />
            <h1 class="result-title">CALVARY HIGHER SECONDARY SCHOOL, TUIDU</h1>
            <h2 class="result-subtitle">{{ resultName }} : {{ CurrentYear }}</h2>
            <h1 class="result-title"> Class {{ resultSummary.className }}{{ resultSummary.sectionName? ', Section ' + resultSummary.sectionName : '' }}</h1>
          </div>

          <div class="mt-4">
            <div class="table-container">
              <table class="result-table is-fullwidth is-striped is-bordered mb-2">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Full Mark</th>
                    <th>Mark Scored</th>
                    <th>Percentage</th>
                    <th>Division</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in results" :key="result.StudentId">
                    <td style="font-weight: 700;">{{ result.Rank }}</td>
                    <td>{{ result.RollNo }}</td>
                    <td style="text-align: left; width: 250px;">{{ result.Name }}</td>
                    <td>{{ result.TotalMaxMark }}</td>
                    <td>{{ result.TotalMarksObtained }}</td>
                    <td>{{ result.Percentage }}%</td>
                    <td>{{ result.ResultStatus === 'Pass' ? result.Division : '' }}</td>
                    <td>
                      <span class="tag" :class="result.ResultStatus === 'Pass' ? 'is-success' : result.ResultStatus === 'Fail'? 'is-danger': 'is-warning'">
                        {{ result.ResultStatus }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="columns is-vcentered summary-section" style="align-items: flex-end; display: flex;">
              <div class="column">
                <table class="bl-table">
                  <tbody>
                    <tr><th>No. of Students</th><td>{{ resultSummary.totalStudents }}</td></tr>
                    <tr><th style="width:200px">No. of Appeared</th><td>{{ resultSummary.appeared }}</td></tr>
                    <tr><th>No. of Passed</th><td>{{ resultSummary.passed }}</td></tr>
                    <tr><th>No. of Failed</th><td>{{ resultSummary.failed }}</td></tr>
                    <tr><th>Passed %</th><td>{{ resultSummary.passedPercentage.toFixed(2) }}%</td></tr>
                    <tr><th>Failed %</th><td>{{ resultSummary.failedPercentage.toFixed(2) }}%</td></tr>
                  </tbody>
                </table>
              </div>

              <div class="column">
                <table class="bl-table1">
                  <tbody>
                    <tr><th>No. of Distinction</th><td>{{ resultSummary.distinction }}</td></tr>
                    <tr><th>No. of I Division</th><td>{{ resultSummary.firstDivision }}</td></tr>
                    <tr><th>No. of II Division</th><td>{{ resultSummary.secondDivision }}</td></tr>
                    <tr><th>No. of III Division</th><td>{{ resultSummary.thirdDivision }}</td></tr>
                    <tr><th>No. of Simple Pass</th><td>{{ resultSummary.simplePass }}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="columns is-vcentered is-mobile mt-6" style="display: flex;">
              <div class="column has-text-left">
                <p class="publish-date">Publish Date: {{ DisplayDate(publishDate) }}</p>
              </div>
              <div class="column has-text-right">
                <p style="border-top: 1px solid black; display: inline-block; padding-top: 5px; min-width: 200px; text-align: center;">
                  {{ teacher?.designation || 'Signature of Class Teacher' }}
                </p>
              </div>
            </div>
          </div>  
        </div> 

        <div class="has-text-centered mt-4 no-print">
          <button class="button is-primary" @click="downloadPDF">Download PDF</button>
        </div>            
      </div>          

      <div v-else-if="!isLoading && selectedClassId !== ''" class="notification is-danger mt-4 no-print">
        No results found for Class {{ className }}{{ sectionName? ' Section ' + sectionName : '' }}.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'

const { CurrentYearId, CurrentYear } = useAcademicYear()
const { loadActiveExam } = useActiveExam()
const route = useRoute()

const examType = ref('')
const resultName = ref('')
const currentExamId = ref('')
const resultSummary = ref(null) 
const isLoading = ref(false)
const classes = ref([])
const sections = ref([])
const selectedClassId = ref('')
const selectedSectionId = ref('')
const results = ref([])
const resultType = ref('')
const publishDate = ref('')
const teacher = ref({ name: '', designation: '' })

const DisplayDate = dateStr => {
  if(!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
}

watch(() => route.query.type, (newType) => {
  resultType.value = newType
  examType.value = (newType === 'final') ? 'annual' : (newType === 'provisional' ? 'selection' : newType)
  
  switch (resultType.value) {
    case 'selection' : resultName.value = 'Selection Test Results'; break;
    case 'provisional': resultName.value = 'Selection Test Final Results'; break;
    case 'final': resultName.value = 'Final (Annual) Results'; break;
    case 'terminal': resultName.value = 'Half Yearly Exam Results'; break;
  }
  getExam()  
  selectedClassId.value = ''; selectedSectionId.value = ''; results.value = [];
}, { immediate: true })

async function getExam() {
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  if(result) currentExamId.value = result.exam.Id
}

async function fetchResults() {
  if (!selectedClassId.value) return
  isLoading.value = true
  try {
    const res = await window.electronAPI.getSectionResults({
      academicYearId: CurrentYearId.value,
      examId: currentExamId.value,
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value || 0,
      resultType: resultType.value
    });
    if (res) {
      results.value = res.results; 
      resultSummary.value = res.summary;
      // KEY FIX: Assign the publish date from the API response
      // publishDate.value = res.publishDate || res.summary?.publishDate || '';
      const status = await window.electronAPI.getPublishStatus({
          academicYearId: CurrentYearId.value,
          activeExamId: currentExamId.value      
        })   
        publishDate.value = status.publishDate || ''
      fetchClassTeacherInfo();
    }
  } finally { isLoading.value = false }
}

async function fetchSections() {
  if (!selectedClassId.value) return
  const response = await window.electronAPI.getSectionsByClassId(selectedClassId.value)
  if (response.success) {
    sections.value = response.sections
    if (sections.value.length === 0) { selectedSectionId.value = 0; fetchResults(); }
  }
}

async function fetchClasses() {
  const result = await window.electronAPI.getClasses();
  if (result.success) {
    if(resultType.value === 'selection' || resultType.value === 'provisional') {
      classes.value = result.classes.filter(cls => cls.ClassName === 'X')
    } else if(resultType.value === 'final') {
      classes.value = result.classes.filter(cls => cls.ClassName !== 'X')
    } else {
      classes.value = result.classes
    }
  }
}

async function fetchClassTeacherInfo() {
  const response = await window.electronAPI.getTeacherSignatory(selectedClassId.value, selectedSectionId.value || 0)
  if (response.success && response.data) {
    teacher.value = { name: response.data.Name, designation: response.data.Designation }
  }
}

const className = computed(() => classes.value.find(cls => cls.Id === selectedClassId.value)?.ClassName || '')
const sectionName = computed(() => sections.value.find(sec => sec.Id === selectedSectionId.value)?.SectionName || '')

onMounted(async () => {
  await getExam(); await loadActiveExam(); await fetchClasses();
})

// USE ELECTRON API FOR PRINTING
async function downloadPDF() {
  await window.electronAPI.generatePDF(`Result_${className.value}-${sectionName.value}.pdf`)
}
</script>

<style scoped>
/* YOUR ORIGINAL STYLES - DO NOT CHANGE */
.table-container { overflow-x: auto; margin-top: 1rem; color: black; }
.notification { margin-bottom: 0; }
.tag { min-width: 60px; justify-content: center; }
.select { width: 100%; }
.box { margin-bottom: 1.5rem; }
.print-page { padding: 3rem; background: white; color: black; margin-top: -2.5rem; }
.smaller-header { font-size: 12px; text-align: center; color: black; }
.smaller-cell { font-size: 12px; text-align: center; color: black; }
.columns { color: black; }
.result-title { font-size: 14pt; font-weight: 900; }
.result-subtitle { font-size: 12pt; font-weight: 500; }
.result-table { border: 2px solid black; width: 100%; border-collapse: collapse; font-size: 11pt; }
.result-table td { border: .1px solid black; padding: 0.1rem 0.3rem; text-align: center; color: black; }
.result-table th { border: 1px solid black; padding-left: 0.2rem; padding-right: 0.2rem; border-bottom: 2px solid black; text-align: center; color: black; vertical-align: middle; font-size: 16px; }
.bl-table { width: 100%; border: 2px solid black; padding: 0.1rem; font-size: 14px; border-collapse: collapse; }
.bl-table th { font-size: 14px; color: black; border: 1px solid black; padding: 0 0.5rem; font-weight: 500; }
.bl-table tbody td { min-width: 60px; font-size: 14px; color: black; border: 1px solid black; text-align: center; font-weight: 700; }
.bl-table1 { width: 100%; border: 2px solid black; padding: 0.1rem; border-collapse: collapse; }
.bl-table1 th { font-size: 14px; color: black; border: 1px solid black; padding-left: 0.5rem; padding-top: 0.12rem; padding-bottom: 0.12rem; font-weight: 500; }
.bl-table1 tbody td { min-width: 60px; font-size: 14px; color: black; border: 1px solid black; text-align: center; padding-top: 0.14rem; padding-bottom: 0.12rem; font-weight: 700; }

/* ELECTRON PRINT OVERRIDES */
@media print {
  .no-print, .navbar { display: none !important; }
  
  @page {
    size: A4 portrait;
    margin: 15mm 10mm; /* Fixes the padding issue across all pages */
  }

  body, html, .form-container { 
    margin: 0 !important; 
    padding: 0 !important; 
    background: white !important; 
  }

  .print-page { padding: 0 !important; }

  /* Automatic table headers on every page */
  .result-table { page-break-inside: auto; }
  .result-table thead { display: table-header-group; }
  .result-table tr { page-break-inside: avoid; page-break-after: auto; }
  
  .summary-section, .signature { page-break-inside: avoid; }
  .columns { display: flex !important; }

  .box, .card, .table, .result-container {
    box-shadow: none !important;
    
  }
}
</style>