<script setup>
/**
 * Doctor's initial module: alerts for review (§7.1).
 *
 * Lists alerts with severity, status, patient and time, filterable by
 * status. Alerts are follow-up signals, never diagnoses.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { doctorService } from '@/services/doctor.service'
import { mapHttpError } from '@/utils/httpErrors'
import { formatDateTime, timeAgo } from '@/utils/formatters'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const router = useRouter()

const alerts = ref([])
const loading = ref(false)
const error = ref('')
const activeFilter = ref('ALL')

const filters = [
  { value: 'ALL', label: 'Todas' },
  { value: 'NEW', label: 'Nuevas' },
  { value: 'CLASSIFIED', label: 'Clasificadas' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'CLOSED', label: 'Cerradas' },
]

const filteredAlerts = computed(() => {
  if (activeFilter.value === 'ALL') return alerts.value
  return alerts.value.filter((a) => a.status === activeFilter.value)
})

const openCount = computed(
  () => alerts.value.filter((a) => a.status !== 'CLOSED').length,
)

async function loadAlerts() {
  loading.value = true
  error.value = ''
  try {
    const response = await doctorService.alerts()
    alerts.value = response.data ?? []
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

function patientName(alert) {
  const p = alert.patient?.person
  if (!p) return alert.patient?.record_number ?? 'Paciente desconocido'
  return `${p.first_name} ${p.first_last_name}`
}

function openAlert(alertId) {
  router.push({ name: 'doctor-alert-detail', params: { id: alertId } })
}

onMounted(loadAlerts)
</script>

<template>
  <div class="alerts">
    <header class="alerts__header">
      <div>
        <h1>Alertas</h1>
        <p class="alerts__subtitle">
          {{ openCount }} {{ openCount === 1 ? 'alerta abierta' : 'alertas abiertas' }} para revisión ·
          señales de seguimiento, no diagnósticos
        </p>
      </div>
    </header>

    <nav class="alerts__filters" aria-label="Filtrar alertas por estado">
      <button
        v-for="filter in filters"
        :key="filter.value"
        type="button"
        class="alerts__filter"
        :class="{ 'alerts__filter--active': activeFilter === filter.value }"
        :aria-pressed="activeFilter === filter.value"
        @click="activeFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </nav>

    <div class="vt-card alerts__panel">
      <LoadingSkeleton v-if="loading" :rows="5" />

      <ErrorState v-else-if="error" :message="error" @retry="loadAlerts" />

      <EmptyState
        v-else-if="filteredAlerts.length === 0"
        title="No hay alertas para mostrar"
        message="No hay alertas que coincidan con este filtro."
      />

      <table v-else class="alerts__table">
        <thead>
          <tr>
            <th scope="col">Paciente</th>
            <th scope="col">Severidad</th>
            <th scope="col">Estado</th>
            <th scope="col">Descripción</th>
            <th scope="col">Generada</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="alert in filteredAlerts" :key="alert.id" class="alerts__row" @click="openAlert(alert.id)">
            <td>
              <div class="alerts__patient">
                <span class="alerts__patient-name">{{ patientName(alert) }}</span>
                <span class="alerts__record">{{ alert.patient?.record_number }}</span>
              </div>
            </td>
            <td><StatusBadge :value="alert.severity" kind="severity" /></td>
            <td><StatusBadge :value="alert.status" kind="status" /></td>
            <td class="alerts__desc">{{ alert.description }}</td>
            <td>
              <span :title="formatDateTime(alert.generated_at)">
                {{ timeAgo(alert.generated_at) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.alerts__header { margin-bottom: var(--space-5); }
.alerts__subtitle {
  color: var(--color-dark);
  opacity: 0.7;
  font-size: var(--fs-small);
  margin-top: var(--space-2);
}

.alerts__filters {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}

.alerts__filter {
  font-family: var(--font-body);
  font-size: var(--fs-small);
  font-weight: 600;
  color: var(--color-navy);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  min-height: 40px;
  padding: 0 var(--space-4);
  cursor: pointer;
  transition: all 0.15s ease;
}

.alerts__filter--active {
  background: var(--color-navy);
  color: var(--text-on-brand);
  border-color: var(--color-navy);
}

.alerts__panel { padding: 0; overflow: hidden; }

.alerts__table {
  width: 100%;
  border-collapse: collapse;
}

.alerts__table th {
  text-align: left;
  font-family: var(--font-body);
  font-size: var(--fs-small);
  font-weight: 600;
  color: var(--color-dark);
  opacity: 0.7;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.alerts__table td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--fs-body);
  vertical-align: middle;
}

.alerts__table tbody tr:last-child td { border-bottom: none; }
.alerts__table tbody tr:hover { background: #faf8f3; }

.alerts__patient { display: flex; flex-direction: column; gap: 2px; }
.alerts__patient-name { font-weight: 600; color: var(--color-navy); }
.alerts__record { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.6; }

.alerts__desc {
  max-width: 280px;
  color: var(--color-dark);
  font-size: var(--fs-small);
}

@media (max-width: 720px) {
  .alerts__table thead { display: none; }
  .alerts__table,
  .alerts__table tbody,
  .alerts__table tr,
  .alerts__table td { display: block; width: 100%; }
  .alerts__table tr {
    margin-bottom: var(--space-4);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }
  .alerts__table td { border: none; padding: var(--space-2) 0; }
}

.alerts__row { cursor: pointer; }
</style>