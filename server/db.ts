import fs from 'fs';
import path from 'path';
import { hashPassword } from './security.js';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  csrfToken: string;
  createdAt: string;
  expiresAt: number; // Unix timestamp en ms
}

export interface Task {
  id: string;
  userId: string; // Vínculo forzoso con el usuario dueño
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  tasks: Task[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    sessions: [],
    tasks: [],
  };

  constructor() {
    this.init();
  }

  /**
   * Inicializa el almacenamiento en disco y ejecuta el sembrado inicial si no existe
   */
  private init(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Limpieza de sesiones expiradas al inicio
        const now = Date.now();
        this.data.sessions = (this.data.sessions || []).filter(s => s.expiresAt > now);
        this.save();
        return;
      } catch (err) {
        console.error('Error al leer la base de datos local, resembrando datos seguros...', err);
      }
    }

    // Semilla inicial obligatoria para demostración y evaluación rápida
    this.seedInitialData();
  }

  /**
   * Genera los datos semilla iniciales con hashes criptográficos reales
   */
  public seedInitialData(): void {
    const aliceAuth = hashPassword('Password123!');
    const bobAuth = hashPassword('SecurePass456!');

    const aliceId = 'usr_alice_001';
    const bobId = 'usr_bob_002';

    const now = new Date().toISOString();

    const users: User[] = [
      {
        id: aliceId,
        email: 'alice@example.com',
        name: 'Alice Johnson',
        passwordHash: aliceAuth.hash,
        salt: aliceAuth.salt,
        createdAt: now,
      },
      {
        id: bobId,
        email: 'bob@example.com',
        name: 'Bob Miller',
        passwordHash: bobAuth.hash,
        salt: bobAuth.salt,
        createdAt: now,
      },
    ];

    const tasks: Task[] = [
      {
        id: 'tsk_alice_001',
        userId: aliceId,
        title: 'Preparar informe de auditoría de seguridad',
        description: 'Verificar almacenamiento seguro de contraseñas y aislamiento entre usuarios en el backend.',
        priority: 'urgent',
        status: 'in_progress',
        dueDate: '2026-11-05',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'tsk_alice_002',
        userId: aliceId,
        title: 'Revisar encabezados HttpOnly y SameSite en cookies',
        description: 'Asegurar que la cookie de sesión no pueda ser accedida desde scripts del navegador (anti-XSS).',
        priority: 'high',
        status: 'completed',
        dueDate: '2026-10-31',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'tsk_alice_003',
        userId: aliceId,
        title: 'Documentar bitácora de iteraciones con agente IA',
        description: 'Registrar prompts, propuestas y correcciones humanas según rúbrica.',
        priority: 'medium',
        status: 'pending',
        dueDate: '2026-11-10',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'tsk_bob_001',
        userId: bobId,
        title: 'Plan de pruebas de penetración IDOR',
        description: 'Verificar que Bob no pueda acceder ni modificar las tareas privadas de Alice bajo ninguna circunstancia.',
        priority: 'urgent',
        status: 'pending',
        dueDate: '2026-11-02',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'tsk_bob_002',
        userId: bobId,
        title: 'Configurar variables de entorno y script reproducible',
        description: 'Asegurar que la aplicación levante limpiamente con npm install && npm run dev.',
        priority: 'low',
        status: 'completed',
        dueDate: '2026-10-30',
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.data = {
      users,
      sessions: [],
      tasks,
    };

    this.save();
    console.log('Base de datos inicializada exitosamente con usuarios Alice y Bob.');
  }

  /**
   * Guarda de forma atómica en disco para garantizar persistencia y evitar corrupción
   */
  private save(): void {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  // --- Operaciones de Usuarios ---
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: userData.email.toLowerCase().trim(),
      name: userData.name.trim(),
      passwordHash: userData.passwordHash,
      salt: userData.salt,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  // --- Operaciones de Sesión ---
  public createSession(userId: string, token: string, csrfToken: string, ttlMs: number = 24 * 3600 * 1000): Session {
    // Limpieza de sesiones anteriores para mantener orden
    const now = Date.now();
    this.data.sessions = this.data.sessions.filter(s => s.expiresAt > now);

    const session: Session = {
      id: token,
      userId,
      csrfToken,
      createdAt: new Date().toISOString(),
      expiresAt: now + ttlMs,
    };
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  public getSession(token: string): Session | undefined {
    const now = Date.now();
    const session = this.data.sessions.find(s => s.id === token);
    if (!session) return undefined;
    if (session.expiresAt <= now) {
      this.deleteSession(token);
      return undefined;
    }
    return session;
  }

  public deleteSession(token: string): void {
    this.data.sessions = this.data.sessions.filter(s => s.id !== token);
    this.save();
  }

  // --- Operaciones de Tareas (CRUD con Aislamiento Estricto por Usuario) ---

  /**
   * Obtiene exclusivamente las tareas del usuario autenticado
   * REGLA DE SEGURIDAD: Nunca devuelve tareas de otros usuarios
   */
  public getTasksByUserId(
    userId: string,
    filters?: { status?: TaskStatus; priority?: TaskPriority; search?: string }
  ): Task[] {
    let result = this.data.tasks.filter(t => t.userId === userId);

    if (filters?.status) {
      result = result.filter(t => t.status === filters.status);
    }
    if (filters?.priority) {
      result = result.filter(t => t.priority === filters.priority);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }

    // Ordenar: primero las más recientes
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Obtiene una tarea específica verificando estricta pertenencia
   */
  public getTaskByIdAndUserId(taskId: string, userId: string): Task | undefined {
    return this.data.tasks.find(t => t.id === taskId && t.userId === userId);
  }

  /**
   * Consulta cruda de existencia para demostración didáctica de ataque IDOR
   * Permite comprobar si la tarea existe en la base de datos aunque pertenezca a otra persona
   */
  public rawFindTask(taskId: string): Task | undefined {
    return this.data.tasks.find(t => t.id === taskId);
  }

  /**
   * Crea una nueva tarea asignada inexorablemente al usuario autenticado
   */
  public createTask(userId: string, taskInput: {
    title: string;
    description: string;
    priority: TaskPriority;
    status?: TaskStatus;
    dueDate?: string;
  }): Task {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId, // El cliente NO puede manipular este ID
      title: taskInput.title,
      description: taskInput.description || '',
      priority: taskInput.priority || 'medium',
      status: taskInput.status || 'pending',
      dueDate: taskInput.dueDate || undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.data.tasks.push(newTask);
    this.save();
    return newTask;
  }

  /**
   * Actualiza una tarea solo si pertenece al usuario autenticado
   * Retorna null si la tarea no existe o pertenece a otro usuario (Aislamiento de Seguridad)
   */
  public updateTask(
    taskId: string,
    userId: string,
    updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>
  ): Task | null {
    const taskIndex = this.data.tasks.findIndex(t => t.id === taskId && t.userId === userId);
    if (taskIndex === -1) {
      return null; // Rechazo de autorización silencioso/estricto
    }

    const current = this.data.tasks[taskIndex];
    const updated: Task = {
      ...current,
      title: updates.title !== undefined ? updates.title : current.title,
      description: updates.description !== undefined ? updates.description : current.description,
      priority: updates.priority !== undefined ? updates.priority : current.priority,
      status: updates.status !== undefined ? updates.status : current.status,
      dueDate: updates.dueDate !== undefined ? updates.dueDate : current.dueDate,
      updatedAt: new Date().toISOString(),
    };

    this.data.tasks[taskIndex] = updated;
    this.save();
    return updated;
  }

  /**
   * Mueve una tarea al principio de la lista actualizando su fecha de creación al tope
   */
  public moveTaskToTop(taskId: string, userId: string): Task | null {
    const taskIndex = this.data.tasks.findIndex(t => t.id === taskId && t.userId === userId);
    if (taskIndex === -1) {
      return null;
    }
    const current = this.data.tasks[taskIndex];
    const userTasks = this.data.tasks.filter(t => t.userId === userId);
    const maxTime = Math.max(...userTasks.map(t => new Date(t.createdAt).getTime()), Date.now());
    current.createdAt = new Date(maxTime + 1000).toISOString();
    current.updatedAt = new Date().toISOString();
    this.save();
    return current;
  }

  /**
   * Elimina una tarea solo si pertenece al usuario autenticado
   * Retorna false si la tarea pertenece a otro usuario o no existe
   */
  public deleteTask(taskId: string, userId: string): boolean {
    const taskIndex = this.data.tasks.findIndex(t => t.id === taskId && t.userId === userId);
    if (taskIndex === -1) {
      return false; // Rechazo seguro
    }
    this.data.tasks.splice(taskIndex, 1);
    this.save();
    return true;
  }

  /**
   * Cuenta tareas totales por usuario (para métricas de seguridad)
   */
  public getCounts(userId: string) {
    const userTasks = this.data.tasks.filter(t => t.userId === userId);
    return {
      total: userTasks.length,
      pending: userTasks.filter(t => t.status === 'pending').length,
      inProgress: userTasks.filter(t => t.status === 'in_progress').length,
      completed: userTasks.filter(t => t.status === 'completed').length,
    };
  }
}

export const db = new Database();
