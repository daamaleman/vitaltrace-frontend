import { ref } from 'vue'

/**
 * Shared mobile sidebar (drawer) state.
 * A single module-level ref so the topbar toggle button and the sidebar
 * itself (and its backdrop in AppLayout) stay in sync without a store.
 */
const isOpen = ref(false)

// Desktop collapse (icon-only rail with just the logo). Persisted so the
// preference survives a reload.
const COLLAPSE_KEY = 'vt-sidebar-collapsed'
let storedCollapsed = false
try {
  storedCollapsed = localStorage.getItem(COLLAPSE_KEY) === '1'
} catch {
  storedCollapsed = false
}
const collapsed = ref(storedCollapsed)

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

  function toggleCollapsed() {
    collapsed.value = !collapsed.value
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed.value ? '1' : '0')
    } catch {
      // Ignore storage errors (private browsing, quota, etc.).
    }
  }

  return { isOpen, open, close, toggle, collapsed, toggleCollapsed }
}
