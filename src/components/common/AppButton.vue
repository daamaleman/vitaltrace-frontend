<script setup>
/**
 * Action button that prevents double-submit.
 *
 * While `loading` is true (or `disabled` is set), the button is disabled and
 * shows a spinner + optional loading label, so the user waits for the action
 * to finish before clicking again. Use for any button that fires a request.
 */
import { computed } from 'vue'

const props = defineProps({
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  variant: { type: String, default: 'primary' }, // 'primary' | 'secondary' | 'danger'
  type: { type: String, default: 'button' },
  loadingLabel: { type: String, default: '' },
})

const emit = defineEmits(['click'])

const isBlocked = computed(() => props.loading || props.disabled)

const variantClass = computed(() => ({
  primary: 'vt-btn-primary',
  secondary: 'vt-btn-secondary',
  danger: 'appbtn--danger',
}[props.variant] ?? 'vt-btn-primary'))

function onClick(event) {
  if (isBlocked.value) return
  emit('click', event)
}
</script>

<template>
  <button
    :type="type"
    class="appbtn"
    :class="variantClass"
    :disabled="isBlocked"
    :aria-busy="loading"
    @click="onClick"
  >
    <span v-if="loading" class="appbtn__spinner" aria-hidden="true"></span>
    <span class="appbtn__label">
      <slot v-if="!loading || !loadingLabel" />
      <template v-else>{{ loadingLabel }}</template>
    </span>
  </button>
</template>

<style scoped>
.appbtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  position: relative;
}
.appbtn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.appbtn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: appbtn-spin 0.6s linear infinite;
  flex-shrink: 0;
}
.appbtn__label { display: inline-flex; align-items: center; }
.appbtn--danger {
  font-family: var(--font-body);
  font-weight: 600;
  color: #fff;
  background: #b3261e;
  border: 1px solid #b3261e;
  border-radius: var(--radius-md);
  min-height: var(--touch-min);
  padding: 0 var(--space-4);
  cursor: pointer;
}
@keyframes appbtn-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .appbtn__spinner { animation: none; }
}
</style>
