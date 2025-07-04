<template>
  <footer class="footer has-background-light">
    <div class="content">
      <div class="columns is-vcentered is-mobile">
        <!-- Left -->
        <div class="column has-text-left">
          <p class="help is-dark">
            Developed by Lalrinpuia, Capritech IT Solutions.
          </p>
        </div>

        <!-- Center -->
        <div class="column has-text-centered">
          <p>
            &copy; {{ currentYear }} Calvary Higher Secondary School. All rights reserved.
          </p>
        </div>

        <!-- Right -->
        <div class="column has-text-right">
          <a href="mailto:ell.rpa@gmail.com" class="button is-small is-light">
            email: ell.rpa@gmail.com
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.footer {
  padding-top: 0.75rem;
  margin-top:auto;
  margin-bottom: 1px;
  height: 60px;
  width:100%;

 
}
</style>
