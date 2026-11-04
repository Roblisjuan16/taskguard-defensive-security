# TaskGuard: Plataforma Monolítica Segura con Aislamiento de Datos, Bitácora de IA y Suite de Pruebas

Aplicación web monolítica de alcance acotado y arquitectura limpia, diseñada para demostrar control técnico, seguridad defensiva estricta (anti-IDOR, hash seguro, cookies HttpOnly, protección CSRF) y reproducibilidad local absoluta sin servicios externos complejos, complementada con su bitácora metodológica de IA y matriz de evidencias de prueba.

---

## Decisiones Críticas y Preferencias Confirmadas

> [!IMPORTANT]
> Decisiones acordadas tras la fase de clarificación interactiva:
> - **Entidad Principal del CRUD**: Sistema de Tareas con títulos, descripciones, niveles de prioridad (`Baja`, `Media`, `Alta`, `Urgente`), estados (`Pendiente`, `En Progreso`, `Completada`) y fechas límite.
> - **Estilo Visual**: Panel moderno y limpio con alternancia fluida de tema Claro/Oscuro (`@custom-variant dark`), tipografía nítida (`Plus Jakarta Sans` y `JetBrains Mono` tabular) y disciplina anti-slop.
> - **Integración de Bitácora y Pruebas**: Sección interactiva dedicada dentro de la interfaz ("Bitácora de IA & Auditoría" y "Matriz de Pruebas y Evidencias") además de los archivos de documentación física `README.md` y scripts de prueba automatizados.
> - **Persistencia y Ejecución Local**: Motor de persistencia en disco con base de datos local y almacenamiento transaccional seguro (cero dependencias externas como Docker o Cloud SQL), garantizando que cualquier evaluador clone y ejecute con `npm install && npm run dev`.

---

## 1. Visión General y Concepto Central

### Qué Hace
TaskGuard es una plataforma web monolítica completa que implementa un ciclo de vida seguro de usuario y gestión de tareas personales:
1. **Flujo de Autenticación Real**: Registro y Login con hashing criptográfico (`scrypt`/`bcrypt` con sal aleatoria de 16 bytes), generación de sesión opaca en el servidor y entrega de cookie segura (`HttpOnly`, `SameSite=Lax`, `Path=/`).
2. **Cierre de Sesión Seguro**: Invalida la sesión en el almacén del servidor y borra la cookie en el cliente, bloqueando de inmediato cualquier solicitud subsecuente a rutas protegidas.
3. **CRUD de Tareas con Aislamiento Estricto (Anti-IDOR)**: Cada operación de lectura, edición y eliminación filtra y verifica forzosamente que el registro pertenezca al `userId` derivado de la sesión activa en el servidor. Los IDs enviados por el cliente no pueden alterar tareas de otros usuarios.
4. **Protección Integral de Seguridad**: Tokens CSRF de doble envío para solicitudes mutables (`POST`, `PUT`, `DELETE`), validación estricta de tipos y sanitización contra XSS y consultas parametrizadas.
5. **Módulo de Defensa y Auditoría**: Visualizador interactivo de casos de prueba con evidencias reales de aislamiento (ejecución de pruebas de penetración IDOR entre Usuario A y Usuario B) y bitácora completa de 3 interacciones con agentes de IA según rúbrica académica.

### Audiencia y Contexto de Evaluación
- **Estudiantes e Ingenieros de Software** que defienden su proyecto frente a un comité evaluador, demostrando maestría en fundamentos de seguridad web y arquitectura monolítica.
- **Evaluadores Técnicos** que requieren clonar el repositorio, ejecutar un único comando, y verificar inmediatamente la persistencia, la seguridad entre sesiones y la auditoría metodológica.

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujos Clave de Interacción
1. **Flujo de Bienvenida y Acceso**:
   - Selector rápido para probar credenciales de prueba preconfiguradas (ej. `alice@example.com` y `bob@example.com` con datos de ejemplo) o registrar un usuario nuevo.
   - Mensajes de error claros e informativos sin fuga de datos ("Credenciales incorrectas" en lugar de revelar si el correo existe o no).
