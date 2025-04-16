<template>
    <div class="form-container wide">
      
        <h1 class="title has-text-centered">Update Student's Details</h1>
        <p>Set Roll No here.</p>
        <div v-if="message" class="notification is-primary">{{ message }}</div>
  
        <!-- Personal Information -->
        <div class="box">
          <fieldset>
            <legend class="title is-5">Personal Information</legend>
  
            <!-- Full Name -->
            <div class="field">
              <label class="label">Full Name</label>
              <div class="control">
                <input class="input" type="text" v-model="form.fullName" placeholder="Full Name" required />
              </div>
            </div>
  
            <!-- Gender -->
            <div class="field is-horizontal">
              <div class="field-body">
                <div class="field">
                  <label class="label">Gender</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="form.gender" required>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>
  
                <div class="field">
                  <label class="label">Date of Birth</label>
                  <div class="control">
                    <input class="input" type="date" v-model="form.dob" required />
                  </div>
                </div>
  
                <div class="field">
                  <label class="label">Contact Number</label>
                  <div class="control">
                    <input class="input" type="tel" v-model="form.contactNumber" maxlength="10" placeholder="Contact Number" />
                  </div>
                </div>
              </div>
            </div>
  
            <div class="field is-horizontal">
              <div class="field-body">
                <div class="field">
                  <label class="label">Father's Name</label>
                  <div class="control">
                    <input class="input" type="text" v-model="form.fathersName" placeholder="Father's Name" required />
                  </div>
                </div>
  
                <div class="field">
                  <label class="label">Mother's Name</label>
                  <div class="control">
                    <input class="input" type="text" v-model="form.mothersName" placeholder="Mother's Name" required />
                  </div>
                </div>
              </div>
            </div>
  
          
  
            <!-- Address -->
            <div class="field">
              <label class="label">Address</label>
              <div class="control">
                <input class="input" v-model="form.address" placeholder="Address"></input>
              </div>
            </div>
          </fieldset>
        </div>
  
        <!-- Unique ID (with PEN) -->
        <div class="box">
          <fieldset>
            <legend class="title is-5">Unique ID</legend>
            <div class="field is-horizontal">
              <div class="field-body">
                <div class="field">
                  <label class="label">APAR</label>
                  <div class="control">
                    <input class="input" type="text" v-model="form.apar" maxlength="12" placeholder="APAR" />
                  </div>
                </div>
                <div class="field">
                  <label class="label">Aadhaar Number</label>
                  <div class="control">
                    <input class="input" type="text" v-model="form.aadhaar" maxlength="12" placeholder="Aadhaar Number" />
                  </div>
                </div>
                <div class="field">
                  <label class="label">PEN</label>
                  <div class="control">
                    <input class="input" type="text" v-model="form.pen" maxlength="12" placeholder="PEN" />
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
  
        <!-- Additional Info -->
        <div class="box">
          <fieldset>
            <legend class="title is-5">Additional Information</legend>
  
            <!-- Caste + Religion -->
            <div class="field is-horizontal">
              <div class="field-body">
                <div class="field">
                  <label class="label">Caste</label>
                  <div class="control">
                    <input class="input" type="text" v-model="form.caste" placeholder="Caste" />
                  </div>
                </div>
  
                <div class="field">
                  <label class="label">Religion</label>
                  <div class="control">
                    <input class="input" type="text" v-model="form.religion" placeholder="Religion" />
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Height + Weight + Blood Group -->
            <div class="field is-horizontal">
              <div class="field-body">
                <div class="field">
                  <label class="label">Height (in cm)</label>
                  <div class="control">
                    <input class="input" type="number" v-model="form.height" placeholder="Height in cm" />
                  </div>
                </div>
  
                <div class="field">
                  <label class="label">Weight (in kg)</label>
                  <div class="control">
                    <input class="input" type="number" v-model="form.weight" placeholder="Weight in kg" />
                  </div>
                </div>
  
                <div class="field">
                  <label class="label">Blood Group</label>
                  <div class="control">
                    <input class="input" type="text" v-model="form.bloodGroup" placeholder="Blood Group" />
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
  
        <!-- Admitted To (moved to bottom) -->
        <div class="box">
          <fieldset>
            <legend class="title is-5">Admitted To</legend>
            <div class="field is-horizontal">
              <div class="field-body">
                <div class="field">
                  <label class="label">Class</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="form.className">
                        <option disabled value="">Select Class</option>
                        <option v-for="cls in classOptions" :key="cls" :value="cls">{{ cls }}</option>
                      </select>
                    </div>
                  </div>
                </div>
  
                <div class="field">
                  <label class="label">Section</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select v-model="form.section">
                        <option disabled value="">Select Section</option>
                        <option v-for="sec in sectionOptions" :key="sec" :value="sec">{{ sec }}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
  
        <!-- Submit -->
        <div class="box">
          <div class="field">
            <div class="control">
              <button class="button is-primary is-fullwidth" @click="handleSubmit">Submit</button>
            </div>
          </div>
        </div>
      </div>
  
  </template>
  
  
  <script setup lang="ts">
  import { useAcademicYear } from '../../composables/useAcademicYear'
  
  import { useAdmissionForm } from '../../composables/useAdmissionForm'
  const { currentYear, loadAcademicYear } = useAcademicYear()
  
  const {
    form,
    classOptions,
    sectionOptions,
    message,
    handleSubmit
  } = useAdmissionForm()
  
  </script>
  
  <style scoped>
  
  </style>
  