import { User, Task, TaskCounts, TaskPriority, TaskStatus } from '../types';

let cachedSessionToken: string | null =
  typeof window !== 'undefined' ? sessionStorage.getItem('tg_session_token') : null;
let cachedCsrfToken: string | null = null;

export function setSessionToken(token: string | null) {
  cachedSessionToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('tg_session_token', token);
    } else {
      sessionStorage.removeItem('tg_session_token');
    }
  }
}

export function getSessionToken(): string | null {
  return cachedSessionToken;
}

export function setCsrfToken(token: string | null) {
  cachedCsrfToken = token;
}

export function getCsrfToken(): string | null {
  return cachedCsrfToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Soporte de autenticación de sesión en iframes (donde navegadores restringen cookies de terceros)
  if (cachedSessionToken) {
    headers.set('Authorization', `Bearer ${cachedSessionToken}`);
  }

  if (cachedCsrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || '')) {
    headers.set('x-csrf-token', cachedCsrfToken);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include', // Imprescindible para cookies de sesión HttpOnly
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.error || `Error HTTP ${response.status}`;
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // --- Autenticación ---
  async getMe(): Promise<{ authenticated: boolean; user: User | null; sessionToken?: string | null; csrfToken: string | null }> {
    const res = await request<{ authenticated: boolean; user: User | null; sessionToken?: string | null; csrfToken: string | null }>('/api/auth/me');
    if (res.sessionToken) setSessionToken(res.sessionToken);
    if (res.csrfToken) setCsrfToken(res.csrfToken);
    return res;
  },

  async login(email: string, password: string): Promise<{ user: User; sessionToken?: string; csrfToken: string }> {
    const res = await request<{ success: boolean; user: User; sessionToken?: string; csrfToken: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.sessionToken) setSessionToken(res.sessionToken);
    setCsrfToken(res.csrfToken);
    return res;
  },

  async register(name: string, email: string, password: string): Promise<{ user: User; sessionToken?: string; csrfToken: string }> {
    const res = await request<{ success: boolean; user: User; sessionToken?: string; csrfToken: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (res.sessionToken) setSessionToken(res.sessionToken);
    setCsrfToken(res.csrfToken);
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request<{ success: boolean }>('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      setSessionToken(null);
      setCsrfToken(null);
    }
  },

  // --- CRUD de Tareas ---
  async getTasks(params?: { status?: TaskStatus; priority?: TaskPriority; search?: string }): Promise<{ tasks: Task[]; counts: TaskCounts }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString();
    const endpoint = `/api/tasks${qs ? `?${qs}` : ''}`;
    return request<{ success: boolean; tasks: Task[]; counts: TaskCounts }>(endpoint);
  },

  async createTask(taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate?: string;
  }): Promise<{ task: Task }> {
    return request<{ success: boolean; task: Task }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  async updateTask(id: string, updates: Partial<{
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate?: string;
  }>): Promise<{ task: Task }> {
    return request<{ success: boolean; task: Task }>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteTask(id: string): Promise<void> {
    await request<{ success: boolean }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  async moveTaskToTop(id: string): Promise<{ task: Task }> {
    return request<{ success: boolean; task: Task }>(`/api/tasks/${id}/move-top`, {
      method: 'POST',
    });
  },

  // --- Auditoría y Pruebas ---
  async simulateIdor(targetTaskId: string): Promise<any> {
    return request<any>('/api/audit/simulate-idor', {
      method: 'POST',
      body: JSON.stringify({ targetTaskId }),
    });
  },

  async getDiagnostics(): Promise<any> {
    return request<any>('/api/audit/diagnostics');
  },

  async resetSeed(): Promise<void> {
    await request<any>('/api/audit/reset-seed', {
      method: 'POST',
    });
  },
};
