<script setup>
/**
 * Professional assignments for a patient (§8.4).
 * Shows the care team, allows assigning doctors/nurses and finishing
 * assignments. Enforces a single active primary doctor (backend-guarded).
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { admissionService } from '@/services/admission.service'
import { mapHttpError } from '@/utils/httpErrors'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  patientId: { type: [String, Number], required: true },
})

const assignments = ref([])
const staff = ref([])
const loading = ref(false)
const error = ref('')
const showForm = ref(false)
const saving = ref(false)
const formError = ref('')

const form = reactive({
  health_staff_id: '',
  assignment_type: 'PRIMARY_DOCTOR',
})

const typeOptions = [
  { value: 'PRIMARY_DOCTOR', label: 'Médico principal' },
  { value: 'SECONDARY_DOCTOR', label: 'Médico secundario' },
  { value: 'NURSE', label: 'Enfermería' },
]

const hasActivePrimary = computed(() =>
  assignments.value.some(
    (a) => a.assignment_type === 'PRIMARY_DOCTOR' && a.status === 'ACTIVE',
  ),
)

function staffName(assignment) {
  const p = assignment.health_staff?.person
  if (!p) return 'Desconocido'
  return `${p.first_name} ${p.first_last_name}`
}

function typeLabel(type) {
  return typeOptions.find((o) => o.value === type)?.label ?? type
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [assignmentsData, staffData] = await Promise.all([
      admissionService.patientAssignments(props.patientId),
      admissionService.availableStaff(),
    ])
    assignments.value = assignmentsData
    staff.value = staffData
  } catch (err) {
    error.value = mapHttpError(err)
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!form.health_staff_id) {
    formError.value = 'Selecciona un profesional.'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    await admissionService.createAssignment(props.patientId, {
      health_staff_id: Number(form.health_staff_id),
      assignment_type: form.assignment_type,
    })
    showForm.value = false
    form.health_staff_id = ''
    form.assignment_type = 'PRIMARY_DOCTOR'
    await load()
  } catch (err) {
    formError.value = mapHttpError(err)
  } finally {
    saving.value = false
  }
}

async function finish(assignmentId) {
  try {
    await admissionService.finishAssignment(assignmentId)
    await load()
  } catch (err) {
    error.value = mapHttpError(err)
  }
}

onMounted(load)
</script>

<template>
  <div class="asg vt-card">
    <div class="asg__header">
      <h3 class="asg__title">Equipo de atención</h3>
      <button v-if="!showForm" type="button" class="vt-btn-secondary" @click="showForm = true">
        + Asignar profesional
      </button>
    </div>

    <div v-if="loading" class="asg__loading">Cargando…</div>
    <p v-else-if="error" class="asg__error">{{ error }}</p>

    <ul v-else-if="assignments.length" class="asg__list">
      <li v-for="a in assignments" :key="a.id" class="asg__item">
        <div class="asg__info">
          <span class="asg__name">{{ staffName(a) }}</span>
          <span class="asg__type">{{ typeLabel(a.assignment_type) }}</span>
        </div>
        <StatusBadge :value="a.status" kind="clinical" />
        <button
          v-if="a.status === 'ACTIVE'"
          type="button"
          class="asg__finish"
          @click="finish(a.id)"
        >
          Finalizar
        </button>
      </li>
    </ul>

    <p v-else class="asg__empty">Aún no hay profesionales asignados.</p>

    <!-- Assign form -->
    <div v-if="showForm" class="asg__form">
      <h4 class="asg__form-title">Asignar profesional</h4>
      <div class="asg__grid">
        <div class="asg__field">
          <label class="asg__label" for="asg-staff">Profesional</label>
          <select id="asg-staff" v-model="form.health_staff_id" class="asg__select">
            <option value="">Seleccionar…</option>
            <option v-for="s in staff" :key="s.id" :value="s.id">
              {{ s.person?.first_name }} {{ s.person?.first_last_name }} ({{ s.professional_type }})
            </option>
          </select>
        </div>
        <div class="asg__field">
          <label class="asg__label" for="asg-type">Tipo de asignación</label>
          <select id="asg-type" v-model="form.assignment_type" class="asg__select">
            <option
              v-for="o in typeOptions"
              :key="o.value"
              :value="o.value"
              :disabled="o.value === 'PRIMARY_DOCTOR' && hasActivePrimary"
            >
              {{ o.label }}{{ o.value === 'PRIMARY_DOCTOR' && hasActivePrimary ? ' (ya asignado)' : '' }}
            </option>
          </select>
        </div>
      </div>

      <p v-if="formError" class="asg__form-error" role="alert">{{ formError }}</p>

      <div class="asg__form-actions">
        <button type="button" class="vt-btn-secondary" @click="showForm = false; formError = ''">Cancelar</button>
        <button type="button" class="vt-btn-primary" :disabled="saving" @click="submit">
          {{ saving ? 'Asignando…' : 'Asignar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.asg { margin-top: var(--space-5); }
.asg__header { display: flex; justify-content: space-between; align-items: center; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
.asg__title { font-size: var(--fs-featured); color: var(--color-navy); }
.asg__loading, .asg__empty { color: var(--color-dark); opacity: 0.6; font-size: var(--fs-small); padding: var(--space-3) 0; }
.asg__error, .asg__form-error { color: #b3261e; font-size: var(--fs-small); margin: var(--space-2) 0; }
.asg__list { list-style: none; display: flex; flex-direction: column; gap: var(--space-3); }
.asg__item { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
.asg__info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.asg__name { font-weight: 600; color: var(--color-navy); }
.asg__type { font-size: var(--fs-small); color: var(--color-dark); opacity: 0.7; }
.asg__finish {
  font-family: var(--font-body); font-size: var(--fs-small); font-weight: 600;
  color: var(--color-teal); background: transparent; border: 1px solid var(--color-teal);
  border-radius: var(--radius-md); min-height: 34px; padding: 0 var(--space-3); cursor: pointer;
}
.asg__form { margin-top: var(--space-5); padding-top: var(--space-5); border-top: 1px solid var(--border-subtle); }
.asg__form-title { font-size: var(--fs-body); font-weight: 600; color: var(--color-navy); margin-bottom: var(--space-4); }
.asg__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4); }
.asg__field { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
.asg__label { font-size: var(--fs-small); font-weight: 600; }
.asg__select {
  font-family: var(--font-body); font-size: var(--fs-body);
  border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
  min-height: var(--touch-min); padding: 0 var(--space-3); background: var(--bg-card);
}
.asg__form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
</style>
