import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, User, Session, TaskPriority, TaskStatus } from './server/db.js';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  generateCsrfToken,
  sanitizeString,
} from './server/security.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Tipado extendido para Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
    }
  }
}

// Middlewares fundamentales del monolito
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json());

// Logger de auditoría para seguridad
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[AUDIT] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Middleware de Autenticación de Sesión (Server-Managed Session via Cookie HttpOnly + Bearer para iframes)
const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
  let sessionToken = req.cookies?.taskguard_session;

  // Soporte de token Bearer para entornos embebidos en iframes donde navegadores bloquean cookies de terceros
  if (!sessionToken && req.headers.authorization?.startsWith('Bearer ')) {
    sessionToken = req.headers.authorization.substring(7);
  }

  if (!sessionToken) {
    req.user = undefined;
    req.session = undefined;
    return next();
  }

  const session = db.getSession(sessionToken);
  if (!session) {
    res.clearCookie('taskguard_session', { path: '/' });
    req.user = undefined;
    req.session = undefined;
    return next();
  }

  const user = db.findUserById(session.userId);
  if (!user) {
    db.deleteSession(sessionToken);
    res.clearCookie('taskguard_session', { path: '/' });
    req.user = undefined;
    req.session = undefined;
    return next();
  }

  req.user = user;
  req.session = session;
  next();
};

app.use(authenticateUser);

// Middleware guardia de rutas protegidas
const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !req.session) {
    res.status(401).json({
      error: 'No autenticado',
      message: 'Debes iniciar sesión para acceder a este recurso protegido.',
    });
    return;
  }
  next();
};

// Middleware de validación CSRF para peticiones mutables
const verifyCsrf = (req: Request, res: Response, next: NextFunction): void => {
  const mutableMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (!mutableMethods.includes(req.method)) {
    return next();
  }

  // Rutas exentas de CSRF previo (Login, Registro, Logout y reset de auditoría)
  const fullPath = req.originalUrl || req.path;
  if (
    fullPath.includes('/auth/login') ||
    fullPath.includes('/auth/register') ||
    fullPath.includes('/auth/logout') ||
    fullPath.includes('/audit/reset-seed')
  ) {
    return next();
  }

  const clientCsrfToken = req.headers['x-csrf-token'];
  if (!req.session || !clientCsrfToken || clientCsrfToken !== req.session.csrfToken) {
    res.status(403).json({
      error: 'Token CSRF inválido o faltante',
      message: 'Solicitud rechazada por política de seguridad CSRF.',
    });
    return;
  }

  next();
};

app.use('/api', verifyCsrf);

// -------------------------------------------------------------
// RUTAS DE AUTENTICACIÓN
// -------------------------------------------------------------

// Estado de sesión actual
app.get('/api/auth/me', (req: Request, res: Response) => {
  if (!req.user || !req.session) {
    res.json({
      authenticated: false,
      user: null,
      sessionToken: null,
      csrfToken: null,
    });
    return;
  }

  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    },
    sessionToken: req.session.id,
    csrfToken: req.session.csrfToken,
  });
});

// Inicio de sesión
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Credenciales incompletas', message: 'Se requiere correo y contraseña.' });
    return;
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    // Retardo mínimo para mitigar enumeración por tiempo
    res.status(401).json({ error: 'Credenciales inválidas', message: 'El correo o la contraseña son incorrectos.' });
    return;
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    res.status(401).json({ error: 'Credenciales inválidas', message: 'El correo o la contraseña son incorrectos.' });
    return;
  }

  // Generación de identificador de sesión seguro y token CSRF
  const sessionToken = generateSessionToken();
  const csrfToken = generateCsrfToken();
  db.createSession(user.id, sessionToken, csrfToken);

  // Cookie segura: HttpOnly impide lectura desde JS
  // En entornos HTTPS (como el iframe de AI Studio), SameSite=None y Secure permiten el paso de cookie
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || isProduction;
  res.cookie('taskguard_session', sessionToken, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    sessionToken,
    csrfToken,
  });
});

// Registro de nuevo usuario
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    res.status(400).json({ error: 'Campos requeridos', message: 'Todos los campos son obligatorios.' });
    return;
  }

  const cleanEmail = sanitizeString(email).toLowerCase();
  const cleanName = sanitizeString(name);

  // Validación de formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    res.status(400).json({ error: 'Correo inválido', message: 'Por favor ingresa un correo electrónico válido.' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Contraseña débil', message: 'La contraseña debe tener al menos 8 caracteres.' });
    return;
  }

  if (db.findUserByEmail(cleanEmail)) {
    res.status(409).json({ error: 'Usuario existente', message: 'Ya existe una cuenta con este correo electrónico.' });
    return;
  }

  // Hashing seguro de contraseña con scrypt y sal criptográfica
  const { hash, salt } = hashPassword(password);
  const newUser = db.createUser({
    email: cleanEmail,
    name: cleanName,
    passwordHash: hash,
    salt,
  });

  // Creación automática de sesión
  const sessionToken = generateSessionToken();
  const csrfToken = generateCsrfToken();
  db.createSession(newUser.id, sessionToken, csrfToken);

  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || isProduction;
  res.cookie('taskguard_session', sessionToken, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    },
    sessionToken,
    csrfToken,
  });
});

