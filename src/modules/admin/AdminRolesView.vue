<script setup>
/**
 * Admin panel: system roles.
 * Read-only list of the roles defined in the system, with their
 * responsibility described. Permissions are enforced in the backend.
 */
import { ref, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'
import { mapHttpError } from '@/utils/httpErrors'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const roles = ref([])
const loading = ref(false)
const error = ref('')

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

    <LoadingSkeleton v-if="loading" :rows="6" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState v-else-if="roles.length === 0" title="Sin roles" />

    <div v-else class="rol__list">
      <article v-for="role in roles" :key="role.id" class="vt-card rol__item">
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
.rol__list { display: flex; flex-direction: column; gap: var(--space-3); }
.rol__item-head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-3); }
.rol__names { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.rol__label { font-weight: 600; color: var(--color-navy); font-size: var(--fs-featured); }
.rol__code { background: #f3f0e9; padding: 2px 8px; border-radius: 4px; font-size: var(--fs-small); color: var(--color-teal); font-weight: 600; }
.rol__desc { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.85; line-height: 1.5; }
.rol__note { margin-top: var(--space-5); font-size: var(--fs-small); color: var(--color-dark); opacity: 0.6; font-style: italic; }
</style>
