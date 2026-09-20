<script setup>
import AppButton from './AppButton.vue'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  totalItems: { type: Number, default: 0 },
  label: { type: String, default: 'Resultados' },
})

const emit = defineEmits(['update:page'])

function goToPage(nextPage) {
  if (nextPage < 1 || nextPage > props.totalPages || nextPage === props.page) return
  emit('update:page', nextPage)
}
</script>

<template>
  <div v-if="totalPages > 1" class="pager">
    <p class="pager__meta">
      {{ label }}: {{ totalItems }} · Página {{ page }} de {{ totalPages }}
    </p>
    <div class="pager__actions">
      <AppButton variant="secondary" :disabled="page <= 1" @click="goToPage(page - 1)">
        Anterior
      </AppButton>
      <AppButton variant="secondary" :disabled="page >= totalPages" @click="goToPage(page + 1)">
        Siguiente
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-4) 0 0;
  margin-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.pager__meta {
  font-size: var(--fs-small);
  color: var(--color-dark);
  opacity: 0.75;
}

.pager__actions {
  display: flex;
  gap: var(--space-2);
}
</style>
