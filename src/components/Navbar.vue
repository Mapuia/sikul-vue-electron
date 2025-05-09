<template>
  <nav class="navbar is-light is-fixed-top" role="navigation" aria-label="main navigation">
    <div class="navbar-container">
      <!-- Brand on the left -->
      <div class="navbar-brand">
        <a class="navbar-item" href="#">
          <img src="../assets/sikul_logo.png" alt="School Logo" />
          <h1 class="navbar-item title is-4 ml-1">Calvary High School</h1>
        </a>
      </div>
      
      <div>
        <h1 class="subtitle">{{ CurrentYear || 'Not Set' }}</h1>
      </div>

      <!-- Menu on the right -->
      <div class="navbar-menu">
        <div class="navbar-end">
          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link is-arrowless">Admission</a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/admission/new">New Admission</router-link>
              <router-link class="navbar-item" to="/admission/re">Re-Admission</router-link>
              <router-link class="navbar-item" to="/admission/tr">Transfer</router-link>
            </div>
          </div>

          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link is-arrowless">Marks</a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/marks/student-marks-entry">Marks Entry: Scholastic</router-link>
              <router-link class="navbar-item" to="/marks/student-marks-entry-coscholastic">Marks Entry: Co-Scholastic</router-link>
              <router-link class="navbar-item" to="/marks/view-edit-marks">View and Update Marks</router-link>
            </div>
          </div>

          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link is-arrowless">Results</a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/result/create">{{ CurrentYear }}: Result</router-link>
              <router-link class="navbar-item" to="/result/report-card">Report Card</router-link>
            </div>
          </div>

          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link is-arrowless">Manage</a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/academic-year/create">Set Academic Year</router-link>
              <router-link class="navbar-item" to="/exam/create">Exams Management</router-link>
              <router-link class="navbar-item" to="/manage/student">Student Management</router-link>
              <router-link class="navbar-item" to="/result-criteria/set">Result Criteria</router-link>
            </div>
          </div>

          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link is-arrowless">Master</a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/class/master">Master: Class</router-link>
              <router-link class="navbar-item" to="/section/master">Master: Section</router-link>
              <router-link class="navbar-item" to="/subject/master">Master: Subjects</router-link>
              <router-link class="navbar-item" to="/exam/master">Master: Exams</router-link>
              <router-link class="navbar-item" to="/class-subject/mapping">Mapping: Class - Subjects</router-link>
              <router-link class="navbar-item" to="/class-section/mapping">Mapping: Class - Sections</router-link>
            </div>
          </div>

          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link is-arrowless">User</a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/logout" @click="logout">Logout</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useAcademicYear } from '../composables/useAcademicYear';

const { CurrentYear, loadAcademicYear } = useAcademicYear();
console.log(CurrentYear.value);

// Safe access to electronAPI with fallback
const electronAPI = window.electronAPI || {
  onAcademicYearChanged: () => {},
  removeAcademicYearListener: () => {},
  logout: () => console.warn('Electron API not available')
};

const handleAcademicYearChange = () => {
  loadAcademicYear();
};

onMounted(() => {
  loadAcademicYear();
  electronAPI.onAcademicYearChanged(handleAcademicYearChange);
});

onUnmounted(() => {
  electronAPI.removeAcademicYearListener(handleAcademicYearChange);
});

const logout = () => {
  electronAPI.logout();
};
</script>

<style scoped>
.navbar {
  width: 100%;
  box-shadow: 0 4px 4px -2px rgba(107, 107, 107, 0.2);
}
.navbar-container {
  width: 90%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3.25rem;
}

.navbar-item.title {
  margin: 0;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  display: flex;
  align-items: center;
}

.navbar-dropdown .navbar-item:hover {
  background-color: hsl(217, 71%, 53%);
  color: white;
}

.navbar-item.router-link-exact-active {
  background-color: rgba(255, 255, 255, 0.885);
}
</style>