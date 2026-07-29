<script setup>
/**
 * Alert detail with review actions (classify / escalate / close).
 *
 * Shows the alert, the originating measurement, the patient, and the action
 * history. Available actions depend on the current status. An alert is a
 * follow-up signal, never a diagnosis.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doctorService } from '@/services/doctor.service'
import { mapHttpError } from '@/utils/httpErrors'
import { formatDateTime } from '@/utils/formatters'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const route = useRoute()
const router = useRouter()

const alert = ref(null)
const history = ref([])
const loading = ref(false)
const error = ref('')
const actionLoading = ref(false)
const actionError = ref('')

const dialog = ref({ open: false, action: null, title: '', label: '' })

const alertId = computed(() => route.params.id)

const canClassify = computed(() => alert.value?.status === 'NEW')
const canEscalate = computed(() =>
  ['NEW', 'CLASSIFIED', 'IN_PROGRESS'].includes(alert.value?.status),
)
const canClose = computed(() =>
  ['NEW', 'CLASSIFIED', 'ESCALATED', 'IN_PROGRESS'].includes(alert.value?.status),
)

function patientName(a) {
  const p = a?.patient?.person
  if (!p) return a?.patient?.record_number ?? 'Paciente desconocido'
  return `${p.first_name} ${p.first_last_name}`
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    alert.value = await doctorService.alert(alertId.value)
    const historyResponse = await doctorService.alertHistory()
    history.value = (historyResponse.data ?? []).filter(
      (h) => h.alert_id === Number(alertId.value),
    )
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

function openDialog(action) {
  const config = {
    classify: { title: 'Clasificar alerta', label: 'Clasificar' },
    escalate: { title: 'Escalar alerta', label: 'Escalar' },
    close: { title: 'Cerrar alerta', label: 'Cerrar' },
  }[action]
  dialog.value = { open: true, action, ...config }
}

async function confirmAction(comment) {
  actionLoading.value = true
  actionError.value = ''
  const payload = comment ? { comment } : {}
  try {
    const action = dialog.value.action
    if (action === 'classify') alert.value = await doctorService.classifyAlert(alertId.value, payload)
    else if (action === 'escalate') alert.value = await doctorService.escalateAlert(alertId.value, payload)
    else if (action === 'close') alert.value = await doctorService.closeAlert(alertId.value, payload)

    dialog.value.open = false
    await loadAll()
  } catch (err) {
    actionError.value = mapHttpError(err)
  } finally {
    actionLoading.value = false
  }
}

onMounted(loadAll)
</script>

<template>
  <div class="detail">
    <button type="button" class="detail__back" @click="router.push({ name: 'doctor-alerts' })">
      ← Volver a alertas
    </button>

    <LoadingSkeleton v-if="loading" :rows="4" />
    <ErrorState v-else-if="error" :message="error" @retry="loadAll" />

    <template v-else-if="alert">
      <header class="detail__header vt-card">
        <div class="detail__title-row">
          <h1>Alerta #{{ alert.id }}</h1>
          <div class="detail__badges">
            <StatusBadge :value="alert.severity" kind="severity" />
            <StatusBadge :value="alert.status" kind="status" />
          </div>
        </div>
        <p class="detail__description">{{ alert.description }}</p>
        <p class="detail__note">Una señal de seguimiento para revisión — no un diagnóstico.</p>
      </header>

      <div class="detail__grid">
        <section class="vt-card">
          <h3 class="detail__section-title">Paciente</h3>
          <p class="detail__patient-name">{{ patientName(alert) }}</p>
          <p class="detail__meta">{{ alert.patient?.record_number }}</p>
        </section>

        <section class="vt-card" v-if="alert.measurement">
          <h3 class="detail__section-title">Medición de origen</h3>
          <p class="detail__measurement">
            {{ alert.measurement.value }} {{ alert.measurement.unit }}
          </p>
          <p class="detail__meta">
            Registrada {{ formatDateTime(alert.measurement.measured_at) }} ·
            origen {{ alert.measurement.origin }}
          </p>
        </section>

        <section class="vt-card">
          <h3 class="detail__section-title">Generada</h3>
          <p class="detail__meta">{{ formatDateTime(alert.generated_at) }}</p>
          <p v-if="alert.closed_at" class="detail__meta">
            Cerrada {{ formatDateTime(alert.closed_at) }}
          </p>
        </section>
      </div>

      <section class="vt-card detail__actions-panel">
        <h3 class="detail__section-title">Acciones</h3>
        <p v-if="actionError" class="detail__action-error" role="alert">{{ actionError }}</p>
        <div class="detail__actions">
          <button type="button" class="vt-btn-secondary" :disabled="!canClassify" @click="openDialog('classify')">
            Clasificar
          </button>
          <button type="button" class="vt-btn-secondary" :disabled="!canEscalate" @click="openDialog('escalate')">
            Escalar
          </button>
          <button type="button" class="vt-btn-primary" :disabled="!canClose" @click="openDialog('close')">
            Cerrar
          </button>
        </div>
      </section>

      <section class="vt-card">
        <h3 class="detail__section-title">Historial</h3>
        <ol v-if="history.length" class="detail__history">
          <li v-for="entry in history" :key="entry.id" class="detail__history-item">
            <div class="detail__history-action">{{ entry.action }}</div>
            <div class="detail__history-transition">
              {{ entry.previous_status }} → {{ entry.new_status }}
            </div>
            <div v-if="entry.comment" class="detail__history-comment">"{{ entry.comment }}"</div>
            <div class="detail__meta">{{ formatDateTime(entry.created_at) }}</div>
          </li>
        </ol>
        <p v-else class="detail__meta">Aún no hay acciones registradas.</p>
      </section>
    </template>

    <ConfirmDialog
      :open="dialog.open"
      :title="dialog.title"
      :confirm-label="dialog.label"
      :with-comment="true"
      :loading="actionLoading"
      message="Esta acción quedará registrada en el historial de la alerta."
      @confirm="confirmAction"
      @cancel="dialog.open = false"
    />
  </div>
</template>

<style scoped>
.detail__back {
  background: none;
  border: none;
  color: var(--action-secondary);
  font-size: var(--fs-body);
  font-weight: 600;
  cursor: pointer;
  margin-bottom: var(--space-5);
  padding: 0;
}
.detail__header { margin-bottom: var(--space-5); }
.detail__title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.detail__badges { display: flex; gap: var(--space-2); }
.detail__description { margin-top: var(--space-3); color: var(--color-dark); }
.detail__note {
  margin-top: var(--space-2);
  font-size: var(--fs-small);
  color: var(--color-dark);
  opacity: 0.6;
}
.detail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.detail__section-title {
  font-size: var(--fs-featured);
  color: var(--color-navy);
  margin-bottom: var(--space-3);
}
.detail__patient-name { font-weight: 600; color: var(--color-navy); font-size: var(--fs-featured); }
.detail__measurement { font-weight: 600; color: var(--color-navy); font-size: var(--fs-subtitle); }
.detail__meta { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; }
.detail__actions-panel { margin-bottom: var(--space-5); }
.detail__actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.detail__action-error { color: #b3261e; font-size: var(--fs-small); margin-bottom: var(--space-3); }
.detail__history { list-style: none; display: flex; flex-direction: column; gap: var(--space-4); }
.detail__history-item {
  padding-left: var(--space-4);
  border-left: 3px solid var(--color-mint);
}
.detail__history-action { font-weight: 600; color: var(--color-navy); }
.detail__history-transition { font-size: var(--fs-small); color: var(--color-dark); }
.detail__history-comment {
  font-size: var(--fs-small);
  font-style: italic;
  color: var(--color-dark);
  opacity: 0.8;
  margin: var(--space-1) 0;
}
</style>
