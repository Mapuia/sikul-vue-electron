<template>
  <section class="hero">
    <div class="hero-body">
      <div class="container">
        <div class="columns is-centered">
          <div class="column is-5-tablet is-4-desktop is-3-widescreen">
            <div class="box">
              <h1 class="title has-text-centered mb-5">Welcome Back</h1>
              
              <div class="field">
                <label class="label">Username</label>
                <div class="control has-icons-left">
                  <input 
                    v-model="username" 
                    class="input" 
                    type="text" 
                    placeholder="e.g. admin123"
                    @keyup.enter="handleLogin"
                  >
                  <span class="icon is-small is-left">
                    <i class="fas fa-user"></i>
                  </span>
                </div>
              </div>

              <div class="field">
                <label class="label">Password</label>
                <div class="control has-icons-left">
                  <input 
                    v-model="password" 
                    class="input" 
                    type="password" 
                    placeholder="********"
                    @keyup.enter="handleLogin"
                  >
                  <span class="icon is-small is-left">
                    <i class="fas fa-lock"></i>
                  </span>
                </div>
              </div>

              <div class="field">
                <button 
                  @click="handleLogin"
                  class="button is-primary is-fullwidth"
                  :class="{'is-loading': loading}"
                >
                  Login
                </button>
              </div>

              <div v-if="error" class="notification is-danger is-light">
                <button class="delete" @click="error = ''"></button>
                {{ error }}
              </div>

              <div class="has-text-centered mt-4">
                <router-link to="/forgot-password" class="is-size-7">
                  Forgot password? Ask Admin.
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { useRouter } from 'vue-router'
export default {
  data() {
    return {
      username: '',
      password: '',
      error: '',
      loading: false
    }
  },
  setup() {
    const router = useRouter()
    return { router }
  },
  methods: {
    async handleLogin() {
      if (!this.username || !this.password) {
        this.error = 'Please enter both username and password'
        return
      }

      this.loading = true
      this.error = ''
      
      try {
        const result = await window.electronAuth.login(this.username, this.password)
        if (result.success) {
          this.$emit('logged-in', result.user)
          await this.router.push('/home')
        } else {
          this.error = result.message || 'Login failed'
        }
      } catch (error) {
        this.error = 'An error occurred during login'
        console.error(error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.hero {
  
  height: calc(100vh - 60px);
}

.box {
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.title {
  color: #363636;
}

.button.is-primary {
  background-color: #667eea;
  border-color: transparent;
  color: #fff;
  transition: all 0.3s ease;
}

.button.is-primary:hover {
  background-color: #5a6fd1;
  transform: translateY(-1px);
}

.notification {
  border-radius: 6px;
}

.is-fullwidth {
  width: 100%;
}
</style>