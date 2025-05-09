// src/composables/useAcademicYear.ts
import { ref } from 'vue';

export const useAcademicYear = () => {
  const CurrentYear = ref('');
  const CurrentYearId = ref<number | null>(null);

  // Safe access to electronAPI
  const electronAPI = window.electronAPI || {
    getCurrentAcademicYear: () => Promise.resolve(null),
    onAcademicYearChanged: () => {}
  };

  const loadAcademicYear = async () => {
    try {
      const year = await electronAPI.getCurrentAcademicYear();
      if (year) {
        CurrentYear.value = year.YearName;
        CurrentYearId.value = year.Id;
      }
    } catch (error) {
      console.error('Failed to load academic year:', error);
    }
  };

  return {
    CurrentYear,
    CurrentYearId,
    loadAcademicYear
  };
};