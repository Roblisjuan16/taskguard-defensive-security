export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCounts {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export interface AuthState {
  user: User | null;
  csrfToken: string | null;
  loading: boolean;
}

export interface TestCase {
  id: string;
  code: string;
  name: string;
  category: 'Autenticación' | 'CRUD' | 'Seguridad & IDOR' | 'Persistencia' | 'Sesiones';
  description: string;
  expectedResult: string;
  actualResult: string;
  status: 'passed' | 'pending' | 'failed';
  commandExample: string;
}

export interface AiInteraction {
  id: number;
  role: 'Analista & Arquitecto' | 'Ingeniero de Seguridad' | 'Tester de Penetración';
  objective: string;
  prompt: string;
  aiProposal: string;
  studentCorrections: string;
  testResult: string;
  verdict: string;
}
