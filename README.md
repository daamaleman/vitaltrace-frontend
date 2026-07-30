<div align="center">

# 🩺 VITALTRACE WEB
### Plataforma Web Responsiva de Seguimiento Clínico Continuo

<p align="center">
  <b>Frontend en Vue 3 &nbsp;·&nbsp; Backend API REST en Laravel 10.50.2 &nbsp;·&nbsp; Base de Datos Normalizada en 3FN</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white" alt="Vue 3">
  <img src="https://img.shields.io/badge/Laravel-10.50.2-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 10">
  <img src="https://img.shields.io/badge/PHP-8.1+-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP 8.1+">
  <img src="https://img.shields.io/badge/MySQL-00758F?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Auth-Laravel%20Sanctum-3B82F6?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel Sanctum">
  <img src="https://img.shields.io/badge/Deploy-Namecheap-DE3723?style=for-the-badge&logo=namecheap&logoColor=white" alt="Namecheap">
</p>

---

</div>

## 📌 1. Resumen Ejecutivo & Visión del Sistema

**VitalTrace Web** es la interfaz profesional y administrativa del ecosistema **VitalTrace**, una plataforma diseñada para el seguimiento clínico integral de pacientes con enfermedades crónicas, discapacidad o condiciones médicas que requieren controles frecuentes. 

El sistema implementa una **arquitectura estrictamente desacoplada**:
* **Backend (`Laravel 10.50.2`)**: Actúa como API REST de primera parte, centralizando las reglas de negocio, la seguridad, la persistencia en base de datos relacional normalizada y la auditoría técnica de accesos.
* **Frontend (`Vue 3`)**: Aplicación web responsiva de página única (SPA) modularizada con *Composition API* y *Vite*, que ofrece una experiencia visual limpia, minimalista y optimizada para el entorno clínico.

> [!IMPORTANT]
> **Decisión Arquitectónica de Delimitación de Accesos:**
> * El **login web público** está restringido exclusivamente a los roles de **Médico** y **Admisión**.
> * El **Paciente** no dispone de acceso a la interfaz web; interactúa con el sistema **únicamente mediante la aplicación móvil**.
> * El **Administrador del Sistema** no está expuesto en el login público; ingresa mediante una **ruta o comando administrativo reservado y protegido**.

---

## 🔐 2. Delimitación de Accesos y Responsabilidades por Rol

La plataforma delimita los alcances para garantizar la integridad clínica y administrativa del expediente del paciente:

<table width="100%">
  <thead>
    <tr align="left">
      <th width="18%">Rol</th>
      <th width="18%">Vía de Ingreso</th>
      <th width="32%">Responsabilidades & Permisos</th>
      <th width="32%">Restricciones Estrictas</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>👨‍⚕️ Médico</b></td>
      <td><code>/login</code><br><i>(Selector Web)</i></td>
      <td>
        <ul>
          <li>Consultar expediente de pacientes con asignación profesional vigente.</li>
          <li>Registrar diagnósticos, tratamientos, prescripciones y rangos clínicos.</li>
          <li>Revisar mediciones, tendencias, evoluciones clínicas y gestionar citas.</li>
          <li>Clasificar, atender y cerrar alertas clínicas.</li>
        </ul>
      </td>
      <td>
        <ul>
          <li>No puede crear pacientes, familiares ni modificar datos administrativos de ingreso.</li>
          <li>No se puede asignar pacientes a sí mismo.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><b>🏢 Admisión</b></td>
      <td><code>/login</code><br><i>(Selector Web)</i></td>
      <td>
        <ul>
          <li>Registrar pacientes, generar número de expediente y datos de contacto.</li>
          <li>Registrar hasta dos (2) familiares por paciente y vincular parentesco.</li>
          <li>Asignar médicos y enfermeros (con vigencia y motivo).</li>
          <li>Crear cuentas pendientes y gestionar solicitudes de corrección.</li>
        </ul>
      </td>
      <td>
        <ul>
          <li>No puede registrar diagnósticos, prescripciones, evoluciones ni cerrar alertas.</li>
          <li>No tiene acceso a los paneles técnicos de administración.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><b>⚙️ Administrador del Sistema</b></td>
      <td><i>Ruta o comando administrativo reservado</i></td>
      <td>
        <ul>
          <li>Gestionar usuarios, roles, permisos y configuración global.</li>
          <li>Supervisar auditoría, logs técnicos, respaldos e integraciones.</li>
          <li>Administrar catálogos del sistema.</li>
        </ul>
      </td>
      <td>
        <ul>
          <li><b>No recibe acceso clínico automático</b> al expediente del paciente ni interviene en información clínica.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><b>📱 Paciente / Familiar</b></td>
      <td><i>App Móvil</i><br><i>(Sin acceso Web)</i></td>
      <td>
        <ul>
          <li>El paciente consulta su historial, confirma medicación y solicita correcciones administrativas.</li>
          <li>Hasta 2 familiares con acceso autorizado según el alcance determinado por el paciente.</li>
        </ul>
      </td>
      <td>
        <ul>
          <li>Excluidos del portal web VitalTrace Web.</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

