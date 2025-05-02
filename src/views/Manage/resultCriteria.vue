<template>
    <div class="form-container wide">
      <h1 class="title has-text-centered">Set Result Criteria</h1>
  
      <div class="box">
        <ul>
            <li>Pass Mark Percentage</li>
            <li>Division Percentage</li>
            <li>Grade Percentage</li>
            <li>How to consider Simple pass</li>
            <li>Which Subject is Mandatory to Pass</li>
        </ul>
   <hr>   
        <p>Pass Mark in each subject is 40%. </p>

  <p>Simple  Pass  is  awarded  to  Class  I  –  VIII  students  whose 
    marks are above the aggregate mark pass marks even if they 
    fail in two subjects.  However,  the  student who  scores  less 
    than 25% in Science or Mathematics will be declared failed. </p>
<hr>
    <p>In  Class  IX  and  X,  Simple  pass  is  awarded  to  Student 
    whose  marks  are  above  the  aggregate  pass  mark  even 
    if  they  fail  in  one  subject.  However,  the  student  who 
    score less than 25% in all subjects will be declared failed. 
    </p>
<hr>
      <p>Criteria for Divisions: <br />
      Distinction  	- 80% <br />
      First Division 	- 60%  <br />
      Second Division – 50%<br />
      Third Division  	- 40%</p>
<hr>
<p>
35 and above  - A <br />
25 and above - B <br />
25 below - C</p>

        <!-- Example input -->
        <div class="field mt-4">
          <label class="label">Sample Input</label>
          <div class="control">
            <input class="input" type="text" v-model="sampleText" placeholder="Type something..." />
          </div>
        </div>
  
        <!-- Example buttons -->
        <div class="buttons mt-4">
          <button class="button is-primary" @click="handleSubmit">Submit</button>
          <button class="button is-light" @click="reset">Reset</button>
        </div>
  
        <!-- Output display -->
        <div v-if="submitted" class="notification is-success mt-4">
          You submitted: <strong>{{ sampleText }}</strong>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const sampleText = ref('')
  const submitted = ref(false)
  
  function handleSubmit() {
    if (sampleText.value.trim()) {
      submitted.value = true
    }
  }
  
  function reset() {
    sampleText.value = ''
    submitted.value = false
  }
  </script>
  
  <style scoped>
  .container {
    max-width: 600px;
    margin: 0 auto;
  }
  </style>
  