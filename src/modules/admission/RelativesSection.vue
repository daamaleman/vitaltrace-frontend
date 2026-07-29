<script setup>
/**
 * Relatives management for a patient (§8.2, RN-03).
 * Shows current relatives (max two active), allows adding and revoking.
 */
import { ref, computed, reactive, onMounted } from 'vue'
import { admissionService } from '@/services/admission.service'
import { mapHttpError } from '@/utils/httpErrors'
import AppFormField from '@/components/common/AppFormField.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  patientId: { type: [String, Number], required: true },
})

const relatives = ref([])
const loading = ref(false)
const error = ref('')
const showForm = ref(false)
const saving = ref(false)
const formError = ref('')
const fieldErrors = ref({})

const form = reactive({
  first_name: '',
  first_last_name: '',
  date_of_birth: '',
  gender: 'UNSPECIFIED',
  identity_document: '',
  phone: '',
  relationship: '',
})

const genderOptions = [
  { value: 'UNSPECIFIED', label: 'No especificado' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'OTHER', label: 'Otro' },
]

const activeCount = computed(
  () => relatives.value.filter((r) => ['PENDING', 'ACTIVE'].includes(r.status)).length,
)

const atMax = computed(() => activeCount.value >= 2)

function relativeName(link) {
  const p = link.relative?.person
  if (!p) return 'Desconocido'
  return `${p.first_name} ${p.first_last_name}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    relatives.value = await admissionService.patientRelatives(props.patientId)
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    first_name: '', first_last_name: '', date_of_birth: '',
    gender: 'UNSPECIFIED', identity_document: '', phone: '', relationship: '',
  })
  fieldErrors.value = {}
  formError.value = ''
}

async function submitRelative() {
  saving.value = true
  formError.value = ''
  fieldErrors.value = {}
  try {
    await admissionService.addRelative(props.patientId, { ...form })
    showForm.value = false
    resetForm()
    await load()
  } catch (err) {
    if (err.status === 422 && err.errors) {
      fieldErrors.value = Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
      )
      formError.value = err.message
    } else {
      formError.value = mapHttpError(err)
    }
  } finally {
    saving.value = false
  }
}

async function revoke(linkId) {
  try {
    await admissionService.revokeRelative(linkId)
    await load()
  } catch (err) {
    error.value = mapHttpError(err)
  }
}

onMounted(load)
</script>

<template>
  <div class="rel vt-card">
    <div class="rel__header">
      <h3 class="rel__title">Familiares <span class="rel__count">{{ activeCount }} de 2</span></h3>
      <button
        v-if="!showForm"
        type="button"
        class="vt-btn-secondary"
        :disabled="atMax"
        :title="atMax ? 'Se alcanzó el máximo de dos familiares activos' : ''"
        @click="showForm = true"
      >
        + Agregar familiar
      </button>
    </div>

    <p v-if="atMax && !showForm" class="rel__note">
      Se alcanzó el máximo de dos familiares activos (RN-03).
    </p>

    <div v-if="loading" class="rel__loading">Cargando…</div>

    <ul v-else-if="relatives.length" class="rel__list">
      <li v-for="link in relatives" :key="link.id" class="rel__item">
        <div class="rel__info">
          <span class="rel__name">{{ relativeName(link) }}</span>
          <span class="rel__relationship">{{ link.relationship }}</span>
        </div>
        <StatusBadge :value="link.status" kind="clinical" />
        <button
          v-if="['PENDING', 'ACTIVE'].includes(link.status)"
          type="button"
          class="rel__revoke"
          @click="revoke(link.id)"
        >
          Revocar
        </button>
      </li>
    </ul>

    <p v-else class="rel__empty">Aún no hay familiares registrados.</p>

    <!-- Add relative form -->
    <div v-if="showForm" class="rel__form">
      <h4 class="rel__form-title">Nuevo familiar</h4>
      <div class="rel__grid">
        <AppFormField v-model="form.first_name" label="Primer nombre" required :error="fieldErrors.first_name" />
        <AppFormField v-model="form.first_last_name" label="Primer apellido" required :error="fieldErrors.first_last_name" />
        <AppFormField v-model="form.date_of_birth" label="Fecha de nacimiento" type="date" required :error="fieldErrors.date_of_birth" />
        <div class="rel__field">
          <label class="rel__label" for="rel-gender">Sexo</label>
          <select id="rel-gender" v-model="form.gender" class="rel__select">
            <option v-for="o in genderOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <AppFormField v-model="form.relationship" label="Parentesco" required :error="fieldErrors.relationship" help="p. ej. Madre, Hijo, Cónyuge" />
        <AppFormField v-model="form.phone" label="Teléfono" :error="fieldErrors.phone" />
      </div>

      <p v-if="formError" class="rel__error" role="alert">{{ formError }}</p>

      <div class="rel__form-actions">
        <button type="button" class="vt-btn-secondary" @click="showForm = false; resetForm()">Cancelar</button>
        <button type="button" class="vt-btn-primary" :disabled="saving" @click="submitRelative">
          {{ saving ? 'Guardando…' : 'Agregar familiar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rel { margin-top: var(--space-5); }
.rel__header { display: flex; justify-content: space-between; align-items: center; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
.rel__title { font-size: var(--fs-featured); color: var(--color-navy); }
.rel__count { font-size: var(--fs-small); font-weight: 600; color: var(--color-teal); margin-left: var(--space-2); }
.rel__note { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; margin-bottom: var(--space-3); }
.rel__loading, .rel__empty { color: var(--color-dark); opacity: 0.6; font-size: var(--fs-small); padding: var(--space-3) 0; }
.rel__list { list-style: none; display: flex; flex-direction: column; gap: var(--space-3); }
.rel__item { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
.rel__info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.rel__name { font-weight: 600; color: var(--color-navy); }
.rel__relationship { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; }
.rel__revoke {
  font-family: var(--font-body); font-size: var(--fs-small); font-weight: 600;
  color: #b3261e; background: transparent; border: 1px solid #b3261e;
  border-radius: var(--radius-md); min-height: 34px; padding: 0 var(--space-3); cursor: pointer;
}
.rel__form { margin-top: var(--space-5); padding-top: var(--space-5); border-top: 1px solid var(--border-subtle); }
.rel__form-title { font-size: var(--fs-body); font-weight: 600; color: var(--color-navy); margin-bottom: var(--space-4); }
.rel__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0 var(--space-4); }
.rel__field { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
.rel__label { font-size: var(--fs-small); font-weight: 600; }
.rel__select {
  font-family: var(--font-body); font-size: var(--fs-body);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: var(--touch-min); padding: 0 var(--space-3); background: var(--bg-card);
}
.rel__error { color: #b3261e; font-size: var(--fs-small); margin-bottom: var(--space-3); }
.rel__form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
</style>
