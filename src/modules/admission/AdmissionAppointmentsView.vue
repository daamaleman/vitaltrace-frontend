<script setup>
/**
 * Admission appointment management: schedule for any patient with any
 * professional, list all, change status. No assignment scoping (admission
 * has broad administrative access).
 */
import { ref, reactive, onMounted } from 'vue'
import { admissionService } from '@/services/admission.service'
import { mapHttpError } from '@/utils/httpErrors'
import { formatDateTime } from '@/utils/formatters'
import { useToastStore } from '@/stores/toast.store'
import AppButton from '@/components/common/AppButton.vue'
import AppFormField from '@/components/common/AppFormField.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const toast = useToastStore()

const appointments = ref([])
const patients = ref([])
const staff = ref([])
const loading = ref(false)
const error = ref('')

const showForm = ref(false)
const saving = ref(false)
const formError = ref('')
const updatingId = ref(null)

const form = reactive({
  patient_id: '',
  health_staff_id: '',
  scheduled_at: '',
  duration_minutes: 30,
  reason: '',
})

const statuses = [
  { value: 'SCHEDULED', label: 'Programada' },
  { value: 'CONFIRMED', label: 'Confirmada' },
  { value: 'ATTENDED', label: 'Atendida' },
  { value: 'CANCELLED', label: 'Cancelada' },
  { value: 'NO_SHOW', label: 'No asistió' },
]

function personName(p) {
  if (!p) return '—'
  return `${p.first_name} ${p.first_last_name}`
}
function patientLabel(a) {
  return personName(a.patient?.person) + (a.patient?.record_number ? ` (${a.patient.record_number})` : '')
}
function staffLabel(a) {
  return personName(a.health_staff?.person ?? a.healthStaff?.person)
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [appts, pats, stf] = await Promise.all([
      admissionService.appointments(),
      admissionService.patients(),
      admissionService.availableStaff(),
    ])
    appointments.value = appts ?? []
    patients.value = Array.isArray(pats) ? pats : (pats?.data ?? [])
    staff.value = stf ?? []
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { patient_id: '', health_staff_id: '', scheduled_at: '', duration_minutes: 30, reason: '' })
  formError.value = ''
}

async function submit() {
  saving.value = true
  formError.value = ''
  try {
    await admissionService.createAppointment({ ...form })
    showForm.value = false
    resetForm()
    await loadAll()
    toast.success('Cita agendada correctamente.')
  } catch (err) {
    formError.value = mapHttpError(err)
    toast.error('No se pudo agendar la cita.')
  } finally {
    saving.value = false
  }
}

async function changeStatus(appt, status) {
  updatingId.value = appt.id
  try {
    await admissionService.setAppointmentStatus(appt.id, status)
    await loadAll()
    toast.success('Estado de la cita actualizado.')
  } catch (err) {
    toast.error('No se pudo actualizar la cita.')
  } finally {
    updatingId.value = null
  }
}

onMounted(loadAll)
</script>

<template>
  <div class="appts">
    <header class="appts__header">
      <h1 class="appts__title">Citas</h1>
      <AppButton v-if="!showForm" variant="primary" @click="showForm = true">Agendar cita</AppButton>
    </header>

    <div v-if="showForm" class="appts__form vt-card">
      <h3 class="appts__form-title">Nueva cita</h3>
      <div class="appts__grid">
        <div class="appts__field">
          <label class="appts__label" for="appt-patient">Paciente</label>
          <select id="appt-patient" v-model="form.patient_id" class="appts__select">
            <option value="" disabled>Selecciona un paciente</option>
            <option v-for="p in patients" :key="p.id" :value="p.id">
              {{ personName(p.person) }} {{ p.record_number ? `(${p.record_number})` : '' }}
            </option>
          </select>
        </div>
        <div class="appts__field">
          <label class="appts__label" for="appt-staff">Profesional</label>
          <select id="appt-staff" v-model="form.health_staff_id" class="appts__select">
            <option value="" disabled>Selecciona un profesional</option>
            <option v-for="s in staff" :key="s.id" :value="s.id">
              {{ personName(s.person) }} {{ s.professional_type ? `· ${s.professional_type}` : '' }}
            </option>
          </select>
        </div>
        <AppFormField v-model="form.scheduled_at" label="Fecha y hora" type="datetime-local" required />
        <AppFormField v-model="form.duration_minutes" label="Duración (min)" type="number" />
      </div>
      <AppFormField v-model="form.reason" label="Motivo" required />
      <p v-if="formError" class="appts__error" role="alert">{{ formError }}</p>
      <div class="appts__form-actions">
        <AppButton variant="secondary" :disabled="saving" @click="showForm = false; resetForm()">Cancelar</AppButton>
        <AppButton variant="primary" :loading="saving" loading-label="Guardando…" @click="submit">Guardar</AppButton>
      </div>
    </div>

    <LoadingSkeleton v-if="loading" :rows="4" />
    <ErrorState v-else-if="error" :message="error" @retry="loadAll" />
    <EmptyState v-else-if="appointments.length === 0" title="No hay citas registradas" />
    <ul v-else class="appts__list">
      <li v-for="a in appointments" :key="a.id" class="appts__item vt-card">
        <div class="appts__item-main">
          <span class="appts__item-title">{{ a.reason }}</span>
          <StatusBadge :value="a.status" kind="clinical" />
        </div>
        <div class="appts__meta">
          {{ patientLabel(a) }} · {{ staffLabel(a) }}
        </div>
        <div class="appts__meta">{{ formatDateTime(a.scheduled_at) }} · {{ a.duration_minutes }} min</div>
        <div class="appts__actions">
          <label class="appts__actions-label">Estado:</label>
          <select
            class="appts__select appts__select--sm"
            :value="a.status"
            :disabled="updatingId === a.id"
            @change="changeStatus(a, $event.target.value)"
          >
            <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.appts__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); gap: var(--space-4); flex-wrap: wrap; }
.appts__title { font-size: var(--fs-featured); color: var(--color-navy); }
.appts__form { margin-bottom: var(--space-5); }
.appts__form-title { font-size: var(--fs-body); font-weight: 600; color: var(--color-navy); margin-bottom: var(--space-4); }
.appts__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0 var(--space-4); }
.appts__field { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
.appts__label { font-size: var(--fs-small); font-weight: 600; }
.appts__select { font-family: var(--font-body); font-size: var(--fs-body); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); min-height: var(--touch-min); padding: 0 var(--space-3); background: var(--bg-card); }
.appts__select--sm { min-height: 34px; max-width: 200px; }
.appts__error { color: #b3261e; font-size: var(--fs-small); margin-bottom: var(--space-3); }
.appts__form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
.appts__list { list-style: none; display: flex; flex-direction: column; gap: var(--space-3); }
.appts__item-main { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); }
.appts__item-title { font-weight: 600; color: var(--color-navy); }
.appts__meta { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.75; margin-top: var(--space-2); }
.appts__actions { display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-3); }
.appts__actions-label { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; }
</style>