---

## 🏗️ 3. Arquitectura de la Solución & Stack Tecnológico

```
 +---------------------------------------------------------------------------------+
 |                           VITALTRACE WEB (SPA - VUE 3)                          |
 |                                                                                 |
 |  [ Layout & Navbar ]  ->  [ Módulo Médico ]  [ Módulo Admisión ]  [ Módulo Admin ]|
 +---------------------------------------------------------------------------------+
                                         |
                                         |  HTTPS / JSON API (/api/v1)
                                         |  Cookies Secure (Sanctum)
                                         v
 +---------------------------------------------------------------------------------+
 |                    BACKEND API REST (LARAVEL 10.50.2 / PHP 8.1+)                |
 |                                                                                 |
 |  [ Routes & Middleware ] -> [ Form Requests & Validators ] -> [ Auth Sanctum ]  |
 |  [ Controllers / Services ] -> [ Policies & Gates ] -> [ Events & Queues ]     |
 +---------------------------------------------------------------------------------+
                                         |
                                         |  Query Builder & Eloquent (InnoDB 3FN)
                                         v
 +---------------------------------------------------------------------------------+
 |                        BASE DE DATOS (MYSQL / MARIADB)                          |
 |       29 Tablas Funcionales · Índices Compuestos · Soft Deletes · Triggers      |
 +---------------------------------------------------------------------------------+
```

### 🔹 Componentes del Backend (Laravel 10.50.2)
* **API REST Versionada (`/api/v1`)**: Exposición de endpoints limpios en formato JSON con convenciones HTTP uniformes (`200`, `201`, `401`, `403`, `404`, `409`, `422`, `500`).
* **Autenticación SPA (Laravel Sanctum)**: Gestión de sesiones mediante cookies `HttpOnly`, `Secure` y `SameSite`, con protección CSRF en mutaciones de datos y reautenticación para operaciones sensibles.
* **Capa de Lógica Desacoplada**: Implementación mediante *Services*, *Form Requests* para validaciones robustas y *Policies/Gates* orientados a rol y relación profesional vigente.
* **Procesamiento Asíncrono**: Colas (*Queues/Jobs*) para el envío programado de códigos de activación, notificaciones de recordatorio y limpieza técnica sin bloquear el hilo clínico.

### 🔹 Componentes del Frontend (Vue 3)
* **Single Page Application (SPA)**: Construida con *Vue 3 Composition API* y empaquetada con *Vite*.
* **Gestión de Estado & Enrutamiento**: Manejo global de perfil, permisos y sesión con *Pinia* y *Vue Router* protegido por guardas de rol.
* **Sistema de Diseño Clínico**: Paleta visual coherente (azul marino `#0A2540`, turquesa `#00D4B2`, beige fondo `#F8F6F0` y blanco blanco `#FFFFFF`), centrada en tablas optimizadas, tarjetas de resumen, y modales minimalistas.

---

## 🛠️ 4. Módulos Funcionales de la Interfaz Web

<div align="center">

| Módulo | Sección Web | Funcionalidad Principal |
| :--- | :--- | :--- |
| **🩺 Médico** | **Alertas de Revisión** | Visualización Kanban/Tabla de mediciones pendientes, en revisión y revisadas, con filtrado rápido por severidad (`CRITICA`, `ALTA`, `MODERADA`). |
| | **Pacientes Asignados** | Listado de expedientes con asignación vigente, indicador de última actividad, signo vital más reciente y próxima cita. |
| | **Seguimiento Clínico** | Registro de evoluciones clínicas, diagnósticos (CIE), tratamientos, medicamentos y configuración de rangos clínicos. |
| | **Agenda de Citas** | Calendario de citas del día y programadas, con detalle de duración y motivo. |
| **🏢 Admisión** | **Registro de Pacientes** | Ingreso de datos personales (`personas`), creación de número institucional y registro del contacto de emergencia. |
| | **Gestión de Familiares** | Alta y vinculación de hasta dos (2) familiares activos con su parentesco y generación de cuentas de acceso. |
| | **Cuentas & Activación** | Generación de cuentas pendientes de verificación, reenvío controlado de códigos de activación e invalidación por vencimiento. |
| | **Asignación Profesional** | Vinculación del médico principal/secundario y enfermero hacia el paciente con trazabilidad de fechas y motivo. |
| | **Correcciones** | Panel de revisión de solicitudes de modificación de datos administrativos enviadas por pacientes. |
| **⚙️ Admin** | **Acceso Reservado** | Panel técnico de gestión de usuarios, roles, permisos, catálogos, auditoría inmutable, respaldos e integraciones. |

