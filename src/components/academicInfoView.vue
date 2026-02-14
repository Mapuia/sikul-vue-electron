<template>
  <div class="student-details">
    <h3 class="title is-4 has-text-centered">Calvary higher Secondary School, Tuidu</h3>
    <hr>
    <h3 class="subtitle is-4 has-text-centered">Student's Academic Information</h3>

    <!-- Personal Information -->
    <div class="box">
      <table class="table sikul-table is-fullwidth">
        <thead>          
          <tr><th style="height: 40px">Registration Number</th><td>{{ student.RegistrationNumber || '-' }}</td></tr>                   
          <tr><th>Name</th><td>{{ student.Name || '-' }}</td></tr>          
          <tr><th>Father's Name</th><td>{{ student.FathersName || '-' }}</td></tr>
          <tr>
            <th>Current Status</th>
            <td>
              <span class="tag" :class="statusTagClass(student.Status)">
                {{ student.Status || '-' }}
              </span>
            </td>
          </tr>        
        </thead>
      </table>
    </div>

    <!-- Academic Information -->
    <div class="box">
      <h3 class="title is-5">Academic Information</h3>
      <table class="table sikul-table is-fullwidth">
        <thead>         
          <tr><th>Academic Year</th><td>{{ admission.YearName || '-' }}</td></tr>
          <tr><th>Class</th><td>{{ admission.ClassName || '-' }}</td></tr>
          <tr><th>Section</th><td>{{ admission.SectionName || '-' }}</td></tr>
          <tr><th>Roll No</th><td>{{ admission.RollNo || '-' }}</td></tr>
          <tr><th>Admission Type</th><td>{{ admission.AdmissionType || '-' }}</td></tr>
          <tr><th>Admission Date</th><td>{{ formatDate(admission.Creation_at) }}</td></tr>
          
        </thead>
      </table>
    </div>

    <!-- Identification -->
    <div class="box">
      <h3 class="title is-5">Unique Identification</h3>
      <table class="table sikul-table is-fullwidth">
        <thead>
          <tr><th>PEN</th><td>{{ student.PEN || '-' }}</td></tr>
          <tr><th>APAAR</th><td>{{ student.APAR || '-' }}</td></tr>
          <tr><th>Aadhaar</th><td>{{ student.Aadhaar || '-' }}</td></tr>
        </thead>
      </table>
    </div> 

  </div>
</template>


<script setup>
const props = defineProps({
  student: {
    type: Object,
    required: true
  },
  admission: {
    type: Object,
    required: true
  }
});

function formatDate(dateString) {
  if (!dateString || dateString === '-') return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function statusTagClass(status) {
  switch (status) {
    case 'Admitted': return 'is-success';
    case 'Transferred': return 'is-info';
    case 'Terminated': return 'is-danger';
    case 'Retained': return 'is-warning';
    default: return 'is-light';
  }
}
</script>

<style scoped>
.student-details {
  width: 70%;
  margin: 0 auto;
}
.student-details .box {
  margin-bottom: 1.5rem;
}
.student-details p {
  margin-bottom: 0.5rem;
}
.tag {
  margin-left: 0.5rem;
}
.sikul-table th{
width: 250px;
font-weight: 450;
}
.sikul-table td {
font-weight: 700;
}
.is-success {
  color: white;
}
</style>
