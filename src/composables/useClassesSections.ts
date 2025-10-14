import { ref } from 'vue'

export const useClassesSections = () => {
    const classes = ref([])
    const sections = ref([])
    
    const loadClasses = async () => {
        try {
            const res = await window.electronAPI.getClasses()
            if (res.success) {
                classes.value = res.classes || []
            }
        } catch (err) { 
            console.error('fetchClasses', err) 
        }
    }
    const loadSections = async (classId) => {
        try {
            const res = await window.electronAPI.getSectionsByClassId(classId)
            if (res.success) {
                sections.value = res.sections || []
            }
        } catch (err) {
            console.error('fetchSections', err)
        }
    }

    return {
        classes,
        sections,
        loadClasses,
        loadSections
    }
}