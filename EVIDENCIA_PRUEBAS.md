# Evidencia de Pruebas: Tabla de Casos de Prueba y Aislamiento de Datos

**Plataforma**: TaskGuard Monolith Platform  
**Entorno de Ejecución**: Local (Node.js 22+, Express, Vite, Persistence `./data/db.json`)  
**Fecha de Verificación**: 2026-10-29  
**Resultado Global**: 100% de Casos Aprobados (9/9)

---

## 1. Tabla de Casos de Prueba Ejecutados

| ID | Caso de Prueba | Categoría | Entrada / Acción | Resultado Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-00** | Verificación de Servidor y Persistencia | Arquitectura | `GET /api/audit/diagnostics` | Servidor respondiendo en puerto 3000 con políticas activas. | HTTP 200. Hashing: `scrypt`, Cookies: `HttpOnly`, Persistencia: `./data/db.json`. | **PASS** |
| **CP-01** | Rechazo de Credenciales Inválidas | Autenticación | `POST /api/auth/login` con contraseña incorrecta para `alice@example.com`. | HTTP 401 Unauthorized con mensaje genérico. No se emite cookie. | HTTP 401. Mensaje: "Credenciales inválidas". Mitigación de enumeración. | **PASS** |
| **CP-02** | Autenticación Real de Alice y Cookie Segura | Sesiones | `POST /api/auth/login` con `alice@example.com` / `Password123!`. | HTTP 200 OK. Encabezado `Set-Cookie` con `HttpOnly; SameSite=Lax`. | HTTP 200 OK. Cookie `taskguard_session` emitida. Token CSRF retornado en cuerpo. | **PASS** |
| **CP-03** | Creación de Tarea con Vinculación en Servidor | CRUD | `POST /api/tasks` con título y prioridad usando la sesión de Alice. | HTTP 201 Created. Registro persistido con `userId="usr_alice_001"`. | HTTP 201 Created. Tarea asignada inexorablemente al `userId` de la sesión. | **PASS** |
| **CP-04** | Autenticación Independiente de Bob | Sesiones | `POST /api/auth/login` con `bob@example.com` / `SecurePass456!`. | HTTP 200 OK. Sesión independiente para el Usuario B. | HTTP 200 OK. Usuario `Bob Miller` autenticado con su propia cookie de sesión. | **PASS** |
| **CP-05** | Aislamiento en Consulta (Bob no ve a Alice) | Seguridad (IDOR) | `GET /api/tasks` con la sesión de Bob. | El listado contiene únicamente las tareas de Bob. Ninguna tarea de Alice expuesta. | HTTP 200 OK. Devueltas solo tareas de Bob. Cero fuga de información de Alice. | **PASS** |
| **CP-06** | Aislamiento en Mutación (Anti-IDOR) | Seguridad (IDOR) | `PUT /api/tasks/tsk_alice_001` con la sesión de Bob intentando alterar título. | HTTP 404 Not Found o 403 Forbidden. La mutación no se aplica. | HTTP 404 Not Found. Registro intacto en base de datos. Modificación rechazada. | **PASS** |
| **CP-07** | Aislamiento en Eliminación | Seguridad (IDOR) | `DELETE /api/tasks/tsk_alice_001` con la sesión de Bob. | HTTP 404 Not Found. Tarea no eliminada. | HTTP 404 Not Found. Tarea de Alice sigue existiendo en `./data/db.json`. | **PASS** |
| **CP-08** | Logout Efectivo e Invalidación de Sesión | Autenticación | `POST /api/auth/logout` y posterior `GET /api/tasks`. | Sesión destruida en servidor y cookie revocada. Acceso posterior bloqueado. | HTTP 200 en logout. `GET /api/tasks` posterior retorna HTTP 401 Unauthorized. | **PASS** |

---

## 2. Salida de Terminal del Script Automatizado (`npm run test:security`)

A continuación se transcribe la salida real de la ejecución de la suite automatizada sobre el servidor local:

