<template>
  <div class="form-container full">
    <h1 class="title has-text-centered is-4">View {{ selected === 'Scholastic' ? 'Marks' : 'Grade' }} for {{ currentExamName }}</h1>
    <h2 class="subtitle has-text-centered">{{ examType ? "" : 'There is something wrong. Logout and login again'}}</h2>
   
    <div>
      <!--selected Tabs-->
      <div class="box columns mb-4">
        <div class="column">
          <div
            class="tab-button has-text-centered is-clickable p-3"
            :class="selected === 'Scholastic' ? 'has-background-primary has-text-black' : ''"
            @click="selected = 'Scholastic'"
          >
            Scholastic Subjects
          </div>
        </div>
        <div class="column">
          <div
            class="tab-button has-text-centered is-clickable p-3"
            :class="selected === 'Co-Scholastic' ? 'has-background-primary has-text-black' : ''"
            @click="selected = 'Co-Scholastic'"
          >
            Co-Scholastic Activities
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div v-if="successMessage" class="notification is-success fixed-notification pr-4" @click="successMessage = ''">
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="notification is-danger fixed-notification pr-4" @click="errorMessage = ''">
        {{ errorMessage }}
      </div>
      <div class="marks-entry-container">
        <aside class="left-panel box">
          <!-- Class Dropdown -->
          <div class="field">
            <label class="label">Class</label>
            <div class="select is-fullwidth is-small">
              <select v-model="selectedClassId">
                <option disabled value="">-- Select Class --</option>
                <option v-for="cls in classes" :key="cls.Id" :value="cls.Id">
                  Class - {{ cls.ClassName }}
                </option>
              </select>
            </div>
          </div>         

          <!-- Section Dropdown -->
          <div class="field">
            <label class="label">Section</label>
            <div class="select is-fullwidth is-small">
              <select v-model="selectedSectionId" :disabled="!selectedClassId || sections.length === 0">
                <option disabled value="">-- Select --</option>
                <option v-for="sec in sections" :key="sec.Id" :value="sec.Id">
                  {{ sec.SectionName }}
                </option>
              </select>
            </div>
          </div>

          <!-- Subject Dropdown -->
          <div class="field">
            <label class="label">{{ selected === "Scholastic" ? "Subject" : "Co-Scholastic Activities" }}</label>
            <div class="select is-fullwidth is-small">
              <select v-model="selectedSubjectId" :disabled="!selectedClassId || !selectedSectionId && sections.length > 0">
                <option disabled value="">-- Select --</option>
                <option v-for="subject in subjects" :key="subject.Id" :value="subject.Id">
                  {{ subject.SubjectName }} {{ subject.SubjectCategory ? '(' + subject.SubjectCategory + ')' : '' }}
                </option>
              </select>
            </div>
          </div>
        </aside>
      
        <!-- Scholastic Marks View -->
        <div v-if="selected === 'Scholastic'" class="main-content box column p-5">
          <div v-if="studentloaded && selectedSubjectId">
            <div class="title tab-heading has-text-weight-bold is-primary is-flex is-justify-content-space-between is-align-items-center">
              <div>
                {{ selectedSubjectName }}
              </div>
              <div class="tags are-medium">
                <span class="tag ml-2">Pass Mark ({{ PassingPercentage }}%)</span>
              </div>
            </div>
          
            <div v-if="students.length > 0" class="is-flex is-flex-direction-column">
              <table class="table is-bordered is-striped is-fullwidth mt-4">
                <thead>
                  <tr>
                    <th rowspan="2" style="width: 100px; vertical-align: middle">Roll No.</th>
                    <th rowspan="2" style="min-width: 150px; vertical-align: middle">Student Name</th>
                    <th colspan="3" class="has-text-centered">Marks Scored</th>                   
                    <th rowspan="2" style="vertical-align: middle">Appeared</th>
                    <th rowspan="2" style="vertical-align: middle">Status</th>
                    <th rowspan="2" style="vertical-align: middle">Action</th>
                  </tr>
                  <tr>
                    <th class="has-text-centered" style="min-width: 100px;">
                      {{examType === "terminal" ? 'First' : 'Second'}} Periodic Test<br />
                      (FM: {{ selectedSubjectCategory === 'Major' ? periodicMajorMaxMark : periodicMinorMaxMark }})
                    </th>
                    <th class="has-text-centered" style="min-width: 100px;">
                      {{ currentExamName }}<br />
                      (FM: {{ selectedSubjectCategory === 'Major' ? terminalMajorMaxMark : terminalMinorMaxMark }})
                    </th>
                    <th class="has-text-centered">Total Marks</th>                 
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in students" :key="student.StudentId">
                    <td style="text-align: center;">{{ student.RollNo }}</td>
                    <td>{{ student.Name }}</td>
                    <!-- First Periodic Test Mark -->
                    <td style="text-align: center;">
                      {{ periodicMarks[student.StudentId] }}
                    </td>
                    <!-- Terminal Mark -->
                    <td style="text-align: center;">
                      {{ termMarks[student.StudentId] }}
                    </td>

                    <!-- Total -->
                    <td class="has-text-centered">
                      {{calculateTotal(student.StudentId)}}
                    </td>
                    <td class="has-text-centered ">
                      <input
                        :checked="appeared[student.StudentId]"
                        :disabled="true"
                        type="checkbox"
                        v-model="appeared[student.StudentId]"
                        :true-value="1"
                        :false-value="0"
                      />
                    </td>
                    <!-- Status -->
                    <td>
                      <span class="tag" :class="statuses[student.StudentId] === 'Pass' ? 'is-success' : 'is-danger'">
                        {{ statuses[student.StudentId] || 'N/A' }}
                      </span>
                    </td>
                    <td v-if="Result_Published"><p class = "help has-text-danger">Result Published! Can not update marks</p></td>
                    <td v-else-if="appeared[student.StudentId]">
                      <button class="button is-info is-small" @click="openEditModal(student)"><i class="fas fa-edit mr-2"></i> Update</button>
                    </td>
                    <td v-else>
                      <span class="has-text-grey">Not Appeared</span>
                    </td>
                  </tr>
                </tbody>
              </table> 
            </div>            
          
            <div v-else class="notification is-info is-dark is-fullwidth has-text-centered">
                No students found for this section.
            </div>            
          </div>
        
          <div v-else class="is-flex is-flex-direction-column p-5">
            <div class="subtitle">Steps to Update Marks for Scholastic Subjects:</div>
            <div class="px-5">
              <ol class="mb-5"> 
                <li>Select Class
                  <span v-if="selectedClassId" class="icon has-text-info"><i class="fas fa-check"></i></span>
                </li>
                <li>Select Section 
                  <span v-if="selectedSectionId" class="icon has-text-info"><i class="fas fa-check"></i></span>
                </li>
                <li>
                  Select Subject
                  <span v-if="selectedSubjectId" class="icon has-text-info"><i class="fas fa-check"></i></span>           
                </li>
                <li>
                  Click Update for to edit the marks for student one by one.                            
                </li>               
              </ol>
            </div>
            <hr />
            <div class="subtitle">
              Information <span class="icon has-text-info">
              <i class="fas fa-info-circle"></i></span>
            </div>
            <div class="px-5">
              <ol class="mb-5"> 
                <li>
                  Student list and marks entered for the selected section will be opened.
                </li>              
                <li>
                  Update button will appear if Result has not been published. 
                </li></br>
                  
                
              </ol>
              <strong>Note:</strong> You can not update marks after result is published.
            </div>
          </div>              
        </div>
     
        <!-- Co-Scholastic Marks Entry -->
        <div v-else class="main-content box column p-5">         
            <div v-if="studentloaded && selectedSubjectId" class="is-flex is-flex-direction-column">
              <div class="title tab-heading has-text-weight-bold is-primary">
                {{ selectedSubjectName }}
              </div>

              <div v-if="students.length > 0" class="is-flex is-flex-direction-column">
                <table class="table is-bordered is-striped is-fullwidth">
                  <thead>
                    <tr>
                      <th style="text-align: center;">Roll No.</th>
                      <th>Student Name</th>                   
                      <th style="text-align: center;">Grade</th>
                      <th style="text-align: center;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="student in students" :key="student.StudentId">
                      <td style="text-align: center;">{{ student.RollNo }}</td>
                      <td>{{ student.Name }}</td>
                  
                      <td class="has-text-centered">
                        {{ existingGrades[student.StudentId] || 'N/A' }}
                      </td>
                      <td v-if="Result_Published"><p class = "help has-text-danger">Result Published! Can not update grades</p></td>
                      <td v-else-if="appeared[student.StudentId]" style="text-align: center;">                      
                        <button class="button is-info is-small" @click="openEditModal(student)"><i class="fas fa-edit"></i> Update</button>
                      </td>
                      <td v-else>
                        <span class="has-text-grey has-tex-centered">Not Appeared</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                
              </div>
              <p v-else class="has-text-grey has-text-centered mt-4">
                No students found for this section.
              </p>       
            </div>
            <div v-else class="button is-info column has-text-centered is-flex is-align-items-center is-flex-direction-column p-5">
              Select Class, Section and Co-Scholastic Activity to enter Grades
            </div>
        </div>
      </div>     
    </div> 
  </div>
  
  <!-- Edit Modal -->
  <div class="modal" :class="{ 'is-active': isEditModalOpen }">
    <div class="modal-background" @click="closeEditModal"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Edit {{ selected === 'Scholastic' ? 'Marks' : 'Grade' }}</p>
        <button class="delete" aria-label="close" @click="closeEditModal"></button>
      </header>
      <section class="modal-card-body">
        <div v-if="selected === 'Scholastic'">
          <div class="field">
            <label class="label">Student</label>
            <p>{{ selectedStudent.Name }} (Roll No: {{ selectedStudent.RollNo }})</p>
          </div>
          
          <div class="field">
            <label class="label">First Periodic Test (Max: {{ selectedSubjectCategory === 'Major' ? periodicMajorMaxMark : periodicMinorMaxMark }})</label>
            <input 
              type="number" 
              class="input" 
              v-model="editForm.periodicMarks"
              :max="selectedSubjectCategory === 'Major' ? periodicMajorMaxMark : periodicMinorMaxMark"
              min="0"
            >
          </div>
          
          <div class="field">
            <label class="label">Half Yearly Exam (Max: {{ selectedSubjectCategory === 'Major' ? terminalMajorMaxMark : terminalMinorMaxMark }})</label>
            <input 
              type="number" 
              class="input" 
              v-model="editForm.termMarks"
              :max="selectedSubjectCategory === 'Major' ? terminalMajorMaxMark : terminalMinorMaxMark"
              min="0"
            >
          </div>
          
          <div class="field">
            <label class="label">Total Marks</label>
            <p>{{ (parseInt(editForm.periodicMarks) || 0) + (parseInt(editForm.termMarks) || 0) }}</p>
          </div>
          
          <div class="field">
            <label class="label">Status</label>
            <span class="tag" :class="calculateEditStatus() === 'Pass' ? 'is-success' : 'is-danger'">
              {{ calculateEditStatus() }}
            </span>
          </div>
        </div>
        
        <div v-else>
          <div class="field">
            <label class="label">Student</label>
            <p>{{ selectedStudent.Name }} (Roll No: {{ selectedStudent.RollNo }})</p>
          </div>
          
          <div class="field">
            <label class="label">Grade</label>
            <div class="select is-fullwidth">
              <select v-model="editForm.grade">
                <option value="">-- Select Grade --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>
        </div>
      </section>
      <footer class="modal-card-foot">
        <button class="button is-success" @click="saveChanges">Save changes</button>
        <button class="button" @click="closeEditModal">Cancel</button>
      </footer>
    </div>
  </div>   
