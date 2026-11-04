# TaskGuard: Plataforma Monolítica Segura con Aislamiento de Datos

TaskGuard es una aplicación web monolítica completa diseñada para demostrar **control técnico, comprensión arquitectónica y verificación de seguridad web defensiva**. Implementa un flujo completo de autenticación de usuario, gestión de sesiones seguras mediante cookies `HttpOnly`, y un CRUD de tareas con **aislamiento estricto por usuario en el backend (defensa anti-IDOR)**.

El proyecto es **100% reproducible localmente** y no requiere Docker, bases de datos externas ni servicios en la nube para funcionar.

---

## 1. Guía Paso a Paso para Levantar el Proyecto desde Cero

### Requisitos Previos
- **Node.js**: Versión 18 o superior (recomendado Node.js 20+ o 22+).
- **npm** o gestor de paquetes compatible.

### Pasos de Instalación y Ejecución

1. **Clonar o descargar el repositorio**:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd taskguard
   ```

2. **Configurar las variables de entorno**:
   Copie el archivo de ejemplo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Nota: Por defecto, el archivo `.env.example` ya contiene valores seguros para ejecución local. No exponga credenciales de producción en este archivo).*

3. **Instalar dependencias**:
   ```bash
   npm install
   ```

4. **Ejecutar el servidor monolítico**:
   ```bash
   npm run dev
   ```

5. **Acceder a la aplicación**:
   Abra su navegador web en:
   ```
   http://localhost:3000
   ```

---

## 2. Credenciales de Prueba Preconfiguradas

Para facilitar la evaluación y demostración en vivo del aislamiento de datos entre dos usuarios distintos, la base de datos local se inicializa automáticamente con dos cuentas de prueba:

| Usuario | Correo Electrónico | Contraseña | Rol / Propósito |
| :--- | :--- | :--- | :--- |
| **Alice (Usuario A)** | `alice@example.com` | `Password123!` | Cuenta principal para crear registros confidenciales. |
| **Bob (Usuario B)** | `bob@example.com` | `SecurePass456!` | Cuenta secundaria para probar intentos de acceso cruzado (IDOR). |

*(También es posible registrar nuevos usuarios directamente desde la interfaz con validación de contraseña de mínimo 8 caracteres).*

---

## 3. Descripción de la Arquitectura

TaskGuard sigue un patrón de **Monolito Modular Moderno** unificando el frontend y el backend en un solo proceso y puerto (`3000`):

```
┌────────────────────────────────────────────────────────┐
│               TaskGuard Monolith (Port 3000)           │
│                                                        │
│  [Frontend React + Vite SPA]                           │
│  ├── Workspace de Tareas (CRUD completo)               │
│  ├── Consola Interactiva de Auditoría Anti-IDOR        │
│  ├── Visor de Bitácora de Trabajo con IA               │
│  └── Matriz de Casos de Prueba con Diagnósticos        │
│                           │                            │
│                           ▼ Peticiones HTTP con Cookie │
│                                                        │
│  [Backend Express REST API]                            │
│  ├── Middlewares: CookieParser, JSON, Logger           │
│  ├── Auth Guard: Valida sesión y extrae req.user.id    │
│  ├── CSRF Guard: Valida header x-csrf-token            │
│  └── Controladores CRUD (Filtrado estricto por userId) │
│                           │                            │
│                           ▼ Operaciones I/O Atómicas   │
│                                                        │
│  [Motor de Persistencia Local]                         │
│  └── ./data/db.json (Users, Sessions, Tasks)           │
└────────────────────────────────────────────────────────┘
```

### Componentes Principales:
1. **`server.ts`**: Punto de entrada del monolito. Configura Express, los middlewares de seguridad, los endpoints de autenticación, el CRUD de tareas, y monta los middlewares de desarrollo de Vite para servir el frontend de forma integrada.
2. **`server/security.ts`**: Módulo criptográfico encargado del hashing seguro con `scrypt`, generación de sal de 16 bytes, comparación en tiempo seguro (`timingSafeEqual`), generación de tokens opacos de sesión y mitigación de CSRF y XSS.
3. **`server/db.ts`**: Capa de persistencia local en disco con transacciones atómicas (escritura en archivo temporal `.tmp` y renombrado atómico), pre-sembrado y consultas con aislamiento obligatorio.
4. **`src/`**: Interfaz de usuario construida con React, Tailwind CSS (soporte nativo de modo claro y oscuro `@custom-variant dark`), cifras tabulares y retroalimentación inmediata.

---

## 4. Decisiones de Seguridad y Mitigación de Vulnerabilidades

| Vulnerabilidad | Mecanismo de Defensa Implementado en TaskGuard |
| :--- | :--- |
| **Robo de Credenciales / Inyección XSS** | Sesiones gestionadas en el servidor mediante cookies con flags `HttpOnly; SameSite=Lax; Path=/`. JavaScript del cliente no tiene acceso a la cookie de sesión (`document.cookie` no expone el token). |
| **Almacenamiento de Contraseñas Débiles** | Prohibido el texto plano, MD5 y SHA-1. Se utiliza el algoritmo de derivación de claves `scrypt` con sal aleatoria criptográfica de 16 bytes y longitud de clave de 64 bytes. Verificación en tiempo constante para mitigar ataques de temporización. |
| **IDOR (Insecure Direct Object Reference)** | El backend **nunca confía en IDs de usuario provistos por el cliente**. En cada operación (`GET`, `PUT`, `DELETE`), la consulta a la base de datos se filtra forzosamente por `userId === req.user.id` (derivado de la sesión verificada). Si el Usuario B intenta acceder a una tarea del Usuario A, el servidor retorna `404 Not Found` de forma hermética. |
| **CSRF (Cross-Site Request Forgery)** | Todas las peticiones mutables (`POST`, `PUT`, `DELETE`) exigen la presencia de un token CSRF criptográfico en el encabezado `x-csrf-token`, validado contra la sesión del usuario. |
| **Persistencia de Datos Efectiva** | Almacenamiento local en disco en `./data/db.json`. Los datos se conservan tras recargar la página o reiniciar el proceso del servidor. |

---

## 5. Ejecución de la Suite de Pruebas Automatizadas

TaskGuard incluye un script de prueba de aislamiento de datos que valida de extremo a extremo el flujo de autenticación, CRUD y rechazo de ataques IDOR entre Alice y Bob:

```bash
npm run test:security
```

Salida esperada:
```
================================================================
 TASKGUARD: SUITE DE PRUEBAS DE SEGURIDAD Y AISLAMIENTO DE DATOS
 Servidor destino: http://localhost:3000