</div>

---

## 🔑 5. Flujo de Activación y Seguridad por Correo

El proceso de alta no utiliza PIN entregado manualmente en físico; opera bajo un ciclo seguro de activación por correo electrónico:

```
[Admisión crea cuenta PENDIENTE] ──> [Laravel genera Código 6 dígitos] ──> [Hash guardado en BD]
                                                                                │
[Usuario ingresa en App / Web]  <──  [Código enviado por Correo SMTP]  <────────┘
               │
               ├──> Validaciones: Expiración (24h) · Intentos (máx 5) · Un solo uso
               │
               v
[Usuario define Contraseña Segura] ──> [Email verificado & Cuenta ACTIVA]
```

* **Vigencia Inicial**: 24 horas continuas desde la emisión del código.
* **Seguridad de Hash**: Los códigos numéricos de 6 dígitos se guardan en hash; nunca se registran en texto plano en logs ni bases de datos.
* **Auditoría de Activación**: Registro inmutable de IP, usuario, intentos y hora de verificación sin revelar el secreto transaccional.

---

## 📡 6. Contrato de API Interna (`/api/v1`) & Rutas Frontend

<details>
<summary><b>📋 Ver Tabla de Endpoints API REST (Laravel)</b></summary>

<br>

| Módulo | HTTP | Endpoint | Descripción |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | Iniciar sesión y obtener cookie Sanctum. |
| | `POST` | `/api/v1/auth/activar-cuenta` | Verificar código de 6 dígitos y activar cuenta. |
| | `POST` | `/api/v1/auth/logout` | Revocar sesión activa. |
| **Admisión** | `GET/POST` | `/api/v1/admision/pacientes` | Consultar catálogo o registrar nuevo paciente. |
| | `POST` | `/api/v1/admision/pacientes/{id}/familiares` | Registrar y asociar familiar autorizado. |
| | `POST` | `/api/v1/admision/pacientes/{id}/asignaciones` | Asignar personal de salud con motivo. |
| **Médico** | `GET` | `/api/v1/clinica/pacientes` | Obtener pacientes con asignación profesional vigente. |
| | `POST` | `/api/v1/diagnosticos` | Registrar nuevo diagnóstico médico. |
| | `POST` | `/api/v1/tratamientos` | Prescribir o modificar plan de tratamiento. |
| | `POST` | `/api/v1/evoluciones` | Crear nota de evolución clínica. |
| **Alertas** | `GET` | `/api/v1/alertas` | Listar alertas pendientes del profesional. |
| | `POST` | `/api/v1/alertas/{id}/cerrar` | Documentar revisión y cerrar alerta. |
| **Admin** | `GET` | `/api/v1/admin/auditoria` | Consultar bitácora inmutable de auditoría. |

</details>

<details>
<summary><b>🧭 Ver Rutas y Guardas del Frontend (Vue Router)</b></summary>

<br>

| Ruta Web | Rol Requerido | Vista / Componente Vue |
| :--- | :--- | :--- |
| `/login` | Público | `LoginView.vue` *(Selector Médico / Admisión)* |
| `/doctor/alertas` | Médico | `DoctorAlertsView.vue` *(Gestión de alertas de revisión)* |
| `/doctor/pacientes` | Médico | `DoctorPatientsView.vue` *(Listado de expedientes asignados)* |
| `/doctor/pacientes/:id` | Médico | `DoctorPatientDetailView.vue` *(Expediente clínico)* |
| `/doctor/citas` | Médico | `DoctorAppointmentsView.vue` *(Agenda y citas)* |
| `/admision/pacientes` | Admisión | `AdmissionPatientsView.vue` *(Administración de pacientes)* |
| `/admision/pacientes/nuevo` | Admisión | `AdmissionPatientCreateView.vue` *(Formulario de ingreso)* |
| `/admision/familiares` | Admisión | `AdmissionRelativesView.vue` *(Gestión de familiares)* |
| `/admision/asignaciones` | Admisión | `AdmissionAssignmentsView.vue` *(Asignación de personal)* |
| `/admision/correcciones` | Admisión | `AdmissionCorrectionsView.vue` *(Solicitudes de modificación)* |
| `/admin/panel-reservado` | Admin | `AdminDashboardView.vue` *(Ruta reservada protegida)* |

</details>

---

## 💾 7. Estructura de Base de Datos Normalizada (3FN - MySQL/MariaDB)

La persistencia de **VitalTrace** opera con **29 tablas funcionales** en Tercera Forma Normal (3FN), utilizando los enums del motor para catálogos controlados y optimizando el almacenamiento:

