<script setup>
/**
 * Admission account management (§8.3, RN-10).
 * Lists accounts, creates access accounts (emailing a 6-digit code),
 * resends codes and blocks/unblocks accounts.
 */
import { ref, reactive, onMounted } from 'vue'
import { admissionService } from '@/services/admission.service'
import { mapHttpError } from '@/utils/httpErrors'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const accounts = ref([])
const availablePeople = ref([])
const loading = ref(false)
const error = ref('')
const notice = ref('')
const showForm = ref(false)
const saving = ref(false)
const formError = ref('')

const form = reactive({ person_id: '', email: '' })

function personName(p) {
  if (!p) return 'Desconocido'
  return `${p.first_name} ${p.first_last_name}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    accounts.value = await admissionService.accounts()
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

async function openForm() {
  formError.value = ''
  try {
    availablePeople.value = await admissionService.peopleWithoutAccount()
    showForm.value = true
  } catch (err) {
    formError.value = mapHttpError(err)
  }
}

async function createAccount() {
  if (!form.person_id || !form.email) {
    formError.value = 'Selecciona una persona e ingresa un correo.'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    await admissionService.createAccount({ person_id: Number(form.person_id), email: form.email })
    showForm.value = false
    form.person_id = ''
    form.email = ''
    notice.value = 'Cuenta creada y código de activación enviado por correo.'
    await load()
  } catch (err) {
    formError.value = mapHttpError(err)
  } finally {
    saving.value = false
  }
}

async function resend(userId) {
  notice.value = ''
  try {
    const res = await admissionService.resendCode(userId)
    notice.value = res.message ?? 'Código de activación reenviado.'
  } catch (err) {
    error.value = mapHttpError(err)
  }
}

async function toggleBlock(account) {
  try {
    if (account.status === 'BLOCKED') {
      await admissionService.unblockAccount(account.id)
    } else {
      await admissionService.blockAccount(account.id)
    }
    await load()
  } catch (err) {
    error.value = mapHttpError(err)
  }
}

onMounted(load)
</script>

<template>
  <div class="acc">
    <header class="acc__header">
      <div>
        <h1>Cuentas</h1>
        <p class="acc__subtitle">Cuentas de acceso y activación (RN-10)</p>
      </div>
      <button v-if="!showForm" type="button" class="vt-btn-primary" @click="openForm">+ Nueva cuenta</button>
    </header>

    <p v-if="notice" class="acc__notice" role="status">{{ notice }}</p>

    <!-- Create form -->
    <div v-if="showForm" class="vt-card acc__form">
      <h3 class="acc__form-title">Crear cuenta de acceso</h3>
      <div class="acc__grid">
        <div class="acc__field">
          <label class="acc__label" for="acc-person">Persona</label>
          <select id="acc-person" v-model="form.person_id" class="acc__select">
            <option value="">Selecciona una persona registrada…</option>
            <option v-for="p in availablePeople" :key="p.id" :value="p.id">
              {{ personName(p) }}
            </option>
          </select>
        </div>
        <div class="acc__field">
          <label class="acc__label" for="acc-email">Correo electrónico</label>
          <input id="acc-email" v-model="form.email" type="email" class="acc__input" placeholder="nombre@ejemplo.com" />
        </div>
      </div>
      <p v-if="formError" class="acc__error" role="alert">{{ formError }}</p>
      <div class="acc__form-actions">
        <button type="button" class="vt-btn-secondary" @click="showForm = false; formError = ''">Cancelar</button>
        <button type="button" class="vt-btn-primary" :disabled="saving" @click="createAccount">
          {{ saving ? 'Creando…' : 'Crear y enviar código' }}
        </button>
      </div>
    </div>

    <div class="vt-card acc__panel">
      <LoadingSkeleton v-if="loading" :rows="5" />
      <ErrorState v-else-if="error" :message="error" @retry="load" />
      <EmptyState v-else-if="accounts.length === 0" title="Aún no hay cuentas" />
      <table v-else class="acc__table">
        <thead>
          <tr><th>Persona</th><th>Correo</th><th>Estado</th><th>Activación</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="a in accounts" :key="a.id">
            <td class="acc__name">{{ personName(a.person) }}</td>
            <td class="acc__email">{{ a.email }}</td>
            <td><StatusBadge :value="a.status" kind="clinical" /></td>
            <td>
              <span v-if="a.activation" class="acc__activation">
                <StatusBadge :value="a.activation.status" kind="clinical" />
              </span>
              <span v-else class="acc__meta">—</span>
            </td>
            <td class="acc__actions">
              <button v-if="a.status === 'PENDING'" type="button" class="acc__btn" @click="resend(a.id)">Reenviar código</button>
              <button type="button" class="acc__btn acc__btn--danger" @click="toggleBlock(a)">
                {{ a.status === 'BLOCKED' ? 'Desbloquear' : 'Bloquear' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.acc__header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-5); flex-wrap: wrap; }
.acc__subtitle { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); margin-top: var(--space-2); }
.acc__notice { background: #e6f4ea; color: #1b5e34; padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); font-size: var(--fs-small); margin-bottom: var(--space-4); }
.acc__form { margin-bottom: var(--space-5); }
.acc__form-title { font-size: var(--fs-featured); color: var(--color-navy); margin-bottom: var(--space-4); }
.acc__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4); }
.acc__field { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
.acc__label { font-size: var(--fs-small); font-weight: 600; }
.acc__select, .acc__input {
  font-family: var(--font-body); font-size: var(--fs-body);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: var(--touch-min); padding: 0 var(--space-3); background: var(--bg-card);
}
.acc__error { color: #b3261e; font-size: var(--fs-small); margin-bottom: var(--space-3); }
.acc__form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
.acc__panel { padding: 0; overflow: hidden; }
.acc__table { width: 100%; border-collapse: collapse; }
.acc__table th { text-align: left; font-size: var(--fs-small); font-weight: 600; color: var(--color-dark); opacity: 0.7; padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
.acc__table td { padding: var(--space-4); border-bottom: 1px solid var(--border-subtle); font-size: var(--fs-body); }
.acc__table tbody tr:last-child td { border-bottom: none; }
.acc__name { font-weight: 600; color: var(--color-navy); }
.acc__email { font-size: var(--fs-small); color: var(--color-dark); }
.acc__meta { color: var(--color-dark); opacity: 0.6; }
.acc__actions { display: flex; gap: var(--space-2); justify-content: flex-end; flex-wrap: wrap; }
.acc__btn {
  font-family: var(--font-body); font-size: var(--fs-small); font-weight: 600;
  color: var(--action-secondary); background: transparent; border: 1px solid var(--action-secondary);
  border-radius: var(--radius-md); min-height: 34px; padding: 0 var(--space-3); cursor: pointer;
}
.acc__btn--danger { color: #b3261e; border-color: #b3261e; }
</style>
