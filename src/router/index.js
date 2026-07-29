import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guards'

/**
 * Secret admin path from the environment (§6.2).
 * Not linked anywhere; only reachable by typing the URL.
 */
const adminPath = import.meta.env.VITE_ADMIN_PATH

const routes = [
  // Public authentication.
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/LoginView.vue'),
  },

  // Reserved admin login (secret path).
  {
    path: `/${adminPath}`,
    name: 'admin-login',
    component: () => import('@/modules/auth/AdminLoginView.vue'),
  },

  // Doctor area.
  {
    path: '/doctor',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true, roles: ['DOCTOR'] },
    children: [
      { path: '', redirect: { name: 'doctor-alerts' } },
      {
        path: 'alerts',
        name: 'doctor-alerts',
        component: () => import('@/modules/doctor/DoctorAlertsView.vue'),
      },
      {
        path: 'alerts/:id',
        name: 'doctor-alert-detail',
        component: () => import('@/modules/doctor/DoctorAlertDetailView.vue'),
      },
      {
        path: 'patients',
        name: 'doctor-patients',
        component: () => import('@/modules/doctor/DoctorPatientsView.vue'),
      },
      {
        path: 'patients/:id',
        name: 'doctor-patient-detail',
        component: () => import('@/modules/doctor/DoctorPatientDetailView.vue'),
      },
      {
        path: 'appointments',
        name: 'doctor-appointments',
        component: () => import('@/modules/doctor/DoctorAppointmentsView.vue'),
      },
    ],
  },

  // Admission area.
  {
    path: '/admission',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true, roles: ['ADMISSION'] },
    children: [
      { path: '', redirect: { name: 'admission-patients' } },
      {
        path: 'patients',
        name: 'admission-patients',
        component: () => import('@/modules/admission/AdmissionPatientsView.vue'),
      },
      {
        path: 'patients/new',
        name: 'admission-patient-new',
        component: () => import('@/modules/admission/AdmissionPatientFormView.vue'),
      },
      {
        path: 'accounts',
        name: 'admission-accounts',
        component: () => import('@/modules/admission/AdmissionAccountsView.vue'),
      },
      {
        path: 'assignments',
        name: 'admission-assignments',
        component: () => import('@/modules/admission/AdmissionAssignmentsView.vue'),
      },
      {
        path: 'corrections',
        name: 'admission-corrections',
        component: () => import('@/modules/admission/AdmissionCorrectionsView.vue'),
      },
    ],
  },

  // Admin area (reachable only after the reserved login).
  {
    path: '/admin',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true, roles: ['SYSTEM_ADMIN'] },
    children: [
      { path: '', redirect: { name: 'admin-users' } },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/modules/admin/AdminUsersView.vue'),
      },
      {
        path: 'roles',
        name: 'admin-roles',
        component: () => import('@/modules/admin/AdminRolesView.vue'),
      },
      {
        path: 'catalogs',
        name: 'admin-catalogs',
        component: () => import('@/modules/admin/AdminCatalogsView.vue'),
      },
      {
        path: 'audit',
        name: 'admin-audit',
        component: () => import('@/modules/admin/AdminAuditView.vue'),
      },
      {
        path: 'config',
        name: 'admin-config',
        component: () => import('@/modules/admin/AdminConfigView.vue'),
      },
    ],
  },

  // Forbidden (403) landing without resource details (§12).
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/modules/auth/ForbiddenView.vue'),
  },

  // Default and catch-all redirect to login.
  { path: '/', redirect: { name: 'login' } },
  { path: '/:pathMatch(.*)*', redirect: { name: 'login' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(authGuard)

export default router
