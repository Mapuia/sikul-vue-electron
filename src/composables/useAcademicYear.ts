// src/composables/useAcademicYear.ts
import { ref } from 'vue';

const CurrentYear = ref('');
const CurrentYearId = ref('');
const PreviousYearId = ref('');
const PreviousYear = ref('');

export const useAcademicYear = () => {

  const loadAcademicYear = async () => {
    const response = await window.electronAPI.getCurrentAcademicYear(); // Renamed 'result' to 'response' for clarity
    //console.log('Result from IPC:', response);
    const previousYearResponse = await window.electronAPI.getPreviousYear();
    if (previousYearResponse?.success && previousYearResponse?.previousYear) {
      PreviousYearId.value = previousYearResponse.previousYearId;
      PreviousYear.value = previousYearResponse.previousYear;
    } else {
      console.warn('Failed to load previous year ID or invalid response:', previousYearResponse);
      PreviousYearId.value = 'Not Found';
    }

    if (response?.success && response?.result) {
      CurrentYear.value = response.result.YearName;
      CurrentYearId.value = response.result.Id;
      //console.log("Academic Year Loaded:", CurrentYear.value);
    } else {
      console.warn('Failed to load academic year or invalid response:', response);
      CurrentYear.value = 'Not Found';
      CurrentYearId.value = 'Not Found';
    }
  };

  return {
    CurrentYear,
    CurrentYearId,
    PreviousYearId,
    PreviousYear,
    loadAcademicYear
  };
};