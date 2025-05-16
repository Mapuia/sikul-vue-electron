<template>
  <nav class="navbar is-light is-fixed-top" role="navigation" aria-label="main navigation">
    <div class="navbar-container">
      <!-- Brand on the left -->
      <div>
        <router-link to="/">
          <img class="logo navbar-logo" src="../assets/sikul_logo.png" alt="School Logo" />
        </router-link>
      </div>
      <div class="is-flex is-flex-direction-column">
        <h1 class="compact-title">Calvary Higher Secondary School</h1>
        <span class="compact-subtitle is-7">Academic Year : {{ CurrentYear || 'Not Set' }}</span>
      </div>

      <!-- Menu on the right -->
      <div class="navbar-menu">
        <div class="navbar-end">
          <div class="navbar-item has-dropdown"
               :class="{ 'is-active': openDropdown === 'admission' }"
               @mouseleave="closeDropdown">
            <a class="navbar-link is-arrowless" @click="toggleDropdown('admission')">
              <span class="fas fa-solid fa-id-badge"></span>Admission
            </a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/admission/new" @click="closeDropdown">New Admission</router-link>
              <router-link class="navbar-item" to="/admission/re" @click="closeDropdown">Re-Admission</router-link>
              <router-link class="navbar-item" to="/admission/tr" @click="closeDropdown">Transfer</router-link>
            </div>
          </div>

          <div class="navbar-item has-dropdown"
               :class="{ 'is-active': openDropdown === 'marks' }"
               @mouseleave="closeDropdown">
            <a class="navbar-link is-arrowless" @click="toggleDropdown('marks')">
              <span class="fas fa-solid fa-trophy"></span>Marks
            </a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/marks/student-marks-entry" @click="closeDropdown">Marks Entry Subjects</router-link>
              <router-link class="navbar-item" to="/marks/student-marks-entry-coscholastic" @click="closeDropdown">Co-Scholastic Activities</router-link>
              <router-link class="navbar-item" to="/marks/view-edit-marks" @click="closeDropdown">Review Marks</router-link>
            </div>
          </div>

          <div class="navbar-item has-dropdown"
               :class="{ 'is-active': openDropdown === 'report' }"
               @mouseleave="closeDropdown">
            <a class="navbar-link is-arrowless" @click="toggleDropdown('report')">
              <span class="fa-solid fa-chart-pie"></span>Report
            </a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/result/create" @click="closeDropdown">Create Result</router-link>
              <router-link class="navbar-item" to="/result/publish" @click="closeDropdown">Publish Result</router-link>
              <router-link class="navbar-item" to="/result/report" @click="closeDropdown">School Report</router-link>
              <router-link class="navbar-item" to="/result/report-card" @click="closeDropdown">Export Report Card</router-link>
            </div>
          </div>

          <div class="navbar-item has-dropdown"
               :class="{ 'is-active': openDropdown === 'manage' }"
               @mouseleave="closeDropdown">
            <a class="navbar-link is-arrowless" @click="toggleDropdown('manage')">
              <span class="fas fa-solid fa-gear"></span>Manage
            </a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/academic-year/create" @click="closeDropdown">Manage Academic Year</router-link>
              <router-link class="navbar-item" to="/exam/create" @click="closeDropdown">Manage Exams</router-link>
              <router-link class="navbar-item" to="/manage/student" @click="closeDropdown">Manage Student</router-link>
              <router-link class="navbar-item" to="/result-criteria/set" @click="closeDropdown">Result Criteria</router-link>
            </div>
          </div>

          <div class="navbar-item has-dropdown"
               :class="{ 'is-active': openDropdown === 'master' }"
               @mouseleave="closeDropdown">
            <a class="navbar-link is-arrowless" @click="toggleDropdown('master')">
              <span class="fas fa-solid fa-database"></span>Master
            </a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/class/master" @click="closeDropdown">Master: Class</router-link>
              <router-link class="navbar-item" to="/section/master" @click="closeDropdown">Master: Section</router-link>
              <router-link class="navbar-item" to="/subject/master" @click="closeDropdown">Master: Subjects</router-link>
              <router-link class="navbar-item" to="/exam/master" @click="closeDropdown">Master: Exams</router-link>
              <router-link class="navbar-item" to="/class-subject/mapping" @click="closeDropdown">Mapping: Class - Subjects</router-link>
              <router-link class="navbar-item" to="/class-section/mapping" @click="closeDropdown">Mapping: Class - Sections</router-link>
            </div>
          </div>

          <div class="navbar-item has-dropdown"
               :class="{ 'is-active': openDropdown === 'user' }"
               @mouseleave="closeDropdown">
            <a class="navbar-link is-arrowless" @click="toggleDropdown('user')">User</a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/logout" @click="handleLogout">Logout</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAcademicYear } from '../composables/useAcademicYear';

const { CurrentYear, loadAcademicYear } = useAcademicYear();

const handleAcademicYearChange = () => {
  loadAcademicYear();
};

onMounted(async () => {
  await loadAcademicYear();
  window.electronAPI.onAcademicYearChanged(handleAcademicYearChange);
});

// Track which dropdown is open
const openDropdown = ref<string | null>(null);

const toggleDropdown = (name: string) => {
  openDropdown.value = openDropdown.value === name ? null : name;
};

const closeDropdown = () => {
  openDropdown.value = null;
};

const handleLogout = () => {
  closeDropdown();
  window.electronAPI.logout();
};
</script>


<style scoped>
.logo {
  height: 4.5em;
  padding: 0.5rem;
  will-change: filter;
  transition: filter 300ms;
  vertical-align: middle;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.compact-title {
  
  font-family: 'Oswald';
  font-weight: 600;
  font-size: x-large;
  color:rgb(13, 13, 13);
  
}
.compact-subtitle {
  font-family: 'Oswald';
  font-weight: 500;
  font-size: medium;
  margin-bottom: 0.2rem;
  color:rgb(13, 13, 13);
 
}
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
  
}

.navbar-dropdown .navbar-item:hover {
  background-color: hsl(217, 71%, 53%);
  color: white;
}

.navbar-item.router-link-exact-active {
  background-color: rgba(196, 123, 123, 0.885);
}

</style>