# Bitácora de Trabajo con Agentes de Inteligencia Artificial

**Proyecto**: TaskGuard - Plataforma Monolítica Segura  
**Estudiante / Auditor Técnico**: Equipo de Desarrollo TaskGuard  
**Criterio Metodológico**: Dirección humana activa y supervisión crítica del código generado, dividida en roles estructurados (Analista/Arquitecto, Ingeniero de Seguridad, Tester de Penetración).

---

## Interacción 1: Arquitectura y Persistencia Local Sin Servicios Externos

- **Rol Adoptado**: Analista & Arquitecto de Software
- **Objetivo**: Diseñar una solución de persistencia de datos efectiva que cumpla el criterio de "ejecución local sin dependencias de servicios externos complejos", asegurando que la información de usuarios, sesiones y tareas permanezca tras recargar la página o reiniciar el servidor.
- **Prompt Utilizado**:
  > "¿Cómo podemos persistir los datos de usuarios, sesiones y tareas para una arquitectura monolítica en Node.js que cualquier evaluador pueda clonar y ejecutar con solo `npm install` y `npm run dev` sin tener que configurar Docker, PostgreSQL ni servicios cloud externos?"
- **Propuesta Inicial del Modelo de IA**:
  > El modelo propuso inicialmente dos alternativas:
  > 1. Almacenar los datos en arrays en memoria (`const users = []`, `const tasks = []`) dentro de `server.ts`.
  > 2. Conectar la aplicación a una base de datos externa tipo MongoDB Atlas o Supabase mediante variables de entorno `MONGODB_URI` / `DATABASE_URL`.
- **Correcciones y Auditoría del Estudiante**:
  > **Rechazo Crítico y Corrección**:
  > 1. El almacenamiento en memoria fue descartado porque incumple la rúbrica oficial de "Persistencia efectiva: la información debe conservarse tras recargar la página o reiniciar el servidor". Al reiniciar el proceso de Node, los datos se perderían.
  > 2. La base de datos externa en la nube fue rechazada porque contradice el criterio de "ejecución local sin dependencias de servicios externos complejos", lo que impediría la evaluación offline o generaría fallos si las credenciales remotas caducan.
  > 3. **Decisión Arquitectónica Humana**: Se instruyó a la IA a implementar un motor de persistencia local en disco basado en JSON (`./data/db.json`) con operaciones de escritura atómica (escritura en un archivo temporal `.tmp` y posterior `renameSync`), pre-sembrado automático de datos iniciales para Alice y Bob, y aislamiento estricto por usuario en cada consulta.
- **Resultado de la Prueba**:
  > Se registraron tareas con Alice, se detuvo el proceso del servidor (`Ctrl+C`) y se volvió a ejecutar `npm run dev`. Tras el reinicio, las tareas y usuarios persistieron intactos en `./data/db.json`.

---

## Interacción 2: Seguridad de Autenticación, Hashing y Cookies HttpOnly

- **Rol Adoptado**: Ingeniero de Seguridad Web
- **Objetivo**: Implementar un sistema de autenticación real y manejo seguro de credenciales y sesiones, previniendo el almacenamiento en texto plano y ataques XSS / robo de tokens.
- **Prompt Utilizado**:
  > "Genera el sistema de autenticación de usuarios para la plataforma, incluyendo el registro, login y logout."
- **Propuesta Inicial del Modelo de IA**:
  > El modelo generó un flujo donde las contraseñas se hasheaban con un hash simple `crypto.createHash('sha256').update(password).digest('hex')` sin sal aleatoria. Además, propuso emitir un JWT firmado y almacenarlo en el `localStorage` del navegador para que el cliente lo enviara en el header `Authorization: Bearer <token>`.