</template>

<script setup>
import { ref, watch, computed, onMounted, reactive } from 'vue'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { useActiveExam } from '../../composables/useActiveExam'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const { CurrentYearId, CurrentYear, loadAcademicYear } = useAcademicYear()
const { 
  periodicMajorMaxMark,
  periodicMinorMaxMark,
  terminalMajorMaxMark,
  terminalMinorMaxMark,
  Terminal_Published,
  Annual_Published,
  PassingPercentage,      
  loadActiveExam 
} = useActiveExam()

// Reactive state
const examType = ref('')
const currentExamId = ref('')
const currentExamName = ref('')
const selected = ref('Scholastic') // Default to Scholastic Subjects
const classes = ref([])
const sections = ref([])
const subjects = ref([])
const students = ref([])
const selectedClassId = ref('')
const selectedSectionId = ref('')
const selectedSubjectId = ref('')
const marksEntered = ref(false)

// Data stores
const existingGrades = ref({})
const newGrades = ref({})
const periodicMarks = ref({})
const termMarks = ref({})
const statuses = ref({})
const appeared = ref({}) // Track if student appeared for exam
const Result_Published = ref(false)
// UI state
const successMessage = ref('')
const errorMessage = ref('')
const isSaving = ref(false)
const finished = ref(false)
const studentloaded = ref(false)

