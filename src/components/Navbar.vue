<template>
  <nav class="navbar is-light is-fixed-top" role="navigation" aria-label="main navigation">
    <div class="navbar-container">
      <div>
        <router-link to="/home">
          <img class="logo navbar-logo" src="../assets/sikul_logo.png" alt="School Logo" />
        </router-link>
      </div>
      <div class="is-flex is-flex-direction-column">
        <h1 class="compact-title">Calvary Higher Secondary School</h1>
        <span class="compact-subtitle is-7">Academic Year : {{ CurrentYear || 'Not Set' }}</span>
      </div>

      <div class="navbar-menu">
        <div class="navbar-end">

          <!-- Students Main Menu -->
          <div v-if="canAccess(['admin', 'deo', 'teacher'])"
               class="navbar-item has-dropdown"
               :class="{ 'is-active': openDropdown === 'student' }"
               @mouseleave="closeDropdown">
            <a class="navbar-link is-arrowless" @mouseover="toggleDropdown('student')" @click="toggleDropdown('student')">
              <span class="fas fa-solid fa-id-badge"></span>Students
            </a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/students/new" @click="closeDropdown">New Student</router-link>
              <router-link class="navbar-item" to="/students/re" @click="closeDropdown">Re-Admission</router-link>
              <router-link class="navbar-item" to="/manage/student" @click="closeDropdown">Manage Student</router-link>
            </div>
          </div>

          <!-- Exam Main Menu -->
          <div v-if="canAccess(['admin', 'teacher', 'deo'])"
               class="navbar-item has-dropdown"
               :class="{ 'is-active': openDropdown === 'exam' }"
               @mouseleave="closeDropdown">
            <a class="navbar-link is-arrowless" @mouseover="toggleDropdown('exam')" @click="toggleDropdown('exam')">
              <span class="fas fa-solid fa-trophy"></span>Exam
            </a>
            <div class="navbar-dropdown">
              <!-- Half Yearly Exam Submenu -->
              <div class="navbar-item has-subdropdown">
                <span class="navbar-link">Half Yearly</span>
                <div class="navbar-subdropdown">
                  <router-link class="navbar-item" to="/marks/marks-entry?type=terminal" @click="closeDropdown">Marks Entry</router-link>
                  <router-link class="navbar-item" to="/marks/view?type=terminal" @click="closeDropdown">View Marks</router-link>
                  <router-link v-if="canAccess(['admin','teacher'])" class="navbar-item" to="/result/create?type=terminal" @click="closeDropdown">Generate Result</router-link>
                  <router-link class="navbar-item" to="/result/section?type=terminal" @click="closeDropdown">View Section Result</router-link>
                  <router-link class="navbar-item" to="/result/summary?type=terminal" @click="closeDropdown">View Result Summary</router-link>
                </div>
              </div>
              <!-- Annual Exam Submenu -->
              <div class="navbar-item has-subdropdown">
                <span class="navbar-link">Annual</span>
                <div class="navbar-subdropdown">
                  <router-link class="navbar-item" to="/marks/marks-entry?type=annual" @click="closeDropdown">Marks Entry</router-link>
                  <router-link class="navbar-item" to="/marks/view?type=annual" @click="closeDropdown">View Marks</router-link>
                  <router-link v-if="canAccess(['admin','teacher'])" class="navbar-item" to="/result/create?type=annual" @click="closeDropdown">Generate Result</router-link>
                  <router-link class="navbar-item" to="/result/section?type=annual" @click="closeDropdown">View Section Result</router-link>
                  <router-link class="navbar-item" to="/result/summary?type=annual" @click="closeDropdown">View Result Summary</router-link>
                </div>
              </div>
              <!-- Class X Selection Submenu -->
              <div class="navbar-item has-subdropdown">
                <span class="navbar-link">Class X Selection Test</span>
                <div class="navbar-subdropdown">
                  <router-link class="navbar-item" to="/marks/marks-entry?type=selection" @click="closeDropdown">Marks Entry</router-link>
                  <router-link class="navbar-item" to="/marks/view?type=selection" @click="closeDropdown">View Marks</router-link>
                  <router-link v-if="canAccess(['admin','teacher'])" class="navbar-item" to="/result/create?type=selection" @click="closeDropdown">Generate Result</router-link>
                  <router-link class="navbar-item" to="/result/section?type=selection" @click="closeDropdown">View Selection Result</router-link>
                  
                </div>
              </div>
            </div>
          </div>

          <!-- Report Card Menu -->
          <div v-if="canAccess(['admin', 'teacher', 'deo'])"
               class="navbar-item has-dropdown"
               :class="{ 'is-active': openDropdown === 'reportcard' }"
               @mouseleave="closeDropdown">
            <a class="navbar-link is-arrowless" @mouseover="toggleDropdown('reportcard')" @click="toggleDropdown('reportcard')">
              <span class="fa-solid fa-chart-pie"></span>Report Card
            </a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/result/report-card/halfyearly" @click="closeDropdown">Half Yearly Report Card</router-link>
              <router-link class="navbar-item" to="/result/report-card/final" @click="closeDropdown">Final Report Card</router-link>
              <router-link class="navbar-item" to="/result/report-card/selection" @click="closeDropdown">Selection Report Card</router-link>
            </div>
          </div>

          <!-- Settings -->
          <div 
               class="navbar-item has-dropdown"
               :class="{ 'is-active': openDropdown === 'manage' }"
               @mouseleave="closeDropdown">
            <a class="navbar-link is-arrowless" @mouseover="toggleDropdown('manage')" @click="toggleDropdown('manage')">
              <span class="fas fa-solid fa-gear"></span>Settings
            </a>
            <div class="navbar-dropdown">
              <router-link v-if="canAccess(['admin'])" class="navbar-item" to="/academic-year/create" @click="closeDropdown">Academic Session</router-link>
              <router-link v-if="canAccess(['admin'])" class="navbar-item" to="/exam/create" @click="closeDropdown">Examination</router-link>
              <router-link class="navbar-item" to="/result-criteria/set" @click="closeDropdown">Result Criteria Info</router-link>
              <router-link class="navbar-item" to="/export" @click="closeDropdown"><i class="fas fa-file-export mr-2"></i>Export</router-link>
              <router-link class="navbar-item" to="/import" @click="closeDropdown"><i class="fas fa-file-import mr-2"></i>Import</router-link>
            </div>
          </div>

          <!-- Master Data -->
          <div v-if="canAccess(['admin'])"
               class="navbar-item has-dropdown"
               :class="{ 'is-active': openDropdown === 'master'}"
               @mouseleave="closeDropdown">
            <a class="navbar-link is-arrowless" @mouseover="toggleDropdown('master')" @click="toggleDropdown('master')">
              <span class="fas fa-solid fa-database"></span>Master Data
            </a>
            <div class="navbar-dropdown">
              <router-link class="navbar-item" to="/class/master" @click="closeDropdown">Master: Class</router-link>
              <router-link class="navbar-item" to="/section/master" @click="closeDropdown">Master: Section</router-link>
              <router-link class="navbar-item" to="/subject/master" @click="closeDropdown">Master: Subjects</router-link>
              <router-link class="navbar-item" to="/exam/master" @click="closeDropdown">Master: Exams</router-link>
              <router-link class="navbar-item" to="/signatories/master" @click="closeDropdown">Master: Signatories</router-link>
              <router-link class="navbar-item" to="/class-subject/mapping" @click="closeDropdown">Mapping: Class - Subjects</router-link>
              <router-link class="navbar-item" to="/class-section/mapping" @click="closeDropdown">Mapping: Class - Sections</router-link>
            </div>
          </div>

          <!-- User Menu -->
          <div class="navbar-item has-dropdown"
               :class="{ 'is-active': openDropdown === 'user' }"
               @mouseleave="closeDropdown">
            <a class="navbar-link is-arrowless" @mouseover="toggleDropdown('user')" @click="toggleDropdown('user')">
              <span class="icon is-left">
                <i class="fas fa-user"></i>
              </span>
              {{ currentUser || "Guest" }}
            </a>
            <div class="navbar-dropdown">
              <router-link v-if="canAccess(['admin'])" class="navbar-item" to="/users/create" @click="closeDropdown">Create User</router-link>
              <router-link class="navbar-item" to="/users/changepassword" @click="closeDropdown">Change Password</router-link>
              <router-link class="navbar-item" to="/logout" @click="handleLogout">Logout</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { useAcademicYear } from '../composables/useAcademicYear';

