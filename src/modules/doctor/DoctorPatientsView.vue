<script setup>
/**
 * Doctor's assigned patients (§7.2).
 *
 * Read-only list of patients actively assigned to the clinician (RN-06).
 * Supports client-side search and navigation to each patient. Administrative
 * data belongs to Admission; here it is view-only.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { doctorService } from '@/services/doctor.service'
import { mapHttpError } from '@/utils/httpErrors'
import { formatDateTime, ageFromDate } from '@/utils/formatters'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const router = useRouter()

const patients = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')

const filteredPatients = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return patients.value
  return patients.value.filter((p) => {
    const name = patientName(p).toLowerCase()
    const record = (p.record_number ?? '').toLowerCase()
    return name.includes(term) || record.includes(term)
  })
})

function patientName(patient) {
  const p = patient.person
  if (!p) return patient.record_number ?? 'Desconocido'
  return `${p.first_name} ${p.first_last_name}`
}

async function loadPatients() {
  loading.value = true
  error.value = ''
  try {
    const response = await doctorService.patients()
    patients.value = response.data ?? []
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

function openPatient(patientId) {
  router.push({ name: 'doctor-patient-detail', params: { id: patientId } })
}

onMounted(loadPatients)
</script>

<template>
  <div class="patients">
    <header class="patients__header">
      <div>
        <h1>Pacientes</h1>
        <p class="patients__subtitle">
          {{ patients.length }} {{ patients.length === 1 ? 'paciente asignado' : 'pacientes asignados' }} ·
          acceso clínico de solo lectura
        </p>
      </div>
    </header>

    <div class="patients__search">
      <input
        v-model="search"
        type="search"
        class="patients__search-input"
        placeholder="Buscar por nombre o número de expediente…"
        aria-label="Buscar pacientes"
      />
    </div>

    <div class="vt-card patients__panel">
      <LoadingSkeleton v-if="loading" :rows="5" />
      <ErrorState v-else-if="error" :message="error" @retry="loadPatients" />
      <EmptyState
        v-else-if="filteredPatients.length === 0"
        title="No se encontraron pacientes"
        :message="search ? 'Ningún paciente coincide con tu búsqueda.' : 'Aún no tienes pacientes asignados.'"
      />

      <table v-else class="patients__table">
        <thead>
          <tr>
            <th scope="col">Paciente</th>
            <th scope="col">Edad</th>
            <th scope="col">Estado</th>
            <th scope="col">Ingreso</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="patient in filteredPatients"
            :key="patient.id"
            class="patients__row"
            @click="openPatient(patient.id)"
          >
            <td>
              <div class="patients__identity">
                <span class="patients__name">{{ patientName(patient) }}</span>
                <span class="patients__record">{{ patient.record_number }}</span>
              </div>
            </td>
            <td>{{ ageFromDate(patient.person?.date_of_birth) }}</td>
            <td><StatusBadge :value="patient.administrative_status" kind="status" /></td>
            <td class="patients__meta">{{ formatDateTime(patient.admission_date) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.patients__header { margin-bottom: var(--space-5); }
.patients__subtitle {
  color: var(--color-dark);
  opacity: 0.7;
  font-size: var(--fs-small);
  margin-top: var(--space-2);
}
.patients__search { margin-bottom: var(--space-5); }
.patients__search-input {
  width: 100%;
  max-width: 380px;
  font-family: var(--font-body);
  font-size: var(--fs-body);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  min-height: var(--touch-min);
  padding: 0 var(--space-4);
  background: var(--bg-card);
}
.patients__panel { padding: 0; overflow: hidden; }
.patients__table { width: 100%; border-collapse: collapse; }
.patients__table th {
  text-align: left;
  font-family: var(--font-body);
  font-size: var(--fs-small);
  font-weight: 600;
  color: var(--color-dark);
  opacity: 0.7;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}
.patients__table td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--fs-body);
  vertical-align: middle;
}
.patients__table tbody tr:last-child td { border-bottom: none; }
.patients__row { cursor: pointer; }
.patients__row:hover { background: #faf8f3; }
.patients__identity { display: flex; flex-direction: column; gap: 2px; }
.patients__name { font-weight: 600; color: var(--color-navy); }
.patients__record { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.6; }
.patients__meta { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; }

@media (max-width: 720px) {
  .patients__table thead { display: none; }
  .patients__table,
  .patients__table tbody,
  .patients__table tr,
  .patients__table td { display: block; width: 100%; }
  .patients__table tr {
    margin-bottom: var(--space-4);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }
  .patients__table td { border: none; padding: var(--space-2) 0; }
}
</style>
