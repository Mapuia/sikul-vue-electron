import { ref } from 'vue'
import { useAcademicYear } from './useAcademicYear';
const { CurrentYearId } = useAcademicYear();

console.log("Active Exam Composable: YearID:", CurrentYearId.value)

const CurrentExamName = ref('')
const CurrentExamId = ref('')
const CurrentExamType = ref('')
const MajorMaxMark = ref('')
const MinorMaxMark = ref('')
const PassingPercentage = ref('')
const Result_Published = ref('')

export const useActiveExam = () => {
  const loadActiveExam = async () => {
    const result = await window.electronAPI.getCurrentExam(CurrentYearId.value)   
    CurrentExamName.value = result?.ExamName || 'Not Set'
    CurrentExamId.value = result?.Id || 'Not Set'
    CurrentExamType.value = result?.ExamType || 'Not Set'
    MajorMaxMark.value = result?.MajorMaxMark ?? 'Not Set'
    MinorMaxMark.value = result?.MinorMaxMark ?? 'Not Set'
    PassingPercentage.value = result?.PassingPercentage ?? 'Not Set'
    Result_Published.value = result?.Result_Published !== undefined ? result.Result_Published : 'Not Set'
    
   // console.log('Composable PublishedResult:', currentExamName.value)
  }

  return {
    CurrentExamId,
    CurrentExamName,
    CurrentExamType,
    MajorMaxMark,
    MinorMaxMark,
    PassingPercentage,
    Result_Published,
    loadActiveExam,
  }
}