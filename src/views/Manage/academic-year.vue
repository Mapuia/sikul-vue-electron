<template>
  <div class="form-container single ">
      <h1 class="title has-text-centered">Academic Year {{ currentYear }}</h1>

 
      <form v-if="concluded" @submit.prevent="submitForm" class="box ">
      <div class="field"> 
        <label class="label ">Academic Year</label>
        <div class="control ">
          <input
            id="yearInput"
            v-model="year"
            @input="formatYear"
            @blur="autoFillDates"
            class="input"
            type="text"
            placeholder="e.g. 2025-26"
            background="white"
          >
        </div>
      </div>

      <div class="field is-horizontal">
        <div class="field-body">
          <div class="field">
            <label class="label">Start Date</label>
            <div class="coinput">
              <input id="startDateInput" v-model="startDate" class="input" type="date">
            </div>
          </div>

          <div class="field">
            <label class="label">End Date</label>
            <div class="control ">
              <input id="endDateInput" v-model="endDate" class="input custom-date" type="date">     
            </div>
          </div>
        </div>
      </div>

      <div class="field mt-5">
        <div class="control">
          <button id="addYearButton" class="button is-primary is-fullwidth" >Submit</button>
        </div>
      </div>  
      <div class="field mt-5">
        
        <div class="control">
          <button class="button is-success is-outlined  is-fullwidth" @click="resetForm">Reset</button>
        </div>
      
      </div>

      <div id="message" class="notification" v-if="message.text" :class="message.type">
        {{ message.text }}
      </div>
    </form>  
    <div v-else="!concluded" class="box" > <p>The Year {{ currentYear }} is not concluded. Check result has been published and Previous Academic year is concluded.</p>
      
      <button v-if="resultout" class="button is-primary mt-5 is-fullwidth" @click="concludeYear">Conclude Year {{ currentYear }} and Create New Academic Year</button>
    </div>
</div>

</template>

<script setup>
import { ref } from 'vue';
import { useAcademicYear } from '../../composables/useAcademicYear'

const { currentYear, loadAcademicYear } = useAcademicYear()

let concluded = ref(false);
let resultout = ref(true);

const year = ref('');
const startDate = ref('');
const endDate = ref('');
const message = ref({ text: '', type: '' });

//temporary
function concludeYear(){
  concluded.value = !concluded.value;
}

function formatYear() {
  let value = year.value.replace(/\D/g, '');
  if (value.length >= 4) {
    const startYear = value.slice(0, 4);
    const endYearShort = ((parseInt(startYear) + 1) % 100).toString().padStart(2, '0');
    year.value = `${startYear}-${endYearShort}`;
  }
}

function autoFillDates() {
  const pattern = /^\d{4}-\d{2}$/;
  const value = year.value.trim();
  if (!pattern.test(value)) {
    showMessage("Invalid format. Please enter in the format: 2025-26", 'is-danger');
    return;
  }

  const startYear = parseInt(value.slice(0, 4));
  startDate.value = `${startYear}-04-01`;
  endDate.value = `${startYear + 1}-03-31`;
}

function submitForm() {
  if (!year.value || !startDate.value || !endDate.value) {
    showMessage("All fields are required.", "is-danger");
    return;
  }
 
  const data = {
    year: year.value,
    startDate: startDate.value,
    endDate: endDate.value
  };

  window.electronAPI.addAcademicYear(data).then(result => {
    if (result.success) {
      showMessage("Academic year added successfully.", "is-success");
      resetForm();
      window.electronAPI.notifyAcademicYearAdded();
    } else {
      showMessage(result.message || "Failed to add academic year.", "is-danger");
    }
  }).catch(err => {
    showMessage("Unexpected error: " + err.message, "is-danger");
  });
   
  

}

function resetForm() {
  year.value = '';
  startDate.value = '';
  endDate.value = '';
}

function showMessage(msg, type) {
  message.value = { text: msg, type: type };
  setTimeout(() => {
    message.value = { text: '', type: '' };
  }, 3000);
}

</script>
