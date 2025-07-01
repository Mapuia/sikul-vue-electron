<template>
  <section class="hero">
    <div class="hero-body">
      <div class="container ">
        <div class="columns is-centered ">
          <div class="column is-3-desktop is-4-tablet is-4-widescreen">
            <div class="box " >
    
              <div class="is-flex is-justify-content-center">
              <img class="logo has-text-centered" src="../assets/sikul_logo.png" alt="School Logo"/>
              </div>
              <h1 class="title has-text-centered  mb-5">Login</h1>
              <div class="field">
                <label class="label">Username</label>
                <div class="control has-icons-left">
                  <input 
                    v-model="username" 
                    class="input" 
                    type="text" 
                    placeholder="username"
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
.title{
  color: rgb(78, 85, 101);
}

.logo {
  height: 4.5em;
  padding: 0.5rem;
  will-change: filter;
  transition: filter 300ms;
  vertical-align: middle;
}
.logo:hover {
  filter: drop-shadow(0 0 1em #c12121aa);
}
.box{
  vertical-align: middle;
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
</style>