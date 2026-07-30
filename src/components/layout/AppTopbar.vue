<script setup>
/**
 * Topbar: shows the authenticated user and a logout action.
 */
import { useAuth } from '@/composables/useAuth'
import { useSidebar } from '@/composables/useSidebar'

const { user, logout } = useAuth()
const { toggle } = useSidebar()
</script>

<template>
  <header class="topbar">
    <button
      type="button"
      class="topbar__menu"
      aria-label="Abrir menú de navegación"
      @click="toggle"
    >
      <span aria-hidden="true">☰</span>
    </button>
    <div class="topbar__spacer"></div>
    <div class="topbar__user">
      <span class="topbar__email">{{ user?.email }}</span>
      <button type="button" class="topbar__logout" @click="logout">Cerrar sesión</button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  height: 64px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  padding: 0 var(--space-5);
  gap: var(--space-3);
}

.topbar__menu {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 20px;
  color: var(--color-navy);
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  flex-shrink: 0;
}

.topbar__spacer {
  flex: 1;
}

.topbar__user {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.topbar__email {
  font-size: var(--fs-small);
  color: var(--color-dark);
}

.topbar__logout {
  font-family: var(--font-body);
  font-size: var(--fs-small);
  font-weight: 600;
  color: var(--action-secondary);
  background: transparent;
  border: 1px solid var(--action-secondary);
  border-radius: var(--radius-md);
  min-height: 36px;
  padding: 0 var(--space-4);
  cursor: pointer;
}

@media (max-width: 880px) {
  .topbar__menu {
    display: inline-flex;
  }
}

@media (max-width: 480px) {
  .topbar {
    padding: 0 var(--space-3);
  }

  .topbar__email {
    display: none;
  }
}
</style>