2. **Espacio de Trabajo de Tareas**:
   - Barra superior con identidad de marca, selector de vista (Tareas, Casos de Prueba, Bitácora IA), alternador de tema claro/oscuro y botón visible de Logout.
   - Métricas clave en formato tabular (`Total`, `Pendientes`, `En Progreso`, `Completadas`).
   - Barra de filtros interactiva (por estado y prioridad) y buscador en tiempo real.
   - Botón de acción principal "+ Nueva Tarea" que abre un modal accesible con validaciones visibles.
   - Listado con tarjetas elegantes: título, prioridad, estado modificable al instante, menú de edición y eliminación con modal de confirmación obligatoria.
   - Estado vacío descriptivo con botón de creación directa cuando no hay tareas registradas.
3. **Flujo de Simulación de Aislamiento y Defensa (Demo en Vivo)**:
   - Panel de "Auditoría de Aislamiento": permite simular o ejecutar un intento del Usuario B tratando de editar o leer la tarea del Usuario A, mostrando el código de respuesta HTTP `403 Forbidden / 404 Not Found` capturado en tiempo real con sus trazas de terminal.
4. **Visor de Bitácora de IA y Evidencias**:
   - Pestaña con las 3 interacciones estructuradas (Objetivo, Prompt, Propuesta del Modelo, Correcciones del Alumno, Resultado de la Prueba).
   - Tabla completa de casos de prueba (CP-01 a CP-08) con resultados, estados y comandos reproducibles.

### Identidad Visual y Paleta de Colores
- **Dirección**: Minimalista, moderno, altamente legible, inspirado en consolas de ingeniería y productividad de alto rendimiento.
- **Tipografía**: `Plus Jakarta Sans` para encabezados y controles (`font-sans`), combinada con `JetBrains Mono` con cifras tabulares (`tabular-nums`) para fechas, estadísticas, identificadores y trazas.
- **Tokens de Color (Dual Theme)**:
  - *Modo Claro*: Lienzo blanco puro y zinc suave (`#F8FAFC` / `#FFFFFF`), bordes sutiles `border-slate-200`, texto principal `text-slate-900`, acento primario azul índigo (`#3B82F6` / `#2563EB`).
  - *Modo Oscuro*: Fondo pizarra profundo (`#090D16` / `#0F172A`), superficies `bg-slate-900/90`, bordes sutiles `border-slate-800`, texto `text-slate-100`, acento primario `text-blue-400`.
- **Disciplina Anti-Slop**:
  - Sin píldoras estáticas decorativas para metadatos; fechas y autores como texto limpio con separadores sutiles (`·`).
  - Sin títulos con prefijos de comentarios de código (`// 01 ARCHITECTURE`).
  - Sin gradientes púrpuras genéricos ni tarjetas flotantes con múltiples sombras.

---

## 3. Decisiones Técnicas y Compromisos Arquitectónicos

### Decisión 1: Servidor Monolítico Node.js / Express con Middleware Integrado
- **Enfoque**: Unificar el backend Express (API RESTful segura, autenticación con cookies HttpOnly, sesiones criptográficas y motor de base de datos) con el frontend React + Vite en el mismo proceso y puerto estándar (`3000`).
- **Por qué**: Cumple al 100% la definición de aplicación web monolítica, eliminando problemas de CORS en producción local y permitiendo que un solo comando (`npm run dev` o `npm start`) inicialice tanto la base de datos como el servidor de aplicaciones.
- **Alternativas descartadas**: Separar cliente y servidor en dos puertos diferentes (introduce fricción de configuración y requiere manejo complejo de CORS con cookies).