// Edit modal state
const isEditModalOpen = ref(false)
const selectedStudent = ref({})
const editForm = ref({
  periodicMarks: 0,
  termMarks: 0,
  grade: ''
})

// Computed properties
const selectedSubjectName = computed(() => {
  return subjects.value.find(sub => sub.Id === selectedSubjectId.value)?.SubjectName || ''
})

const selectedSubject = computed(() => {
  return subjects.value.find(subject => subject.Id === selectedSubjectId.value) || null
})

const selectedSubjectCategory = computed(() => {
  return selectedSubject.value?.SubjectCategory || null
})
// Watch for route changes
watch(() => route.query.type, (newType) => {
  examType.value = newType
  getExam()
  fetchClasses() 
  selectedClassId.value = ''
  selectedSectionId.value = 0
  selectedSubjectId.value = ''
}, { immediate: true })

watch(() => route.query, (newQuery) => {
  if(newQuery.examType) {
    examType.value = newQuery.examType
    fetchClasses() 
    getExam()
  }
}, { immediate: true })

// On Page Load, get examId and examName
async function getExam() {
  const result = await window.electronAPI.getExamByType(examType.value, CurrentYearId.value)
  currentExamId.value = result.exam.Id
  currentExamName.value = result.exam.ExamName
}
//verify result published
async function verifyResultStatus() { 
    const result = await window.electronAPI.verifyResultStatus({
            academicYearId: CurrentYearId.value,
            resultType: examType.value === 'terminal' ? examType.value : 'final', //if examType is not terminal, result will be final
            examId: currentExamId.value,
            classId: selectedClassId.value,
            sectionId: selectedSectionId.value
          })       
    if (result.success) {
      Result_Published.value = result.isPublished     
    }
}
// Initialization
onMounted(async () => {
  await Promise.all([
    loadAcademicYear(),
    loadActiveExam()       
  ])  
})

