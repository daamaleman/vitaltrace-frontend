<script setup>
/**
 * Admin panel: health professionals.
 * Lists the health staff records (doctors and nurses) with their type,
 * code, specialty and active status. Registration opens a separate form;
 * this view is read-only. Permissions are enforced in the backend.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminService } from '@/services/admin.service'
import { mapHttpError } from '@/utils/httpErrors'
import AppButton from '@/components/common/AppButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import { usePagination } from '@/composables/usePagination'

const router = useRouter()

const staff = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const statusFilter = ref('ALL')
const typeFilter = ref('ALL')

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return staff.value.filter((s) => {
    if (statusFilter.value !== 'ALL' && statusValue(s.active) !== statusFilter.value) return false
    if (typeFilter.value !== 'ALL' && (s.professional_type || '—') !== typeFilter.value) return false
    const name = staffName(s).toLowerCase()
    if (!term) return true
    return name.includes(term) || String(professionalCode(s)).toLowerCase().includes(term) || specialtyLabel(s).toLowerCase().includes(term)
  })
})

const { page, totalPages, totalItems, paged: pagedStaff } = usePagination(filtered, { pageSize: 10 })

const statusOptions = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'INACTIVE', label: 'Inactivos' },
]

const typeOptions = [
  { value: 'ALL', label: 'Todos los tipos' },
  { value: 'DOCTOR', label: 'Médico' },
  { value: 'NURSE', label: 'Enfermero' },
]

function staffName(s) {
  const p = s.person
  if (!p) return '—'
  return `${p.first_name} ${p.first_last_name}`
}

function professionalCode(s) {
  return s.professional_code || '—'
}

function specialtyLabel(s) {
  return s.specialty?.name ?? s.specialty ?? '—'
}

function statusValue(active) {
  return active ? 'ACTIVE' : 'INACTIVE'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    staff.value = await adminService.healthStaff()
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

function register() {
  router.push({ name: 'admin-professional-new' })
}

onMounted(load)
</script>

<template>
  <div class="pro">
    <header class="pro__header">
      <div>
        <h1>Profesionales</h1>
        <p class="pro__subtitle">{{ staff.length }} profesionales registrados</p>
      </div>
      <AppButton variant="primary" @click="register">Registrar profesional</AppButton>
    </header>

    <div class="pro__search">
      <input
        v-model="search"
        type="search"
        class="pro__search-input"
        placeholder="Buscar por nombre o código…"
        aria-label="Buscar profesionales"
      />
      <select v-model="typeFilter" class="pro__filter" aria-label="Filtrar profesionales por tipo">
        <option v-for="option in typeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <select v-model="statusFilter" class="pro__filter" aria-label="Filtrar profesionales por estado">
        <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </div>

    <div class="vt-card pro__panel">
      <LoadingSkeleton v-if="loading" :rows="5" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="filtered.length === 0" title="Sin profesionales" />
      <table v-else class="pro__table">
        <thead>
          <tr><th>Nombre</th><th>Tipo</th><th>Código</th><th>Especialidad</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in pagedStaff" :key="s.id">
            <td class="pro__name">{{ staffName(s) }}</td>
            <td class="pro__type">{{ s.professional_type || '—' }}</td>
            <td class="pro__code">{{ professionalCode(s) }}</td>
            <td class="pro__meta">{{ specialtyLabel(s) }}</td>
            <td><StatusBadge :value="statusValue(s.active)" kind="clinical" /></td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppPagination v-model:page="page" :total-pages="totalPages" :total-items="totalItems" label="Profesionales" />
  </div>
</template>

<style scoped>
.pro__header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-5); flex-wrap: wrap; }
.pro__subtitle { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); margin-top: var(--space-2); }
.pro__search { display: flex; gap: var(--space-3); margin-bottom: var(--space-5); flex-wrap: wrap; align-items: center; }
.pro__search-input {
  width: 100%; max-width: 380px;
  font-family: var(--font-body); font-size: var(--fs-body);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: var(--touch-min); padding: 0 var(--space-4); background: var(--bg-card);
}
.pro__filter {
  font-family: var(--font-body); font-size: var(--fs-body);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: var(--touch-min); padding: 0 var(--space-4); background: var(--bg-card);
}
.pro__panel { padding: 0; overflow: hidden; }
.pro__table { width: 100%; border-collapse: collapse; }
.pro__table th { text-align: left; font-size: var(--fs-small); font-weight: 600; color: var(--color-dark); opacity: 0.7; padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
.pro__table td { padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); font-size: var(--fs-body); }
.pro__table tbody tr:last-child td { border-bottom: none; }
.pro__name { font-weight: 600; color: var(--color-navy); }
.pro__type { font-size: var(--fs-small); font-weight: 600; color: var(--color-teal); }
.pro__code { font-size: var(--fs-small); color: var(--color-dark); }
.pro__meta { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.8; }

@media (max-width: 720px) {
  .pro__table thead { display: none; }
  .pro__table,
  .pro__table tbody,
  .pro__table tr,
  .pro__table td { display: block; width: 100%; }
  .pro__table tr {
    margin-bottom: var(--space-4);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }
  .pro__table td { border: none; padding: var(--space-2) 0; }
}
</style>
