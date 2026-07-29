<script setup>
/**
 * Status/severity badge. Never relies on color alone: always pairs a color
 * with a label and a small icon glyph, per the brand accessibility rules.
 */
import { computed } from 'vue'

const props = defineProps({
  value: { type: String, required: true },
  kind: { type: String, default: 'status' }, // 'status' | 'severity'
})

const severityMap = {
  INFORMATIONAL: { label: 'Informativa', color: 'info', icon: 'ℹ' },
  MODERATE: { label: 'Moderada', color: 'moderate', icon: '▲' },
  HIGH: { label: 'Alta', color: 'high', icon: '▲' },
  CRITICAL: { label: 'Crítica', color: 'critical', icon: '⚠' },
}

const statusMap = {
  NEW: { label: 'Nueva', color: 'new', icon: '●' },
  CLASSIFIED: { label: 'Clasificada', color: 'classified', icon: '◐' },
  ESCALATED: { label: 'Escalada', color: 'high', icon: '▲' },
  IN_PROGRESS: { label: 'En progreso', color: 'progress', icon: '◔' },
  CLOSED: { label: 'Cerrada', color: 'closed', icon: '✓' },
  ACTIVE: { label: 'Activo', color: 'new', icon: '●' },
}

const clinicalMap = {
  // Diagnosis
  ACTIVE: { label: 'Activo', color: 'progress', icon: '●' },
  RESOLVED: { label: 'Resuelto', color: 'closed', icon: '✓' },
  UNDER_REVIEW: { label: 'En revisión', color: 'classified', icon: '◐' },
  // Evolution
  STABLE: { label: 'Estable', color: 'closed', icon: '✓' },
  OBSERVATION: { label: 'En observación', color: 'classified', icon: '◐' },
  DELICATE: { label: 'Delicado', color: 'moderate', icon: '▲' },
  RECOVERY: { label: 'Recuperación', color: 'info', icon: '↑' },
  CRITICAL: { label: 'Crítico', color: 'critical', icon: '⚠' },
  // Treatment
  FINISHED: { label: 'Finalizado', color: 'closed', icon: '✓' },
  SUSPENDED: { label: 'Suspendido', color: 'high', icon: '⏸' },
  // Appointment
  SCHEDULED: { label: 'Programada', color: 'new', icon: '●' },
  CONFIRMED: { label: 'Confirmada', color: 'info', icon: '✓' },
  ATTENDED: { label: 'Atendida', color: 'closed', icon: '✓' },
  CANCELLED: { label: 'Cancelada', color: 'high', icon: '✕' },
  NO_SHOW: { label: 'No asistió', color: 'moderate', icon: '⊘' },
  // Administrative (patient)
  PRE_REGISTERED: { label: 'Preregistrado', color: 'classified', icon: '◐' },
  INACTIVE: { label: 'Inactivo', color: 'neutral', icon: '•' },
  DISCHARGED: { label: 'Dado de alta', color: 'closed', icon: '✓' },
  ARCHIVED: { label: 'Archivado', color: 'neutral', icon: '•' },
  // Patient-relative link
  PENDING: { label: 'Pendiente', color: 'classified', icon: '◐' },
  REVOKED: { label: 'Revocado', color: 'high', icon: '✕' },
  EXPIRED: { label: 'Expirado', color: 'neutral', icon: '⊘' },
}

const config = computed(() => {
  let map = statusMap
  if (props.kind === 'severity') map = severityMap
  else if (props.kind === 'clinical') map = clinicalMap
  return map[props.value] ?? { label: props.value, color: 'neutral', icon: '•' }
})
</script>

<template>
  <span class="badge" :class="`badge--${config.color}`">
    <span class="badge__icon" aria-hidden="true">{{ config.icon }}</span>
    <span class="badge__label">{{ config.label }}</span>
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--fs-small);
  font-weight: 600;
  line-height: 1.4;
  border: 1px solid transparent;
  white-space: nowrap;
}

.badge__icon { font-size: 0.85em; }

/* Severity + status palettes, each with sufficient contrast */
.badge--info,
.badge--new { background: #e8f0f8; color: #01305e; border-color: #cfe0f0; }
.badge--classified { background: #eae6f7; color: #4b3b8f; border-color: #d8d0ee; }
.badge--moderate,
.badge--progress { background: #fff3e0; color: #8a5300; border-color: #ffe0b2; }
.badge--high { background: #fde8e6; color: #b3261e; border-color: #f7c9c4; }
.badge--critical { background: #b3261e; color: #ffffff; border-color: #b3261e; }
.badge--closed { background: #e6f4ea; color: #1b5e34; border-color: #cfe8d6; }
.badge--neutral { background: #eee; color: #444; border-color: #ddd; }
</style>