<script setup>
/**
 * Corrección administrativa directa (flujo presencial, RN-01).
 * Admisión busca un paciente, consulta sus datos, edita campos administrativos
 * autorizados con un motivo obligatorio, y guarda. El cambio queda registrado
 * y auditado. Pacientes y familiares solo tienen lectura de estos datos.
 */
import { ref, reactive, computed } from 'vue'
import { admissionService } from '@/services/admission.service'
import { mapHttpError } from '@/utils/httpErrors'
import { formatDateTime } from '@/utils/formatters'
import { useToastStore } from '@/stores/toast.store'
import AppButton from '@/components/common/AppButton.vue'
import AppFormField from '@/components/common/AppFormField.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const toast = useToastStore()

// --- Búsqueda de paciente ---
const search = ref('')
const results = ref([])
const searching = ref(false)
const searchError = ref('')

// --- Paciente seleccionado y su historial ---
const selected = ref(null)
const history = ref([])
const loadingPatient = ref(false)

// --- Formulario de corrección ---
const form = reactive({
  first_name: '', middle_name: '', first_last_name: '', second_last_name: '',
  identity_document: '', phone: '', address: '',
  emergency_contact_name: '', emergency_contact_phone: '', administrative_notes: '',
  reason: '',
})
const saving = ref(false)
const formError = ref('')
const fieldErrors = ref({})
const confirmOpen = ref(false)

async function runSearch() {
  if (!search.value.trim()) return
  searching.value = true
  searchError.value = ''
  try {
    const res = await admissionService.patients({ search: search.value.trim() })
    results.value = Array.isArray(res) ? res : (res?.data ?? [])
  } catch (err) {
    searchError.value = mapHttpError(err)
  } finally {
    searching.value = false
  }
}

function patientLabel(p) {
  const person = p.person
  const name = person ? `${person.first_name} ${person.first_last_name}` : '—'
  return `${name} · ${p.record_number ?? ''}`
}

async function selectPatient(p) {
  loadingPatient.value = true
  try {
    const full = await admissionService.patient(p.id)
    selected.value = full
    const person = full.person ?? {}
    Object.assign(form, {
      first_name: person.first_name ?? '',
      middle_name: person.middle_name ?? '',
      first_last_name: person.first_last_name ?? '',
      second_last_name: person.second_last_name ?? '',
      identity_document: person.identity_document ?? '',
      phone: person.phone ?? '',
      address: person.address ?? '',
      emergency_contact_name: full.emergency_contact_name ?? '',
      emergency_contact_phone: full.emergency_contact_phone ?? '',
      administrative_notes: full.administrative_notes ?? '',
      reason: '',
    })
    fieldErrors.value = {}
    formError.value = ''
    // Historial de correcciones de este paciente
    const all = await admissionService.corrections()
    history.value = (all ?? []).filter((c) => c.patient_id === full.id)
  } catch (err) {
    toast.error(mapHttpError(err))
  } finally {
    loadingPatient.value = false
  }
}

function clearSelection() {
  selected.value = null
  results.value = []
  search.value = ''
  history.value = []
}

function openConfirm() {
  if (!form.reason.trim() || form.reason.trim().length < 5) {
    fieldErrors.value = { reason: 'El motivo es obligatorio (mínimo 5 caracteres).' }
    return
  }
  confirmOpen.value = true
}

