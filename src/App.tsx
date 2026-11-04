import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TaskWorkspace } from './components/TaskWorkspace';
import { IdorAuditView } from './components/IdorAuditView';
import { AiLogView } from './components/AiLogView';
import { TestMatrixView } from './components/TestMatrixView';
import { DocumentationView } from './components/DocumentationView';
import { AuthModal } from './components/AuthModal';
import { api } from './lib/api';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'idor' | 'ailog' | 'tests' | 'docs'>('tasks');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sincronización del tema oscuro con el elemento html raíz
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Verificación de sesión activa al cargar la aplicación
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const res = await api.getMe();
        if (res.authenticated && res.user) {
          setUser(res.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Sin sesión activa previa:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleAuthSuccess = (authenticatedUser: User, csrfToken?: string) => {
    if (csrfToken) {
      api.getMe(); // Sincroniza el estado de la sesión
    }
    setUser(authenticatedUser);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setUser(null);
      setActiveTab('tasks');
    }
  };

  // Cambio de usuario para la demostración de aislamiento (Alice <-> Bob)
  const handleSwitchUser = async (email: string, pass: string) => {
    try {
      const res = await api.login(email, pass);
      setUser(res.user);
    } catch (err: any) {
      alert(`Error al cambiar de usuario: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-[#007AFF]/25">
      
      {/* Barra de Navegación Superior */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Área de Contenido Principal a Pantalla Completa (100% Viewport) */}
      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 transition-all">
        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-3 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 font-mono">
              Verificando sesión en servidor...
            </p>
          </div>
        ) : !user ? (
          <AuthModal onSuccess={handleAuthSuccess} />
        ) : (
          <div className="animate-apple-fade-in w-full">
            {activeTab === 'tasks' && <TaskWorkspace user={user} />}
            {activeTab === 'idor' && <IdorAuditView currentUser={user} onSwitchUser={handleSwitchUser} />}
            {activeTab === 'ailog' && <AiLogView />}
            {activeTab === 'tests' && <TestMatrixView />}
            {activeTab === 'docs' && <DocumentationView />}
          </div>
        )}
      </main>

      {/* Pie de Página sobrio y limpio a 100% */}
      <footer className="w-full border-t border-black/[0.05] dark:border-white/[0.06] bg-white/40 dark:bg-[#121214]/60 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-medium">TaskGuard · Plataforma Monolítica Segura con Aislamiento de Datos</div>
          <div className="text-xs text-slate-400">
            Node.js / Express · Persistencia Local · Hashing scrypt · Cookies HttpOnly
          </div>
        </div>
      </footer>
    </div>
  );
}
