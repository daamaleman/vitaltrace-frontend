import http, { initCsrf } from './http'

/**
 * Authentication operations against the Laravel API (AuthService, §11).
 */
export const authService = {
  /**
   * Log in a Médico or Admisión account.
   * Fetches the CSRF cookie first, as required by Sanctum SPA auth.
   */
  async login(credentials) {
    await initCsrf()
    const { data } = await http.post('/auth/login', credentials)
    return data.data
  },

  /**
   * Return the currently authenticated user.
   */
  async me() {
    const { data } = await http.get('/auth/me')
    return data.data
  },

  /**
   * Log out and invalidate the session.
   */
  async logout() {
    await http.post('/auth/logout')
  },
}