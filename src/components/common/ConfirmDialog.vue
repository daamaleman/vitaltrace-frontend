<script setup>
/**
 * Confirmation dialog for sensitive actions. Supports an optional comment
 * field so the clinician can annotate the action (recorded in history).
 */
import { ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmar acción' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirmar' },
  withComment: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])

const comment = ref('')

watch(() => props.open, (isOpen) => {
  if (isOpen) comment.value = ''
})

function confirm() {
  emit('confirm', comment.value.trim() || null)
}
</script>

<template>
  <div v-if="open" class="dialog" role="dialog" aria-modal="true">
    <div class="dialog__backdrop" @click="emit('cancel')"></div>
    <div class="dialog__panel">
      <h3 class="dialog__title">{{ title }}</h3>
      <p v-if="message" class="dialog__message">{{ message }}</p>

      <div v-if="withComment" class="dialog__field">
        <label for="confirm-comment" class="dialog__label">Comentario (opcional)</label>
        <textarea
          id="confirm-comment"
          v-model="comment"
          class="dialog__textarea"
          rows="3"
          placeholder="Agrega una nota para el registro…"
        ></textarea>
      </div>

      <div class="dialog__actions">
        <button type="button" class="vt-btn-secondary" :disabled="loading" @click="emit('cancel')">
          Cancelar
        </button>
        <button type="button" class="vt-btn-primary" :disabled="loading" @click="confirm">
          {{ loading ? 'Procesando…' : confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 1000;
}
.dialog__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(40, 49, 55, 0.5);
}
.dialog__panel {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 40px rgba(40, 49, 55, 0.25);
  padding: var(--space-5);
  width: 100%;
  max-width: 440px;
  margin: var(--space-4);
}
.dialog__title { color: var(--color-navy); margin-bottom: var(--space-3); }
.dialog__message { color: var(--color-dark); font-size: var(--fs-body); margin-bottom: var(--space-4); }
.dialog__field { margin-bottom: var(--space-4); }
.dialog__label {
  display: block;
  font-size: var(--fs-small);
  font-weight: 600;
  margin-bottom: var(--space-2);
}
.dialog__textarea {
  width: 100%;
  font-family: var(--font-body);
  font-size: var(--fs-body);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  resize: vertical;
}
.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
