<script setup>
/**
 * Patient clinical follow-up (§7.3).
 *
 * Read-only aggregate view for the assigned clinician: patient data,
 * measurement trend, diagnoses, clinical evolutions and treatments.
 * Clinical history is preserved, never overwritten (RN-09).
 */
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doctorService } from '@/services/doctor.service'
import { mapHttpError } from '@/utils/httpErrors'
import { formatDateTime, ageFromDate } from '@/utils/formatters'
import { useToastStore } from '@/stores/toast.store'
import AppButton from '@/components/common/AppButton.vue'
import AppFormField from '@/components/common/AppFormField.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const route = useRoute()
const router = useRouter()

const summary = ref(null)
const loading = ref(false)
const error = ref('')
const activeTab = ref('measurements')

const tabs = [
  { value: 'measurements', label: 'Mediciones' },
  { value: 'diagnoses', label: 'Diagnósticos' },
  { value: 'evolutions', label: 'Evoluciones' },
  { value: 'treatments', label: 'Tratamientos' },
]

const patient = computed(() => summary.value?.patient ?? null)
const person = computed(() => patient.value?.person ?? null)

const patientName = computed(() => {
  if (!person.value) return patient.value?.record_number ?? 'Paciente'
  return `${person.value.first_name} ${person.value.first_last_name}`
})

const measurements = computed(() => summary.value?.measurements ?? [])
const diagnoses = computed(() => summary.value?.diagnoses ?? [])
const evolutions = computed(() => summary.value?.evolutions ?? [])
const treatments = computed(() => summary.value?.treatments ?? [])

const toast = useToastStore()

const evolutionStatuses = [
  { value: 'STABLE', label: 'Estable' },
  { value: 'OBSERVATION', label: 'Observación' },
  { value: 'DELICATE', label: 'Delicado' },
  { value: 'CRITICAL', label: 'Crítico' },
  { value: 'RECOVERY', label: 'Recuperación' },
]

const showEvolutionForm = ref(false)
const savingEvolution = ref(false)
const evolutionError = ref('')
const evolutionForm = reactive({
  clinical_summary: '',
  status: 'STABLE',
  recorded_at: '',
})

function resetEvolutionForm() {
  evolutionForm.clinical_summary = ''
  evolutionForm.status = 'STABLE'
  evolutionForm.recorded_at = ''
  evolutionError.value = ''
}

async function submitEvolution() {
  savingEvolution.value = true
  evolutionError.value = ''
  try {
    await doctorService.addEvolution(route.params.id, { ...evolutionForm })
    showEvolutionForm.value = false
    resetEvolutionForm()
    await loadSummary()
    toast.success('Evolución registrada correctamente.')
  } catch (err) {
    evolutionError.value = mapHttpError(err)
    toast.error('No se pudo registrar la evolución.')
  } finally {
    savingEvolution.value = false
  }
}