```
[personas] (1) <──> (1) [usuarios] (1) <──> (N) [activaciones_cuenta]
    │                     │
    ├── (1) [pacientes]   ├── (N) [usuario_rol] (N) <──> (1) [roles]
    ├── (1) [familiares]  └── (N) [auditoria_logs]
    └── (1) [personal_salud] (1) <──> (N) [asignaciones_profesionales]
```

* **Regla de Edad**: La columna `edad` no se almacena físicamente en la tabla; se calcula de forma dinámica a partir de `fecha_nacimiento`.
* **Límite de Familiares**: Control transaccional en la relación `paciente_familiar` que limita a un **máximo estricto de 2 familiares activos** por cada paciente.
* **Borrado Lógico & Trazabilidad**: Implementación de `softDeletes()` y columnas `created_by`, `updated_by` y `deleted_by` en tablas transaccionales y clínicas.
* **Inmutabilidad en Auditoría**: Las tablas `auditoria_logs`, `historial_alertas` y `logs_integracion` son estrictamente inmutables (no admiten sentencias `UPDATE` ni `DELETE`).

---

## 🚀 8. Guía de Instalación y Despliegue en Namecheap

El despliegue de **VitalTrace Web** y su API se realiza en servidores de **Namecheap** bajo entorno compartido con cPanel o VPS con PHP 8.1+, MySQL/MariaDB y soporte para cron y colas.

### 1️⃣ Prerrequisitos del Entorno
```bash
PHP >= 8.1
Composer >= 2.x
Node.js >= 18.x & npm
MySQL / MariaDB >= 10.5
```

### 2️⃣ Configuración y Compilación del Frontend (`Vue 3`)
```bash
# 1. Clonar repositorio y entrar a la carpeta del frontend
git clone https://github.com/vitaltrace-org/vitaltrace-web.git
cd vitaltrace-web

# 2. Instalar dependencias
npm install

# 3. Configurar variable de entorno hacia la API en Namecheap (.env.production)
echo "VITE_API_BASE_URL=https://api.vitaltrace.domain/api/v1" > .env.production

# 4. Compilar assets para producción
npm run build

# 5. Los archivos estáticos se generarán en /dist para su publicación web
```

### 3️⃣ Puesta en Marcha de la API (`Laravel 10.50.2`)
```bash
# 1. Instalar dependencias backend
composer install --optimize-autoloader --no-dev

# 2. Generar clave de aplicación y configurar caché
php artisan key:generate
php artisan config:cache
php artisan route:cache

# 3. Ejecutar migraciones y datos semilla institucionales
php artisan migrate --seed --force

# 4. Enlazar almacenamiento de documentos públicos
php artisan storage:link
```

### 4️⃣ Configuración de Tareas Programadas (Cron in Namecheap)
Agregar al crontab del servidor Namecheap para ejecutar el programador cada minuto:
```bash
* * * * * cd /home/usuario/api && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🧪 9. Estrategia de Pruebas & Calidad de Software

La plataforma mantiene una cobertura integral para validar sus reglas de negocio y seguridad:

| Nivel de Prueba | Herramientas / Alcance | Cobertura Principal |
| :--- | :--- | :--- |
| **Pruebas Unitarias** | `PHPUnit` / `Vitest` | Cálculo de edad por fecha, validación de códigos numéricos, motor de alertas clínicas y límites de familiares. |
| **Pruebas API / Feature** | `PHPUnit Feature Tests` | Respuestas HTTP (`200`, `201`, `422`, `403`), serialización JSON limpia y transaccionalidad de expedientes. |
| **Autorización & Seguridad** | `Sanctum Guards & Policies` | Pruebas de acceso horizontal (médicos intentando ver pacientes no asignados) y bloqueo de rutas de administración. |
| **Pruebas Frontend (Vue)** | `Vue Test Utils` / `Cypress` | Verificación de flujos de login Médico/Admisión, filtros de alertas pendientes y modales de seguimiento. |

---

## 📖 10. Priorización MoSCoW & Alcance Funcional

* **🟢 MUST HAVE**: Login web delimitado (Médico y Admisión), separación de Vue 3 y Laravel 10.50.2, base de datos en 3FN (29 tablas), activación de cuenta por correo, máximo de 2 familiares activos por paciente, auditoría de accesos y cambios, y despliegue integral en Namecheap.
* **🟡 SHOULD HAVE**: Dashboard de pendientes para médicos, flujos de solicitudes de corrección administrativa, recordatorios por cola programada y exportaciones de reportes institucionales.
* **🔴 WON'T HAVE (Versión Actual)**: Acceso del paciente desde navegador web, módulos de teleconsulta o videollamada en vivo, facturación y diagnóstico médico automatizado.

---

<div align="center">
  <p><b>VitalTrace Web — Solución de Seguimiento Integral en Salud</b></p>
  <p><i>Documentación alineada con las especificaciones técnicas y funcionales de VitalTrace Web (Versión 2.0).</i></p>
</div>