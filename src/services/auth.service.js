import http, { initCsrf } from './http'

/**
 * Authentication operations against the Laravel API (AuthService, §11).
 * Login is a two-step flow: credentials → emailed 2FA code → session.
 */
export const authService = {
  /**
   * Step 1: validate credentials. Returns the 2FA challenge
   * ({ requires_2fa, challenge_id, email_hint }); no session yet.
   */
  async login(credentials) {
    await initCsrf()
    const { data } = await http.post('/auth/login', credentials)
    return data.data
  },

  /**
   * Step 2: verify the emailed code and establish the session.
   * Returns the authenticated user.
   */
  async verifyTwoFactor({ challengeId, code }) {
    const { data } = await http.post('/auth/verify-2fa', {
      challenge_id: challengeId,
      code,
    })
    return data.data.user
  },

  /**
   * Resend the 2FA code for an existing challenge. Returns the new challenge id.
   */
  async resendTwoFactor(challengeId) {
    const { data } = await http.post('/auth/resend-2fa', {
      challenge_id: challengeId,
    })
    return data.data.challenge_id
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