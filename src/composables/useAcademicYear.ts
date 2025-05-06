import { ref } from 'vue'

const currentYear = ref('')
const currentYearId = ref('')

export const useAcademicYear = () => {
  const loadAcademicYear = async () => {
    const result = await window.electronAPI.getCurrentAcademicYear()
  
    currentYear.value = result?.YearName || 'Not Found'
    currentYearId.value = result?.Id || 'Not Found'
  }

  return {
    currentYearId,
    currentYear,
    loadAcademicYear,
  }
}