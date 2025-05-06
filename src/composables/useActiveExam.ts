import { ref } from 'vue'

const currentExam = ref('')
const currentExamId = ref('')

export const useActiveExam = (currentYearId) => {
  const loadActiveExam = async () => {
    const result = await window.electronAPI.getCurrentExam(currentYearId)
    console.log("From Api:", result)
    currentExam.value = result?.ExamName || 'Not Found'
    currentExamId.value = result?.Id || 'Not Found'
  }

  return {
    currentExamId,
    currentExam,
    loadActiveExam,
  }
}