### Decisión 2: Almacén de Persistencia Transaccional Local con Inicialización Automática
- **Enfoque**: Base de datos local embebida en archivo (`./data/taskguard.json` o SQLite embebido) con lectura/escritura atómica, esquema inicial precargado (seed de usuarios y tareas iniciales) y migraciones de arranque automáticas.
- **Por qué**: Cero dependencias externas (no requiere instalar Docker, PostgreSQL ni configurar cuentas en la nube). Cumple la condición de persistencia efectiva: los datos permanecen intactos al recargar el navegador o reiniciar el proceso del servidor.
- **Alternativas descartadas**: Almacenamiento en memoria volátil (se perdería al reiniciar) o base de datos externa tipo Cloud SQL (rompería la reproducibilidad offline que exige la rúbrica).

### Decisión 3: Seguridad de Autenticación y Sesiones
- **Enfoque**: Hashing de contraseñas mediante derivación criptográfica robusta (`crypto.scrypt` nativo de Node.js con sal única criptográfica por usuario, o `bcrypt`), almacenamiento de sesiones en memoria/archivo con identificador aleatorio de alta entropía (`crypto.randomBytes(32)`), cookies `HttpOnly; SameSite=Lax; Path=/` y verificación de token CSRF para operaciones mutables.
- **Por qué**: Proporciona seguridad real de grado de producción, evitando vulnerabilidades de robo de tokens vía JavaScript (imposible leer la sesión desde `document.cookie`).

### Decisión 4: Aislamiento por Usuario Estricto en Servidor
- **Enfoque**: El middleware de autenticación extrae el `userId` desde la sesión verificada y lo inyecta en `req.user`. Todos los controladores de CRUD consultan exclusivamente por `WHERE id = :taskId AND userId = :currentUserId`.
- **Por qué**: Erradica por diseño cualquier vulnerabilidad IDOR (Insecure Direct Object Reference). Si el Usuario B intenta enviar `DELETE /api/tasks/1` (perteneciente al Usuario A), el backend rechaza con `404 Not Found` o `403 Forbidden`.

---

## 4. Arquitectura Técnica y Estrategia de Datos

### Diagrama del Sistema Monolítico

