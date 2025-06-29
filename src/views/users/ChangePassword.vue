<template>
  <div class="section">
    <div class="container">
      <div class="columns is-centered">
        <div class="column is-half">
          <div class="box">
            <h1 class="title has-text-centered">Change Password</h1>
            
            <div class="field">
              <label class="label">Current Password</label>
              <div class="control has-icons-left">
                <input v-model="currentPassword" class="input" type="password" placeholder="Current password" required>
                <span class="icon is-small is-left">
                  <i class="fas fa-lock"></i>
                </span>
              </div>
            </div>

            <div class="field">
              <label class="label">New Password</label>
              <div class="control has-icons-left">
                <input v-model="newPassword" class="input" type="password" placeholder="New password" required>
                <span class="icon is-small is-left">
                  <i class="fas fa-key"></i>
                </span>
              </div>
              <p class="help">Password must be at least 8 characters</p>
            </div>

            <div class="field">
              <label class="label">Confirm New Password</label>
              <div class="control has-icons-left">
                <input v-model="confirmPassword" class="input" type="password" placeholder="Confirm new password" required>
                <span class="icon is-small is-left">
                  <i class="fas fa-key"></i>
                </span>
              </div>
            </div>

            <div class="field">
              <div class="control">
                <button @click="changePassword" class="button is-primary is-fullwidth" :disabled="!formValid || loading">
                  <span v-if="loading" class="icon">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  <span v-else>Change Password</span>
                </button>
              </div>
            </div>

            <div v-if="error" class="notification is-danger">
              <button class="delete" @click="error = ''"></button>
              {{ error }}
            </div>

            <div v-if="success" class="notification is-success">
              <button class="delete" @click="success = ''"></button>
              Password changed successfully!
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup >
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);

const formValid = computed(() => {
  return currentPassword.value && 
         newPassword.value.length >= 8 && 
         newPassword.value === confirmPassword.value;
});

const changePassword = async () => {
  if (!formValid.value) return;

  try {
    loading.value = true;
    error.value = '';
    success.value = '';

    const result = await window.electronAuth.changePassword(
      (await window.electronAuth.getCurrentUser()).username,
      currentPassword.value,
      newPassword.value
    );
    
    if (result.success) {
      success.value = 'Password changed successfully!';
      currentPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
    } else {
      error.value = result.message || 'Failed to change password';
    }
  } catch (err) {
    error.value = 'An error occurred while changing password';
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.box {
  max-width: 500px;
  margin: 0 auto;
}
</style>