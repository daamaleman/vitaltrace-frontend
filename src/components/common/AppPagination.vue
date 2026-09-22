<script setup>
import { computed } from 'vue'
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

const visiblePages = computed(() => {
  if (props.totalPages <= 7) {
    return Array.from({ length: props.totalPages }, (_, index) => index + 1)
  }

  const candidates = new Set([1, props.totalPages, props.page - 1, props.page, props.page + 1])
  const orderedPages = Array.from(candidates)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= props.totalPages)
    .sort((a, b) => a - b)

  const output = []
  let previousPage = 0

  orderedPages.forEach((pageNumber) => {
    if (pageNumber - previousPage > 1) {
      output.push('...')
    }
    output.push(pageNumber)
    previousPage = pageNumber
  })

  return output
})
</script>

<template>
  <div v-if="totalPages > 1" class="pager">
    <div class="pager__meta">
      <span class="pager__label">{{ label }}</span>
      <span class="pager__summary">{{ totalItems }} elementos</span>
      <span class="pager__count">Página {{ page }} de {{ totalPages }}</span>
    </div>

    <div class="pager__controls" aria-label="Paginación">
      <AppButton variant="secondary" class="pager__nav" :disabled="page <= 1" @click="goToPage(page - 1)">
        Anterior
      </AppButton>

      <div class="pager__pages">
        <button
          v-for="item in visiblePages"
          :key="`${item}-${typeof item}`"
          type="button"
          class="pager__page"
          :class="{ 'pager__page--active': item === page, 'pager__page--ellipsis': item === '...' }"
          :disabled="item === '...'"
          :aria-current="item === page ? 'page' : undefined"
          @click="typeof item === 'number' && goToPage(item)"
        >
          {{ item }}
        </button>
      </div>

      <AppButton variant="secondary" class="pager__nav" :disabled="page >= totalPages" @click="goToPage(page + 1)">
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
  padding: var(--space-4);
  margin-top: var(--space-4);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.pager__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pager__label {
  font-size: var(--fs-small);
  font-weight: 700;
  color: var(--color-navy);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.pager__summary,
.pager__count {
  font-size: var(--fs-small);
  color: var(--color-dark);
  opacity: 0.78;
}

.pager__controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-left: auto;
}

.pager__pages {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.pager__page {
  min-width: 36px;
  height: 36px;
  padding: 0 var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-navy);
  font-family: var(--font-body);
  font-size: var(--fs-small);
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.pager__page:hover:not(:disabled) {
  background: rgba(1, 125, 132, 0.08);
}

.pager__page--active {
  background: var(--color-navy);
  color: var(--text-on-brand);
}

.pager__page--ellipsis {
  cursor: default;
  color: var(--color-dark);
  opacity: 0.55;
}

.pager__nav {
  min-width: 100px;
}

.pager__nav:disabled {
  opacity: 0.45;
}

@media (max-width: 720px) {
  .pager {
    padding: var(--space-4) var(--space-3);
  }

  .pager__controls {
    width: 100%;
    justify-content: space-between;
  }

  .pager__pages {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .pager__nav {
    flex: 1;
    min-width: 0;
  }
}
</style>