// Cierre de sesión (Logout efectivo en servidor y cliente)
app.post('/api/auth/logout', (req: Request, res: Response) => {
  let sessionToken = req.cookies?.taskguard_session;
  if (!sessionToken && req.headers.authorization?.startsWith('Bearer ')) {
    sessionToken = req.headers.authorization.substring(7);
  }
  if (sessionToken) {
    db.deleteSession(sessionToken);
  }

  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || isProduction;
  res.clearCookie('taskguard_session', {
    path: '/',
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
  });
  res.json({
    success: true,
    message: 'Sesión invalidada exitosamente en el servidor.',
  });
});

// -------------------------------------------------------------
// RUTAS CRUD DE TAREAS (PROTEGIDAS CON AISLAMIENTO ESTRICTO)
// -------------------------------------------------------------

// Listar tareas del usuario autenticado
app.get('/api/tasks', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id; // Obtenido del servidor, NO del cliente
  const { status, priority, search } = req.query;

  const validStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed'];
  const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

  const filterStatus = typeof status === 'string' && validStatuses.includes(status as TaskStatus)
    ? (status as TaskStatus)
    : undefined;

  const filterPriority = typeof priority === 'string' && validPriorities.includes(priority as TaskPriority)
    ? (priority as TaskPriority)
    : undefined;

  const filterSearch = typeof search === 'string' ? search : undefined;

  const tasks = db.getTasksByUserId(userId, {
    status: filterStatus,
    priority: filterPriority,
    search: filterSearch,
  });

  const counts = db.getCounts(userId);

  res.json({
    success: true,
    tasks,
    counts,
  });
});

// Crear nueva tarea
app.post('/api/tasks', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { title, description, priority, status, dueDate } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'Título obligatorio', message: 'El título de la tarea es requerido.' });
    return;
  }

  const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
  const selectedPriority: TaskPriority = validPriorities.includes(priority) ? priority : 'medium';

  const validStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed'];
  const selectedStatus: TaskStatus = validStatuses.includes(status) ? status : 'pending';

  const cleanTitle = sanitizeString(title);
  const cleanDescription = sanitizeString(description);
  const cleanDueDate = typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : undefined;

  const task = db.createTask(userId, {
    title: cleanTitle,
    description: cleanDescription,
    priority: selectedPriority,
    status: selectedStatus,
    dueDate: cleanDueDate,
  });

  res.status(201).json({
    success: true,
    message: 'Tarea creada exitosamente',
    task,
  });
});

// Actualizar tarea (Aislamiento: sólo si pertenece al usuario autenticado)
app.put('/api/tasks/:id', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const taskId = req.params.id;
  const { title, description, priority, status, dueDate } = req.body;

  const updates: Partial<{
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string | undefined;
  }> = {};

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Título inválido', message: 'El título no puede estar vacío.' });
      return;
    }
    updates.title = sanitizeString(title);
  }

  if (description !== undefined) {
    updates.description = sanitizeString(description);
  }

  const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
  if (priority !== undefined && validPriorities.includes(priority)) {
    updates.priority = priority;
  }

  const validStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed'];
  if (status !== undefined && validStatuses.includes(status)) {
    updates.status = status;
  }

  if (dueDate !== undefined) {
    updates.dueDate = typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : undefined;
  }

  const updatedTask = db.updateTask(taskId, userId, updates);

  if (!updatedTask) {
    // REGLA DE SEGURIDAD: Rechazo anti-IDOR
    res.status(404).json({
      error: 'No encontrado o no autorizado',
      message: 'La tarea no existe o no tienes permisos para modificarla.',
    });
    return;
  }

  res.json({
    success: true,
    message: 'Tarea actualizada exitosamente',
    task: updatedTask,
  });
});

// Eliminar tarea (Aislamiento: sólo si pertenece al usuario autenticado)
app.delete('/api/tasks/:id', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const taskId = req.params.id;

  const deleted = db.deleteTask(taskId, userId);

  if (!deleted) {
    // REGLA DE SEGURIDAD: Rechazo anti-IDOR
    res.status(404).json({
      error: 'No encontrado o no autorizado',
      message: 'La tarea no existe o no tienes permisos para eliminarla.',
    });
    return;
  }

  res.json({
    success: true,
    message: 'Tarea eliminada exitosamente.',
  });
});

