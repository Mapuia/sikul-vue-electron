// src/composables/useAcademicYear.ts
import { ref } from 'vue';

const CurrentYear = ref('');
const CurrentYearId = ref('');
const PreviousYear = ref('');
const PreviousYearId = ref('');


export const useAcademicYear = () => {

  const loadAcademicYear = async () => {
    const response = await window.electronAPI.getCurrentAcademicYear(); 
    if (response?.success && response?.result) {
      CurrentYear.value = response.result.YearName;
      CurrentYearId.value = response.result.Id;
      //console.log("Academic Year Loaded:", CurrentYear.value);
    } else {
      console.warn('Failed to load academic year or invalid response:', response);
      CurrentYear.value = 'Not Set';
      CurrentYearId.value = 'Not Found';
    }

    if (/^\d{4}-\d{4}$/.test(CurrentYear.value)) {
      const startYear = parseInt(CurrentYear.value.split("-")[0]);
      let previousYear = `${startYear - 1}-${startYear}`;
      PreviousYear.value = previousYear;
      //console.log(previousYear); // "2023-2024"
    } else {
      console.log("Invalid year format");
    }

    const result = await window.electronAPI.getYearId(PreviousYear.value)
    if(result?.success){
      PreviousYearId.value = result?.previousYearId
    }
    else{
      console.log('No Year Value found')
    }

  }
  return {
    CurrentYear,
    CurrentYearId,    
    PreviousYear,
    PreviousYearId,
    loadAcademicYear
  };
};