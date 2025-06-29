import { ref } from 'vue'
import { useAcademicYear } from './useAcademicYear';

const { CurrentYearId } = useAcademicYear();

const periodicMajorMaxMark = ref(0)
const periodicMinorMaxMark = ref(0)
const terminalMajorMaxMark = ref(0)
const terminalMinorMaxMark = ref(0)
const PassingPercentage = ref(40) // Default passing percentage
const Terminal_Published = ref(false)
const Annual_Published = ref(false)

export const useActiveExam = () => {
  const loadActiveExam = async () => {
    try {
      const result = await window.electronAPI.getCurrentExam(CurrentYearId.value);
      
      // Set default values if null/undefined
      periodicMajorMaxMark.value = result?.periodic?.MajorMaxMark ?? 0;
      periodicMinorMaxMark.value = result?.periodic?.MinorMaxMark ?? 0;
      terminalMajorMaxMark.value = result?.terminal?.MajorMaxMark ?? 0;
      terminalMinorMaxMark.value = result?.terminal?.MinorMaxMark ?? 0;
      PassingPercentage.value = result?.terminal?.PassingPercentage ?? 40;
      
      // Ensure boolean values for published status
      Terminal_Published.value = Boolean(result?.terminal?.Result_Published);
      Annual_Published.value = Boolean(result?.annual?.Result_Published);
      
    } catch (error) {
      console.error('Error loading active exam:', error);
      // Reset to defaults on error
      periodicMajorMaxMark.value = 0;
      periodicMinorMaxMark.value = 0;
      terminalMajorMaxMark.value = 0;
      terminalMinorMaxMark.value = 0;
      PassingPercentage.value = 40;
      Terminal_Published.value = false;
      Annual_Published.value = false;
    }
  }

  return {
    periodicMajorMaxMark,
    periodicMinorMaxMark,
    terminalMajorMaxMark,
    terminalMinorMaxMark,
    PassingPercentage,
    Terminal_Published,
    Annual_Published,
    loadActiveExam,
  }
}