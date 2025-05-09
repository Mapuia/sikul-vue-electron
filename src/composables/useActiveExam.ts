import { ref } from 'vue'

const CurrentExamName = ref('')
const CurrentExamId = ref('')
const MajorMaxMark = ref('')
const MinorMaxMark = ref('')
const Result_Published = ref('')


export const useActiveExam = () => {
  const loadActiveExam = async () => {
    const result = await window.electronAPI.getCurrentExam()
   
    CurrentExamName.value = result?.ExamName || 'Not Found'
    CurrentExamId.value = result?.Id || 'Not Found'
    MajorMaxMark.value = result?.MajorMaxMark ?? 'Not Found'
    MinorMaxMark.value = result?.MinorMaxMark ?? 'Not Found'
    Result_Published.value = result?.Result_Published !== undefined ? result.Result_Published : 'Not Found'
    
   // console.log('Composable PublishedResult:', currentExamName.value)
  }

  return {
    CurrentExamId,
    CurrentExamName,
    MajorMaxMark,
    MinorMaxMark,
    Result_Published,
    loadActiveExam,
  }
}