// Watch for tab changes
watch(selected, (newTab) => {
  // Reset all selections when switching tabs
  selectedClassId.value = ''
  selectedSectionId.value = 0
  selectedSubjectId.value = ''
  students.value = []
  periodicMarks.value = {}
  termMarks.value = {}
  statuses.value = {}
  newGrades.value = {}
  appeared.value = {}
  fetchClasses()
})

// Watch for class changes
watch(selectedClassId, async (classId) => {
  selectedSubjectId.value = ''
  if (!classId) {
    resetSectionData()    
    return
  } 
  marksEntered.value = false
  const secResult = await window.electronAPI.getSectionsByClassId(classId)
   
  if (secResult.success) {
    sections.value = secResult.sections
  }
  if(sections.value.length === 0){
    selectedSectionId.value = 0
    loadStudentsBySectionId()
    studentloaded.value = false  
  }
  const result = await window.electronAPI.getSubjectsByClassId(selectedClassId.value, selected.value)
  if (result.success) subjects.value = result.subjects   
})

// Watch for section changes
watch(selectedSectionId, async (sectionId) => {
  if (!selectedClassId.value || !sectionId) {
    resetStudentData()
    return
  }
  loadStudentsBySectionId()
  studentloaded.value = false
})

// Watch for subject changes
watch(selectedSubjectId, async (subjectId) => {
  if (!subjectId) return

  if (selected.value === "Scholastic") {
    await loadExistingMarks()
  } else if (selected.value === "Co-Scholastic") {
    await loadExistingGrades()
  }
  studentloaded.value = true
  verifyResultStatus()
})

// Methods
const calculateTotal = (studentId) => {
  const pmarks = periodicMarks.value[studentId] || 0
  const tmarks = termMarks.value[studentId] || 0
  return pmarks + tmarks
}

const updateStatus = (studentId) => {
  const total = calculateTotal(studentId)
  const maxTotal = (selectedSubjectCategory.value === 'Major' 
    ? (periodicMajorMaxMark.value + terminalMajorMaxMark.value)
    : (periodicMinorMaxMark.value + terminalMinorMaxMark.value))
  
  const passMark = Math.ceil(maxTotal * (PassingPercentage.value / 100))
  statuses.value[studentId] = total >= passMark ? 'Pass' : 'Fail'
}