```
┌────────────────────────────────────────────────────────────────────────┐
│                          NAVEGADOR DEL CLIENTE                         │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │   Vistas de Tareas    │  │ Bitácora de IA    │  │ Suite Pruebas  │  │
│  │  (List, Create, Edit) │  │  (3 Interacciones)│  │ & Evidencias   │  │
│  └───────────┬───────────┘  └─────────┬─────────┘  └───────┬────────┘  │
│              │                        │                    │           │
│              └────────────────────────┼────────────────────┘           │
│                                       │                                │
│                  Cliente API REST (Fetch con Cookies)                  │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │ HTTP Requests (Cookie HttpOnly + CSRF)
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 SERVIDOR MONOLÍTICO TASKGUARD (PORT 3000)              │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Middleware: Express JSON, CookieParser, CSRF Guard, Logger       │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Middleware de Autenticación: Valida SessionId -> req.user        │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│         ┌───────────────────────────┴──────────────────────────┐       │
│         ▼                                                      ▼       │
│  ┌─────────────────────────────┐                ┌───────────────────┐  │
│  │ Rutas de Autenticación      │                │ Rutas de Tareas   │  │
│  │ /api/auth/login             │                │ GET    /api/tasks │  │
│  │ /api/auth/register          │                │ POST   /api/tasks │  │
│  │ /api/auth/logout            │                │ PUT    /api/tasks │  │
│  │ /api/auth/me                │                │ DELETE /api/tasks │  │
│  └──────────────┬──────────────┘                └─────────┬─────────┘  │
│                 │                                         │            │
│                 │ (Valida credenciales & sessions)        │ (Filtra    │
│                 │                                         │  userId)   │
│                 ▼                                         ▼            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │        Capa de Datos y Persistencia (DB Engine Local)            │  │
│  │        • Tabla de Usuarios: id, email, passwordHash, salt, name  │  │
│  │        • Tabla de Sesiones: sessionId, userId, expiresAt         │  │
│  │        • Tabla de Tareas:   id, userId, title, desc, status, ... │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Archivo de Persistencia Local: /data/db.json (Lectura/Escritura) │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Datos
- **Usuario (`User`)**:
  - `id`: string (UUID)
  - `email`: string (único, normalizado en minúsculas)
  - `name`: string
  - `passwordHash`: string (hash criptográfico seguro con sal)
  - `salt`: string (16 bytes hex)
  - `createdAt`: string (ISO 8601)
- **Sesión (`Session`)**:
  - `id`: string (token opaco de 64 caracteres hex)
  - `userId`: string (relación con User)
  - `createdAt`: string
  - `expiresAt`: string (duración configurable, ej. 24 horas)
- **Tarea (`Task`)**:
  - `id`: string (UUID)
  - `userId`: string (llave foránea obligatoria para aislamiento)
  - `title`: string (1 - 120 caracteres, sanitizado)
  - `description`: string (texto enriquecido opcional)
  - `status`: `'pending' | 'in_progress' | 'completed'`
  - `priority`: `'low' | 'medium' | 'high' | 'urgent'`
  - `dueDate`: string (opcional, YYYY-MM-DD)
  - `createdAt`: string
  - `updatedAt`: string

### Mapeo de Componentes Interactivos y Estado
1. `App`: Orquesta el estado global de autenticación (`user`, `loading`), vista activa (`tasks`, `audit`, `docs`), y tema visual (`light` / `dark`).
2. `AuthModal` / `AuthView`: Maneja inicio de sesión, registro y selector de credenciales pre-cargadas para evaluación rápida (Alice y Bob).
3. `TaskWorkspace`:
   - `TaskStatsStrip`: Métricas tabulares dinámicas.
   - `TaskFilterBar`: Filtros por estado, prioridad y búsqueda en tiempo real.
   - `TaskList`: Renderiza listado con animaciones suaves, indicador de prioridad y acciones contextuales.
   - `TaskFormModal`: Creación y edición con validación de campos obligatorios en cliente y servidor.
   - `DeleteConfirmModal`: Modal de confirmación obligatoria para prevenir borrados accidentales.
4. `IsolationDemoModal` (Auditoría en Vivo):
   - Herramienta para probar y verificar el aislamiento: ejecuta una llamada a la API simulando al Usuario B intentando modificar o leer una tarea del Usuario A, mostrando el código `403/404` y la respuesta del servidor.
5. `AiLogView`:
   - Renderiza las 3 interacciones clave con el asistente de IA con los campos exactos de la rúbrica (Objetivo, Prompt, Propuesta del modelo, Correcciones del estudiante, Resultado de la prueba).
6. `TestMatrixView`:
   - Visualiza la tabla completa de 8 casos de prueba (CP-01 a CP-08), sus estados, comandos de terminal y evidencias.
7. `DocumentationView`:
   - Visualizador en vivo del contenido del `README.md` reproducible, arquitectura y guía paso a paso para levantar el proyecto desde cero.

---

## 5. Entregables Físicos del Proyecto

1. **Código Fuente Completo**:
   - Backend Express con middleware de autenticación, sesiones, protección CSRF y controladores seguros.
   - Capa de base de datos local con persistencia atómica y datos semilla iniciales.
   - Frontend React + Tailwind CSS con modo claro/oscuro y componentes interactivos completos.
2. **`README.md` Reproducible**:
   - Guía paso a paso para clonar, instalar (`npm install`) y ejecutar (`npm run dev`).
   - Configuración de `.env` a partir de `.env.example`.
   - Explicación de la arquitectura monolítica y decisiones de seguridad.
3. **`BITACORA_IA.md` y Vista Integrada**:
   - Detalle estructurado de las 3 interacciones clave exigidas por la rúbrica oficial.
4. **`EVIDENCIA_PRUEBAS.md` y Suite Automatizada**:
   - Casos de prueba CP-01 a CP-08 cubriendo Registro, Login, Logout, CRUD completo, persistencia tras reinicio y prueba de penetración anti-IDOR.
   - Script ejecutable de prueba de aislamiento de datos para verificación en terminal.
