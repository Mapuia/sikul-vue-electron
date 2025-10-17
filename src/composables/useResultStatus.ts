import { ref } from 'vue'

export const useResultStatus = () => {
  const isPublished = ref(false)
  const publishDate = ref(null)

  async function checkResultStatus(examId, academicYearId) {
    try {
      const response = await window.electronAPI.getPublishStatus({
        academicYearId,
        activeExamId: examId        
      })

      if (response.success) {
        isPublished.value = response?.isPublished
        
        // Format publishDate if available
        if (response?.publishDate) {
          const date = new Date(response.publishDate)
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          publishDate.value = `${day}-${month}-${year}`
        } else {
          publishDate.value = null
        }

        console.log('checkResultStatus', isPublished.value, publishDate.value)
      } else {
        isPublished.value = false
        publishDate.value = null
      }
    } catch (err) {
      console.error('checkResultStatus', err)
      isPublished.value = false
      publishDate.value = null
    }
  }

  return { isPublished, publishDate, checkResultStatus }
}

