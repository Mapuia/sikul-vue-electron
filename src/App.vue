<template>
  <div class="app-wrapper">
    <div v-if="!authenticated">
      <Login @logged-in="handleLoginSuccess" />
    </div>
    <div v-else>
      <Navbar @logout="logout" />
      <router-view />
      
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Login from './components/LoginPage.vue'

export default defineComponent({
  components: { Login, Navbar },
  data() {
    return {
      authenticated: false
    }
  },
  setup() {
    const router = useRouter()
    return { router }
  },
  async created() {
    try {
      this.authenticated = await window.electronAuth.isAuthenticated()
      if (this.authenticated) {
        await this.router.push('/home') // Wait for navigation
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      this.router.push('/login')
    }
  },
  methods: {
    async handleLoginSuccess(user) {
      try {
        this.authenticated = true
        await this.$nextTick() // Ensure reactivity update
        await this.router.push('/home') // Explicitly wait for navigation
      } catch (error) {
        console.error('Redirect failed:', error)
      }
    },
    async logout() {
      try {
        await window.electronAuth.logout()
        this.authenticated = false
        await this.router.push('/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }
  }
})
</script>