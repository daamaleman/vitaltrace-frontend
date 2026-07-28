<script setup>
/**
 * Application shell: sidebar + topbar + routed content on the warm canvas.
 */
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
</script>

<template>
  <div class="layout">
    <AppSidebar />
    <div class="layout__main">
      <AppTopbar />
      <main class="layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.layout__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.layout__content {
  flex: 1;
  padding: var(--space-6);
  background: var(--bg-canvas);
}
</style>