// Simple trend: chronological measurements for a mini sparkline.
const trend = computed(() => {
  const points = [...measurements.value]
    .slice(0, 12)
    .reverse()
    .map((m) => Number(m.value))
    .filter((v) => !Number.isNaN(v))
  if (points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const width = 280
  const height = 60
  const step = width / (points.length - 1)
  const coords = points.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return { polyline: coords.join(' '), width, height, min, max }
})

async function loadSummary() {
  loading.value = true
  error.value = ''
  try {
    summary.value = await doctorService.patientSummary(route.params.id)
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

onMounted(loadSummary)
</script>

<template>
  <div class="patient">
    <button type="button" class="patient__back" @click="router.push({ name: 'doctor-patients' })">
      ← Volver a pacientes
    </button>

    <LoadingSkeleton v-if="loading" :rows="4" />
    <ErrorState v-else-if="error" :message="error" @retry="loadSummary" />

    <template v-else-if="patient">
      <!-- Patient header -->
      <header class="patient__header vt-card">
        <div class="patient__identity">
          <h1>{{ patientName }}</h1>
          <div class="patient__meta-row">
            <span class="patient__chip">{{ patient.record_number }}</span>
            <span class="patient__chip">{{ ageFromDate(person?.date_of_birth) }} años</span>
            <StatusBadge :value="patient.administrative_status" kind="status" />
          </div>
        </div>
        <p class="patient__note">Vista clínica de solo lectura · el historial se conserva, no se sobrescribe.</p>
      </header>

      <!-- Tabs -->
      <nav class="patient__tabs" aria-label="Secciones clínicas">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="patient__tab"
          :class="{ 'patient__tab--active': activeTab === tab.value }"
          :aria-pressed="activeTab === tab.value"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- Measurements -->
      <section v-show="activeTab === 'measurements'" class="vt-card">
        <div v-if="trend" class="patient__trend">
          <h3 class="patient__section-title">Tendencia reciente</h3>
          <svg :viewBox="`0 0 ${trend.width} ${trend.height}`" class="patient__sparkline" preserveAspectRatio="none">
            <polyline :points="trend.polyline" fill="none" stroke="var(--color-teal)" stroke-width="2" />
          </svg>
          <div class="patient__trend-range">
            <span>mín {{ trend.min }}</span>
            <span>máx {{ trend.max }}</span>
          </div>
        </div>

        <EmptyState v-if="measurements.length === 0" title="No hay mediciones" />
        <table v-else class="patient__table">
          <thead>
            <tr><th>Tipo</th><th>Valor</th><th>Origen</th><th>Registrada</th></tr>
          </thead>
          <tbody>
            <tr v-for="m in measurements" :key="m.id">
              <td>{{ m.measurement_type?.name ?? '—' }}</td>
              <td class="patient__value">{{ m.value }} {{ m.unit }}</td>
              <td>{{ m.origin }}</td>
              <td class="patient__meta">{{ formatDateTime(m.measured_at) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Diagnoses -->
      <section v-show="activeTab === 'diagnoses'" class="vt-card">
        <EmptyState v-if="diagnoses.length === 0" title="No hay diagnósticos" />
        <ul v-else class="patient__list">
          <li v-for="d in diagnoses" :key="d.id" class="patient__item">
            <div class="patient__item-head">
              <span class="patient__item-title">{{ d.cie_code }} · {{ d.description }}</span>
              <StatusBadge :value="d.status" kind="clinical" />
            </div>
            <div class="patient__meta">Diagnosticado {{ formatDateTime(d.diagnosis_date) }}</div>
          </li>
        </ul>
      </section>

      <!-- Evolutions -->
      <section v-show="activeTab === 'evolutions'" class="vt-card">
        <div class="patient__section-head">
          <h3 class="patient__section-title">Evoluciones</h3>
          <AppButton v-if="!showEvolutionForm" variant="primary" @click="showEvolutionForm = true">
            Registrar evolución
          </AppButton>
        </div>

        <div v-if="showEvolutionForm" class="patient__form">
          <div class="patient__field">
            <label class="patient__label" for="evo-summary">
              Resumen clínico <span aria-hidden="true" class="patient__required">*</span>
            </label>
            <textarea
              id="evo-summary"
              v-model="evolutionForm.clinical_summary"
              class="patient__textarea"
              rows="4"
              required
            ></textarea>
          </div>
          <div class="patient__field">
            <label class="patient__label" for="evo-status">Estado clínico</label>
            <select id="evo-status" v-model="evolutionForm.status" class="patient__select">
              <option v-for="s in evolutionStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <AppFormField
            v-model="evolutionForm.recorded_at"
            label="Fecha y hora"
            type="datetime-local"
            required
          />
          <p v-if="evolutionError" class="patient__error" role="alert">{{ evolutionError }}</p>
          <div class="patient__form-actions">
            <AppButton variant="secondary" :disabled="savingEvolution" @click="showEvolutionForm = false; resetEvolutionForm()">
              Cancelar
            </AppButton>
            <AppButton variant="primary" :loading="savingEvolution" loading-label="Guardando…" @click="submitEvolution">
              Guardar evolución
            </AppButton>
          </div>
        </div>

        <EmptyState v-if="evolutions.length === 0 && !showEvolutionForm" title="No hay evoluciones registradas" />
        <ol v-else-if="evolutions.length" class="patient__timeline">
          <li v-for="e in evolutions" :key="e.id" class="patient__timeline-item">
            <div class="patient__item-head">
              <StatusBadge :value="e.status" kind="clinical" />
              <span class="patient__meta">{{ formatDateTime(e.recorded_at) }}</span>
            </div>
            <p class="patient__summary-text">{{ e.clinical_summary }}</p>
          </li>
        </ol>
      </section>

      <!-- Treatments -->
      <section v-show="activeTab === 'treatments'" class="vt-card">
        <EmptyState v-if="treatments.length === 0" title="No hay tratamientos" />
        <ul v-else class="patient__list">
          <li v-for="t in treatments" :key="t.id" class="patient__item">
            <div class="patient__item-head">
              <span class="patient__item-title">{{ t.indications }}</span>
              <StatusBadge :value="t.status" kind="clinical" />
            </div>
            <div class="patient__meta">
              Iniciado {{ formatDateTime(t.start_date) }}
              <span v-if="t.end_date"> · finaliza {{ formatDateTime(t.end_date) }}</span>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.patient__back {
  background: none; border: none;
  color: var(--action-secondary);
  font-size: var(--fs-body); font-weight: 600;
  cursor: pointer; margin-bottom: var(--space-5); padding: 0;
}
.patient__header { margin-bottom: var(--space-5); }
.patient__meta-row {
  display: flex; align-items: center; gap: var(--space-3);
  margin-top: var(--space-3); flex-wrap: wrap;
}
.patient__chip {
  font-size: var(--fs-small); font-weight: 600;
  color: var(--color-navy); background: #eef4f8;
  padding: 4px 10px; border-radius: var(--radius-sm);
}
.patient__note {
  margin-top: var(--space-3); font-size: var(--fs-small);
  color: var(--color-dark); opacity: 0.6;
}
.patient__tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-5); flex-wrap: wrap; }
.patient__tab {
  font-family: var(--font-body); font-size: var(--fs-small); font-weight: 600;
  color: var(--color-navy); background: var(--bg-card);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: 40px; padding: 0 var(--space-4); cursor: pointer;
}
.patient__tab--active { background: var(--color-navy); color: var(--text-on-brand); border-color: var(--color-navy); }
.patient__section-title { font-size: var(--fs-featured); color: var(--color-navy); margin-bottom: var(--space-3); }
.patient__trend { margin-bottom: var(--space-5); }
.patient__sparkline { width: 100%; height: 60px; display: block; }
.patient__trend-range { display: flex; justify-content: space-between; font-size: var(--fs-small); color: var(--color-dark); opacity: 0.6; margin-top: var(--space-2); }
.patient__table { width: 100%; border-collapse: collapse; }
.patient__table th {
  text-align: left; font-size: var(--fs-small); font-weight: 600;
  color: var(--color-dark); opacity: 0.7; padding: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}
.patient__table td { padding: var(--space-3); border-bottom: 1px solid var(--border-subtle); font-size: var(--fs-body); }
.patient__table tbody tr:last-child td { border-bottom: none; }
.patient__value { font-weight: 600; color: var(--color-navy); }
.patient__meta { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; }
.patient__list { list-style: none; display: flex; flex-direction: column; gap: var(--space-4); }
.patient__item { padding-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
.patient__item:last-child { border-bottom: none; padding-bottom: 0; }
.patient__item-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.patient__item-title { font-weight: 600; color: var(--color-navy); }
.patient__timeline { list-style: none; display: flex; flex-direction: column; gap: var(--space-5); }
.patient__timeline-item { padding-left: var(--space-4); border-left: 3px solid var(--color-mint); }
.patient__summary-text { margin-top: var(--space-2); color: var(--color-dark); }

.patient__section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); gap: var(--space-3); flex-wrap: wrap; }
.patient__form { margin-bottom: var(--space-5); padding: var(--space-4); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: #fafbfc; }
.patient__field { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
.patient__label { font-size: var(--fs-small); font-weight: 600; }
.patient__required { color: var(--action-secondary); }
.patient__select,
.patient__textarea {
  font-family: var(--font-body); font-size: var(--fs-body);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  padding: var(--space-3); background: var(--bg-card); color: var(--text-primary);
}
.patient__select { min-height: var(--touch-min); padding: 0 var(--space-3); }
.patient__textarea { resize: vertical; }
.patient__error { color: #b3261e; font-size: var(--fs-small); margin-bottom: var(--space-3); }
.patient__form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); }

@media (max-width: 720px) {
  .patient__table thead { display: none; }
  .patient__table,
  .patient__table tbody,
  .patient__table tr,
  .patient__table td { display: block; width: 100%; }
  .patient__table tr {
    margin-bottom: var(--space-3);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }
  .patient__table td { border: none; padding: var(--space-1) 0; }
}
</style>
