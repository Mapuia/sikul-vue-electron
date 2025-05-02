<template>
    <section class="section">
      <div class="content container full">
        <img src="../assets/sikul_logo.png" alt="School Logo" class="logo" />
        <h1 class="welcome">Welcome to Calvary High School</h1>
        <p>Light to Enlight</p>
        <router-link to="/dashboard" class="enter-button">Dashboard</router-link>
      </div>
    </section>
  </template>
  
  <script setup>
  </script>
  
  <style scoped>
  .welcome{
    color: black;
  }
  .landing {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: url('../assets/logo-watermark.png') no-repeat center center fixed;
    background-size: 400px auto;
  }
  
  .content {
    text-align: center;
    backdrop-filter: blur(6px);
    background-color: rgba(255, 255, 255, 0.8);
    padding: 2rem 3rem;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    color: black;
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