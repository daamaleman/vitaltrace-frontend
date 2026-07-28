import { useAuthStore } from '@/stores/auth.store'

/**
 * Global navigation guard.
 *
 * - Public routes pass through.
 * - Protected routes require an active session; if none, redirect to login.
 * - Role-restricted routes require the user to hold one of meta.roles.
 *
 * The backend remains the final authority; these guards only shape navigation.
 */
export async function authGuard(to) {
  const authStore = useAuthStore()

  // Restore the session once per app lifecycle before deciding.
  if (!authStore.initialized) {
    await authStore.fetchUser()
  }

  const requiresAuth = to.meta.requiresAuth === true
  const allowedRoles = to.meta.roles ?? null

  // Public route: allow.
  if (!requiresAuth) {
    return true
  }

  // Protected route without a session: send to login.
  if (!authStore.isAuthenticated) {
    return { name: 'login' }
  }

  // Role-restricted route: check membership.
  if (allowedRoles && !authStore.hasAnyRole(allowedRoles)) {
    return { name: 'forbidden' }
  }

  return true
}