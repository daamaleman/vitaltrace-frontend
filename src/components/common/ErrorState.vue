<script setup>
defineProps({
  message: { type: String, default: 'Algo salió mal.' },
})
defineEmits(['retry'])
</script>

<template>
  <div class="error">
    <div class="error__icon" aria-hidden="true">⚠</div>
    <p class="error__message">{{ message }}</p>
    <button type="button" class="vt-btn-secondary" @click="$emit('retry')">Reintentar</button>
  </div>
</template>

<style scoped>
.error { text-align: center; padding: var(--space-7) var(--space-5); }
.error__icon { font-size: 36px; color: #b3261e; margin-bottom: var(--space-3); }
.error__message { color: var(--color-dark); margin-bottom: var(--space-4); }
</style>