<script setup>
/**
 * Admin panel: system roles.
 * Read-only list of the roles defined in the system, with their
 * responsibility described. Permissions are enforced in the backend.
 */
import { ref, computed, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'
import { mapHttpError } from '@/utils/httpErrors'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const roles = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const statusFilter = ref('ALL')

// Human-readable responsibility per role (frontend copy).
const roleInfo = {
  PATIENT: { label: 'Paciente', desc: 'Registra su seguimiento y consulta su información autorizada desde la app móvil.' },
  RELATIVE: { label: 'Familiar', desc: 'Acompañamiento limitado del paciente según autorización vigente.' },
  DOCTOR: { label: 'Médico', desc: 'Seguimiento clínico de pacientes asignados: diagnósticos, tratamientos y evoluciones.' },
  NURSE: { label: 'Enfermero', desc: 'Registro autorizado de signos vitales y observaciones dentro de su alcance.' },
  ADMISSION: { label: 'Admisión', desc: 'Ingreso de pacientes, cuentas, familiares, asignaciones y correcciones.' },
  SYSTEM_ADMIN: { label: 'Administrador del sistema', desc: 'Operación técnica, catálogos, auditoría y configuración. Sin acceso clínico.' },
}

function info(role) {
  return roleInfo[role.name] ?? { label: role.name, desc: role.description || '—' }
}

function statusValue(active) {
  return active ? 'ACTIVE' : 'INACTIVE'
}

const filteredRoles = computed(() => {
  const term = search.value.trim().toLowerCase()
  return roles.value.filter((role) => {
    if (statusFilter.value !== 'ALL' && statusValue(role.active) !== statusFilter.value) return false
    if (!term) return true

    const details = info(role)
    return [role.name, details.label, details.desc, role.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(term)
  })
})

const statusOptions = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'INACTIVE', label: 'Inactivos' },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    roles.value = await adminService.roles()
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="rol">
    <header class="rol__header">
      <h1>Roles y permisos</h1>
      <p class="rol__subtitle">{{ roles.length }} roles definidos en el sistema</p>
    </header>

    <div class="rol__searchbar">
      <input
        v-model="search"
        type="search"
        class="rol__search"
        placeholder="Buscar por código, nombre o descripción…"
        aria-label="Buscar roles"
      />
      <select v-model="statusFilter" class="rol__filter" aria-label="Filtrar roles por estado">
        <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </div>

    <LoadingSkeleton v-if="loading" :rows="6" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState v-else-if="filteredRoles.length === 0" title="Sin roles" />

    <div v-else class="rol__list">
      <article v-for="role in filteredRoles" :key="role.id" class="vt-card rol__item">
        <div class="rol__item-head">
          <div class="rol__names">
            <span class="rol__label">{{ info(role).label }}</span>
            <code class="rol__code">{{ role.name }}</code>
          </div>
          <StatusBadge :value="statusValue(role.active)" kind="clinical" />
        </div>
        <p class="rol__desc">{{ info(role).desc }}</p>
      </article>
    </div>

    <p class="rol__note">
      Los permisos se validan siempre en el backend. Esta vista muestra los roles definidos y su responsabilidad principal.
    </p>
  </div>
</template>

<style scoped>
.rol__header { margin-bottom: var(--space-5); }
.rol__subtitle { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); margin-top: var(--space-2); }
.rol__searchbar { display: flex; gap: var(--space-3); margin-bottom: var(--space-5); flex-wrap: wrap; align-items: center; }
.rol__search,
.rol__filter {
  font-family: var(--font-body); font-size: var(--fs-body);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: var(--touch-min); padding: 0 var(--space-4); background: var(--bg-card);
}
.rol__search { width: 100%; max-width: 420px; }
.rol__list { display: flex; flex-direction: column; gap: var(--space-3); }
.rol__item-head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-3); }
.rol__names { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.rol__label { font-weight: 600; color: var(--color-navy); font-size: var(--fs-featured); }
.rol__code { background: #f3f0e9; padding: 2px 8px; border-radius: 4px; font-size: var(--fs-small); color: var(--color-teal); font-weight: 600; }
.rol__desc { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.85; line-height: 1.5; }
.rol__note { margin-top: var(--space-5); font-size: var(--fs-small); color: var(--color-dark); opacity: 0.6; font-style: italic; }
</style>
