<script setup>
// Root shell: renders the active route and the global toast stack.
import ToastContainer from '@/components/common/ToastContainer.vue'
</script>

<template>
  <router-view />
  <ToastContainer />
</template>