const { CurrentYear, loadAcademicYear } = useAcademicYear();

// User data
const currentUser = ref('');
const userRole = ref('');

async function getUser(){
  const user = await window.electronAuth.getCurrentUser();
  if (user) {
    currentUser.value = user.username.charAt(0).toUpperCase() + user.username.slice(1);
    userRole.value = user.role;
  }
}

// Role-based access control
const canAccess = (requiredRoles) => {
  return requiredRoles.includes(userRole.value);
};

// Track dropdown state
const openDropdown = ref('');

// Load user data and academic year
onMounted(async () => {
  await loadAcademicYear();
  await getUser();
});

// Dropdown handlers
const toggleDropdown = (name) => {
  openDropdown.value = openDropdown.value === name ? null : name;
};

const closeDropdown = () => {
  openDropdown.value = null;
};

// Handle viewport edge detection for submenus
const checkViewportEdge = (event) => {
  const dropdown = (event.currentTarget).querySelector('.navbar-subdropdown');
  if (dropdown) {
    const rect = dropdown.getBoundingClientRect();
    dropdown.classList.toggle('right-edge', rect.right > window.innerWidth);
  }
};

// Logout handler
const handleLogout = async () => {
  await window.electronAuth.logout();
  window.location.reload(); // Force full page reload to clear state
};
</script>

