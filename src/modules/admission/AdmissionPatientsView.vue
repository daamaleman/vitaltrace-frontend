<script setup>
/**
 * Admission patients list (§8.1).
 * Lists registered patients with search and access to register/edit.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { admissionService } from '@/services/admission.service'
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

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return patients.value
  return patients.value.filter((p) => {
    const name = patientName(p).toLowerCase()
    return name.includes(term) || (p.record_number ?? '').toLowerCase().includes(term)
  })
})

function patientName(p) {
  const person = p.person
  if (!person) return p.record_number ?? 'Desconocido'
  return `${person.first_name} ${person.first_last_name}`
}

async function loadPatients() {
  loading.value = true
  error.value = ''
  try {
    const response = await admissionService.patients()
    patients.value = response.data ?? []
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

function newPatient() {
  router.push({ name: 'admission-patient-new' })
}

function editPatient(id) {
  router.push({ name: 'admission-patient-edit', params: { id } })
}

onMounted(loadPatients)
</script>

<template>
  <div class="ap">
    <header class="ap__header">
      <div>
        <h1>Pacientes</h1>
        <p class="ap__subtitle">{{ patients.length }} registrados · gestión de admisión</p>
      </div>
      <button type="button" class="vt-btn-primary" @click="newPatient">+ Nuevo paciente</button>
    </header>

    <div class="ap__search">
      <input
        v-model="search"
        type="search"
        class="ap__search-input"
        placeholder="Buscar por nombre o número de expediente…"
        aria-label="Buscar pacientes"
      />
    </div>

    <div class="vt-card ap__panel">
      <LoadingSkeleton v-if="loading" :rows="5" />
      <ErrorState v-else-if="error" :message="error" @retry="loadPatients" />
      <EmptyState
        v-else-if="filtered.length === 0"
        title="No hay pacientes"
        :message="search ? 'Ningún paciente coincide con tu búsqueda.' : 'Registra el primer paciente para comenzar.'"
      />
      <table v-else class="ap__table">
        <thead>
          <tr><th>Paciente</th><th>Edad</th><th>Estado</th><th>Ingreso</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id">
            <td>
              <div class="ap__identity">
                <span class="ap__name">{{ patientName(p) }}</span>
                <span class="ap__record">{{ p.record_number }}</span>
              </div>
            </td>
            <td>{{ ageFromDate(p.person?.date_of_birth) }}</td>
            <td><StatusBadge :value="p.administrative_status" kind="clinical" /></td>
            <td class="ap__meta">{{ formatDateTime(p.admission_date) }}</td>
            <td class="ap__actions">
              <button type="button" class="ap__edit" @click="editPatient(p.id)">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.ap__header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-5); flex-wrap: wrap; }
.ap__subtitle { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); margin-top: var(--space-2); }
.ap__search { margin-bottom: var(--space-5); }
.ap__search-input {
  width: 100%; max-width: 380px;
  font-family: var(--font-body); font-size: var(--fs-body);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: var(--touch-min); padding: 0 var(--space-4); background: var(--bg-card);
}
.ap__panel { padding: 0; overflow: hidden; }
.ap__table { width: 100%; border-collapse: collapse; }
.ap__table th {
  text-align: left; font-size: var(--fs-small); font-weight: 600;
  color: var(--color-dark); opacity: 0.7; padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}
.ap__table td { padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); font-size: var(--fs-body); }
.ap__table tbody tr:last-child td { border-bottom: none; }
.ap__identity { display: flex; flex-direction: column; gap: 2px; }
.ap__name { font-weight: 600; color: var(--color-navy); }
.ap__record { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.6; }
.ap__meta { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; }
.ap__actions { text-align: right; }
.ap__edit {
  font-family: var(--font-body); font-size: var(--fs-small); font-weight: 600;
  color: var(--action-secondary); background: transparent;
  border: 1px solid var(--action-secondary); border-radius: var(--radius-md);
  min-height: 36px; padding: 0 var(--space-4); cursor: pointer;
}
</style>
