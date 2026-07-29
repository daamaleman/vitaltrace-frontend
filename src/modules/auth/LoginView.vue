<script setup>
/**
 * Public login for Doctor and Admission (§6.1).
 *
 * The role selector is presentational only: it does not change the real
 * role, which the backend validates. After login, the user is routed to
 * the landing view of their actual role.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/composables/useAuth'
import { mapHttpError } from '@/utils/httpErrors'
import AppFormField from '@/components/common/AppFormField.vue'

const authStore = useAuthStore()
const { landingRoute } = useAuth()
const router = useRouter()

const selectedRole = ref('DOCTOR')
const email = ref('')
const password = ref('')
const formError = ref('')
const fieldErrors = ref({})

const roleOptions = [
  { value: 'DOCTOR', label: 'Médico' },
  { value: 'ADMISSION', label: 'Admisión' },
]

async function handleSubmit() {
  formError.value = ''
  fieldErrors.value = {}

  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push(landingRoute())
  } catch (error) {
    if (error.status === 422 && error.errors) {
      fieldErrors.value = Object.fromEntries(
        Object.entries(error.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
      )
    } else {
      formError.value = mapHttpError(error)
    }
  }
}
</script>

<template>
  <div class="login">
    <div class="login__card vt-card">
      <div class="login__brand">
        <span class="login__logo">Vital<strong>Trace</strong></span>
        <p class="login__tagline">Seguimiento clínico continuo</p>
      </div>

      <div class="login__roles" role="group" aria-label="Selecciona tu rol">
        <button
          v-for="option in roleOptions"
          :key="option.value"
          type="button"
          class="login__role"
          :class="{ 'login__role--active': selectedRole === option.value }"
          :aria-pressed="selectedRole === option.value"
          @click="selectedRole = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <AppFormField
          v-model="email"
          label="Correo electrónico"
          type="email"
          autocomplete="username"
          required
          :error="fieldErrors.email"
        />
        <AppFormField
          v-model="password"
          label="Contraseña"
          type="password"
          autocomplete="current-password"
          required
          :error="fieldErrors.password"
        />

        <p v-if="formError" class="login__error" role="alert">{{ formError }}</p>

        <button type="submit" class="vt-btn-primary login__submit" :disabled="authStore.loading">
          {{ authStore.loading ? 'Iniciando sesión…' : 'Iniciar sesión' }}
        </button>
      </form>

      <p class="login__note">Prototipo académico · Datos ficticios</p>
    </div>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-5);
}

.login__card {
  width: 100%;
  max-width: 420px;
}

.login__brand {
  text-align: center;
  margin-bottom: var(--space-6);
}

.login__logo {
  font-family: var(--font-heading);
  font-size: var(--fs-section);
  font-weight: 600;
  color: var(--color-navy);
}

.login__logo strong {
  color: var(--color-teal);
  font-weight: 700;
}

.login__tagline {
  font-size: var(--fs-small);
  color: var(--color-dark);
  opacity: 0.75;
  margin-top: var(--space-2);
}

.login__roles {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.login__role {
  flex: 1;
  font-family: var(--font-body);
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--color-navy);
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  min-height: var(--touch-min);
  cursor: pointer;
  transition: all 0.15s ease;
}

.login__role--active {
  background: var(--color-navy);
  color: var(--text-on-brand);
  border-color: var(--color-navy);
}

.login__submit {
  width: 100%;
  margin-top: var(--space-2);
}

.login__error {
  font-size: var(--fs-small);
  color: #b3261e;
  margin-bottom: var(--space-4);
}

.login__note {
  text-align: center;
  font-size: var(--fs-small);
  color: var(--color-dark);
  opacity: 0.6;
  margin-top: var(--space-5);
}
</style>