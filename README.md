<div align="center">

# 🩺 VitalTrace · App Web

### Frontend de la plataforma de seguimiento clínico continuo

Aplicación web responsiva (SPA) para el **personal de salud y administrativo**. Consume la API de VitalTrace y presenta, según el rol autenticado, los módulos de seguimiento clínico, admisión de pacientes y administración del sistema.

<br>

![Vue](https://img.shields.io/badge/Vue-3.5.35-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-3-FFD859?style=for-the-badge&logo=vuedotjs&logoColor=black)
![Axios](https://img.shields.io/badge/Axios-1-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

![Estado](https://img.shields.io/badge/estado-en_producción-017D84?style=flat-square)
![Tipo](https://img.shields.io/badge/tipo-SPA_responsiva-01305E?style=flat-square)
![API](https://img.shields.io/badge/consume-API_%2Fapi%2Fv1-60CEC8?style=flat-square)
![Equipo](https://img.shields.io/badge/equipo-QuantumMinds-283137?style=flat-square)

</div>

---

## 📑 Tabla de contenido

- [Descripción general](#-descripción-general)
- [Stack tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Autenticación y sesión](#-autenticación-y-sesión)
- [Rutas y áreas por rol](#-rutas-y-áreas-por-rol)
- [Módulos y vistas](#-módulos-y-vistas)
- [Implementaciones destacadas](#-implementaciones-destacadas)
- [Componentes reutilizables](#-componentes-reutilizables)
- [Estado global y servicios](#-estado-global-y-servicios)
- [Identidad visual](#-identidad-visual)
- [Seguridad en el cliente](#-seguridad-en-el-cliente)
- [Instalación](#-instalación)
- [Despliegue](#-despliegue)

---

## 🎯 Descripción general

**VitalTrace** centraliza el seguimiento de pacientes crónicos en un solo expediente. Esta aplicación web es el canal del **equipo de salud**: una SPA en Vue 3 totalmente separada del backend, que consume la API por HTTPS y **nunca accede directamente a la base de datos**.

> 💡 Los **pacientes y familiares** usan la aplicación móvil; esta web está dirigida al **personal de salud y administrativo**. El personal de enfermería dispone además de su propio portal en la API.

La interfaz representa el **proceso real de atención**: el paciente no llega directamente al médico, primero pasa por Admisión, que registra sus datos y los de sus familiares. Cada rol ve únicamente los módulos y acciones que le corresponden.

---

## 🛠 Stack tecnológico

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| **Framework** | Vue (Composition API · `<script setup>`) | `3.5.35` |
| **Build tool** | Vite | `^8` |
| **Ruteo** | Vue Router | `^4` |
| **Estado global** | Pinia | `^3` |
| **Cliente HTTP** | Axios | `^1` |

> 🔒 **Versión fijada:** se usa Vue `3.5.35` estable. No se utiliza Vue 3.6 ni versiones beta.

---

## 🏗 Arquitectura

Arquitectura **modular por dominio**. Los componentes visuales no contienen reglas clínicas complejas; la lógica reutilizable se extrae a *composables*, módulos de API y *stores*. La autoridad definitiva de validación siempre reside en el backend.

```
Vista (Views)  ←  Componentes reutilizables
      │
      ▼
Composables  ·  Stores (Pinia)       ← estado e interacción
      │
      ▼
Services (módulos de API)            ← consumo de endpoints
      │
      ▼  Axios · HTTPS · JSON
   API Laravel (/api/v1)
```

<details open>
<summary><b>📂 Estructura del proyecto</b></summary>

```
src/
├── components/
│   ├── common/      # AppButton, AppFormField, AppPagination, StatusBadge,
│   │                #  ConfirmDialog, ToastContainer, LoadingSkeleton,
│   │                #  EmptyState, ErrorState
│   └── layout/      # AppLayout, AppSidebar, AppTopbar
├── composables/     # useAuth, useSidebar, useIdleTimeout, usePagination
├── modules/
│   ├── auth/        # LoginView, AdminLoginView, ForbiddenView
│   ├── doctor/      # Alerts, Patients, PatientDetail, Appointments
│   ├── admission/   # Patients, PatientForm, Accounts, Assignments,
│   │                #  Appointments, Corrections
│   └── admin/       # Users, Roles, Catalogs, Audit, Config, Professionals
├── services/        # http, auth, doctor, admission, admin
├── stores/          # auth.store, toast.store
├── router/          # rutas + guards por rol
└── utils/           # formValidation, formatters, httpErrors
```

</details>

---

## 🔐 Autenticación y sesión

El cliente Axios (`services/http.js`) **centraliza** la URL base, el envío de cookies, la cabecera CSRF, un interceptor único y la transformación de errores a una forma consistente.

```
1. GET  /sanctum/csrf-cookie     →  obtiene la cookie CSRF
2. POST /auth/login              →  inicia sesión
3. GET  /auth/me                 →  confirma la sesión antes de resolver el login
```

El manejo de respuestas HTTP está estandarizado en toda la aplicación:

| Respuesta | Comportamiento de interfaz |
|:---------:|----------------------------|
| `200` / `201` | Actualiza estado, muestra confirmación y redirige |
| `401` | **Limpia la sesión local y redirige al login** |
| `403` | Muestra pantalla **"Sin permiso"** sin revelar el recurso |
| `409` / `422` | Conflicto de negocio / errores de validación por campo |
| `429` | Indica espera para nuevo intento o reenvío |

---

## 🧭 Rutas y áreas por rol

Cada área vive bajo un *layout* protegido por rol. Los **guards de navegación** exigen sesión en rutas `requiresAuth` y validan el rol declarado en `meta.roles`, redirigiendo a la pantalla de "Sin permiso" cuando no corresponde.

| Área | Ruta base | Menú |
|------|-----------|------|
| **Médico** | `/doctor` | Alertas · Pacientes · Citas |
| **Admisión** | `/admission` | Pacientes · Cuentas · Asignaciones · Citas · Correcciones |
| **Administración** | `/admin` *(ruta reservada)* | Usuarios · Roles · Catálogos · Auditoría · Configuración · Profesionales |

> 🔑 La ruta de administración usa un **path reservado** (variable de entorno) y **no se enlaza desde el login general**.

---

## 📺 Módulos y vistas

<details open>
<summary><b>⚕️ Área Médico</b></summary>

| Vista | Función |
|-------|---------|
| `DoctorAlertsView` / `DoctorAlertDetailView` | Bandeja de alertas: clasificar, escalar y cerrar con historial |
| `DoctorPatientsView` | Pacientes asignados (filtrados por asignación, RN-06) |
| `DoctorPatientDetailView` | Expediente en pestañas: **Mediciones** (con tendencia), **Diagnósticos**, **Evoluciones**, **Tratamientos**, **Rangos** y **Citas**, cada una con su formulario de registro |
| `DoctorAppointmentsView` | Agenda del profesional |

</details>

<details>
<summary><b>📋 Área Admisión</b></summary>

| Vista | Función |
|-------|---------|
| `AdmissionPatientsView` / `PatientFormView` | Listado con búsqueda; alta y edición por pasos |
| `RelativesSection` | Familiares (máx. 2) con correo que dispara la activación |
| `AssignmentsSection` / `AdmissionAssignmentsView` | Equipo profesional por paciente |
| `AdmissionAccountsView` | Cuentas: activación, reenvío de código, bloqueo/desbloqueo |
| `AdmissionAppointmentsView` | Citas para cualquier paciente y profesional |
| `AdmissionCorrectionsView` | **Corrección administrativa directa** con motivo obligatorio |

</details>

<details>
<summary><b>⚙️ Área Administración del sistema</b></summary>

| Vista | Función |
|-------|---------|
| `AdminUsersView` + `UserRolesDialog` | Usuarios, bloqueo y gestión de roles (salvaguarda de auto-bloqueo) |
| `AdminCatalogsView` | **CRUD completo** de especialidades, medicamentos y tipos de medición |
| `AdminProfessionalsView` + `FormView` | Gestión y registro de personal de salud |
| `AdminRolesView` | Roles del sistema y su alcance |
| `AdminAuditView` | Línea de tiempo de auditoría con filtros por usuario, acción, módulo y fecha |
| `AdminConfigView` | Estado del sistema con verificación de salud de la API |

</details>

---

## ⭐ Implementaciones destacadas

### 1️⃣ Evaluación clínica del paciente

El detalle del paciente reúne **toda la evaluación clínica en pestañas**, cada una con su formulario de registro que envía al backend acotado por asignación: mediciones con gráfico de tendencia, diagnósticos, evoluciones, tratamientos con medicamentos dinámicos, rangos clínicos y citas.

### 2️⃣ Flujo de corrección administrativa directa

El módulo de correcciones se rediseñó a un **flujo de mantenimiento presencial**: buscar paciente → consultar datos actuales → editar solo campos autorizados → **motivo obligatorio** → confirmar → guardar, con historial de correcciones del paciente.

### 3️⃣ Panel de auditoría con eventos legibles

El panel de administración presenta la auditoría con **descripciones específicas por tipo de evento**: "Inició sesión en Portal médico", "Accedió a Auditoría", "Actualizó en `users` · registro #1", sin etiquetas vacías. Incluye filtros por usuario, acción, tabla, **módulo/portal** y rango de fechas.

### 4️⃣ Validación y sanitización estricta

El módulo `utils/formValidation.js` aplica **sanitización estricta** en todas las entradas: elimina emojis y caracteres de control, recorta longitudes y valida por tipo de campo (nombre, teléfono, correo, número) con mensajes en español. Los `maxlength` coinciden exactamente con los límites del backend y la base de datos.

### 5️⃣ Sidebar colapsable

Barra lateral que se **oculta con un botón de flecha** junto al logo, manteniendo el logotipo siempre visible arriba a la izquierda. El estado colapsado se recuerda entre recargas (localStorage) y convive con el *drawer* móvil existente.

### 6️⃣ Estados de interfaz consistentes

Todas las vistas manejan de forma uniforme: carga (*skeletons*), ausencia de datos (*empty states*), error con reintento, sesión vencida y falta de permiso — **nunca** una tabla vacía sin contexto.

---

## 🧩 Componentes reutilizables

| Componente | Uso |
|------------|-----|
| `AppButton` | Botón con estado de carga que se deshabilita durante la acción (**evita doble envío**) |
| `AppFormField` | Campo con etiqueta, ayuda, error, `maxlength` y accesibilidad uniforme |
| `AppPagination` | Controles de paginación compartidos entre listados |
| `StatusBadge` | Estado con texto e icono (**no depende solo del color**) |
| `ConfirmDialog` | Confirmación de acciones sensibles |
| `ToastContainer` | Notificaciones temporales de éxito y error |
| `LoadingSkeleton` · `EmptyState` · `ErrorState` | Estados consistentes de carga, ausencia y error |

---

## 🗂 Estado global y servicios

### Stores (Pinia)

| Store | Responsabilidad |
|-------|-----------------|
| `auth.store` | Usuario, sesión, roles, permisos; getters `hasRole`/`hasAnyRole`; login/logout y restauración |
| `toast.store` | Notificaciones temporales (success / error / info) |

### Composables

| Composable | Responsabilidad |
|------------|-----------------|
| `useAuth` | Acceso a la sesión y helpers de rol en componentes |
| `useSidebar` | Estado del menú lateral (colapsar y *drawer* móvil) |
| `useIdleTimeout` | Cierre de sesión por inactividad (15 min) |
| `usePagination` | Paginación cliente reutilizable con ajuste de página al filtrar |

### Servicios de API

Los componentes **no llaman a Axios directamente**; usan módulos de servicio por dominio que envuelven los endpoints y devuelven datos normalizados: `auth.service`, `doctor.service`, `admission.service`, `admin.service`.

---

## 🎨 Identidad visual

Diseño **mobile-first** responsivo siguiendo la identidad oficial de VitalTrace.

<table>
<tr>
<td align="center" bgcolor="#01305E"><br><b style="color:#fff">Navy</b><br><code>#01305E</code><br><br></td>
<td align="center"><br><b>Teal</b><br><code>#017D84</code><br><br></td>
<td align="center"><br><b>Mint</b><br><code>#60CEC8</code><br><br></td>
<td align="center"><br><b>Dark</b><br><code>#283137</code><br><br></td>
<td align="center"><br><b>Surface</b><br><code>#F3F0E9</code><br><br></td>
</tr>
</table>

- **Tipografía:** Sora (títulos) + Public Sans (texto)
- Menú lateral en escritorio y colapsable en pantallas pequeñas
- Tablas convertibles en tarjetas en móvil
- Contraste suficiente, navegación por teclado y foco visible

---

## 🛡️ Seguridad en el cliente

- No se guardan **contraseñas, códigos, tokens ni expedientes completos** en el navegador; se usan cookies seguras administradas por Sanctum.
- Se limpian los *stores* al cerrar sesión o recibir `401`.
- **No se confía solo en ocultar botones**: el backend valida todos los permisos.
- Cierre de sesión por **inactividad** y expiración al cerrar el navegador.
- Ruta de administración **reservada**, no enlazada desde el login.

> ⚖️ La interfaz aplica permisos visuales y validación preliminar, pero **la autoridad definitiva siempre reside en el backend**.

---

## 🚀 Instalación

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/daamaleman/vitaltrace-frontend.git
cd vitaltrace-frontend
npm install

# 2. Configurar entorno
cp .env.example .env
# Editar VITE_API_URL con la URL del backend

# 3. Servir en desarrollo
npm run dev
```

**Requisitos:** Node.js 18+, npm.

---

## 🌐 Despliegue

El frontend se compila con Vite y se publica en **Namecheap** bajo `app.vitaltrace.lat`.

```bash
# Compilación de producción
npm run build

# El contenido de dist/ se publica en el document root del subdominio
```

| Elemento | Configuración |
|----------|---------------|
| **Variable** | `VITE_API_URL` → URL HTTPS del backend |
| **Fallback de rutas** | Redirección a `index.html` (Vue Router en modo *history*) |
| **CORS / cookies** | Dominios *stateful* de Sanctum entre dominio y subdominio |
| **Seguridad** | HTTPS obligatorio |

---

<div align="center">

<br>

**VitalTrace · App Web** · Seguimiento clínico continuo

Desarrollado por **QuantumMinds**

<sub>Prototipo académico · Vue 3.5.35 · Vite · Datos ficticios</sub>

</div>