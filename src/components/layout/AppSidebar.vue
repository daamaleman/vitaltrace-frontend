<script setup>
/**
 * Role-aware sidebar. Only the menu items for the user's role are shown (§14).
 */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useSidebar } from '@/composables/useSidebar'
import logoMark from '@/assets/Isotipo-reversed.png'

const authStore = useAuthStore()
const { isOpen, close } = useSidebar()

const doctorMenu = [
  { name: 'doctor-alerts', label: 'Alertas' },
  { name: 'doctor-patients', label: 'Pacientes' },
  { name: 'doctor-appointments', label: 'Citas' },
]

const admissionMenu = [
  { name: 'admission-patients', label: 'Pacientes' },
  { name: 'admission-accounts', label: 'Cuentas' },
  { name: 'admission-assignments', label: 'Asignaciones' },
  { name: 'admission-appointments', label: 'Citas' },
  { name: 'admission-corrections', label: 'Correcciones' },
]

const adminMenu = [
  { name: 'admin-users', label: 'Usuarios' },
  { name: 'admin-roles', label: 'Roles y permisos' },
  { name: 'admin-professionals', label: 'Profesionales' },
  { name: 'admin-catalogs', label: 'Catálogos' },
  { name: 'admin-audit', label: 'Auditoría' },
  { name: 'admin-config', label: 'Configuración' },
]

const menu = computed(() => {
  if (authStore.hasRole('DOCTOR')) return doctorMenu
  if (authStore.hasRole('ADMISSION')) return admissionMenu
  if (authStore.hasRole('SYSTEM_ADMIN')) return adminMenu
  return []
})
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--open': isOpen }">
    <div class="sidebar__brand">
      <span class="sidebar__mark">
        <img :src="logoMark" alt="" class="sidebar__mark-img" />
      </span>
      <span class="sidebar__brand-text">Vital<strong>Trace</strong></span>
    </div>
    <nav class="sidebar__nav" aria-label="Navegación principal">
      <router-link
        v-for="item in menu"
        :key="item.name"
        :to="{ name: item.name }"
        class="sidebar__link"
        active-class="sidebar__link--active"
        @click="close"
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
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  margin-bottom: var(--space-6);
}

.sidebar__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
}

.sidebar__mark-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.sidebar__brand-text {
  font-family: var(--font-heading);
  font-size: var(--fs-subtitle);
  font-weight: 600;
  color: var(--text-on-brand);
  white-space: nowrap;
}

.sidebar__brand-text strong {
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

@media (max-width: 880px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    height: 100vh;
    z-index: 1001;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    box-shadow: 4px 0 24px rgba(1, 48, 94, 0.25);
  }

  .sidebar--open {
    transform: translateX(0);
  }
}
</style>
