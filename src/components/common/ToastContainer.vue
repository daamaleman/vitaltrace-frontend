<script setup>
/**
 * Renders the stack of active toasts (top-right). Reads from the toast store.
 */
import { useToastStore } from '@/stores/toast.store'

const toastStore = useToastStore()

const icons = { success: '✓', error: '✕', info: 'ℹ' }
</script>

<template>
  <div class="toasts" aria-live="polite" aria-atomic="false">
    <transition-group name="toast">
      <div
        v-for="t in toastStore.toasts"
        :key="t.id"
        class="toast"
        :class="`toast--${t.type}`"
        role="status"
      >
        <span class="toast__icon" aria-hidden="true">{{ icons[t.type] }}</span>
        <span class="toast__msg">{{ t.message }}</span>
        <button type="button" class="toast__close" aria-label="Cerrar" @click="toastStore.dismiss(t.id)">×</button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  top: var(--space-5);
  right: var(--space-5);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 360px;
}
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  font-size: var(--fs-small);
}
.toast__icon {
  width: 22px; height: 22px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; color: #fff; font-weight: 700; flex-shrink: 0;
}
.toast--success { border-left: 4px solid #1b8a4b; }
.toast--success .toast__icon { background: #1b8a4b; }
.toast--error { border-left: 4px solid #b3261e; }
.toast--error .toast__icon { background: #b3261e; }
.toast--info { border-left: 4px solid var(--color-teal); }
.toast--info .toast__icon { background: var(--color-teal); }
.toast__msg { flex: 1; color: var(--color-dark); }
.toast__close {
  background: transparent; border: none; cursor: pointer;
  font-size: 18px; line-height: 1; color: var(--color-dark); opacity: 0.5;
}
.toast__close:hover { opacity: 1; }

.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active, .toast-leave-active { transition: none; }
}
</style>
