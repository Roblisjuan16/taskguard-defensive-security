import React from 'react';
import {
  ShieldCheck,
  Moon,
  Sun,
  LogOut,
  CheckCircle2,
  ListTodo,
  Terminal,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: 'tasks' | 'idor' | 'ailog' | 'tests' | 'docs';
  setActiveTab: (tab: 'tasks' | 'idor' | 'ailog' | 'tests' | 'docs') => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  darkMode,
  setDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full liquid-glass transition-all">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 h-18 flex items-center justify-between gap-4 md:gap-8">
        
        {/* Zona 1: Estilo macOS Window & Brand Wordmark */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Botones estilo "Traffic Lights" de macOS */}
          <div className="hidden sm:flex items-center gap-1.5 py-1">
            <span className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-black/10 inline-block shadow-xs" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-black/10 inline-block shadow-xs" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-black/10 inline-block shadow-xs" />
          </div>

          <div className="h-5 w-px bg-black/[0.08] dark:bg-white/[0.1] hidden sm:block" />

          {/* Icono de Marca al estilo SF Symbol */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#0051A8] flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-white hover:opacity-85 transition-opacity whitespace-nowrap text-left"
            >
              TaskGuard
            </button>
          </div>
        </div>

        {/* Zona 2: Control Segmentado al estilo macOS Sequoia / iPadOS */}
        <nav className="hidden lg:flex items-center p-1.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl border border-black/[0.04] dark:border-white/[0.05]">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ios-press ${
              activeTab === 'tasks'
                ? 'bg-white dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Mis Tareas</span>
          </button>

          <button
            onClick={() => setActiveTab('idor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ios-press ${
              activeTab === 'idor'
                ? 'bg-white dark:bg-[#2C2C2E] text-[#34C759] dark:text-[#30D158] shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Auditoría Anti-IDOR</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ios-press ${
              activeTab === 'tests'
                ? 'bg-white dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Matriz de Pruebas</span>
          </button>

          <button
            onClick={() => setActiveTab('ailog')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ios-press ${
              activeTab === 'ailog'
                ? 'bg-white dark:bg-[#2C2C2E] text-[#AF52DE] dark:text-[#BF5AF2] shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Bitácora IA</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ios-press ${
              activeTab === 'docs'
                ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>README</span>
          </button>
        </nav>

        {/* Zona 3: Control de Tema y Perfil de Usuario macOS */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.14] transition-all ios-press"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {/* Chip de Usuario Contact Card */}
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-black/[0.03] dark:bg-white/[0.06] rounded-2xl border border-black/[0.04] dark:border-white/[0.05]">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                    {user.name.split(' ')[0]}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-tight">
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Botón de Logout con estilo Apple Destructive */}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#FF3B30] dark:text-[#FF453A] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 rounded-2xl transition-all ios-press whitespace-nowrap"
                title="Cerrar sesión e invalidar cookies"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <span className="text-sm text-slate-400 font-medium">Sin autenticar</span>
          )}
        </div>
      </div>

      {/* Navegación móvil con pestañas de desplazamiento suave */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-2 border-t border-black/[0.04] dark:border-white/[0.06] gap-1 text-xs">
        {[
          { key: 'tasks', label: 'Mis Tareas' },
          { key: 'idor', label: 'Auditoría IDOR' },
          { key: 'tests', label: 'Pruebas' },
          { key: 'ailog', label: 'Bitácora IA' },
          { key: 'docs', label: 'README' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key as any)}
            className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ios-press ${
              activeTab === item.key
                ? 'bg-[#007AFF] text-white font-medium shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
