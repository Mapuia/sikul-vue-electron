<template>
    <div class="form-container wide">
      <h1 class="title has-text-centered">Result Criteria Info</h1>
  
      <div class="box">
        <h1 class="subtitle">About Result Criteria <span class="icon has-text-info"><i class="fas fa-info-circle"></i></span></h1>
   <hr>   
       
    <ol class="pl-4">
      <li>Pass Mark in each subject is 40%</li>
      <li>Division and Rank is given to those who pass in all subjects</li>
      <li>Simple Pass is granted to Class I-X students, who secure above the aggregate pass marks; even if they fail in 1 or 2 subjects. However, it is compulsory to secure at least 20% in those failed subjects to get Simple Pass.</li>
      Student failed in 1 subject is declared 'Fail' if he secure less than 20% in that failed subject.
      <li>Simple Pass is granted to Class XI students if they failed in 1 subject only. (There is no minimum marks)</li>
      <li>There is no provision for Simple Pass for KG-I and KG-II. It is compulsory to pass in all subjects.</li>
    </ol>
<hr>
      <p>Criteria for Divisions: <br />
      Distinction  	- 80% <br />
      First Division 	- 60%  <br />
      Second Division – 45%<br />
      Third Division  	- 40%</p>
<hr>

<p>Criteria for Grade: <br />
35 and above  - A <br />
25 and above - B <br />
Below 25 - C</p>

  
<!-- Example input 
        <div class="field mt-4">
          <label class="label">Sample Input</label>
          <div class="control">
            <input class="input" type="text" v-model="sampleText" placeholder="Type something..." />
          </div>
        </div>
-->  
        <!-- Example buttons 
        <div class="buttons mt-4">
          <button class="button is-primary" @click="handleSubmit">Submit</button>
          <button class="button is-light" @click="reset">Reset</button>
        </div>
--> 
        <!-- Output display -
        <div v-if="submitted" class="notification is-success mt-4">
          You submitted: <strong>{{ sampleText }}</strong>
        </div>
      
    
-->   </div>
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
  