import { ref } from 'vue'

const currentYear = ref('')

export const useAcademicYear = () => {
  const loadAcademicYear = async () => {
    const result = await window.electronAPI.getCurrentAcademicYear()
    currentYear.value = result?.Year || 'Not Found'
  }

  return {
    currentYear,
    loadAcademicYear,
  }
}