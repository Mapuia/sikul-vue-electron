import { ref } from 'vue'

export const useResultNames = () => {
  const resultName = ref('')
  const resultType = ref('')

  const setResultName = async (examType) => {
   
    switch(examType) {
      case 'terminal':
        resultName.value = 'Half Yearly Exam Result'
        break
      case 'annual':
        resultName.value = 'Annual Exam Result'
        break
      case 'final':
        resultName.value = 'Final Result'
        break
      case 'selection':
        resultName.value = 'Selection Result'
        break
  
    }
    resultType.value = examType.value === 'terminal' ? examType.value : examType.value === 'annual' ? 'final' : 'selection'

  }
  
  return { resultName, resultType, setResultName }
}