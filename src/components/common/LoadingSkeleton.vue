<script setup>
/** Simple skeleton rows for loading states. */
defineProps({ rows: { type: Number, default: 5 } })
</script>

<template>
  <div class="skeleton" role="status" aria-label="Cargando">
    <div v-for="n in rows" :key="n" class="skeleton__row"></div>
  </div>
</template>

<style scoped>
.skeleton { display: flex; flex-direction: column; gap: var(--space-3); }
.skeleton__row {
  height: 48px;
  border-radius: var(--radius-md);
  background: linear-gradient(90deg, #ece8df 25%, #f5f2ea 50%, #ece8df 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>