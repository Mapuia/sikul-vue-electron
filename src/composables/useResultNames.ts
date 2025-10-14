import { ref } from 'vue'

export const useResultNames = () => {
  const resultName = ref('')

  const setResultName = async (examType) => {
    resultName.value = examType === 'terminal' ? 'Half Yearly Exam Result' : 
    examType === 'annual' ? 'Annual Exam Result' : 
    examType === 'final' ? 'Final Exam Result' : 'Selection result'
  }

  return { resultName, setResultName }
}