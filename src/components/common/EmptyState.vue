<script setup>
defineProps({
  title: { type: String, default: 'Todavía no hay nada aquí' },
  message: { type: String, default: '' },
})
</script>

<template>
  <div class="empty">
    <div class="empty__icon" aria-hidden="true">🗂</div>
    <h3 class="empty__title">{{ title }}</h3>
    <p v-if="message" class="empty__message">{{ message }}</p>
  </div>
</template>

<style scoped>
.empty { text-align: center; padding: var(--space-7) var(--space-5); }
.empty__icon { font-size: 40px; margin-bottom: var(--space-3); }
.empty__title { color: var(--color-navy); margin-bottom: var(--space-2); }
.empty__message { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); }
</style>