<script setup>
/**
 * Admin panel: user management.
 * Lists all users with person, role, status and last access; allows
 * blocking/unblocking. Does not touch clinical data.
 */
import { ref, computed, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'
import { mapHttpError } from '@/utils/httpErrors'
import { formatDateTime } from '@/utils/formatters'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const users = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return users.value
  return users.value.filter((u) => {
    const name = userName(u).toLowerCase()
    return name.includes(term) || u.email.toLowerCase().includes(term)
  })
})

function userName(u) {
  const p = u.person
  if (!p) return '—'
  return `${p.first_name} ${p.first_last_name}`
}

function roleLabel(u) {
  if (!u.roles || u.roles.length === 0) return '—'
  return u.roles.map((r) => r.name).join(', ')
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    users.value = await adminService.users()
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

async function toggleBlock(user) {
  try {
    if (user.status === 'BLOCKED') {
      await adminService.unblockUser(user.id)
    } else {
      await adminService.blockUser(user.id)
    }
    await load()
  } catch (err) {
    error.value = mapHttpError(err)
  }
}

onMounted(load)
</script>

<template>
  <div class="au">
    <header class="au__header">
      <div>
        <h1>Usuarios</h1>
        <p class="au__subtitle">{{ users.length }} usuarios del sistema</p>
      </div>
    </header>

    <div class="au__search">
      <input
        v-model="search"
        type="search"
        class="au__search-input"
        placeholder="Buscar por nombre o correo…"
        aria-label="Buscar usuarios"
      />
    </div>

    <div class="vt-card au__panel">
      <LoadingSkeleton v-if="loading" :rows="5" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="filtered.length === 0" title="Sin usuarios" />
      <table v-else class="au__table">
        <thead>
          <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.id">
            <td class="au__name">{{ userName(u) }}</td>
            <td class="au__email">{{ u.email }}</td>
            <td class="au__role">{{ roleLabel(u) }}</td>
            <td><StatusBadge :value="u.status" kind="clinical" /></td>
            <td class="au__meta">{{ u.last_access_at ? formatDateTime(u.last_access_at) : '—' }}</td>
            <td class="au__actions">
              <button type="button" class="au__btn" @click="toggleBlock(u)">
                {{ u.status === 'BLOCKED' ? 'Desbloquear' : 'Bloquear' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.au__header { margin-bottom: var(--space-5); }
.au__subtitle { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); margin-top: var(--space-2); }
.au__search { margin-bottom: var(--space-5); }
.au__search-input {
  width: 100%; max-width: 380px;
  font-family: var(--font-body); font-size: var(--fs-body);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: var(--touch-min); padding: 0 var(--space-4); background: var(--bg-card);
}
.au__panel { padding: 0; overflow: hidden; }
.au__table { width: 100%; border-collapse: collapse; }
.au__table th { text-align: left; font-size: var(--fs-small); font-weight: 600; color: var(--color-dark); opacity: 0.7; padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
.au__table td { padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); font-size: var(--fs-body); }
.au__table tbody tr:last-child td { border-bottom: none; }
.au__name { font-weight: 600; color: var(--color-navy); }
.au__email { font-size: var(--fs-small); color: var(--color-dark); }
.au__role { font-size: var(--fs-small); font-weight: 600; color: var(--color-teal); }
.au__meta { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; }
.au__actions { text-align: right; }
.au__btn {
  font-family: var(--font-body); font-size: var(--fs-small); font-weight: 600;
  color: #b3261e; background: transparent; border: 1px solid #b3261e;
  border-radius: var(--radius-md); min-height: 34px; padding: 0 var(--space-3); cursor: pointer;
}
</style>
