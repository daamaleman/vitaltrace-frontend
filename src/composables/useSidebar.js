import { ref } from 'vue'

/**
 * Shared mobile sidebar (drawer) state.
 * A single module-level ref so the topbar toggle button and the sidebar
 * itself (and its backdrop in AppLayout) stay in sync without a store.
 */
const isOpen = ref(false)

export function useSidebar() {
  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  return { isOpen, open, close, toggle }
}
