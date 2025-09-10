<template>
  <div class="student-details">

    <!-- Personal Information -->
    <div class="box">
      <h3 class="title is-5">Personal Information</h3>
      <table class="sikul-table is-fullwidth">
        <thead>
          <tr><th>Regn. No.</th><td>{{ student.RegistrationNumber || '-' }}</td></tr>
          <tr><th>Name</th><td>{{ student.Name || '-' }}</td></tr>
          <tr><th>Gender</th><td>{{ student.Gender || '-' }}</td></tr>
          <tr><th>Date of Birth</th><td>{{ formatDate(student.DOB) }}</td></tr>
          <tr><th>Father's Name</th><td>{{ student.FathersName || '-' }}</td></tr>
          <tr><th>Mother's Name</th><td>{{ student.MothersName || '-' }}</td></tr>
          <tr><th>Contact</th><td>{{ student.Contact || '-' }}</td></tr>
          <tr><th>Caste</th><td>{{ student.Caste || '-' }}</td></tr>
          <tr><th>Religion</th><td>{{ student.Religion || '-' }}</td></tr>
          <tr><th>Blood Group</th><td>{{ student.BloodGroup || '-' }}</td></tr>
          <tr><th>Address</th><td>{{ student.Address || '-' }}</td></tr>
        </thead>
      </table>
    </div>

    <!-- Academic Information -->
    <div class="box">
      <h3 class="title is-5">Current Academic Information</h3>
      <table class="sikul-table is-fullwidth">
        <thead>
         
          <tr><th>Class</th><td>{{ admission.ClassName || '-' }}</td></tr>
          <tr><th>Section</th><td>{{ admission.SectionName || '-' }}</td></tr>
          <tr><th>Roll No</th><td>{{ admission.RollNo || '-' }}</td></tr>
          <tr><th>Admission Type</th><td>{{ admission.AdmissionType || '-' }}</td></tr>
          <tr><th>First Admission</th><td>{{ formatDate(student.FirstAdmissionDate) }}</td></tr>
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

    <!-- Identification -->
    <div class="box">
      <h3 class="title is-5">UNIQUE ID</h3>
      <table class="sikul-table is-fullwidth">
        <thead>
          <tr><th>PEN</th><td>{{ student.PEN || '-' }}</td></tr>
          <tr><th>APAAR</th><td>{{ student.APAR || '-' }}</td></tr>
          <tr><th>Aadhaar</th><td>{{ student.Aadhaar || '-' }}</td></tr>
        </thead>
      </table>
    </div>

    <!-- Physical Attributes -->
    <div class="box">
      <h3 class="title is-5">Physical Attributes</h3>
      <table class="sikul-table is-fullwidth">
        <thead>
          <tr><th>Height</th><td>{{ student.Height || '-' }} cm</td></tr>
          <tr><th>Weight</th><td>{{ student.Weight || '-' }} Kg</td></tr>
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
}
</style>