async function submitCorrection() {
  saving.value = true
  formError.value = ''
  fieldErrors.value = {}
  try {
    await admissionService.correctPatient(selected.value.id, { ...form })
    confirmOpen.value = false
    toast.success('Corrección administrativa aplicada correctamente.')
    // Recargar el paciente y su historial
    await selectPatient(selected.value)
  } catch (err) {
    confirmOpen.value = false
    if (err.status === 422 && err.errors) {
      fieldErrors.value = Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
      )
      formError.value = err.message
    } else {
      formError.value = mapHttpError(err)
    }
    toast.error('No se pudo aplicar la corrección.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="corr">
    <header class="corr__header">
      <h1>Correcciones administrativas</h1>
      <p class="corr__subtitle">Mantenimiento presencial de datos administrativos del paciente</p>
    </header>

    <!-- Paso 1: buscar y seleccionar paciente -->
    <div v-if="!selected" class="vt-card corr__panel">
      <div class="corr__searchbar">
        <input
          v-model="search"
          type="search"
          class="corr__search"
          placeholder="Buscar por nombre, documento o número de expediente…"
          aria-label="Buscar paciente"
          @keyup.enter="runSearch"
        />
        <AppButton variant="primary" :loading="searching" @click="runSearch">Buscar</AppButton>
      </div>

      <p v-if="searchError" class="corr__error" role="alert">{{ searchError }}</p>

      <ul v-if="results.length" class="corr__results">
        <li v-for="p in results" :key="p.id" class="corr__result" @click="selectPatient(p)">
          <span class="corr__result-name">{{ patientLabel(p) }}</span>
          <span class="corr__result-go">Seleccionar →</span>
        </li>
      </ul>
      <EmptyState
        v-else-if="!searching && search"
        title="Sin resultados"
        message="Ningún paciente coincide con la búsqueda."
      />
      <p v-else-if="!search" class="corr__hint">Busca un paciente para consultar y corregir sus datos administrativos.</p>
    </div>

    <!-- Paso 2-6: datos actuales, edición, motivo, confirmar -->
    <div v-else class="corr__editor">
      <button type="button" class="corr__back" @click="clearSelection">← Buscar otro paciente</button>

      <div class="vt-card corr__patient-card">
        <h2 class="corr__patient-title">{{ patientLabel(selected) }}</h2>
        <p class="corr__patient-meta">Ingreso {{ formatDateTime(selected.admission_date) }} · estado {{ selected.administrative_status }}</p>
      </div>

      <div class="vt-card corr__form">
        <h3 class="corr__form-title">Datos administrativos</h3>
        <div class="corr__grid">
          <AppFormField v-model="form.first_name" kind="name" label="Primer nombre" :maxlength="80" :error="fieldErrors.first_name" />
          <AppFormField v-model="form.middle_name" kind="name" label="Segundo nombre" :maxlength="80" :error="fieldErrors.middle_name" />
          <AppFormField v-model="form.first_last_name" kind="name" label="Primer apellido" :maxlength="80" :error="fieldErrors.first_last_name" />
          <AppFormField v-model="form.second_last_name" kind="name" label="Segundo apellido" :maxlength="80" :error="fieldErrors.second_last_name" />
          <AppFormField v-model="form.identity_document" label="Documento de identidad" :maxlength="40" :error="fieldErrors.identity_document" />
          <AppFormField v-model="form.phone" kind="phone" label="Teléfono" :maxlength="25" :error="fieldErrors.phone" />
          <AppFormField v-model="form.emergency_contact_name" kind="name" label="Contacto de emergencia" :maxlength="160" :error="fieldErrors.emergency_contact_name" />
          <AppFormField v-model="form.emergency_contact_phone" kind="phone" label="Teléfono de emergencia" :maxlength="25" :error="fieldErrors.emergency_contact_phone" />
        </div>
        <AppFormField v-model="form.address" label="Dirección" :maxlength="200" :error="fieldErrors.address" />
        <AppFormField v-model="form.administrative_notes" label="Notas administrativas" :maxlength="500" :error="fieldErrors.administrative_notes" />

        <div class="corr__reason-field">
          <label class="corr__label" for="corr-reason">
            Motivo de la corrección <span aria-hidden="true" class="corr__required">*</span>
          </label>
          <textarea
            id="corr-reason"
            v-model="form.reason"
            class="corr__textarea"
            rows="2"
            maxlength="500"
            placeholder="Explica por qué se realiza esta corrección…"
          ></textarea>
          <p v-if="fieldErrors.reason" class="corr__error" role="alert">{{ fieldErrors.reason }}</p>
        </div>

        <p v-if="formError" class="corr__error" role="alert">{{ formError }}</p>
        <div class="corr__actions">
          <AppButton variant="secondary" :disabled="saving" @click="clearSelection">Cancelar</AppButton>
          <AppButton variant="primary" :loading="saving" loading-label="Guardando…" @click="openConfirm">Guardar corrección</AppButton>
        </div>
      </div>

      <!-- Historial de correcciones del paciente -->
      <div v-if="history.length" class="vt-card corr__history">
        <h3 class="corr__form-title">Historial de correcciones</h3>
        <ul class="corr__hist-list">
          <li v-for="h in history" :key="h.id" class="corr__hist-item">
            <div class="corr__hist-head">
              <span class="corr__hist-field">{{ h.field }}</span>
              <span class="corr__hist-date">{{ formatDateTime(h.reviewed_at ?? h.created_at) }}</span>
            </div>
            <div class="corr__hist-change">
              <span class="corr__hist-old">{{ h.current_value || '(vacío)' }}</span>
              <span class="corr__arrow" aria-hidden="true">→</span>
              <span class="corr__hist-new">{{ h.requested_value }}</span>
            </div>
            <p class="corr__hist-reason">{{ h.reason }}</p>
          </li>
        </ul>
      </div>
    </div>

    <ConfirmDialog
      :open="confirmOpen"
      title="Confirmar corrección"
      confirm-label="Aplicar corrección"
      :loading="saving"
      message="Se actualizarán los datos administrativos del paciente y quedará registrado en la auditoría. ¿Deseas continuar?"
      @confirm="submitCorrection"
      @cancel="confirmOpen = false"
    />
  </div>
</template>

<style scoped>
.corr__header { margin-bottom: var(--space-5); }
.corr__subtitle { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); margin-top: var(--space-2); }
.corr__panel { padding: var(--space-5); }
.corr__searchbar { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }
.corr__search { flex: 1; min-width: 240px; font-family: var(--font-body); font-size: var(--fs-body); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); min-height: var(--touch-min); padding: 0 var(--space-4); background: var(--bg-card); }
.corr__hint { color: var(--color-dark); opacity: 0.6; font-size: var(--fs-small); margin-top: var(--space-4); }
.corr__results { list-style: none; margin-top: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
.corr__result { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); cursor: pointer; }
.corr__result:hover { background: #faf8f3; border-color: var(--color-teal); }
.corr__result-name { font-weight: 600; color: var(--color-navy); }
.corr__result-go { font-size: var(--fs-small); color: var(--color-teal); font-weight: 600; }
.corr__back { background: none; border: none; color: var(--action-secondary); font-weight: 600; cursor: pointer; margin-bottom: var(--space-4); padding: 0; }
.corr__patient-card { padding: var(--space-4); margin-bottom: var(--space-4); }
.corr__patient-title { font-size: var(--fs-featured); color: var(--color-navy); }
.corr__patient-meta { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; margin-top: var(--space-2); }
.corr__form { padding: var(--space-5); margin-bottom: var(--space-4); }
.corr__form-title { font-size: var(--fs-body); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-4); }
.corr__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0 var(--space-4); }
.corr__reason-field { display: flex; flex-direction: column; gap: var(--space-2); margin: var(--space-4) 0; }
.corr__label { font-size: var(--fs-small); font-weight: 600; }
.corr__required { color: var(--action-secondary); }
.corr__textarea { font-family: var(--font-body); font-size: var(--fs-body); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-3); background: var(--bg-card); resize: vertical; }
.corr__error { color: #b3261e; font-size: var(--fs-small); margin-top: var(--space-2); }
.corr__actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); }
.corr__history { padding: var(--space-5); }
.corr__hist-list { list-style: none; display: flex; flex-direction: column; gap: var(--space-3); }
.corr__hist-item { padding-bottom: var(--space-3); border-bottom: 1px solid var(--border-subtle); }
.corr__hist-item:last-child { border-bottom: none; }
.corr__hist-head { display: flex; justify-content: space-between; margin-bottom: 2px; }
.corr__hist-field { font-weight: 600; color: var(--color-navy); }
.corr__hist-date { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.6; }
.corr__hist-change { display: flex; gap: var(--space-2); align-items: center; font-size: var(--fs-small); }
.corr__hist-old { color: var(--color-dark); opacity: 0.6; }
.corr__hist-new { color: var(--color-navy); font-weight: 600; }
.corr__arrow { color: var(--color-teal); font-weight: 700; }
.corr__hist-reason { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.75; font-style: italic; margin-top: 2px; }
</style>
