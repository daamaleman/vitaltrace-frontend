<script setup>
/**
 * Topbar: shows the authenticated user and a logout action.
 */
import { useAuth } from '@/composables/useAuth'

const { user, logout } = useAuth()
</script>

<template>
  <header class="topbar">
    <div class="topbar__spacer"></div>
    <div class="topbar__user">
      <span class="topbar__email">{{ user?.email }}</span>
      <button type="button" class="topbar__logout" @click="logout">Sign out</button>
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
</style>
