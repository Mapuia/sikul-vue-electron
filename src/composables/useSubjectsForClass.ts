// To be used later if needed

import { ref } from 'vue'

export const useSubjectsForClass = () => {

    const subjects = ref([])

    const loadSubjectsForClass = async (classId) => {
        try {
            const res = await window.electronAPI.getSubjectsByClassId(classId)
            subjects.value = res.subjects
        } catch (error) {
            console.error('Error loading subjects:', error)
        }
    }
    //console.log("Subjects: ", subjects)
    return {
        subjects,
        loadSubjectsForClass
    }
}    