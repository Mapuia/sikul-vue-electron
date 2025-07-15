<template>
  <div class="page-wrapper is-flex is-flex-direction-column is-justify-content-space-between">
    <!-- Centered Content -->
    <section class="section is-flex-grow-1 is-flex is-flex-direction-column is-justify-content-center is-align-items-center has-text-centered">
      <figure class="image is-96x96 mb-4">
        <img src="../assets/sikul_logo.png" alt="School Logo" />
      </figure>

      <h1 class="subtitle is-4 mb-3">
        Hello {{ currentUser }}                         
      </h1>
      <h1 class="title is-4">
        Welcome to Calvary Higher Secondary School
      </h1>
      <h2 class="subtitle is-5 mt-5 mb-5 is-italic">"Light to Enlight"</h2>      
    </section>

    <Footer />
    
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Footer from '../components/Footer.vue'

const currentUser = ref('')
const currentYear = new Date().getFullYear()

onMounted(async () => {
  const user = await window.electronAuth.getCurrentUser()
  currentUser.value = user.username.charAt(0).toUpperCase() + user.username.slice(1);
})
</script>

<style scoped>
.page-wrapper {
  min-height: calc(100vh - 3.25rem);
}
.section{
  padding-bottom: 7rem;
}
.image img {
  width: 96px;
  height: 96px;
}
.footer{
  color: rgb(35, 35, 73);
}
</style>