<style scoped>
/* Logo styles */
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

/* Title styles */
.compact-title {
  font-family: 'Oswald';
  font-weight: 600;
  font-size: x-large;
  color: rgb(13, 13, 13);
}
.compact-subtitle {
  font-family: 'Oswald';
  font-weight: 500;
  font-size: medium;
  margin-bottom: 0.2rem;
  color: rgb(13, 13, 13);
}

/* Navbar container */
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

/* Dropdown styles */
.navbar-dropdown {
  min-width: 220px;
}
.navbar-item.has-dropdown:hover{
  background-color: hsl(217, 74%, 84%)
}
.navbar-dropdown .navbar-item:hover {
  background-color: hsl(217, 71%, 53%);
  color: white;
}
.navbar-item.router-link-exact-active {
  background-color: rgba(51, 61, 81, 0.885);
}

/* Subdropdown styles */
.navbar-item .has-subdropdown {
  position: relative;
  padding: 0;  
}

.navbar-item .has-subdropdown:hover {
  background-color: hsl(217, 71%, 53%) !important;
  color: white;
}

.navbar-item.has-subdropdown > .navbar-link {
  width: 100%;
  padding: 0.5rem 1rem;
  display: block;
  color: var(--text-color);
}
.navbar-subdropdown {
  display: none;
  position: absolute;
  left: 100%;
  right: auto;
  top: 0;
  min-width: 200px;
  border: 1px solid #838282;
  border-radius: 4px;
  box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1);
  z-index: 20;
}
.navbar-item.has-subdropdown:hover .navbar-subdropdown {
  display: block;
 background-color: var(--hover-bg-color);
  color: var(--hover-text-color);
}
.navbar-item.has-subdropdown:hover .navbar-subdropdown.right-edge {
  left: auto;
  right: 100%;
}
.navbar-subdropdown .navbar-item {
  padding: 0.5rem 1.5rem;
  white-space: nowrap;
  color: var(--text-color);
}
.navbar-subdropdown .navbar-item:hover {
  background-color: hsl(217, 71%, 53%) !important;
  color: var(--hover-text-color);
}

.navbar-item.has-dropdown:hover > .navbar-link,
.navbar-link:hover {
  background-color: hsl(217, 71%, 53%) !important;
  color: white !important;
}
</style>
