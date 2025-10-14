import { ref } from 'vue'

export const useCurrentExam = () => {
  const currentExamId = ref(null)
  const currentExamName = ref('No Active Exam')

  async function getExamByType(type, academicYearId) {
    try {
      const result = await window.electronAPI.getExamByType(type, academicYearId)
      currentExamId.value = result?.exam?.Id ?? null
      currentExamName.value = result?.exam?.ExamName ?? 'No Active Exam'
    } catch (error) {
      console.error('Error fetching exam type:', error)
    }
  }

  return {
    currentExamId,
    currentExamName,
    getExamByType
  }
}