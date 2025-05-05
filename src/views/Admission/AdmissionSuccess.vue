<template>
    <div class="form-container wide">
      <div class="box has-text-centered">
        <h1 class="title is-4 mb-6">Admission Successful!</h1>
        
        <div class="notification is-success is-light">
          <p class="subtitle is-5">Student has been successfully admitted for {{ academicYear }}</p>
          
          <div class="content has-text-left">
            <div class="columns is-centered">
              <div class="column is-half">
                <table class="table is-fullwidth">
                  <tbody>
                    <tr>
                      <th>Admission ID</th>
                      <td>{{ admissionId }}</td>
                    </tr>
                    <tr>
                      <th>Student Name</th>
                      <td>{{ studentName }}</td>
                    </tr>
                    <tr>
                      <th>Class</th>
                      <td>{{ className }} - {{ sectionName }}</td>
                    </tr>
                    <tr>
                      <th>Roll Number</th>
                      <td>{{ rollNo }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
  
        <div class="buttons is-centered mt-6">
          <button 
            class="button is-primary "
            @click="newAdmission"
          >
            New Admission
          </button>
          <button 
            class="button is-info "
            @click="reAdmission"
          >
            Re-Admission
          </button>
          <button 
            class="button is-light "
            @click="goToStudents"
          >
            View All Students
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
    router.push('/admission/new');
  };
  const reAdmission = () => {
    router.push('/admission/re');
  };
  const goToStudents = () => {
    router.push('/students');
  };
  </script>
  
  <style scoped>

  
  .buttons {
    margin-top: 2rem;
    margin-bottom: 2rem;
  }
  </style>