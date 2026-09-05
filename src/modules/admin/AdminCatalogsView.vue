<script setup>
/**
 * Admin panel: catalogs CRUD (specialties, medications, measurement types).
 * Create, edit and toggle active state. Managed by the system administrator.
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'
import { mapHttpError } from '@/utils/httpErrors'
import { useToastStore } from '@/stores/toast.store'
import StatusBadge from '@/components/common/StatusBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppFormField from '@/components/common/AppFormField.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const toast = useToastStore()
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

// --- Form state ---
const showForm = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')
const togglingId = ref(null)
const form = reactive({
  name: '', description: '',            // specialties
  generic_name: '', presentation: '',   // medications
  base_unit: '', decimals: 2,           // measurement types
  active: true,
})

function resetForm() {
  Object.assign(form, { name: '', description: '', generic_name: '', presentation: '', base_unit: '', decimals: 2, active: true })
  editingId.value = null
  formError.value = ''
}

function openCreate() {
  resetForm()
  showForm.value = true
}

function openEdit(item) {
  resetForm()
  editingId.value = item.id
  if (activeTab.value === 'specialties') {
    form.name = item.name; form.description = item.description ?? ''
  } else if (activeTab.value === 'medications') {
    form.generic_name = item.generic_name; form.presentation = item.presentation ?? ''
  } else {
    form.name = item.name; form.base_unit = item.base_unit; form.decimals = item.decimals ?? 2
  }
  form.active = !!item.active
  showForm.value = true
}

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

function buildPayload() {
  if (activeTab.value === 'specialties') {
    return { name: form.name, description: form.description || null, active: form.active }
  } else if (activeTab.value === 'medications') {
    return { generic_name: form.generic_name, presentation: form.presentation || null, active: form.active }
  } else {
    return { name: form.name, base_unit: form.base_unit, decimals: Number(form.decimals), active: form.active }
  }
}

async function submit() {
  saving.value = true
  formError.value = ''
  const payload = buildPayload()
  try {
    if (activeTab.value === 'specialties') {
      editingId.value ? await adminService.updateSpecialty(editingId.value, payload) : await adminService.createSpecialty(payload)
    } else if (activeTab.value === 'medications') {
      editingId.value ? await adminService.updateMedication(editingId.value, payload) : await adminService.createMedication(payload)
    } else {
      editingId.value ? await adminService.updateMeasurementType(editingId.value, payload) : await adminService.createMeasurementType(payload)
    }
    showForm.value = false
    resetForm()
    await load()
    toast.success(editingId.value ? 'Registro actualizado.' : 'Registro creado.')
  } catch (err) {
    formError.value = mapHttpError(err)
    toast.error('No se pudo guardar.')
  } finally {
    saving.value = false
  }
}

async function toggleActive(item) {
  togglingId.value = item.id
  try {
    const next = !item.active
    if (activeTab.value === 'specialties') {
      await adminService.updateSpecialty(item.id, { name: item.name, description: item.description ?? null, active: next })
    } else if (activeTab.value === 'medications') {
      await adminService.updateMedication(item.id, { generic_name: item.generic_name, presentation: item.presentation ?? null, active: next })
    } else {
      await adminService.updateMeasurementType(item.id, { name: item.name, base_unit: item.base_unit, decimals: item.decimals, active: next })
    }
    await load()
    toast.success(next ? 'Activado.' : 'Desactivado.')
  } catch (err) {
    toast.error('No se pudo cambiar el estado.')
  } finally {
    togglingId.value = null
  }
}

function statusValue(active) { return active ? 'ACTIVE' : 'INACTIVE' }

const currentList = computed(() => {
  if (activeTab.value === 'specialties') return specialties.value
  if (activeTab.value === 'medications') return medications.value
  return measurementTypes.value
})

function switchTab(v) {
  activeTab.value = v
  showForm.value = false
  resetForm()
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
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="cat__actions">
      <AppButton v-if="!showForm" variant="primary" @click="openCreate">Agregar</AppButton>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="vt-card cat__form">
      <h3 class="cat__form-title">{{ editingId ? 'Editar' : 'Nuevo' }} registro</h3>

      <template v-if="activeTab === 'specialties'">
        <AppFormField v-model="form.name" label="Nombre" required :error="formError && !form.name ? 'Requerido' : ''" />
        <AppFormField v-model="form.description" label="Descripción" />
      </template>

      <template v-else-if="activeTab === 'medications'">
        <AppFormField v-model="form.generic_name" label="Nombre genérico" required />
        <AppFormField v-model="form.presentation" label="Presentación" />
      </template>

      <template v-else>
        <AppFormField v-model="form.name" label="Nombre" required />
        <AppFormField v-model="form.base_unit" label="Unidad base" required />
        <AppFormField v-model="form.decimals" label="Decimales" type="number" />
      </template>

      <label class="cat__check">
        <input type="checkbox" v-model="form.active" /> Activo
      </label>

      <p v-if="formError" class="cat__error" role="alert">{{ formError }}</p>
      <div class="cat__form-actions">
        <AppButton variant="secondary" :disabled="saving" @click="showForm = false; resetForm()">Cancelar</AppButton>
        <AppButton variant="primary" :loading="saving" loading-label="Guardando…" @click="submit">Guardar</AppButton>
      </div>
    </div>

    <LoadingSkeleton v-if="loading" :rows="5" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <div v-else class="vt-card cat__panel">
      <table class="cat__table">
        <thead>
          <tr v-if="activeTab === 'specialties'"><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr>
          <tr v-else-if="activeTab === 'medications'"><th>Nombre genérico</th><th>Presentación</th><th>Estado</th><th>Acciones</th></tr>
          <tr v-else><th>Nombre</th><th>Unidad</th><th>Decimales</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          <tr v-for="item in currentList" :key="item.id">
            <template v-if="activeTab === 'specialties'">
              <td class="cat__name">{{ item.name }}</td>
              <td class="cat__meta">{{ item.description || '—' }}</td>
            </template>
            <template v-else-if="activeTab === 'medications'">
              <td class="cat__name">{{ item.generic_name }}</td>
              <td class="cat__meta">{{ item.presentation || '—' }}</td>
            </template>
            <template v-else>
              <td class="cat__name">{{ item.name }}</td>
              <td class="cat__meta">{{ item.base_unit }}</td>
              <td class="cat__meta">{{ item.decimals }}</td>
            </template>
            <td><StatusBadge :value="statusValue(item.active)" kind="clinical" /></td>
            <td class="cat__row-actions">
              <button type="button" class="cat__link" @click="openEdit(item)">Editar</button>
              <button type="button" class="cat__link" :disabled="togglingId === item.id" @click="toggleActive(item)">
                {{ item.active ? 'Desactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
          <tr v-if="currentList.length === 0"><td :colspan="activeTab === 'measurementTypes' ? 5 : 4" class="cat__empty">Sin registros</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.cat__header { margin-bottom: var(--space-5); }
.cat__subtitle { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); margin-top: var(--space-2); }
.cat__tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); flex-wrap: wrap; }
.cat__tab { font-family: var(--font-body); font-size: var(--fs-small); font-weight: 600; color: var(--color-navy); background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); min-height: 40px; padding: 0 var(--space-4); cursor: pointer; }
.cat__tab--active { background: var(--color-navy); color: var(--text-on-brand); border-color: var(--color-navy); }
.cat__actions { margin-bottom: var(--space-4); }
.cat__form { padding: var(--space-5); margin-bottom: var(--space-5); }
.cat__form-title { font-size: var(--fs-body); font-weight: 600; color: var(--color-navy); margin-bottom: var(--space-4); }
.cat__check { display: flex; align-items: center; gap: var(--space-2); font-size: var(--fs-small); margin: var(--space-3) 0; }
.cat__error { color: #b3261e; font-size: var(--fs-small); margin-bottom: var(--space-3); }
.cat__form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
.cat__panel { padding: 0; overflow: hidden; }
.cat__table { width: 100%; border-collapse: collapse; }
.cat__table th { text-align: left; font-size: var(--fs-small); font-weight: 600; color: var(--color-dark); opacity: 0.7; padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
.cat__table td { padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); font-size: var(--fs-body); }
.cat__table tbody tr:last-child td { border-bottom: none; }
.cat__name { font-weight: 600; color: var(--color-navy); }
.cat__meta { color: var(--color-dark); opacity: 0.8; font-size: var(--fs-small); }
.cat__empty { text-align: center; color: var(--color-dark); opacity: 0.6; }
.cat__row-actions { display: flex; gap: var(--space-3); }
.cat__link { background: none; border: none; color: var(--color-teal); font-weight: 600; font-size: var(--fs-small); cursor: pointer; padding: 0; }
.cat__link:hover { text-decoration: underline; }
.cat__link:disabled { opacity: 0.5; cursor: default; }
</style>