================================================================

✅ [PASS] CP-00: Servidor y motor de persistencia activos
✅ [PASS] CP-01: Rechazo de credenciales inválidas
✅ [PASS] CP-02: Autenticación real de Usuario A (Alice) y emisión de cookie HttpOnly
✅ [PASS] CP-03: Creación de tarea privada para Usuario A vinculada forzosamente en el servidor
✅ [PASS] CP-04: Autenticación de Usuario B (Bob) con sesión independiente
✅ [PASS] CP-05: Aislamiento en Listado: Usuario B no puede ver tareas de Usuario A
✅ [PASS] CP-06: Aislamiento en Mutación (Anti-IDOR): Usuario B no puede modificar tareas de Usuario A
✅ [PASS] CP-07: Aislamiento en Eliminación: Usuario B no puede borrar tareas de Usuario A
✅ [PASS] CP-08: Logout efectivo en servidor e invalidación de cookie para rutas protegidas

================================================================
 RESUMEN DE EJECUCIÓN DE PRUEBAS DE SEGURIDAD
 Casos de Prueba Ejecutados: 9
 Casos Exitosos:             9/9
 Veredicto de Aislamiento:   100% SEGURO Y VERIFICADO
================================================================
```

---

## 6. Documentos Adicionales de Evaluación
- **`BITACORA_IA.md`**: Detalle de las 3 interacciones clave con agentes de IA (Objetivo, Prompt, Propuesta del modelo, Correcciones del estudiante y Resultado).
- **`EVIDENCIA_PRUEBAS.md`**: Matriz completa de casos de prueba CP-01 a CP-08 con salidas de terminal y justificaciones técnicas para la defensa en vivo.
