<template>
  <div class="section">
    <div class="container">
      <div class="columns is-centered">
        <div class="column is-half">
          <div class="box">
            <h1 class="title has-text-centered">Create New User</h1>
            
            <div class="field">
              <label class="label">Username</label>
              <div class="control has-icons-left">
                <input v-model="username" class="input" type="text" placeholder="Username" required>
                <span class="icon is-small is-left">
                  <i class="fas fa-user"></i>
                </span>
              </div>
            </div>

            <div class="field">
              <label class="label">Password</label>
              <div class="control has-icons-left">
                <input v-model="password" class="input" type="password" placeholder="Password" required>
                <span class="icon is-small is-left">
                  <i class="fas fa-lock"></i>
                </span>
              </div>
              <p class="help">Password must be at least 8 characters</p>
            </div>

            <div class="field">
              <label class="label">Confirm Password</label>
              <div class="control has-icons-left">
                <input v-model="confirmPassword" class="input" type="password" placeholder="Confirm password" required>
                <span class="icon is-small is-left">
                  <i class="fas fa-lock"></i>
                </span>
              </div>
            </div>

            <div class="field">
              <label class="label">Role</label>
              <div class="control has-icons-left">
                <div class="select is-fullwidth">
                  <select v-model="role">
                    <option value="admin">Administrator</option>
                    <option value="teacher">Teacher</option>
                    <option value="deo">Data Entry Operator</option>
                  </select>
                </div>
                <span class="icon is-small is-left">
                  <i class="fas fa-user-tag"></i>
                </span>
              </div>
            </div>

            <div class="field">
              <div class="control">
                <button @click="createUser" class="button is-primary is-fullwidth" :disabled="!formValid || loading">
                  <span v-if="loading" class="icon">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  <span v-else>Create User</span>
                </button>
              </div>
            </div>

            <div v-if="error" class="notification is-danger">
              <button class="delete" @click="error = ''"></button>
              {{ error }}
            </div>

            <div v-if="success" class="notification is-success">
              <button class="delete" @click="success = ''"></button>
              User created successfully!
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const role = ref('teacher');
const error = ref('');
const success = ref('');
const loading = ref(false);

const formValid = computed(() => {
  return username.value && 
         password.value.length >= 8 && 
         password.value === confirmPassword.value;
});

const createUser = async () => {
  if (!formValid.value) return;

  try {
    loading.value = true;
    error.value = '';
    success.value = '';

    const result = await window.electronAuth.register(
      username.value,
      password.value,
      role.value
    );

    if (result.success) {
      success.value = 'User created successfully!';
      username.value = '';
      password.value = '';
      confirmPassword.value = '';
      role.value = 'teacher';
    } else {
      error.value = result.message || 'Failed to create user';
    }
  } catch (err) {
    error.value = 'An error occurred while creating user';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Verify admin status on mount
onMounted(async () => {
  const currentUser = await window.electronAuth.getCurrentUser();
  if (currentUser?.role !== 'admin') {
    router.push('/unauthorized');
  }
});
</script>

<style scoped>
.box {
  max-width: 500px;
  margin: 0 auto;
}
</style>