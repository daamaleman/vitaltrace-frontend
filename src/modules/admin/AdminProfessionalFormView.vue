<script setup>
/**
 * Register a health professional (create only).
 * Links an existing user account to a health-staff record (doctor or nurse).
 * The backend owns HealthStaff creation and multi-role behavior; this form
 * only posts to POST /admin/professionals/register.
 */
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminService } from '@/services/admin.service'
import { mapHttpError } from '@/utils/httpErrors'
import { useToastStore } from '@/stores/toast.store'
import AppButton from '@/components/common/AppButton.vue'
import AppFormField from '@/components/common/AppFormField.vue'

const router = useRouter()
const toast = useToastStore()

const form = reactive({
  user_id: '',
  professional_type: 'DOCTOR',
  professional_code: '',
  specialty_id: '',
  active: true,
})

const typeOptions = [
  { value: 'DOCTOR', label: 'Médico' },
  { value: 'NURSE', label: 'Enfermero' },
]

const users = ref([])
const specialties = ref([])
const fieldErrors = ref({})
const formError = ref('')
const loading = ref(false)
const saving = ref(false)

function userLabel(u) {
  const p = u.person
  const name = p ? `${p.first_name} ${p.first_last_name}` : `Usuario ${u.id}`
  return u.email ? `${name} — ${u.email}` : name
}

async function loadOptions() {
  loading.value = true
  formError.value = ''
  try {
    const [usersData, specialtiesData] = await Promise.all([
      adminService.users(),
      adminService.specialties(),
    ])
    users.value = usersData
    specialties.value = specialtiesData
  } catch (err) {
    formError.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  formError.value = ''
  fieldErrors.value = {}
  try {
    await adminService.registerProfessional({
      user_id: form.user_id ? Number(form.user_id) : null,
      professional_type: form.professional_type,
      professional_code: form.professional_code,
      specialty_id: form.specialty_id ? Number(form.specialty_id) : null,
      active: form.active,
    })
    toast.success('Profesional registrado.')
    router.push({ name: 'admin-professionals' })
  } catch (err) {
    if (err.status === 422 && err.errors) {
      fieldErrors.value = Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
      )
    } else {
      formError.value = mapHttpError(err)
    }
  } finally {
    saving.value = false
  }
}

onMounted(loadOptions)
</script>

<template>
  <div class="pf">
    <button type="button" class="pf__back" @click="router.push({ name: 'admin-professionals' })">
      ← Volver a profesionales
    </button>

    <h1>Registrar profesional</h1>

    <form class="pf__form" @submit.prevent="handleSubmit">
      <div class="vt-card pf__section">
        <h3 class="pf__section-title">Datos del profesional</h3>
        <div class="pf__grid">
          <div class="pf__field">
            <label class="pf__label" for="pf-user">Usuario</label>
            <select id="pf-user" v-model="form.user_id" class="pf__select" :disabled="loading">
              <option value="">Selecciona un usuario…</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ userLabel(u) }}</option>
            </select>
            <p v-if="fieldErrors.user_id" class="pf__field-error" role="alert">{{ fieldErrors.user_id }}</p>
          </div>

          <div class="pf__field">
            <label class="pf__label" for="pf-type">Tipo de profesional</label>
            <select id="pf-type" v-model="form.professional_type" class="pf__select">
              <option v-for="o in typeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <p v-if="fieldErrors.professional_type" class="pf__field-error" role="alert">{{ fieldErrors.professional_type }}</p>
          </div>

          <AppFormField
            v-model="form.professional_code"
            label="Código profesional"
            required
            :error="fieldErrors.professional_code"
          />

          <div class="pf__field">
            <label class="pf__label" for="pf-specialty">Especialidad (opcional)</label>
            <select id="pf-specialty" v-model="form.specialty_id" class="pf__select" :disabled="loading">
              <option value="">Sin especialidad</option>
              <option v-for="s in specialties" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <p v-if="fieldErrors.specialty_id" class="pf__field-error" role="alert">{{ fieldErrors.specialty_id }}</p>
          </div>
        </div>

        <label class="pf__checkbox">
          <input v-model="form.active" type="checkbox" />
          <span>Activo</span>
        </label>
        <p v-if="fieldErrors.active" class="pf__field-error" role="alert">{{ fieldErrors.active }}</p>
      </div>

      <p v-if="formError" class="pf__error" role="alert">{{ formError }}</p>

      <div class="pf__actions">
        <AppButton variant="secondary" :disabled="saving" @click="router.push({ name: 'admin-professionals' })">
          Cancelar
        </AppButton>
        <AppButton variant="primary" type="submit" :loading="saving" loading-label="Registrando…">
          Registrar profesional
        </AppButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.pf__back { background: none; border: none; color: var(--action-secondary); font-size: var(--fs-body); font-weight: 600; cursor: pointer; margin-bottom: var(--space-4); padding: 0; }
.pf__form { margin-top: var(--space-5); }
.pf__section { margin-bottom: var(--space-5); }
.pf__section-title { font-size: var(--fs-featured); color: var(--color-navy); margin-bottom: var(--space-4); }
.pf__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0 var(--space-4); }
.pf__field { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
.pf__label { font-size: var(--fs-small); font-weight: 600; color: var(--text-primary); }
.pf__select {
  font-family: var(--font-body); font-size: var(--fs-body);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: var(--touch-min); padding: 0 var(--space-3); background: var(--bg-card);
}
.pf__field-error { font-size: var(--fs-small); color: #b3261e; }
.pf__checkbox { display: flex; align-items: center; gap: var(--space-2); font-size: var(--fs-small); font-weight: 600; color: var(--text-primary); margin-top: var(--space-2); }
.pf__error { color: #b3261e; font-size: var(--fs-small); margin-bottom: var(--space-4); }
.pf__actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
</style>
