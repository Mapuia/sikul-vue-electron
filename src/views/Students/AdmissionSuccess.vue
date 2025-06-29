<template>
    <div class="container is-flex is-flex-direction-column is-justify-content-center is-align-items-center" style="height: calc(100vh - 10vh);">
      <div class="box" style="width: 100%; max-width: 800px;">
        <h1 class="title is-4 has-text-centered">Student entered successfully!</h1>
        <h2 class="subtitle is-5 has-text-centered">Academic Year {{ academicYear }}</h2>

        <div class="notification is-success is-dark box">
          <div class="columns is-centered box">
            <div class="column is-half">          
                    <table class="table is-fullwidth">
                  <tbody>                    
                    <tr>
                      <th>Name</th>
                      <td>{{ studentName }}</td>
                    </tr>
                    <tr>
                      <th>Class</th>
                      <td>{{ className }}  </td>
                    </tr>
                    <tr v-if="sectionName">
                      <th>Section</th>
                      <td>{{ sectionName }}</td>
                    </tr>
                    <tr>
                      <th>Roll Number</th>
                      <td>{{ rollNo }}</td>
                    </tr>
                    <tr>
                      <th>Admission ID</th>
                      <td>{{ admissionId }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
         
        </div>
  
         <div class="buttons is-centered mt-4">
            <button class="button is-primary" @click="newAdmission">
              Enter New Student
            </button>
          </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  // Get the route query parameters
  const admissionId = router.currentRoute.value.query.admissionId;
  const studentName = router.currentRoute.value.query.studentName;
  const className = router.currentRoute.value.query.className;
  const sectionName = router.currentRoute.value.query.sectionName;
  const rollNo = router.currentRoute.value.query.rollNo;
  const academicYear = router.currentRoute.value.query.academicYear;
  
  const newAdmission = () => {
    router.push('/students/new');
  };

  </script>
  
  <style scoped>

  
  .buttons {
    margin-top: 2rem;
    margin-bottom: 2rem;
  }
  </style>