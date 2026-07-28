<script setup>
/**
 * Accessible form field: label, control, optional help text and error.
 * The error message is linked via aria-describedby for screen readers.
 */
import { computed, useId } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  help: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  autocomplete: { type: String, default: 'off' },
})

const emit = defineEmits(['update:modelValue'])

const fieldId = useId()
const errorId = computed(() => `${fieldId}-error`)
const helpId = computed(() => `${fieldId}-help`)

const describedBy = computed(() => {
  const ids = []
  if (props.help) ids.push(helpId.value)
  if (props.error) ids.push(errorId.value)
  return ids.length ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="field">
    <label :for="fieldId" class="field__label">
      {{ label }}
      <span v-if="required" aria-hidden="true" class="field__required">*</span>
    </label>

    <input
      :id="fieldId"
      :type="type"
      :value="modelValue"
      :required="required"
      :autocomplete="autocomplete"
      :aria-describedby="describedBy"
      :aria-invalid="error ? 'true' : undefined"
      class="field__input"
      @input="emit('update:modelValue', $event.target.value)"
    />

    <p v-if="help" :id="helpId" class="field__help">{{ help }}</p>
    <p v-if="error" :id="errorId" class="field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.field__label {
  font-family: var(--font-body);
  font-size: var(--fs-small);
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--text-primary);
}

.field__required {
  color: var(--action-secondary);
}

.field__input {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  min-height: var(--touch-min);
  padding: 0 var(--space-4);
}

.field__input:focus-visible {
  border-color: var(--action-secondary);
}

.field__help {
  font-size: var(--fs-small);
  color: var(--color-dark);
  opacity: 0.75;
}

.field__error {
  font-size: var(--fs-small);
  color: #b3261e; /* accessible error red, used only for validation text */
}
</style>