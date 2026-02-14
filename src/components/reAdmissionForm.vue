<template>
  <div class="student-edit-form">
    <div class="columns is-multiline">
      <div class="column is-half">
        <table class="sikul-table is-fullwidth">
          <thead>       
           <tr>
              <th>Name:</th> <td>{{formData.Name}}</td>
            </tr>
            <tr>
              <th>APAR:</th> <td>{{formData.APAR}}</td>
            </tr>
            <tr>
              <th>PEN:</th> <td>{{formData.PEN}}</td>
            </tr>
            <tr>
              <th>Class:</th> <td>{{formData.ClassName}} {{formData.SectionName ? 'Section-' + formData.SectionName : ''}}</td>
            </tr>    
            <tr>
              <th>Previous Class Result:</th> <td>{{formData.ResultStatus}}</td>
            </tr>
            </thead>
        </table>
      </div>    
      <div class="column is-half">
        <h2 class="subtitle is-6">Admit to:</h2>
      <div class="control">
        <select v-model = "newClassId" class="">
          <option value="13">XI</option>
        </select>
        <input type="input" v-model="newRollNo" />
      </div>
      </div>
    </div>
  
  
    <div class="field is-grouped is-grouped-right">
      
      <div class="control">
        <button class="button is-primary" @click="saveChanges" :disabled="isSaving">
          <span v-if="isSaving" class="icon is-small">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
          <span>Promoted to Next Class</span>
        </button>
        
      </div>
      <div class="control">
        <button class="button is-light" @click="$emit('cancel')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
const errorMessage = ref('')
const props = defineProps({
  readmission: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['save', 'cancel']);

const formData = ref({ ...props.readmission });
const isSaving = ref(false);
const newRollNo = ref(formData.value.Rank)
//console.log('Students Data in Edit Page:', formData.value)

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

async function saveChanges() {
  isSaving.value = true;
  
  try {
    const response = await window.electronAPI.updateStudent(formData.value);
    
    if (response.success) {
      emit('save', formData.value); // Notify parent of successful save
      successMessage.value = 'Student updated successfully!';
    } else {
      throw new Error(response.error || 'Failed to update student');
    }
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>


.student-edit-form {
  padding: 0rem;
}
</style>