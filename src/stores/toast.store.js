import { defineStore } from 'pinia'

/**
 * Global ephemeral notifications (toasts).
 * Views call toast.success/error/info; the ToastContainer renders them.
 */
let nextId = 1

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [], // { id, type, message }
  }),
  actions: {
    push(message, type = 'success', duration = 3500) {
      const id = nextId++
      this.toasts.push({ id, type, message })
      setTimeout(() => this.dismiss(id), duration)
      return id
    },
    success(message) { return this.push(message, 'success') },
    error(message) { return this.push(message, 'error', 5000) },
    info(message) { return this.push(message, 'info') },
    dismiss(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
  },
})