- **Correcciones y Auditoría del Estudiante**:
  > **Detección de Vulnerabilidades Críticas**:
  > 1. **Hash sin sal**: El uso de SHA-256 directo es vulnerable a ataques de tablas rainbow precomputadas y ataques de diccionario masivo por fuerza bruta en GPU. Se ordenó reemplazarlo por un algoritmo de derivación de claves resistente: `crypto.scryptSync` con una sal criptográfica única de 16 bytes generada por usuario y verificación en tiempo constante (`crypto.timingSafeEqual`) para neutralizar ataques de temporización.
  > 2. **Token en localStorage**: Almacenar tokens en `localStorage` expone al usuario a ataques de secuestro de sesión vía Cross-Site Scripting (XSS), ya que cualquier script ejecutado en el cliente puede leer el token. Se exigió cambiar a sesiones gestionadas en el servidor con cookies protegidas por los flags `HttpOnly; SameSite=Lax; Path=/` y generación de tokens de sesión opacos de 256 bits (`crypto.randomBytes(32)`), complementado con protección CSRF de doble envío.
- **Resultado de la Prueba**:
  > Al ejecutar `console.log(document.cookie)` en la consola del navegador del cliente, la cookie `taskguard_session` no es visible ni accesible. En `./data/db.json`, las contraseñas están almacenadas exclusivamente como hashes derivados con su sal independiente.

---

## Interacción 3: Control de Acceso Estricto en Backend (Defensa Anti-IDOR)

- **Rol Adoptado**: Tester de Penetración & Seguridad de Aplicaciones
- **Objetivo**: Asegurar el aislamiento absoluto de datos entre usuarios en el backend, garantizando que un Usuario B no pueda ver, editar ni eliminar registros del Usuario A bajo ninguna circunstancia.
- **Prompt Utilizado**:
  > "Crea las rutas del CRUD de tareas en Express: listado, creación, edición y eliminación."
- **Propuesta Inicial del Modelo de IA**:
  > El modelo implementó los controladores buscando y modificando las tareas por su `id` recibido en los parámetros de la URL:
  > ```typescript
  > app.delete('/api/tasks/:id', (req, res) => {
  >   const taskId = req.params.id;
  >   const deleted = db.tasks.findIndex(t => t.id === taskId);
  >   // Borrado directo sin validar dueño...
  > });
  > ```
- **Correcciones y Auditoría del Estudiante**:
  > **Detección de Falla de Aislamiento (IDOR)**:
  > La propuesta del modelo presentaba una vulnerabilidad crítica de *Insecure Direct Object Reference* (IDOR). Si el Usuario B adivinaba o conocía el `id` de una tarea de Alice, podía enviar `DELETE /api/tasks/tsk_alice_001` y el backend la borraría.
  > **Corrección Exigida**: Se estableció como principio inviolable que **el backend jamás confía en los identificadores enviados por el cliente**. El `userId` debe derivarse forzosamente de la sesión autenticada (`req.user.id`).
  > Todas las operaciones en la base de datos se reescribieron para incluir la condición de propiedad:
  > ```typescript
  > // Filtrado mandatorio por userId del servidor:
  > db.updateTask(taskId, req.user.id, updates);
  > db.deleteTask(taskId, req.user.id);
  > ```
  > Si la tarea no pertenece al usuario autenticado, el backend retorna de inmediato `404 Not Found` o `403 Forbidden` sin filtrar datos ajenos.
- **Resultado de la Prueba**:
  > Se ejecutó la suite de pruebas `scripts/test-isolation.ts` simulando a Bob intentando acceder y mutar las tareas de Alice. Todos los intentos fueron bloqueados exitosamente con código HTTP 404. El panel interactivo de la aplicación confirmó el aislamiento.

---

## Conclusión Metodológica
Esta bitácora evidencia que el uso de IA fue dirigido críticamente en todo momento por el alumno: cada propuesta fue auditada frente a estándares de seguridad (OWASP Top 10) y requerimientos de la rúbrica oficial, transformando borradores genéricos en una solución monolítica blindada y verificable.
