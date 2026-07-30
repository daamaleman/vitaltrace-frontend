import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

/**
 * Auto-logout after a period of user inactivity (§13).
 *
 * Any mouse, keyboard, touch or scroll activity resets the timer. When the
 * timeout elapses without activity, the session is cleared and the user is
 * sent to the login screen.
 *
 * @param {number} minutes  Idle minutes before logout (default 15).
 */
export function useIdleTimeout(minutes = 15) {
  const authStore = useAuthStore()
  const router = useRouter()

  const timeoutMs = minutes * 60 * 1000
  let timer = null

  async function logoutForIdle() {
    await authStore.logout()
    router.push({ name: 'login', query: { reason: 'idle' } })
  }

  function resetTimer() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(logoutForIdle, timeoutMs)
  }

  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']

  onMounted(() => {
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
  })

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
    events.forEach((e) => window.removeEventListener(e, resetTimer))
  })
}
