<script setup>
/**
 * Accessible form field: label, control, optional help text and error.
 * The error message is linked via aria-describedby for screen readers.
 */
import { computed, useId } from 'vue'
import { blockInvalidPaste, getFieldValidationMessage, sanitizeFieldValue } from '@/utils/formValidation'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  kind: { type: String, default: 'text' },
  maxlength: { type: [String, Number], default: undefined },
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

const defaultMaxLength = computed(() => {
  if (props.kind === 'name') return 150
  if (props.kind === 'phone') return 15
  if (props.kind === 'email') return 254
  return undefined
})

const effectiveMaxLength = computed(() => {
  if (props.maxlength !== undefined && props.maxlength !== null && props.maxlength !== '') {
    return Number(props.maxlength)
  }

  return defaultMaxLength.value
})

const inputMode = computed(() => {
  if (props.type === 'email') return 'email'
  if (props.kind === 'phone') return 'numeric'
  if (props.type === 'number') return 'decimal'
  return undefined
})

function onInput(event) {
  const sanitizedValue = sanitizeFieldValue(event.target.value, {
    kind: props.kind,
    maxLength: effectiveMaxLength.value,
  })

  if (event.target.value !== sanitizedValue) {
    event.target.value = sanitizedValue
  }

  emit('update:modelValue', sanitizedValue)
}

function onPaste(event) {
  blockInvalidPaste(event, props.kind, effectiveMaxLength.value)
}

function onDrop(event) {
  const dropText = event.dataTransfer?.getData('text/plain') ?? ''
  if (!dropText) return

  const sanitizedDrop = sanitizeFieldValue(dropText, {
    kind: props.kind,
    maxLength: effectiveMaxLength.value,
  })

  if (sanitizedDrop !== dropText) {
    event.preventDefault()
  }
}

const fieldValidationMessage = computed(() => getFieldValidationMessage(props.kind, props.label))
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
      :maxlength="effectiveMaxLength"
      :inputmode="inputMode"
      :aria-describedby="describedBy"
      :aria-invalid="error ? 'true' : undefined"
      :title="fieldValidationMessage"
      class="field__input"
      @input="onInput"
      @paste="onPaste"
      @drop="onDrop"
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