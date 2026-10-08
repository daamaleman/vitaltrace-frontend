<script setup>
/**
 * Public login for Doctor and Admission (§6.1).
 *
 * The role selector picks which area the user intends to log into. After
 * a successful login, the real role (from the backend) must match the
 * selected area; otherwise the session is closed and an error is shown.
 */
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/composables/useAuth'
import { mapHttpError } from '@/utils/httpErrors'
import AppButton from '@/components/common/AppButton.vue'
import AppFormField from '@/components/common/AppFormField.vue'
import logoStacked from '@/assets/Imagotipo V.png'

const authStore = useAuthStore()
const { landingRoute } = useAuth()
const router = useRouter()
const route = useRoute()

const idleMessage = route.query.reason === 'idle'
  ? 'Tu sesión se cerró por inactividad. Inicia sesión de nuevo.'
  : ''

const selectedRole = ref('DOCTOR')
const email = ref('')
const password = ref('')
const formError = ref('')
const fieldErrors = ref({})

// --- Estado del paso 2FA ---
const step = ref('credentials')
const challengeId = ref('')
const emailHint = ref('')
const code = ref('')
const resending = ref(false)
const resentMessage = ref('')

const roleOptions = [
  { value: 'DOCTOR', label: 'Médico' },
  { value: 'ADMISSION', label: 'Admisión' },
]

// Paso 1: validar credenciales → recibir challenge 2FA
async function handleSubmit() {
  formError.value = ''
  fieldErrors.value = {}
  try {
    const challenge = await authStore.login({ email: email.value, password: password.value })
    challengeId.value = challenge.challenge_id
    emailHint.value = challenge.email_hint ?? ''
    step.value = 'code'
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

// Paso 2: verificar el código → crear sesión y validar área
async function handleVerify() {
  formError.value = ''
  fieldErrors.value = {}
  try {
    await authStore.verifyTwoFactor({ challengeId: challengeId.value, code: code.value })

    if (!authStore.hasRole(selectedRole.value)) {
      const areaLabel = roleOptions.find((o) => o.value === selectedRole.value)?.label ?? ''
      await authStore.logout()
      resetFlow()
      formError.value = `Este correo no corresponde al área de ${areaLabel}. Verifica el área seleccionada.`
      return
    }

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

async function handleResend() {
  resending.value = true
  resentMessage.value = ''
  formError.value = ''
  try {
    challengeId.value = await authStore.resendTwoFactor(challengeId.value)
    resentMessage.value = 'Te enviamos un nuevo código.'
  } catch (error) {
    formError.value = mapHttpError(error)
  } finally {
    resending.value = false
  }
}

function resetFlow() {
  step.value = 'credentials'
  challengeId.value = ''
  code.value = ''
  password.value = ''
}
</script>

<template>
  <div class="login">
    <div class="login__card vt-card">
      <div class="login__brand">
        <img :src="logoStacked" alt="VitalTrace" class="login__logo-img" />
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

      <p v-if="idleMessage" class="login__idle" role="status">{{ idleMessage }}</p>

      <!-- Paso 1: credenciales -->
      <form v-if="step === 'credentials'" @submit.prevent="handleSubmit">
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

        <AppButton
          variant="primary"
          type="submit"
          class="login__submit"
          :loading="authStore.loading"
          loading-label="Verificando…"
        >
          Continuar
        </AppButton>
      </form>

      <!-- Paso 2: código 2FA -->
      <form v-else @submit.prevent="handleVerify">
        <p class="login__2fa-intro">
          Ingresa el código de verificación que enviamos a
          <strong>{{ emailHint }}</strong>.
        </p>

        <AppFormField
          v-model="code"
          label="Código de verificación"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          required
          :error="fieldErrors.code"
        />

        <p v-if="resentMessage" class="login__idle" role="status">{{ resentMessage }}</p>
        <p v-if="formError" class="login__error" role="alert">{{ formError }}</p>

        <AppButton
          variant="primary"
          type="submit"
          class="login__submit"
          :loading="authStore.loading"
          loading-label="Verificando…"
        >
          Verificar e iniciar sesión
        </AppButton>

        <div class="login__2fa-actions">
          <button type="button" class="login__link" :disabled="resending" @click="handleResend">
            Reenviar código
          </button>
          <button type="button" class="login__link" @click="resetFlow">
            Cambiar correo
          </button>
        </div>
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

.login__logo-img {
  height: 108px;
  width: auto;
  margin: 0 auto;
  display: block;
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

.login__idle {
  background: #fff3e0;
  color: #8a5300;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--fs-small);
  margin-bottom: var(--space-4);
  text-align: center;
}

.login__2fa-intro {
  font-size: var(--fs-small);
  color: var(--color-dark);
  margin-bottom: var(--space-4);
  text-align: center;
}

.login__2fa-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-4);
}

.login__link {
  background: none;
  border: none;
  color: var(--color-teal);
  font-weight: 600;
  font-size: var(--fs-small);
  cursor: pointer;
  padding: 0;
}

.login__link:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>