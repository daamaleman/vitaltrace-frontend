<script setup>
/**
 * Application shell: sidebar + topbar + routed content on the warm canvas.
 */
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import { useIdleTimeout } from '@/composables/useIdleTimeout'
import { useSidebar } from '@/composables/useSidebar'

// Auto-logout after 15 minutes of inactivity (§13).
useIdleTimeout(15)

const { isOpen, close } = useSidebar()
</script>

<template>
  <div class="layout">
    <AppSidebar />
    <div v-if="isOpen" class="layout__backdrop" @click="close"></div>
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

.layout__backdrop {
  display: none;
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

@media (max-width: 880px) {
  .layout__backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(1, 48, 94, 0.4);
    z-index: 1000;
  }
}

@media (max-width: 640px) {
  .layout__content {
    padding: var(--space-4);
  }
}
</style>