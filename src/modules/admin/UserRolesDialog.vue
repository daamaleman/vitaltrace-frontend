<script setup>
/**
 * Dialog to manage a user's roles (assign / revoke).
 * Warns before assigning clinical roles (DOCTOR/NURSE), which imply a
 * health_staff record. The backend enforces the real safeguards.
 */
import { ref, watch } from 'vue'
import { adminService } from '@/services/admin.service'
import { mapHttpError } from '@/utils/httpErrors'
import { useToastStore } from '@/stores/toast.store'
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  user: { type: Object, default: null },
})
const emit = defineEmits(['close', 'changed'])

const toast = useToastStore()
const roles = ref([])
const loading = ref(false)
const error = ref('')
const busyRoleId = ref(null)

function userName(u) {
  const p = u?.person
  if (!p) return u?.email ?? 'Usuario'
  return `${p.first_name} ${p.first_last_name}`
}

async function load() {
  if (!props.user) return
  loading.value = true
  error.value = ''
  try {
    roles.value = await adminService.userRoles(props.user.id)
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) load()
})

async function toggle(role) {
  if (busyRoleId.value !== null) return

  // Warn before assigning a clinical role.
  if (!role.active && role.clinical) {
    const ok = window.confirm(
      `El rol ${role.name} es clínico y requiere que la persona esté registrada como personal de salud. ¿Deseas asignarlo de todos modos?`,
    )
    if (!ok) return
  }

  busyRoleId.value = role.id
  try {
    if (role.active) {
      await adminService.revokeRole(props.user.id, role.id)
      toast.success(`Rol ${role.name} revocado.`)
    } else {
      await adminService.assignRole(props.user.id, role.id)
      toast.success(`Rol ${role.name} asignado.`)
    }
    await load()
    emit('changed')
  } catch (err) {
    const e = err?.message ?? 'No se pudo actualizar el rol.'
    toast.error(e)
    error.value = e
  } finally {
    busyRoleId.value = null
  }
}
</script>

<template>
  <div v-if="open" class="urd" role="dialog" aria-modal="true" @click.self="emit('close')">
    <div class="urd__panel vt-card">
      <header class="urd__header">
        <h3 class="urd__title">Roles de {{ userName(user) }}</h3>
        <button type="button" class="urd__close" aria-label="Cerrar" @click="emit('close')">×</button>
      </header>

      <p v-if="loading" class="urd__loading">Cargando…</p>
      <p v-else-if="error" class="urd__error">{{ error }}</p>

      <ul v-else class="urd__list">
        <li v-for="role in roles" :key="role.id" class="urd__item">
          <div class="urd__info">
            <span class="urd__name">{{ role.name }}</span>
            <span v-if="role.clinical" class="urd__clinical">Clínico</span>
            <span class="urd__desc">{{ role.description }}</span>
          </div>
          <AppButton
            :variant="role.active ? 'danger' : 'primary'"
            :loading="busyRoleId === role.id"
            @click="toggle(role)"
          >
            {{ role.active ? 'Quitar' : 'Asignar' }}
          </AppButton>
        </li>
      </ul>

      <footer class="urd__footer">
        <AppButton variant="secondary" @click="emit('close')">Cerrar</AppButton>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.urd {
  position: fixed; inset: 0; z-index: 900;
  background: rgba(2, 20, 40, 0.45);
  display: grid; place-items: center; padding: var(--space-4);
}
.urd__panel { width: 100%; max-width: 520px; max-height: 85vh; overflow-y: auto; }
.urd__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
.urd__title { font-size: var(--fs-featured); color: var(--color-navy); font-weight: 700; }
.urd__close { background: transparent; border: none; font-size: 24px; line-height: 1; cursor: pointer; color: var(--color-dark); opacity: 0.6; }
.urd__close:hover { opacity: 1; }
.urd__loading, .urd__error { padding: var(--space-4) 0; font-size: var(--fs-small); }
.urd__error { color: #b3261e; }
.urd__list { list-style: none; display: flex; flex-direction: column; gap: var(--space-3); }
.urd__item { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); padding: var(--space-3); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
.urd__info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.urd__name { font-weight: 600; color: var(--color-navy); }
.urd__clinical { font-size: 11px; font-weight: 600; color: #8a5300; background: #fff3e0; padding: 1px 8px; border-radius: 4px; align-self: flex-start; }
.urd__desc { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; }
.urd__footer { display: flex; justify-content: flex-end; margin-top: var(--space-5); }
</style>
