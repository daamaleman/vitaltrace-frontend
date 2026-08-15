<script setup>
/**
 * Admin panel: audit log (RN-15).
 * Read-only trace of system actions: who did what, when, on which record.
 */
import { ref, computed, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'
import { mapHttpError } from '@/utils/httpErrors'
import { formatDateTime } from '@/utils/formatters'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const logs = ref([])
const loading = ref(false)
const error = ref('')
const actionFilter = ref('ALL')

const actionFilters = [
  { value: 'ALL', label: 'Todas' },
  { value: 'CREATE', label: 'Creación' },
  { value: 'UPDATE', label: 'Actualización' },
  { value: 'DELETE', label: 'Eliminación' },
  { value: 'ACCESS', label: 'Acceso' },
]

const filtered = computed(() => {
  if (actionFilter.value === 'ALL') return logs.value
  return logs.value.filter((l) => l.action === actionFilter.value)
})

function actorName(log) {
  const person = log.user?.person
  if (person) return `${person.first_name} ${person.first_last_name}`
  return log.user?.email ?? `Usuario ${log.user_id ?? '—'}`
}

function actionLabel(action) {
  return {
    CREATE: 'Creó', UPDATE: 'Actualizó', DELETE: 'Eliminó',
    ACCESS: 'Accedió', LOGIN: 'Inició sesión', LOGOUT: 'Cerró sesión',
  }[action] ?? action
}

function noteFrom(log) {
  if (!log.new_values) return null
  try {
    const parsed = typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values
    return parsed?.note ?? null
  } catch {
    return null
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    logs.value = await adminService.auditLogs()
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="ad">
    <header class="ad__header">
      <h1>Auditoría</h1>
      <p class="ad__subtitle">Registro de acciones del sistema</p>
    </header>

    <nav class="ad__filters" aria-label="Filtrar por acción">
      <button
        v-for="f in actionFilters"
        :key="f.value"
        type="button"
        class="ad__filter"
        :class="{ 'ad__filter--active': actionFilter === f.value }"
        @click="actionFilter = f.value"
      >
        {{ f.label }}
      </button>
    </nav>

    <LoadingSkeleton v-if="loading" :rows="6" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState v-else-if="filtered.length === 0" title="Sin registros de auditoría" />

    <div v-else class="ad__timeline">
      <article v-for="log in filtered" :key="log.id" class="vt-card ad__entry">
        <div class="ad__entry-main">
          <div class="ad__entry-head">
            <span class="ad__actor">{{ actorName(log) }}</span>
            <span class="ad__role">{{ log.role_snapshot }}</span>
          </div>
          <p class="ad__action">
            <strong>{{ actionLabel(log.action) }}</strong>
            en <code>{{ log.table }}</code>
            <span v-if="log.record_id"> · registro #{{ log.record_id }}</span>
          </p>
          <p v-if="noteFrom(log)" class="ad__note">{{ noteFrom(log) }}</p>
        </div>
        <div class="ad__entry-meta">
          <span class="ad__time">{{ formatDateTime(log.created_at) }}</span>
          <span v-if="log.ip_address" class="ad__ip">{{ log.ip_address }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.ad__header { margin-bottom: var(--space-5); }
.ad__subtitle { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); margin-top: var(--space-2); }
.ad__filters { display: flex; gap: var(--space-2); margin-bottom: var(--space-5); flex-wrap: wrap; }
.ad__filter {
  font-family: var(--font-body); font-size: var(--fs-small); font-weight: 600;
  color: var(--color-navy); background: var(--bg-card);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: 40px; padding: 0 var(--space-4); cursor: pointer;
}
.ad__filter--active { background: var(--color-navy); color: var(--text-on-brand); border-color: var(--color-navy); }
.ad__timeline { display: flex; flex-direction: column; gap: var(--space-3); }
.ad__entry { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); flex-wrap: wrap; }
.ad__entry-head { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2); }
.ad__actor { font-weight: 600; color: var(--color-navy); }
.ad__role { font-size: var(--fs-small); font-weight: 600; color: var(--color-teal); }
.ad__action { font-size: var(--fs-body); color: var(--color-dark); }
.ad__action code { background: #f3f0e9; padding: 1px 6px; border-radius: 4px; font-size: 0.9em; }
.ad__note { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.8; margin-top: var(--space-2); font-style: italic; }
.ad__entry-meta { text-align: right; display: flex; flex-direction: column; gap: 2px; }
.ad__time { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; }
.ad__ip { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.5; font-family: monospace; }
</style>
