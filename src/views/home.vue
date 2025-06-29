<template>
    <section class="section">
      <div class="content container full">
        <img src="../assets/sikul_logo.png" alt="School Logo" class="logo" />
        <h1 class="welcome">Welcome {{currentUser}} to Calvary Higher Secondary School</h1>
        <h2 class="subtitle">Light to Enlight</h2>
        <router-link to="/dashboard" class="enter-button">Dashboard</router-link>
      </div>
    </section>
  </template>
  
<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'

  const currentUser = ref('')
 
  onMounted(async () => {
    const user = await window.electronAuth.getCurrentUser()
    currentUser.value = user.username
  })
  
  </script>

  <style scoped>
  .welcome{
    color: rgb(144, 139, 147);
  }
 
  
  .content {
    margin-top: 3rem;
    text-align: center;
    backdrop-filter: blur(6px);
    background-color: rgba(51, 48, 48, 0.8);
    padding: 4rem 3rem;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    color: rgb(65, 60, 60);
    height: 500px;
  }
  
  .logo {
    width: 100px;
    height: 95px;
    margin-bottom: 1rem;
  }
  
  .enter-button {
    display: inline-block;
    margin-top: 1.5rem;
    padding: 0.5rem 1.5rem;
    background-color: hsl(217, 71%, 53%);
    color: white;
    border-radius: 6px;
    text-decoration: none;
  }
  .enter-button:hover {
    background-color: hsl(217, 71%, 43%);
  }
  </style>