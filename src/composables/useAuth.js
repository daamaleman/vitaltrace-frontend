import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Session helpers shared across views: role checks, landing route by role,
 * and logout with redirect.
 */
export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const user = computed(() => authStore.user)
  const roles = computed(() => authStore.roles)

  /**
   * Resolve the landing route for the user's primary role (§6.1).
   */
  function landingRoute() {
    if (authStore.hasRole('DOCTOR')) return { name: 'doctor-alerts' }
    if (authStore.hasRole('ADMISSION')) return { name: 'admission-patients' }
    if (authStore.hasRole('SYSTEM_ADMIN')) return { name: 'admin-users' }
    return { name: 'login' }
  }

  async function logout() {
    await authStore.logout()
    router.push({ name: 'login' })
  }

  return { user, roles, landingRoute, logout }
}