<template>
  <!-- Personal Info -->
  <div class="box">
    <h3 class="title is-5">Personal Information</h3>
    <div class="columns is-multiline">
      <div class="column is-one-third">
        <p><strong>Name:</strong> {{ student.name || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Gender:</strong> {{ student.gender || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Date of Birth:</strong> {{ formatDate(student.dob) || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Father's Name:</strong> {{ student.fathersName || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Mother's Name:</strong> {{ student.mothersName || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Contact:</strong> {{ student.contact || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Caste:</strong> {{ student.caste || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Religion:</strong> {{ student.religion || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Blood Group:</strong> {{ student.bloodGroup || '-' }}</p>
      </div>
      <div class="column is-full">
        <p><strong>Address:</strong> {{ student.address || '-' }}</p>
      </div>
    </div>
  </div>

  <!-- Academic Info -->
  <div class="box">
    <h3 class="title is-5">Academic Information</h3>
    <div class="columns is-multiline">
      <div class="column is-one-third">
        <p><strong>Current Class:</strong> {{ student.className || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Section:</strong> {{ student.sectionName || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Roll No:</strong> {{ student.rollNo || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Admission Type:</strong> {{ student.admissionType || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Academic Year:</strong> {{ student.academicYear || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>First Admission:</strong> {{ formatDate(student.firstAdmissionDate) || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Status:</strong> 
          <span class="tag" :class="statusTagClass(student.status)">
            {{ student.status || '-' }}
          </span>
        </p>
      </div>
    </div>
  </div>

  <!-- Identification -->
  <div class="box">
    <h3 class="title is-5">Identification</h3>
    <div class="columns is-multiline">
      
      <div class="column is-one-third">
        <p><strong>PEN:</strong> {{ student.pen || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>APAR:</strong> {{ student.apar || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Aadhaar:</strong> {{ student.aadhaar || '-' }}</p>
      </div>
    </div>
  </div>

  <!-- Physical Attributes -->
  <div class="box">
    <h3 class="title is-5">Physical Attributes</h3>
    <div class="columns">
      <div class="column is-one-third">
        <p><strong>Height:</strong> {{ student.height || '-' }}</p>
      </div>
      <div class="column is-one-third">
        <p><strong>Weight:</strong> {{ student.weight || '-' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  student: {
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
</style>