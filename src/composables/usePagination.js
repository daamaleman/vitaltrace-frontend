import { ref, computed, watch, toValue } from 'vue'

/**
 * Shared client-side pagination: page state, page count, and the sliced
 * "current page" of a list. `source` may be a ref, computed, or getter
 * function returning the already-filtered array.
 */
export function usePagination(source, { pageSize = 10 } = {}) {
  const page = ref(1)

  const totalItems = computed(() => toValue(source).length)
  const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))

  const paged = computed(() => {
    const list = toValue(source)
    const start = (page.value - 1) * pageSize
    return list.slice(start, start + pageSize)
  })

  // Clamp when the list shrinks (filter, tab switch, row removal) — without
  // this, `page` can end up pointing past `totalPages`.
  watch(totalPages, (max) => {
    if (page.value > max) page.value = max
  })

  return { page, pageSize, totalPages, totalItems, paged }
}
