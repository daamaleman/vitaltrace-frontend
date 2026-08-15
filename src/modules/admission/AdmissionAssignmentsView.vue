<script setup>
/**
 * Admission: assignments overview.
 * Lists patients with their current care team (primary doctor, nurse) and
 * lets Admission jump to the patient detail to manage assignments (§8.4).
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { admissionService } from '@/services/admission.service'
import { mapHttpError } from '@/utils/httpErrors'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const router = useRouter()
const patients = ref([])
const loading = ref(false)
const error = ref('')

function patientName(patient) {
  const p = patient.person
  if (!p) return patient.record_number ?? 'Paciente'
  return `${p.first_name} ${p.first_last_name}`
}

function staffName(assignment) {
  const p = assignment?.health_staff?.person
  return p ? `${p.first_name} ${p.first_last_name}` : null
}

function primaryDoctor(patient) {
  const a = (patient.assignments ?? []).find(
    (x) => x.assignment_type === 'PRIMARY_DOCTOR' && x.status === 'ACTIVE',
  )
  return a ? staffName(a) : null
}

function nurse(patient) {
  const a = (patient.assignments ?? []).find(
    (x) => x.assignment_type === 'NURSE' && x.status === 'ACTIVE',
  )
  return a ? staffName(a) : null
}

function manage(patient) {
  router.push({ name: 'admission-patient-edit', params: { id: patient.id } })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    patients.value = await admissionService.patientsWithTeam()
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="asg">
    <header class="asg__header">
      <h1>Asignaciones</h1>
      <p class="asg__subtitle">Equipo de cuidado por paciente</p>
    </header>

    <LoadingSkeleton v-if="loading" :rows="5" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState v-else-if="patients.length === 0" title="Sin pacientes" />

    <div v-else class="vt-card asg__panel">
      <table class="asg__table">
        <thead>
          <tr><th>Paciente</th><th>Médico principal</th><th>Enfermero</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="patient in patients" :key="patient.id">
            <td class="asg__name">
              {{ patientName(patient) }}
              <span class="asg__record">{{ patient.record_number }}</span>
            </td>
            <td>
              <span v-if="primaryDoctor(patient)" class="asg__staff">{{ primaryDoctor(patient) }}</span>
              <span v-else class="asg__none">Sin asignar</span>
            </td>
            <td>
              <span v-if="nurse(patient)" class="asg__staff">{{ nurse(patient) }}</span>
              <span v-else class="asg__none">Sin asignar</span>
            </td>
            <td class="asg__actions">
              <button type="button" class="asg__btn" @click="manage(patient)">Gestionar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.asg__header { margin-bottom: var(--space-5); }
.asg__subtitle { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); margin-top: var(--space-2); }
.asg__panel { padding: 0; overflow: hidden; }
.asg__table { width: 100%; border-collapse: collapse; }
.asg__table th { text-align: left; font-size: var(--fs-small); font-weight: 600; color: var(--color-dark); opacity: 0.7; padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
.asg__table td { padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); font-size: var(--fs-body); }
.asg__table tbody tr:last-child td { border-bottom: none; }
.asg__name { font-weight: 600; color: var(--color-navy); }
.asg__record { display: block; font-size: var(--fs-small); font-weight: 400; color: var(--color-dark); opacity: 0.6; }
.asg__staff { color: var(--color-dark); }
.asg__none { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.5; font-style: italic; }
.asg__actions { text-align: right; }
.asg__btn {
  font-family: var(--font-body); font-size: var(--fs-small); font-weight: 600;
  color: var(--color-teal); background: transparent; border: 1px solid var(--color-teal);
  border-radius: var(--radius-md); min-height: 34px; padding: 0 var(--space-4); cursor: pointer;
}
</style>
