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
  { value: 'ranges', label: 'Rangos' },
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

// Catálogos (hardcoded para la demo)
const measurementTypes = [
  { value: 1, label: 'Presión sistólica' },
  { value: 2, label: 'Glucosa en sangre' },
  { value: 3, label: 'Saturación de oxígeno' },
]
const medicationCatalog = [
  { value: 1, label: 'Losartán' },
  { value: 2, label: 'Metformina' },
  { value: 3, label: 'Amlodipino' },
  { value: 4, label: 'Insulina glargina' },
  { value: 5, label: 'Atorvastatina' },
]
const diagnosisStatuses = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'RESOLVED', label: 'Resuelto' },
  { value: 'UNDER_REVIEW', label: 'En revisión' },
]
const severities = [
  { value: 'INFORMATIONAL', label: 'Informativa' },
  { value: 'MODERATE', label: 'Moderada' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' },
]
const treatmentStatuses = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'FINISHED', label: 'Finalizado' },
  { value: 'SUSPENDED', label: 'Suspendido' },
]

// --- Diagnóstico ---
const showDiagnosisForm = ref(false)
const savingDiagnosis = ref(false)
const diagnosisError = ref('')
const diagnosisForm = reactive({ cie_code: '', description: '', diagnosis_date: '', status: 'ACTIVE' })
function resetDiagnosisForm() { Object.assign(diagnosisForm, { cie_code: '', description: '', diagnosis_date: '', status: 'ACTIVE' }); diagnosisError.value = '' }
async function submitDiagnosis() {
  savingDiagnosis.value = true; diagnosisError.value = ''
  try {
    await doctorService.addDiagnosis(route.params.id, { ...diagnosisForm })
    showDiagnosisForm.value = false; resetDiagnosisForm(); await loadSummary()
    toast.success('Diagnóstico registrado correctamente.')
  } catch (err) { diagnosisError.value = mapHttpError(err); toast.error('No se pudo registrar el diagnóstico.') }
  finally { savingDiagnosis.value = false }
}

// --- Rango clínico ---
const showRangeForm = ref(false)
const savingRange = ref(false)
const rangeError = ref('')
const rangeForm = reactive({ measurement_type_id: 1, min_value: '', max_value: '', severity: 'MODERATE', start_date: '' })
function resetRangeForm() { Object.assign(rangeForm, { measurement_type_id: 1, min_value: '', max_value: '', severity: 'MODERATE', start_date: '' }); rangeError.value = '' }
async function submitRange() {
  savingRange.value = true; rangeError.value = ''
  try {
    await doctorService.addRange(route.params.id, { ...rangeForm })
    showRangeForm.value = false; resetRangeForm(); await loadSummary()
    toast.success('Rango clínico registrado correctamente.')
  } catch (err) { rangeError.value = mapHttpError(err); toast.error('No se pudo registrar el rango.') }
  finally { savingRange.value = false }
}