const resetSectionData = () => {
  sections.value = []
  subjects.value = []
  selectedSectionId.value = ''
  resetStudentData()
}

const resetStudentData = () => {
  students.value = []
  resetMarkData()
}

const resetMarkData = () => {
  periodicMarks.value = {}
  termMarks.value = {}
  statuses.value = {}
  appeared.value = {}
}

const resetGrades = () => {
  existingGrades.value = {}
  newGrades.value = {}
}

// Modal functions
const openEditModal = async (student) => {
  await verifyResultStatus()
  if(Result_Published.value) return

  selectedStudent.value = student
  if (selected.value === 'Scholastic') {
    editForm.value = {
      periodicMarks: periodicMarks.value[student.StudentId] || 0,
      termMarks: termMarks.value[student.StudentId] || 0,
      grade: ''
    }
  } else {
    editForm.value = {
      periodicMarks: 0,
      termMarks: 0,
      grade: newGrades.value[student.StudentId] || existingGrades.value[student.StudentId] || ''
    }
  }
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedStudent.value = {}
  editForm.value = {
    periodicMarks: 0,
    termMarks: 0,
    grade: ''
  }
}

const calculateEditStatus = () => {
  const periodic = parseInt(editForm.value.periodicMarks) || 0
  const half = parseInt(editForm.value.termMarks) || 0
  const total = periodic + half
  
  const maxTotal = (selectedSubjectCategory.value === 'Major' 
    ? (periodicMajorMaxMark.value + terminalMajorMaxMark.value)
    : (periodicMinorMaxMark.value + terminalMinorMaxMark.value))
  
  const passMark = Math.ceil(maxTotal * (PassingPercentage.value / 100))
  return total >= passMark ? 'Pass' : 'Fail'
}

// Data loading functions
async function fetchClasses() {
  const result = await window.electronAPI.getClasses()
  if (result.success) classes.value = result.classes
}

async function loadStudentsBySectionId() {
  try {
    const result = await window.electronAPI.getStudentsByClassAndSection({ 
      classId: selectedClassId.value,
      sectionId: selectedSectionId.value,
      AcademicYearId: CurrentYearId.value
    })

    if (result.success) {
      students.value = await result.students
      resetMarkData()
    } else {
      resetStudentData()
    }
  } catch (error) {
    console.error('Error loading students:', error)
    resetStudentData()
  }
}

async function loadExistingMarks() {
  try {
    const result = await window.electronAPI.getMarksByExamSubject({
      examId: currentExamId.value,
      subjectId: selectedSubjectId.value,
      ClassId: selectedClassId.value,
      SectionId: selectedSectionId.value
    })

    periodicMarks.value = {}
    termMarks.value = {}
    
    result.forEach(mark => {
      periodicMarks.value[mark.StudentId] = mark.PeriodicMarksObtained || 'No Entry'
      termMarks.value[mark.StudentId] = mark.TerminalMarksObtained || 'No Entry'
      statuses.value[mark.StudentId] = mark.SubjectResult || "N.A."
      appeared.value[mark.StudentId] = mark.SubjectResult === 'N.A.' ? 0 : 1
    })
    marksEntered.value = result.length > 0
  } catch (error) {
    console.error("Failed to load marks:", error)
    errorMessage.value = "Failed to load existing marks"
    setTimeout(() => errorMessage.value = '', 3000)
  }
}

async function loadExistingGrades() {
  try {
    const result = await window.electronAPI.getCoScholasticMarks({
      examId: currentExamId.value,
      subjectId: selectedSubjectId.value      
    })

    existingGrades.value = {}
    newGrades.value = {}
    
    if (result.success) {
      result.grades.forEach(grade => {
        existingGrades.value[grade.StudentId] = grade.Grade
        newGrades.value[grade.StudentId] = grade.Grade // Initialize newGrades with existing values
        appeared.value[grade.StudentId] = grade.Grade ? 1 : 0
      })
    }   
  } catch (error) {
    console.error("Error loading existing grades:", error)
  }
}

// Save functions
const saveChanges = async () => {
  if (selected.value === 'Scholastic') {
    // Update the marks for the selected student
    periodicMarks.value[selectedStudent.value.StudentId] = editForm.value.periodicMarks
    termMarks.value[selectedStudent.value.StudentId] = editForm.value.termMarks
    updateStatus(selectedStudent.value.StudentId)
    await saveMarks()
  } else {
    // Update the grade for the selected student
    newGrades.value[selectedStudent.value.StudentId] = editForm.value.grade
    //appeared.value[selectedStudent.value.StudentId] = editForm.value.grade ? 1 : 0
    await submitGrades()
  }
  closeEditModal()
}

