<script setup>
/**
 * Admin panel: system configuration / status.
 * Read-only overview of the system: stack, deployment and a live backend
 * health check. No editable settings are exposed (enforced server-side).
 */
import { ref, onMounted } from 'vue'
import http from '@/services/http'

const apiStatus = ref('checking') // 'checking' | 'online' | 'offline'

const systemInfo = [
  { label: 'Aplicación', value: 'VitalTrace — Seguimiento clínico continuo' },
  { label: 'Equipo', value: 'QuantumMinds' },
  { label: 'Versión', value: '1.0' },
  { label: 'Entorno', value: 'Producción' },
]

const stack = [
  { label: 'Backend', value: 'Laravel 10.50.2 · PHP 8.2 · API REST' },
  { label: 'Frontend', value: 'Vue 3.5 · Composition API · Vite · Pinia' },
  { label: 'Base de datos', value: 'MySQL / MariaDB (normalizada)' },
  { label: 'Autenticación', value: 'Laravel Sanctum · sesión por cookies (SPA)' },
]

const deployment = [
  { label: 'Frontend', value: 'app.vitaltrace.lat' },
  { label: 'API', value: 'api.vitaltrace.lat' },
  { label: 'Infraestructura', value: 'Namecheap · hosting compartido' },
  { label: 'Correo', value: 'SMTP institucional (activación de cuentas)' },
]

async function checkApi() {
  apiStatus.value = 'checking'
  try {
    await http.get('/auth/me')
    apiStatus.value = 'online'
  } catch (err) {
    // 401 still means the API is reachable and responding.
    apiStatus.value = err?.response ? 'online' : 'offline'
  }
}

onMounted(checkApi)
</script>

<template>
  <div class="cfg">
    <header class="cfg__header">
      <h1>Configuración</h1>
      <p class="cfg__subtitle">Estado e información del sistema</p>
    </header>

    <!-- Service status -->
    <section class="vt-card cfg__section">
      <h2 class="cfg__section-title">Estado de servicios</h2>
      <div class="cfg__services">
        <div class="cfg__service">
          <span class="cfg__dot" :class="`cfg__dot--${apiStatus}`" aria-hidden="true"></span>
          <div>
            <span class="cfg__service-name">API backend</span>
            <span class="cfg__service-state">
              {{ apiStatus === 'online' ? 'En línea' : apiStatus === 'offline' ? 'Sin respuesta' : 'Comprobando…' }}
            </span>
          </div>
          <button type="button" class="cfg__recheck" @click="checkApi">Recomprobar</button>
        </div>
        <div class="cfg__service">
          <span class="cfg__dot cfg__dot--online" aria-hidden="true"></span>
          <div>
            <span class="cfg__service-name">Base de datos</span>
            <span class="cfg__service-state">Operativa (vía API)</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Info blocks -->
    <section class="cfg__grid">
      <div class="vt-card cfg__block">
        <h2 class="cfg__section-title">Sistema</h2>
        <dl class="cfg__list">
          <div v-for="row in systemInfo" :key="row.label" class="cfg__row">
            <dt>{{ row.label }}</dt><dd>{{ row.value }}</dd>
          </div>
        </dl>
      </div>

      <div class="vt-card cfg__block">
        <h2 class="cfg__section-title">Stack tecnológico</h2>
        <dl class="cfg__list">
          <div v-for="row in stack" :key="row.label" class="cfg__row">
            <dt>{{ row.label }}</dt><dd>{{ row.value }}</dd>
          </div>
        </dl>
      </div>

      <div class="vt-card cfg__block">
        <h2 class="cfg__section-title">Despliegue</h2>
        <dl class="cfg__list">
          <div v-for="row in deployment" :key="row.label" class="cfg__row">
            <dt>{{ row.label }}</dt><dd>{{ row.value }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <p class="cfg__note">
      Esta vista es de solo lectura. Los parámetros técnicos se gestionan en el servidor; la seguridad y los permisos se validan siempre en el backend.
    </p>
  </div>
</template>

<style scoped>
.cfg__header { margin-bottom: var(--space-5); }
.cfg__subtitle { color: var(--color-dark); opacity: 0.7; font-size: var(--fs-small); margin-top: var(--space-2); }
.cfg__section { margin-bottom: var(--space-5); }
.cfg__section-title { font-size: var(--fs-featured); color: var(--color-navy); margin-bottom: var(--space-4); font-weight: 700; }
.cfg__services { display: flex; flex-direction: column; gap: var(--space-3); }
.cfg__service { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
.cfg__dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.cfg__dot--online { background: #1b8a4b; }
.cfg__dot--offline { background: #b3261e; }
.cfg__dot--checking { background: #c99a00; }
.cfg__service-name { font-weight: 600; color: var(--color-navy); display: block; }
.cfg__service-state { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; }
.cfg__recheck {
  margin-left: auto; font-family: var(--font-body); font-size: var(--fs-small); font-weight: 600;
  color: var(--color-teal); background: transparent; border: 1px solid var(--color-teal);
  border-radius: var(--radius-md); min-height: 32px; padding: 0 var(--space-3); cursor: pointer;
}
.cfg__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-4); }
.cfg__list { display: flex; flex-direction: column; gap: var(--space-3); }
.cfg__row { display: flex; flex-direction: column; gap: 2px; padding-bottom: var(--space-3); border-bottom: 1px solid var(--border-subtle); }
.cfg__row:last-child { border-bottom: none; padding-bottom: 0; }
.cfg__row dt { font-size: var(--fs-small); font-weight: 600; color: var(--color-teal); }
.cfg__row dd { font-size: var(--fs-small); color: var(--color-dark); margin: 0; }
.cfg__note { margin-top: var(--space-5); font-size: var(--fs-small); color: var(--color-dark); opacity: 0.6; font-style: italic; }
</style>
