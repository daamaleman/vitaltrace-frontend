<script setup>
/**
 * Doctor's appointments (§7.4).
 *
 * Lists the clinician's appointments, split into upcoming and past, with
 * patient, schedule, reason, duration and status. Read-only overview.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { doctorService } from '@/services/doctor.service'
import { mapHttpError } from '@/utils/httpErrors'
import { formatDateTime } from '@/utils/formatters'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const router = useRouter()

const appointments = ref([])
const loading = ref(false)
const error = ref('')

const now = Date.now()

function scheduledTime(appt) {
  return new Date(appt.scheduled_at.replace(' ', 'T')).getTime()
}

const upcoming = computed(() =>
  appointments.value
    .filter((a) => scheduledTime(a) >= now && !['CANCELLED', 'ATTENDED', 'NO_SHOW'].includes(a.status))
    .sort((a, b) => scheduledTime(a) - scheduledTime(b)),
)

const past = computed(() =>
  appointments.value
    .filter((a) => scheduledTime(a) < now || ['CANCELLED', 'ATTENDED', 'NO_SHOW'].includes(a.status))
    .sort((a, b) => scheduledTime(b) - scheduledTime(a)),
)

function patientName(appt) {
  const p = appt.patient?.person
  if (!p) return appt.patient?.record_number ?? 'Paciente desconocido'
  return `${p.first_name} ${p.first_last_name}`
}

function openPatient(appt) {
  if (appt.patient?.id) {
    router.push({ name: 'doctor-patient-detail', params: { id: appt.patient.id } })
  }
}

async function loadAppointments() {
  loading.value = true
  error.value = ''
  try {
    appointments.value = await doctorService.appointments()
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

onMounted(loadAppointments)
</script>

<template>
  <div class="appts">
    <header class="appts__header">
      <div>
        <h1>Citas</h1>
        <p class="appts__subtitle">
          {{ upcoming.length }} próximas ·
          {{ past.length }} pasadas
        </p>
      </div>
    </header>

    <LoadingSkeleton v-if="loading" :rows="4" />
    <ErrorState v-else-if="error" :message="error" @retry="loadAppointments" />

    <template v-else>
      <section class="appts__section">
        <h3 class="appts__section-title">Próximas</h3>
        <div class="vt-card appts__panel">
          <EmptyState v-if="upcoming.length === 0" title="No hay citas próximas" />
          <ul v-else class="appts__list">
            <li
              v-for="appt in upcoming"
              :key="appt.id"
              class="appts__item appts__item--clickable"
              @click="openPatient(appt)"
            >
              <div class="appts__when">
                <span class="appts__date">{{ formatDateTime(appt.scheduled_at) }}</span>
                <span class="appts__duration">{{ appt.duration_minutes }} min</span>
              </div>
              <div class="appts__body">
                <span class="appts__patient">{{ patientName(appt) }}</span>
                <span class="appts__reason">{{ appt.reason }}</span>
              </div>
              <StatusBadge :value="appt.status" kind="clinical" />
            </li>
          </ul>
        </div>
      </section>

      <section class="appts__section">
        <h3 class="appts__section-title">Pasadas</h3>
        <div class="vt-card appts__panel">
          <EmptyState v-if="past.length === 0" title="No hay citas pasadas" />
          <ul v-else class="appts__list">
            <li
              v-for="appt in past"
              :key="appt.id"
              class="appts__item appts__item--clickable"
              @click="openPatient(appt)"
            >
              <div class="appts__when">
                <span class="appts__date">{{ formatDateTime(appt.scheduled_at) }}</span>
                <span class="appts__duration">{{ appt.duration_minutes }} min</span>
              </div>
              <div class="appts__body">
                <span class="appts__patient">{{ patientName(appt) }}</span>
                <span class="appts__reason">{{ appt.reason }}</span>
              </div>
              <StatusBadge :value="appt.status" kind="clinical" />
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.appts__header { margin-bottom: var(--space-5); }
.appts__subtitle {
  color: var(--color-dark); opacity: 0.7;
  font-size: var(--fs-small); margin-top: var(--space-2);
}
.appts__section { margin-bottom: var(--space-6); }
.appts__section-title {
  font-size: var(--fs-featured); color: var(--color-navy);
  margin-bottom: var(--space-3);
}
.appts__panel { padding: 0; overflow: hidden; }
.appts__list { list-style: none; }
.appts__item {
  display: flex; align-items: center; gap: var(--space-4);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}
.appts__item:last-child { border-bottom: none; }
.appts__item--clickable { cursor: pointer; }
.appts__item--clickable:hover { background: #faf8f3; }
.appts__when {
  display: flex; flex-direction: column; gap: 2px;
  min-width: 160px;
}
.appts__date { font-weight: 600; color: var(--color-navy); font-size: var(--fs-small); }
.appts__duration { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.6; }
.appts__body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.appts__patient { font-weight: 600; color: var(--color-navy); }
.appts__reason { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.8; }

@media (max-width: 640px) {
  .appts__item { flex-direction: column; align-items: flex-start; gap: var(--space-2); }
  .appts__when { min-width: 0; }
}
</style>
