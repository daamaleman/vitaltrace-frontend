<script setup>
/**
 * Admission correction requests review (§8.5).
 * Shows requests (current → requested value) and lets Admission approve
 * (applying the change) or reject with a note.
 */
import { ref, computed, onMounted } from 'vue'
import { admissionService } from '@/services/admission.service'
import { mapHttpError } from '@/utils/httpErrors'
import { formatDateTime } from '@/utils/formatters'
import { useToastStore } from '@/stores/toast.store'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const toast = useToastStore()

const corrections = ref([])
const loading = ref(false)
const error = ref('')
const filter = ref('PENDING')
const actionLoading = ref(false)

const dialog = ref({ open: false, action: null, id: null, title: '', label: '' })

const filters = [
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
  { value: 'ALL', label: 'Todas' },
]

const filtered = computed(() => {
  if (filter.value === 'ALL') return corrections.value
  return corrections.value.filter((c) => c.status === filter.value)
})

function patientName(c) {
  const p = c.patient?.person
  if (!p) return c.patient?.record_number ?? 'Desconocido'
  return `${p.first_name} ${p.first_last_name}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    corrections.value = await admissionService.corrections()
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

function openDialog(action, id) {
  dialog.value = {
    open: true,
    action,
    id,
    title: action === 'approve' ? 'Aprobar corrección' : 'Rechazar corrección',
    label: action === 'approve' ? 'Aprobar' : 'Rechazar',
  }
}

async function confirmAction(note) {
  actionLoading.value = true
  try {
    if (dialog.value.action === 'approve') {
      await admissionService.approveCorrection(dialog.value.id, note)
      toast.success('Corrección aprobada y aplicada.')
    } else {
      // Rejection requires a note.
      await admissionService.rejectCorrection(dialog.value.id, note || 'Rechazada.')
      toast.success('Corrección rechazada.')
    }
    dialog.value.open = false
    await load()
  } catch (err) {
    error.value = mapHttpError(err)
    toast.error('No se pudo completar la acción.')
  } finally {
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="corr">
    <header class="corr__header">
      <div>
        <h1>Solicitudes de corrección</h1>
        <p class="corr__subtitle">Revisa y resuelve las solicitudes de corrección de datos</p>
      </div>
    </header>

    <nav class="corr__filters" aria-label="Filtrar por estado">
      <button
        v-for="f in filters"
        :key="f.value"
        type="button"
        class="corr__filter"
        :class="{ 'corr__filter--active': filter === f.value }"
        @click="filter = f.value"
      >
        {{ f.label }}
      </button>
    </nav>

    <LoadingSkeleton v-if="loading" :rows="4" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState
      v-else-if="filtered.length === 0"
      title="No hay solicitudes de corrección"
      :message="filter === 'PENDING' ? 'No hay solicitudes pendientes por revisar.' : 'No hay nada aquí.'"
    />

    <div v-else class="corr__list">
      <article v-for="c in filtered" :key="c.id" class="vt-card corr__item">
        <div class="corr__item-head">
          <div>
            <span class="corr__patient">{{ patientName(c) }}</span>
            <span class="corr__field">Campo: {{ c.field }}</span>
          </div>
          <StatusBadge :value="c.status" kind="clinical" />
        </div>

        <div class="corr__change">
          <div class="corr__value corr__value--old">
            <span class="corr__value-label">Actual</span>
            <span class="corr__value-text">{{ c.current_value || '—' }}</span>
          </div>
          <span class="corr__arrow" aria-hidden="true">→</span>
          <div class="corr__value corr__value--new">
            <span class="corr__value-label">Solicitado</span>
            <span class="corr__value-text">{{ c.requested_value }}</span>
          </div>
        </div>

        <p class="corr__reason"><strong>Motivo:</strong> {{ c.reason }}</p>

        <p v-if="c.response" class="corr__response"><strong>Respuesta:</strong> {{ c.response }}</p>
        <p v-if="c.reviewed_at" class="corr__meta">Revisada {{ formatDateTime(c.reviewed_at) }}</p>

        <div v-if="c.status === 'PENDING'" class="corr__actions">
          <button type="button" class="vt-btn-secondary corr__reject" @click="openDialog('reject', c.id)">Rechazar</button>
          <button type="button" class="vt-btn-primary" @click="openDialog('approve', c.id)">Aprobar</button>
        </div>
      </article>
    </div>

    <ConfirmDialog
      :open="dialog.open"
      :title="dialog.title"
      :confirm-label="dialog.label"
      :with-comment="true"
      :loading="actionLoading"
      :message="dialog.action === 'approve'
        ? 'Aprobar aplicará este cambio al expediente del paciente.'
        : 'Indica el motivo del rechazo de esta solicitud.'"
      @confirm="confirmAction"
      @cancel="dialog.open = false"
    />
  </div>
</template>

<style scoped>
.corr__header { margin-bottom: var(--space-5); }
.corr__subtitle { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); margin-top: var(--space-2); }
.corr__filters { display: flex; gap: var(--space-2); margin-bottom: var(--space-5); flex-wrap: wrap; }
.corr__filter {
  font-family: var(--font-body); font-size: var(--fs-small); font-weight: 600;
  color: var(--color-navy); background: var(--bg-card);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: 40px; padding: 0 var(--space-4); cursor: pointer;
}
.corr__filter--active { background: var(--color-navy); color: var(--text-on-brand); border-color: var(--color-navy); }
.corr__list { display: flex; flex-direction: column; gap: var(--space-4); }
.corr__item-head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-4); }
.corr__patient { display: block; font-weight: 600; color: var(--color-navy); font-size: var(--fs-featured); }
.corr__field { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; }
.corr__change { display: flex; align-items: stretch; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
.corr__value { flex: 1; min-width: 140px; padding: var(--space-3); border-radius: var(--radius-md); }
.corr__value--old { background: #f5f2ea; }
.corr__value--new { background: #e6f4ea; }
.corr__value-label { display: block; font-size: var(--fs-small); font-weight: 600; opacity: 0.7; margin-bottom: 2px; }
.corr__value-text { color: var(--color-navy); font-weight: 600; }
.corr__arrow { align-self: center; color: var(--color-teal); font-weight: 700; font-size: var(--fs-subtitle); }
.corr__reason, .corr__response { font-size: var(--fs-small); color: var(--color-dark); margin-bottom: var(--space-2); }
.corr__meta { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.6; }
.corr__actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); }
.corr__reject { color: #b3261e; border-color: #b3261e; }
</style>
