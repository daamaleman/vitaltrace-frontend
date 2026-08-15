import { defineStore } from 'pinia'
import { authService } from '@/services/auth.service'

/**
 * Session store: authenticated user, role and permission helpers.
 *
 * No passwords, codes or full clinical data are ever stored here (§13).
 * The session itself lives in the Sanctum cookie, not in this store.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,

    /**
     * Role names of the authenticated user (from the backend payload).
     */
    roles: (state) => state.user?.roles?.map((r) => r.name) ?? [],

    hasRole: (state) => (roleName) =>
      state.user?.roles?.some((r) => r.name === roleName) ?? false,

    hasAnyRole: (state) => (roleNames) =>
      state.user?.roles?.some((r) => roleNames.includes(r.name)) ?? false,
  },

  actions: {
    /**
     * Authenticate and load the user profile.
     *
     * The login response already includes the user, so we use it directly
     * instead of firing a separate /me request, which avoids a race with the
     * freshly issued session cookie.
     */
    async login(credentials) {
      this.loading = true
      try {
        this.user = await authService.login(credentials)
        this.initialized = true
        return this.user
      } finally {
        this.loading = false
      }
    },

    /**
     * Restore the session on app start or route entry.
     * A failed call means there is no active session.
     */
    async fetchUser() {
      try {
        this.user = await authService.me()
      } catch {
        this.user = null
      } finally {
        this.initialized = true
      }
    },

    /**
     * Clear the local session. Called on logout and on 401 responses.
     */
    clearSession() {
      this.user = null
    },

    /**
     * Log out on the backend and clear local state.
     */
    async logout() {
      try {
        await authService.logout()
      } finally {
        this.clearSession()
      }
    },
  },
})