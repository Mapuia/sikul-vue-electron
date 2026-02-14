<template>
  <footer class="footer has-background-light py-3">
      <div class="columns is-mobile is-vcentered px-4 is-size-7">
        
        <div class="column has-text-centered">
          {{ currentYear }} Calvary Higher Secondary School. 
        </div>
        
      </div>
    </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.footer{
  color: rgb(35, 35, 73);
}
</style>
