<script setup>
/**
 * Admin panel: catalogs (specialties, medications, measurement types).
 * Read-only reference data managed by the system administrator.
 */
import { ref, computed, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'
import { mapHttpError } from '@/utils/httpErrors'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const activeTab = ref('specialties')
const loading = ref(false)
const error = ref('')

const specialties = ref([])
const medications = ref([])
const measurementTypes = ref([])

const tabs = [
  { value: 'specialties', label: 'Especialidades' },
  { value: 'medications', label: 'Medicamentos' },
  { value: 'measurementTypes', label: 'Tipos de medición' },
]

const activeLabel = computed(() => tabs.find((t) => t.value === activeTab.value)?.label ?? '')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [s, m, mt] = await Promise.all([
      adminService.specialties(),
      adminService.medications(),
      adminService.measurementTypes(),
    ])
    specialties.value = s
    medications.value = m
    measurementTypes.value = mt
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

function statusValue(active) {
  return active ? 'ACTIVE' : 'INACTIVE'
}

onMounted(load)
</script>

<template>
  <div class="cat">
    <header class="cat__header">
      <h1>Catálogos</h1>
      <p class="cat__subtitle">Datos de referencia del sistema</p>
    </header>

    <nav class="cat__tabs" aria-label="Catálogos">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="cat__tab"
        :class="{ 'cat__tab--active': activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </nav>

    <LoadingSkeleton v-if="loading" :rows="5" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <div v-else class="vt-card cat__panel">
      <!-- Especialidades -->
      <table v-if="activeTab === 'specialties'" class="cat__table">
        <thead>
          <tr><th>Nombre</th><th>Descripción</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr v-if="specialties.length === 0"><td colspan="3"><EmptyState title="Sin especialidades" /></td></tr>
          <tr v-for="s in specialties" :key="s.id">
            <td class="cat__name">{{ s.name }}</td>
            <td class="cat__meta">{{ s.description || '—' }}</td>
            <td><StatusBadge :value="statusValue(s.active)" kind="clinical" /></td>
          </tr>
        </tbody>
      </table>

      <!-- Medicamentos -->
      <table v-else-if="activeTab === 'medications'" class="cat__table">
        <thead>
          <tr><th>Nombre genérico</th><th>Presentación</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr v-if="medications.length === 0"><td colspan="3"><EmptyState title="Sin medicamentos" /></td></tr>
          <tr v-for="m in medications" :key="m.id">
            <td class="cat__name">{{ m.generic_name }}</td>
            <td class="cat__meta">{{ m.presentation || '—' }}</td>
            <td><StatusBadge :value="statusValue(m.active)" kind="clinical" /></td>
          </tr>
        </tbody>
      </table>

      <!-- Tipos de medición -->
      <table v-else class="cat__table">
        <thead>
          <tr><th>Nombre</th><th>Unidad base</th><th>Decimales</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr v-if="measurementTypes.length === 0"><td colspan="4"><EmptyState title="Sin tipos de medición" /></td></tr>
          <tr v-for="mt in measurementTypes" :key="mt.id">
            <td class="cat__name">{{ mt.name }}</td>
            <td class="cat__meta">{{ mt.base_unit }}</td>
            <td class="cat__meta">{{ mt.decimals }}</td>
            <td><StatusBadge :value="statusValue(mt.active)" kind="clinical" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.cat__header { margin-bottom: var(--space-5); }
.cat__subtitle { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); margin-top: var(--space-2); }
.cat__tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-5); flex-wrap: wrap; }
.cat__tab {
  font-family: var(--font-body); font-size: var(--fs-small); font-weight: 600;
  color: var(--color-navy); background: var(--bg-card);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: 40px; padding: 0 var(--space-4); cursor: pointer;
}
.cat__tab--active { background: var(--color-navy); color: var(--text-on-brand); border-color: var(--color-navy); }
.cat__panel { padding: 0; overflow: hidden; }
.cat__table { width: 100%; border-collapse: collapse; }
.cat__table th { text-align: left; font-size: var(--fs-small); font-weight: 600; color: var(--color-dark); opacity: 0.7; padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
.cat__table td { padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); font-size: var(--fs-body); }
.cat__table tbody tr:last-child td { border-bottom: none; }
.cat__name { font-weight: 600; color: var(--color-navy); }
.cat__meta { color: var(--color-dark); opacity: 0.8; font-size: var(--fs-small); }
</style>