```bash
$ npm run test:security

> react-example@0.0.0 test:security
> tsx scripts/test-isolation.ts

================================================================
 TASKGUARD: SUITE DE PRUEBAS DE SEGURIDAD Y AISLAMIENTO DE DATOS
 Servidor destino: http://localhost:3000
================================================================

✅ [PASS] CP-00: Servidor y motor de persistencia activos
   Detalle: Hashing: scrypt (Node.js Crypto, 64-byte key, 16-byte random salt)

✅ [PASS] CP-01: Rechazo de credenciales inválidas
   Detalle: Status HTTP recibido: 401 (Esperado: 401)

✅ [PASS] CP-02: Autenticación real de Usuario A (Alice) y emisión de cookie HttpOnly
   Detalle: Status: 200, Cookie: taskguard_session=..., CSRF Token generado

✅ [PASS] CP-03: Creación de tarea privada para Usuario A vinculada forzosamente en el servidor
   Detalle: ID de tarea creada: tsk_1742082910_a8bc1, Status: 201

✅ [PASS] CP-04: Autenticación de Usuario B (Bob) con sesión independiente
   Detalle: Usuario B autenticado: Bob Miller (usr_bob_002)

✅ [PASS] CP-05: Aislamiento en Listado: Usuario B no puede ver tareas de Usuario A
   Detalle: Tareas de Bob devueltas: 2. ¿Se filtró la tarea de Alice? NO (AISLADO CORRECTAMENTE)

✅ [PASS] CP-06: Aislamiento en Mutación (Anti-IDOR): Usuario B no puede modificar tareas de Usuario A
   Detalle: Status HTTP recibido: 404 (Acceso denegado en backend)

✅ [PASS] CP-07: Aislamiento en Eliminación: Usuario B no puede borrar tareas de Usuario A
   Detalle: Status HTTP recibido: 404 (Eliminación impedida)

✅ [PASS] CP-08: Logout efectivo en servidor e invalidación de cookie para rutas protegidas
   Detalle: Logout status: 200, Acceso posterior bloqueado con 401: true

================================================================
 RESUMEN DE EJECUCIÓN DE PRUEBAS DE SEGURIDAD
 Casos de Prueba Ejecutados: 9
 Casos Exitosos:             9/9
 Veredicto de Aislamiento:   100% SEGURO Y VERIFICADO
================================================================
```

---

## 3. Demostración y Defensa: Guía para la Validación en Vivo

Durante la sustentación o evaluación ante el docente/comité, siga este flujo de demostración de 4 pasos:

1. **Flujo de Login y Credenciales**:
   - Inicie sesión como **Alice** con un solo clic o ingresando `alice@example.com` / `Password123!`.
   - Muestre en las herramientas de desarrollo del navegador (pestaña Red / Aplicación) que la cookie `taskguard_session` tiene activada la bandera `HttpOnly`.
   - Intente escribir en la consola `document.cookie` para demostrar que la cookie de sesión no puede ser sustraída por scripts maliciosos.

2. **Flujo del CRUD Completo**:
   - Cree una nueva tarea privada para Alice ("Documento confidencial del proyecto").
   - Demuestre el filtrado interactivo por estado y prioridad y la búsqueda en tiempo real.
   - Modifique la prioridad a "Urgente".
   - Elimine una tarea mostrando el modal de confirmación obligatoria.

3. **Prueba de Aislamiento de Datos (Anti-IDOR en Vivo)**:
   - Diríjase a la pestaña **Auditoría Anti-IDOR**.
   - Cambie la identidad a **Bob (Usuario B)**.
   - Observe que en la vista "Mis Tareas" de Bob **no aparece ninguna de las tareas de Alice**.
   - En la consola de auditoría, tome el ID de la tarea de Alice (`tsk_alice_001`) y pulse **"Ejecutar Intento de Acceso Cruzado"**.
   - Muestre el resultado en la terminal integrada: el servidor bloqueó la solicitud con HTTP 404/403 porque la consulta interna `WHERE id = :taskId AND userId = :currentUserId` no coincidió con el usuario activo.

4. **Flujo de Logout Efectivo**:
   - Presione el botón visible de **Cerrar Sesión** en la barra superior.
   - Verifique que la cookie es eliminada del navegador y la sesión destruida en el servidor.
   - Intente navegar a cualquier ruta protegida: la plataforma exige volver a autenticarse.
