import { ref } from 'vue'

export const useDisplayDate = () => {
  const formattedDate = ref('')

  function displayDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    const date = new Date(dateString)
    formattedDate.value = date.toLocaleDateString('en-IN', options)
  }

  return { formattedDate, displayDate }
}
