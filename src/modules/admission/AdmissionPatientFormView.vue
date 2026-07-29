<script setup>
/**
 * Patient registration/edit form (§8.1).
 * Captures person + patient data in one form; the backend creates or
 * updates both transactionally. Only Admission reaches this.
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { admissionService } from '@/services/admission.service'
import { mapHttpError } from '@/utils/httpErrors'
import AppFormField from '@/components/common/AppFormField.vue'
import RelativesSection from './RelativesSection.vue'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.name === 'admission-patient-edit')
const patientId = computed(() => route.params.id)

const form = reactive({
  first_name: '',
  middle_name: '',
  first_last_name: '',
  second_last_name: '',
  date_of_birth: '',
  gender: 'UNSPECIFIED',
  identity_document: '',
  phone: '',
  address: '',
  record_number: '',
  admission_date: '',
  administrative_status: 'PRE_REGISTERED',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  administrative_notes: '',
})

const fieldErrors = ref({})
const formError = ref('')
const saving = ref(false)
const loading = ref(false)

const genderOptions = [
  { value: 'UNSPECIFIED', label: 'No especificado' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'OTHER', label: 'Otro' },
]

const statusOptions = [
  { value: 'PRE_REGISTERED', label: 'Preregistrado' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'DISCHARGED', label: 'Dado de alta' },
  { value: 'ARCHIVED', label: 'Archivado' },
]

async function loadForEdit() {
  loading.value = true
  try {
    const patient = await admissionService.patient(patientId.value)
    const p = patient.person ?? {}
    Object.assign(form, {
      first_name: p.first_name ?? '',
      middle_name: p.middle_name ?? '',
      first_last_name: p.first_last_name ?? '',
      second_last_name: p.second_last_name ?? '',
      date_of_birth: p.date_of_birth ?? '',
      gender: p.gender ?? 'UNSPECIFIED',
      identity_document: p.identity_document ?? '',
      phone: p.phone ?? '',
      address: p.address ?? '',
      record_number: patient.record_number ?? '',
      admission_date: patient.admission_date ?? '',
      administrative_status: patient.administrative_status ?? 'PRE_REGISTERED',
      emergency_contact_name: patient.emergency_contact_name ?? '',
      emergency_contact_phone: patient.emergency_contact_phone ?? '',
      administrative_notes: patient.administrative_notes ?? '',
    })
  } catch (err) {
    formError.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  formError.value = ''
  fieldErrors.value = {}
  try {
    if (isEdit.value) {
      await admissionService.updatePatient(patientId.value, { ...form })
    } else {
      await admissionService.createPatient({ ...form })
    }
    router.push({ name: 'admission-patients' })
  } catch (err) {
    if (err.status === 422 && err.errors) {
      fieldErrors.value = Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
      )
    } else {
      formError.value = mapHttpError(err)
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEdit.value) loadForEdit()
})
</script>

<template>
  <div class="pf">
    <button type="button" class="pf__back" @click="router.push({ name: 'admission-patients' })">
      ← Volver a pacientes
    </button>

    <h1>{{ isEdit ? 'Editar paciente' : 'Registrar paciente' }}</h1>

    <form class="pf__form" @submit.prevent="handleSubmit">
      <div class="vt-card pf__section">
        <h3 class="pf__section-title">Información personal</h3>
        <div class="pf__grid">
          <AppFormField v-model="form.first_name" label="Primer nombre" required :error="fieldErrors.first_name" />
          <AppFormField v-model="form.middle_name" label="Segundo nombre" :error="fieldErrors.middle_name" />
          <AppFormField v-model="form.first_last_name" label="Primer apellido" required :error="fieldErrors.first_last_name" />
          <AppFormField v-model="form.second_last_name" label="Segundo apellido" :error="fieldErrors.second_last_name" />
          <AppFormField v-model="form.date_of_birth" label="Fecha de nacimiento" type="date" required :error="fieldErrors.date_of_birth" />
          <div class="pf__field">
            <label class="pf__label" for="gender">Sexo</label>
            <select id="gender" v-model="form.gender" class="pf__select">
              <option v-for="o in genderOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <AppFormField v-model="form.identity_document" label="Documento de identidad" :error="fieldErrors.identity_document" />
          <AppFormField v-model="form.phone" label="Teléfono" :error="fieldErrors.phone" />
        </div>
        <AppFormField v-model="form.address" label="Dirección" :error="fieldErrors.address" />
      </div>

      <div class="vt-card pf__section">
        <h3 class="pf__section-title">Información administrativa</h3>
        <div class="pf__grid">
          <AppFormField v-model="form.record_number" label="Número de expediente" required :error="fieldErrors.record_number" />
          <AppFormField v-model="form.admission_date" label="Fecha de ingreso" type="date" required :error="fieldErrors.admission_date" />
          <div class="pf__field">
            <label class="pf__label" for="status">Estado administrativo</label>
            <select id="status" v-model="form.administrative_status" class="pf__select">
              <option v-for="o in statusOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <AppFormField v-model="form.emergency_contact_name" label="Nombre de contacto de emergencia" :error="fieldErrors.emergency_contact_name" />
          <AppFormField v-model="form.emergency_contact_phone" label="Teléfono de contacto de emergencia" :error="fieldErrors.emergency_contact_phone" />
        </div>
        <AppFormField v-model="form.administrative_notes" label="Notas administrativas" :error="fieldErrors.administrative_notes" />
      </div>

      <p v-if="formError" class="pf__error" role="alert">{{ formError }}</p>

      <div class="pf__actions">
        <button type="button" class="vt-btn-secondary" @click="router.push({ name: 'admission-patients' })">Cancelar</button>
        <button type="submit" class="vt-btn-primary" :disabled="saving">
          {{ saving ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Registrar paciente') }}
        </button>
      </div>
    </form>

    <RelativesSection v-if="isEdit" :patient-id="patientId" />
  </div>
</template>

<style scoped>
.pf__back { background: none; border: none; color: var(--action-secondary); font-size: var(--fs-body); font-weight: 600; cursor: pointer; margin-bottom: var(--space-4); padding: 0; }
.pf__form { margin-top: var(--space-5); }
.pf__section { margin-bottom: var(--space-5); }
.pf__section-title { font-size: var(--fs-featured); color: var(--color-navy); margin-bottom: var(--space-4); }
.pf__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0 var(--space-4); }
.pf__field { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
.pf__label { font-size: var(--fs-small); font-weight: 600; color: var(--text-primary); }
.pf__select {
  font-family: var(--font-body); font-size: var(--fs-body);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: var(--touch-min); padding: 0 var(--space-3); background: var(--bg-card);
}
.pf__error { color: #b3261e; font-size: var(--fs-small); margin-bottom: var(--space-4); }
.pf__actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
</style>
