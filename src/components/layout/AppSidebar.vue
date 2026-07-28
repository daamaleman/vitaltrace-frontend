<script setup>
/**
 * Role-aware sidebar. Only the menu items for the user's role are shown (§14).
 */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

const doctorMenu = [
  { name: 'doctor-alerts', label: 'Alerts' },
  { name: 'doctor-patients', label: 'Patients' },
  { name: 'doctor-appointments', label: 'Appointments' },
]

const admissionMenu = [
  { name: 'admission-patients', label: 'Patients' },
  { name: 'admission-accounts', label: 'Accounts' },
  { name: 'admission-assignments', label: 'Assignments' },
  { name: 'admission-corrections', label: 'Corrections' },
]

const adminMenu = [
  { name: 'admin-users', label: 'Users' },
  { name: 'admin-roles', label: 'Roles & permissions' },
  { name: 'admin-catalogs', label: 'Catalogs' },
  { name: 'admin-audit', label: 'Audit' },
  { name: 'admin-config', label: 'Configuration' },
]

const menu = computed(() => {
  if (authStore.hasRole('DOCTOR')) return doctorMenu
  if (authStore.hasRole('ADMISSION')) return admissionMenu
  if (authStore.hasRole('SYSTEM_ADMIN')) return adminMenu
  return []
})
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__brand">Vital<strong>Trace</strong></div>
    <nav class="sidebar__nav" aria-label="Main navigation">
      <router-link
        v-for="item in menu"
        :key="item.name"
        :to="{ name: item.name }"
        class="sidebar__link"
        active-class="sidebar__link--active"
      >
        {{ item.label }}
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background: var(--color-navy);
  color: var(--text-on-brand);
  display: flex;
  flex-direction: column;
  padding: var(--space-5) var(--space-3);
}

.sidebar__brand {
  font-family: var(--font-heading);
  font-size: var(--fs-subtitle);
  font-weight: 600;
  color: var(--text-on-brand);
  padding: 0 var(--space-3);
  margin-bottom: var(--space-6);
}

.sidebar__brand strong {
  color: var(--color-mint);
  font-weight: 700;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar__link {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: rgba(255, 255, 255, 0.8);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  min-height: var(--touch-min);
  display: flex;
  align-items: center;
  transition: background 0.15s ease;
}

.sidebar__link:hover {
  background: rgba(255, 255, 255, 0.08);
  text-decoration: none;
}

.sidebar__link--active {
  background: var(--color-teal);
  color: var(--text-on-brand);
}
</style>