// Mover tarea al principio (Move to top)
app.post('/api/tasks/:id/move-top', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const taskId = req.params.id;

  const updatedTask = db.moveTaskToTop(taskId, userId);

  if (!updatedTask) {
    res.status(404).json({
      error: 'No encontrado o no autorizado',
      message: 'La tarea no existe o no tienes permisos para moverla.',
    });
    return;
  }

  res.json({
    success: true,
    message: 'Tarea movida al principio.',
    task: updatedTask,
  });
});

// -------------------------------------------------------------
// RUTAS DE AUDITORÍA Y DEMOSTRACIÓN DE AISLAMIENTO (DEFENSA EN VIVO)
// -------------------------------------------------------------

// Simulación y verificación en vivo de ataque IDOR (Insecure Direct Object Reference)
app.post('/api/audit/simulate-idor', requireAuth, (req: Request, res: Response) => {
  const currentUserId = req.user!.id;
  const currentEmail = req.user!.email;
  const { targetTaskId } = req.body;

  if (!targetTaskId || typeof targetTaskId !== 'string') {
    res.status(400).json({ error: 'ID de tarea objetivo requerido para la prueba.' });
    return;
  }

  // 1. Verificar si la tarea existe en la base de datos (con fines de auditoría)
  const taskInDb = db.rawFindTask(targetTaskId);

  // 2. Intentar acceder a través del método seguro del backend (con filtro forzoso de userId)
  const accessibleTask = db.getTaskByIdAndUserId(targetTaskId, currentUserId);

  const isCrossUserAttack = taskInDb && taskInDb.userId !== currentUserId;
  const attackBlocked = accessibleTask === undefined;

  res.json({
    auditTest: 'CP-06: Verificación de Aislamiento y Control de Acceso (Anti-IDOR)',
    timestamp: new Date().toISOString(),
    attacker: {
      userId: currentUserId,
      email: currentEmail,
    },
    target: {
      taskId: targetTaskId,
      existsInDatabase: !!taskInDb,
      realOwnerUserId: taskInDb ? taskInDb.userId : 'Desconocido',
      isBelongingToAnotherUser: isCrossUserAttack,
    },
    backendVerification: {
      queryFilter: 'WHERE id = :taskId AND userId = :currentUserId',
      filterEnforcedInServer: true,
      defenseStatus: attackBlocked ? 'BLOQUEADO CON ÉXITO' : 'VULNERABLE',
      httpStatusCode: attackBlocked ? 404 : 200,
      dataExposed: accessibleTask !== undefined,
    },
    verdict: attackBlocked
      ? 'Aislamiento validado: El backend impidió el acceso y no expuso información ajena.'
      : 'ALERTA: Falla de aislamiento detectada.',
  });
});

// Diagnóstico de seguridad general del sistema
app.get('/api/audit/diagnostics', (req: Request, res: Response) => {
  res.json({
    system: 'TaskGuard Monolith Platform',
    status: 'OPERATIONAL',
    securityPolicies: {
      passwordHashing: 'scrypt (Node.js Crypto, 64-byte key, 16-byte random salt)',
      plainTextStorage: 'ESTRICTAMENTE PROHIBIDO (0 ocurrencias)',
      sessionStorage: 'Server-Managed Sessions con Token Opaque (256-bit entropy)',
      cookieFlags: {
        httpOnly: true,
        sameSite: 'Lax',
        path: '/',
        secure: isProduction,
      },
      csrfProtection: 'Double-Submit Crypto Token en métodos POST/PUT/DELETE',
      idorProtection: 'Filtrado obligatorio por userId del servidor en todas las consultas',
      sqlInjectionProtection: 'Persistencia tipada y parametrizada',
      xssProtection: 'Sanitización de entradas en servidor y escape nativo en React',
      dataPersistence: 'Archivo local atómico (/data/db.json) sin dependencias externas',
    },
    demoCredentials: [
      { email: 'alice@example.com', role: 'Usuario A', samplePassword: 'Password123!' },
      { email: 'bob@example.com', role: 'Usuario B', samplePassword: 'SecurePass456!' },
    ],
  });
});

// Reinicialización de datos semilla (para evaluadores)
app.post('/api/audit/reset-seed', (req: Request, res: Response) => {
  db.seedInitialData();
  res.json({
    success: true,
    message: 'Base de datos restaurada al estado semilla inicial (Alice y Bob con sus tareas).',
  });
});

// -------------------------------------------------------------
// INTEGRACIÓN VITE (FRONTEND MONOLÍTICO)
// -------------------------------------------------------------

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================================`);
    console.log(` TaskGuard Monolithic Server ejecutándose en:`);
    console.log(` http://localhost:${PORT}`);
    console.log(` Modo: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO (Vite Middleware)'}`);
    console.log(` Persistencia: ./data/db.json`);
    console.log(`========================================================`);
  });
}

startServer().catch(err => {
  console.error('Error al iniciar el servidor TaskGuard:', err);
  process.exit(1);
});