// --- Tratamiento ---
const showTreatmentForm = ref(false)
const savingTreatment = ref(false)
const treatmentError = ref('')
const treatmentForm = reactive({ indications: '', start_date: '', status: 'ACTIVE', medications: [] })
function addMedRow() { treatmentForm.medications.push({ medication_id: 1, dose: '', route: 'Oral', frequency: '' }) }
function removeMedRow(i) { treatmentForm.medications.splice(i, 1) }
function resetTreatmentForm() { Object.assign(treatmentForm, { indications: '', start_date: '', status: 'ACTIVE', medications: [] }); treatmentError.value = '' }
async function submitTreatment() {
  savingTreatment.value = true; treatmentError.value = ''
  try {
    await doctorService.addTreatment(route.params.id, { ...treatmentForm })
    showTreatmentForm.value = false; resetTreatmentForm(); await loadSummary()
    toast.success('Tratamiento registrado correctamente.')
  } catch (err) { treatmentError.value = mapHttpError(err); toast.error('No se pudo registrar el tratamiento.') }
  finally { savingTreatment.value = false }
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
        <div class="patient__section-head">
          <h3 class="patient__section-title">Diagnósticos</h3>
          <AppButton v-if="!showDiagnosisForm" variant="primary" @click="showDiagnosisForm = true">Registrar diagnóstico</AppButton>
        </div>
        <div v-if="showDiagnosisForm" class="patient__form">
          <AppFormField v-model="diagnosisForm.cie_code" label="Código CIE (opcional)" />
          <div class="patient__field">
            <label class="patient__label" for="diag-desc">
              Descripción <span aria-hidden="true" class="patient__required">*</span>
            </label>
            <textarea id="diag-desc" v-model="diagnosisForm.description" class="patient__textarea" rows="3" required></textarea>
          </div>
          <AppFormField v-model="diagnosisForm.diagnosis_date" label="Fecha de diagnóstico" type="date" required />
          <div class="patient__field">
            <label class="patient__label" for="diag-status">Estado</label>
            <select id="diag-status" v-model="diagnosisForm.status" class="patient__select">
              <option v-for="s in diagnosisStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <p v-if="diagnosisError" class="patient__error" role="alert">{{ diagnosisError }}</p>
          <div class="patient__form-actions">
            <AppButton variant="secondary" :disabled="savingDiagnosis" @click="showDiagnosisForm = false; resetDiagnosisForm()">Cancelar</AppButton>
            <AppButton variant="primary" :loading="savingDiagnosis" loading-label="Guardando…" @click="submitDiagnosis">Guardar</AppButton>
          </div>
        </div>
        <EmptyState v-if="diagnoses.length === 0 && !showDiagnosisForm" title="No hay diagnósticos" />
        <ul v-else-if="diagnoses.length" class="patient__list">
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
        <div class="patient__section-head">
          <h3 class="patient__section-title">Tratamientos</h3>
          <AppButton v-if="!showTreatmentForm" variant="primary" @click="showTreatmentForm = true">Registrar tratamiento</AppButton>
        </div>
        <div v-if="showTreatmentForm" class="patient__form">
          <div class="patient__field">
            <label class="patient__label" for="treat-indications">
              Indicaciones <span aria-hidden="true" class="patient__required">*</span>
            </label>
            <textarea id="treat-indications" v-model="treatmentForm.indications" class="patient__textarea" rows="3" required></textarea>
          </div>
          <AppFormField v-model="treatmentForm.start_date" label="Fecha de inicio" type="date" required />
          <div class="patient__field">
            <label class="patient__label" for="treat-status">Estado</label>
            <select id="treat-status" v-model="treatmentForm.status" class="patient__select">
              <option v-for="s in treatmentStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <div class="patient__meds">
            <div class="patient__meds-head">
              <span class="patient__label">Medicamentos</span>
              <button type="button" class="patient__add-med" @click="addMedRow">+ Agregar</button>
            </div>
            <div v-for="(med, i) in treatmentForm.medications" :key="i" class="patient__med-row">
              <select v-model="med.medication_id" class="patient__select">
                <option v-for="m in medicationCatalog" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
              <input v-model="med.dose" placeholder="Dosis" class="patient__med-input" />
              <input v-model="med.route" placeholder="Vía" class="patient__med-input" />
              <input v-model="med.frequency" placeholder="Frecuencia" class="patient__med-input" />
              <button type="button" class="patient__remove-med" @click="removeMedRow(i)">×</button>
            </div>
          </div>
          <p v-if="treatmentError" class="patient__error" role="alert">{{ treatmentError }}</p>
          <div class="patient__form-actions">
            <AppButton variant="secondary" :disabled="savingTreatment" @click="showTreatmentForm = false; resetTreatmentForm()">Cancelar</AppButton>
            <AppButton variant="primary" :loading="savingTreatment" loading-label="Guardando…" @click="submitTreatment">Guardar</AppButton>
          </div>
        </div>
        <EmptyState v-if="treatments.length === 0 && !showTreatmentForm" title="No hay tratamientos" />
        <ul v-else-if="treatments.length" class="patient__list">
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

      <!-- Ranges -->
      <section v-show="activeTab === 'ranges'" class="vt-card">
        <div class="patient__section-head">
          <h3 class="patient__section-title">Rangos clínicos</h3>
          <AppButton v-if="!showRangeForm" variant="primary" @click="showRangeForm = true">Definir rango</AppButton>
        </div>
        <div v-if="showRangeForm" class="patient__form">
          <div class="patient__field">
            <label class="patient__label" for="range-type">Tipo de medición</label>
            <select id="range-type" v-model="rangeForm.measurement_type_id" class="patient__select">
              <option v-for="t in measurementTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <AppFormField v-model="rangeForm.min_value" label="Valor mínimo" type="number" />
          <AppFormField v-model="rangeForm.max_value" label="Valor máximo" type="number" />
          <div class="patient__field">
            <label class="patient__label" for="range-sev">Severidad</label>
            <select id="range-sev" v-model="rangeForm.severity" class="patient__select">
              <option v-for="s in severities" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <AppFormField v-model="rangeForm.start_date" label="Fecha de inicio" type="date" required />
          <p v-if="rangeError" class="patient__error" role="alert">{{ rangeError }}</p>
          <div class="patient__form-actions">
            <AppButton variant="secondary" :disabled="savingRange" @click="showRangeForm = false; resetRangeForm()">Cancelar</AppButton>
            <AppButton variant="primary" :loading="savingRange" loading-label="Guardando…" @click="submitRange">Guardar</AppButton>
          </div>
        </div>
        <EmptyState v-if="!showRangeForm" title="Define rangos para generar alertas automáticas" />
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

.patient__meds { margin-bottom: var(--space-4); }
.patient__meds-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
.patient__add-med { background: none; border: 1px solid var(--color-teal); color: var(--color-teal); border-radius: var(--radius-md); padding: 4px 10px; font-weight: 600; cursor: pointer; font-size: var(--fs-small); }
.patient__med-row { display: flex; gap: var(--space-2); margin-bottom: var(--space-2); align-items: center; }
.patient__med-input { flex: 1; min-width: 0; font-family: var(--font-body); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); min-height: 38px; padding: 0 var(--space-2); }
.patient__remove-med { background: none; border: none; color: #b3261e; font-size: 20px; line-height: 1; cursor: pointer; padding: 0 var(--space-2); flex-shrink: 0; }

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
  .patient__med-row { flex-wrap: wrap; }
  .patient__med-row .patient__select,
  .patient__med-input { flex: 1 1 100%; }
}
</style>
