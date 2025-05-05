<template>
    <nav class="navbar is-light is-fixed-top" role="navigation" aria-label="main navigation">
      <div class="navbar-container">
        <!-- Brand on the left -->
        <div class="navbar-brand">
        <a class="navbar-item" href="#">
          <img src="../assets/sikul_logo.png" alt="School Logo"  />
          <h1 class="navbar-item title is-4 ml-1">Calvary High School</h1>
        </a>
      </div>
        
        <div>
          <h1 class="subtitle">{{ currentYear || 'Not Set' }}</h1>
  
        </div>
  
        <!-- Menu on the right -->
        <div class="navbar-menu">
          <div class="navbar-end">
            <div class="navbar-item has-dropdown is-hoverable">
              <a class="navbar-link is-arrowless">Admission</a>
              <div class="navbar-dropdown">
                <a><router-link class="navbar-item" to="/admission/new">New Admission</router-link>
                <router-link class="navbar-item" to="/admission/re">Re-Admission</router-link>
                <router-link class="navbar-item" to="/admission/tr">Transfer</router-link>
            </a>
              </div>
            </div>
  
            <div class="navbar-item has-dropdown is-hoverable">
              <a class="navbar-link is-arrowless">Marks</a>
              <div class="navbar-dropdown">
                <a>
                  <router-link class="navbar-item" to="/marks/student-marks-entry">Enter Marks</router-link>
             
                  <router-link class="navbar-item" to="/marks/view-edit-marks">View and Update Marks</router-link>
                </a>
              </div>
            </div>
  
            <div class="navbar-item has-dropdown is-hoverable">
              <a class="navbar-link is-arrowless">Results</a>
              <div class="navbar-dropdown">
                <a>
                  <router-link class="navbar-item" to="/result/create">{{ currentYear }}: Result</router-link>                  
                  <router-link class="navbar-item" to="/result/report-card">Report Card</router-link>
                </a>
              </div>
            </div>
  
            <div class="navbar-item has-dropdown is-hoverable">
              <a class="navbar-link is-arrowless">Manage</a>
              <div class="navbar-dropdown">
                <a>
                  <router-link class="navbar-item" to="/academic-year/create">Set Academic Year</router-link>   
                  <router-link class="navbar-item" to="/manage/student">Manage: Student</router-link>
                  <router-link class="navbar-item" to="/exam/create">Create Exams</router-link>                  
                  <router-link class="navbar-item" to="/result-criteria/set">Set Result Criteria</router-link>                 
                </a>
              </div>
            </div>
            <div class="navbar-item has-dropdown is-hoverable">
              <a class="navbar-link is-arrowless">Master</a>
              <div class="navbar-dropdown">
                <a>                          
                  <router-link class="navbar-item" to="/class/master">Master: Class</router-link>
                  <router-link class="navbar-item" to="/section/master">Master: Section</router-link>
                  <router-link class="navbar-item" to="/subject/master">Master: Subjects</router-link>
                  <router-link class="navbar-item" to="/exam/master">Master: Exams</router-link>
                  <router-link class="navbar-item" to="/class-subject/mapping">Mapping: Class - Subjects</router-link>                
                  <router-link class="navbar-item" to="/class-section/mapping">Mapping: Class - Sections</router-link>                
                </a>
              </div>
            </div>

            <div class="navbar-item is-hoverable">
              <a class="navbar-link is-arrowless">User</a>
              <div class="navbar-dropdown">
                <a><router-link class="navbar-item" to="/logout" @click="logoutButton">Logout</router-link></a>
              </div>
            </div>    
          </div>
        </div>
      </div>
    </nav>
  </template>
  
<script setup lang="ts">

import { onMounted } from 'vue'
import { useAcademicYear } from '../composables/useAcademicYear'
const { currentYear, loadAcademicYear } = useAcademicYear()

function logoutButton() {
  window.electronAPI.logout()
}

onMounted(() => {
  loadAcademicYear()
})

window.electronAPI.onAcademicYearChanged(() => {
  loadAcademicYear()
})
   
</script>
  
<style scoped>
.navbar{
  width: 100%;
  box-shadow: 0 4px 4px -2px rgba(107, 107, 107, 0.2);
}
.navbar-container {
  width: 90%;
  margin: 0 auto;
  display: flex;
  align-items: center; /* aligns brand and menu vertically */
  justify-content: space-between;
  min-height: 3.25rem; /* same as Bulma's default navbar height */
}

.navbar-item.title {
  margin: 0;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  display: flex;
  align-items: center;
}

/* Dropdown hover effect */

.navbar-dropdown .navbar-item:hover {
background-color: hsl(217, 71%,  53%); /* Bulma primary */
color: white;
}

/* Optional active item style */
.navbar-item.router-link-exact-active {
  background-color: rgba(255, 255, 255, 0.885);
}
</style>
