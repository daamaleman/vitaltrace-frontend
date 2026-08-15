<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Roles y Permisos</h1>
        <p class="text-sm text-gray-600 mt-1">
          Gestión de roles de usuario y control de acceso al sistema clínico.
        </p>
      </div>
    </div>

    <!-- Estado de Carga -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
    </div>

    <!-- Lista de Roles -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="role in roles"
        :key="role.id || role.name"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
      >
        <div>
          <!-- Badge de Nombre del Rol -->
          <div class="flex items-center justify-between mb-3">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
              :class="getRoleBadgeClass(role.name)"
            >
              {{ role.name }}
            </span>
            <span class="text-xs text-gray-400">
              ID: #{{ role.id }}
            </span>
          </div>

          <!-- Descripción -->
          <p class="text-sm text-gray-600 mb-4">
            {{ role.description || getDefaultDescription(role.name) }}
          </p>

          <!-- Permisos asociados (Si el backend devuelve array de permisos) -->
          <div v-if="role.permissions && role.permissions.length > 0" class="mt-4 border-t border-gray-100 pt-3">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
              Permisos del sistema
            </span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="(perm, index) in role.permissions"
                :key="index"
                class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded"
              >
                {{ perm.name || perm }}
              </span>
            </div>
          </div>
          <div v-else class="mt-4 border-t border-gray-100 pt-3">
            <span class="text-xs text-gray-400 italic">
              Permisos estándar asignados según perfil.
            </span>
          </div>
        </div>

        <!-- Pie de tarjeta -->
        <div class="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span class="text-xs font-medium text-teal-700">
            Rol del Sistema
          </span>
          <span class="text-xs text-gray-400">
            Estado: Activo
          </span>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div
      v-if="!loading && roles.length === 0"
      class="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500"
    >
      No se encontraron roles configurados en el sistema.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'

const roles = ref([])
const loading = ref(false)

const loadRoles = async () => {
  loading.value = true
  try {
    const data = await adminService.roles()
    roles.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error al cargar la lista de roles:', error)
    roles.value = []
  } finally {
    loading.value = false
  }
}

// Colores visuales dinámicos según el tipo de rol
const getRoleBadgeClass = (roleName = '') => {
  const name = roleName.toUpperCase()
  if (name.includes('ADMIN')) {
    return 'bg-purple-100 text-purple-800'
  }
  if (name.includes('DOCTOR') || name.includes('MD')) {
    return 'bg-teal-100 text-teal-800'
  }
  if (name.includes('ADMISSION') || name.includes('NURSE')) {
    return 'bg-blue-100 text-blue-800'
  }
  if (name.includes('PATIENT')) {
    return 'bg-emerald-100 text-emerald-800'
  }
  return 'bg-gray-100 text-gray-800'
}

// Descripciones por defecto en caso de que la tabla roles solo tenga 'name'
const getDefaultDescription = (roleName = '') => {
  const name = roleName.toUpperCase()
  if (name.includes('ADMIN')) {
    return 'Acceso total al panel de administración, auditoría, usuarios y catálogos.'
  }
  if (name.includes('DOCTOR')) {
    return 'Acceso a expedientes clínicos asignados, evolución, diagnósticos y alertas de signos vitales.'
  }
  if (name.includes('ADMISSION')) {
    return 'Gestión administrativa de admisiones, registro de pacientes y activación de cuentas.'
  }
  if (name.includes('PATIENT')) {
    return 'Acceso al portal del paciente para consulta de historial propio y mediciones.'
  }
  return 'Rol de usuario dentro de la plataforma VitalTrace.'
}

onMounted(() => {
  loadRoles()
})
</script>