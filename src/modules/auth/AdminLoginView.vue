<script setup>
/**
 * Reserved admin login (§6.2).
 *
 * Reachable only by typing the secret path (VITE_ADMIN_PATH); not linked
 * anywhere in the UI. No role selector: this path is exclusively for
 * SYSTEM_ADMIN, which the backend validates.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { mapHttpError } from '@/utils/httpErrors'
import AppFormField from '@/components/common/AppFormField.vue'
import logoStacked from '@/assets/Imagotipo V.png'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const formError = ref('')
const fieldErrors = ref({})

async function handleSubmit() {
  formError.value = ''
  fieldErrors.value = {}

  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push({ name: 'admin-users' })
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
        <img :src="logoStacked" alt="VitalTrace" class="login__logo-img" />
        <p class="login__tagline">Acceso administrativo reservado</p>
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