async function saveMarks() {
  isSaving.value = true;
  errorMessage.value = '';

  try {
    // Calculate max marks based on subject category
    const periodicMax = selectedSubjectCategory.value === 'Major' 
      ? periodicMajorMaxMark.value 
      : periodicMinorMaxMark.value;
    
    const terminalMax = selectedSubjectCategory.value === 'Major' 
      ? terminalMajorMaxMark.value 
      : terminalMinorMaxMark.value;
    
    const totalMax = periodicMax + terminalMax;

    const marksData = students.value
    .filter(student => !!appeared.value[student.StudentId])
    .map(student => {
      const periodicMarksObtained = periodicMarks.value[student.StudentId] || 0;
      const terminalMarksObtained = termMarks.value[student.StudentId] || 0;
      const totalMarksObtained = periodicMarksObtained + terminalMarksObtained;
      return {
        StudentId: student.StudentId,        
        PeriodicMaxMark: periodicMax,
        TerminalMaxMark: terminalMax,
        TotalMaxMarks: totalMax,
        PeriodicMarksObtained: periodicMarksObtained,
        TerminalMarksObtained: terminalMarksObtained,
        TotalMarksObtained: totalMarksObtained,
        SubjectResult: statuses.value[student.StudentId]
      };
    });

    if (marksData.length === 0) {
      throw new Error('No marks data to save');
    }

    const subjectData = {
      YearId: CurrentYearId.value, 
      ExamId: currentExamId.value,   
      ExamType: examType.value,   
      ClassId: selectedClassId.value,
      SectionId: selectedSectionId.value === '' ? 0 : selectedSectionId.value,
      SubjectId: selectedSubjectId.value
      //Finished: Boolean(finished.value)
    };

    if (!subjectData.YearId || !subjectData.ExamId || subjectData.ClassId === '' || !subjectData.SubjectId) {
      throw new Error('Incomplete subject data');
    }

    const result = await window.electronAPI.saveMarks({marksData, subjectData});
    if (result.success) {
      successMessage.value = 'Marks updated successfully!';
      setTimeout(() => successMessage.value = '', 3000);
      marksEntered.value = true;
      studentloaded.value = true
    } else {
      throw new Error(result.message || 'Failed to update marks'); 
    }
  } catch (err) {
    errorMessage.value = err.message;
    setTimeout(() => errorMessage.value = '', 5000);
  } finally {
    isSaving.value = false;
  }
}

async function submitGrades() {
  if (!selectedClassId.value || selectedSectionId.value === '' || !selectedSubjectId.value) {
    alert('Please select class, section, and co-scholastic activity')
    return
  }

  isSaving.value = true
  try {
    const gradesData = students.value
      .filter(student => appeared.value[student.StudentId])
      .map(student => {
        // Use new grade if edited, otherwise existing grade
        const grade = newGrades.value[student.StudentId] || existingGrades.value[student.StudentId]
        return {
          StudentId: student.StudentId,
          SubjectId: selectedSubjectId.value,
          ActiveExamId: currentExamId.value,
          Grade: grade
        }
      })

    const result = await window.electronAPI.saveCoScholasticMarks(gradesData)

    if (result.success) {
      successMessage.value = 'Grades submitted successfully!'
      setTimeout(() => successMessage.value = '', 3000)
      // Refresh existing grades after save
      await loadExistingGrades()
    } else {
      throw new Error(result.error || 'Failed to save grades')
    }
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`
    setTimeout(() => errorMessage.value = '', 5000)
    console.error("Error submitting grades:", error)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.marks-entry-container {
  display: flex;
  gap: 1rem;
  min-height: 500px;
}

.left-panel {
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.title{
  margin-bottom: 0;
}
.main-content {
  flex: 1;
  width:100%
}
.columns{
  padding: 0.5rem;
  margin: 0;
}
.tab-button{
 border: 1px solid rgb(126, 126, 126);
 border-radius: 10px;
}
.tab-heading{
  padding: 0.15 rem;
}

.thin-line {
  border: none;
  border-top: 1px solid #3c3b3b;
}

.is-clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.is-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>