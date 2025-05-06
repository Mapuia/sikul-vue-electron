<template>
  <div class="form-container full">
    <h1 class="title has-text-centered">Marks Entry - Half Yearly Exam</h1>

    <div class="marks-entry-container">
      <!-- Vertical Class Menu -->
      <div class="vertical-tabs">
        <h1>Class</h1>
        <div
          v-for="cls in classes"
          :key="cls.Id"
          @click="selectClass(cls.Id)"
          :class="['tab-item', selectedClassId === cls.Id ? 'active' : '']"
        >
          Class {{ cls.ClassName }}
        </div>

        <!-- Section appears only if a class is selected -->
        <template v-if="sections.length > 0">
          <h1 style="margin-top: 1rem;">Section</h1>
          <div
            v-for="sec in sections"
            :key="sec.Id"
            @click="selectSection(sec.Id)"
            :class="['tab-item', selectedSectionId === sec.Id ? 'active' : '']"
          >
            Section {{ sec.SectionName }}
          </div>
        </template>
      </div>

      <div class="main-content">
        <div v-if="selectedClassId && selectedSectionId">
          <h2 class="title is-4">
            Class {{ getClassName(selectedClassId) }} - Section {{ getSectionName(selectedSectionId) }}
          </h2>

          <!-- Your actual student mark entry table can go here -->
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'

const classes = ref([])
const sections = ref([])

const selectedClassId = ref(null)
const selectedSectionId = ref(null)

async function fetchClasses() {
  const response = await window.electronAPI.getClasses()
  if (response.success) {
    classes.value = response.classes
  }
}

async function fetchSectionsForClass(classId) {
  const response = await window.electronAPI.getClassSectionMappings(classId)
  if (response.success) {
    sections.value = response.sections
  } else {
    sections.value = []
  }
}

function selectClass(classId) {
  selectedClassId.value = classId
  selectedSectionId.value = null
  fetchSectionsForClass(classId)
}

function selectSection(sectionId) {
  selectedSectionId.value = sectionId
}

// Optional helpers
function getClassName(id) {
  return classes.value.find(c => c.Id === id)?.ClassName || ''
}
function getSectionName(id) {
  return sections.value.find(s => s.Id === id)?.SectionName || ''
}

onMounted(() => {
  fetchClasses()
})
</script>
<style scoped>
.marks-entry-container {
  display: flex;
  gap: 2rem;
}

.vertical-tabs {
  width: 200px;
  border-right: 1px solid #ddd;
}

.tab-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: background-color 0.2s;
}

.tab-item:hover {
  background-color: #f5f5f5;
}

.tab-item.active {
  background-color: #3273dc;
  color: white;
  border-left: 4px solid #2759a5;
  font-weight: bold;
}

.main-content {
  flex-grow: 1;
}
</style>