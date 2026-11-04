import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, User as UserIcon, ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { User } from '../types';

interface AuthModalProps {
  onSuccess: (user: User, csrfToken: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        onSuccess(res.user, res.csrfToken);
      } else {
        const res = await api.register(name, email, password);
        onSuccess(res.user, res.csrfToken);
      }
    } catch (err: any) {
      setError(err.message || 'Error de autenticación. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(userEmail, pass);
      onSuccess(res.user, res.csrfToken);
    } catch (err: any) {
      setError(err.message || 'Error al autenticar usuario predefinido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-2xl animate-apple-fade-in">
      <div className="w-full max-w-lg liquid-glass rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10">
        
        {/* Cabecera estilo macOS Window con Traffic Lights */}
        <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-black/[0.05] dark:border-white/[0.06] text-center relative">
          <div className="absolute left-6 top-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block shadow-xs" />
          </div>

          <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {mode === 'login' ? 'TaskGuard Security' : 'Crear Cuenta Segura'}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Autenticación con sesiones en servidor y hash criptográfico scrypt
          </p>

          {/* Segmented Control iOS para Alternar Login / Registro */}
          <div className="mt-5 flex p-1.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl border border-black/[0.03] dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ios-press ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ios-press ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>
        </div>

        {/* Tarjetas de Acceso Rápido estilo Apple Contact Card */}
        <div className="px-6 sm:px-8 py-4 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2.5">
            <KeyRound className="w-4 h-4 text-[#FF9500]" />
            <span>Acceso rápido preconfigurado para pruebas de aislamiento:</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleQuickLogin('alice@example.com', 'Password123!')}
              disabled={loading}
              className="text-left p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2C2C2E] hover:border-[#007AFF] transition-all ios-press shadow-xs hover:shadow-md"
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">A</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Alice (Usuario A)</div>
              </div>
              <div className="text-xs text-slate-400 font-mono truncate">alice@example.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('bob@example.com', 'SecurePass456!')}
              disabled={loading}
              className="text-left p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2C2C2E] hover:border-[#007AFF] transition-all ios-press shadow-xs hover:shadow-md"
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">B</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Bob (Usuario B)</div>
              </div>
              <div className="text-xs text-slate-400 font-mono truncate">bob@example.com</div>
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3.5 text-xs sm:text-sm text-[#FF3B30] dark:text-[#FF453A] bg-red-500/10 border border-red-500/20 rounded-2xl font-medium">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nombre Completo
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full pl-12 pr-4 py-3 text-sm sm:text-base bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF] transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@dominio.com"
                className="w-full pl-12 pr-4 py-3 text-sm sm:text-base bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF] font-mono transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Contraseña {mode === 'register' && <span className="text-slate-400 font-normal">(mínimo 8 caracteres)</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-12 pr-4 py-3 text-sm sm:text-base bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF] font-mono transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 px-5 bg-[#007AFF] hover:bg-[#0066D6] text-white text-base font-semibold rounded-2xl shadow-lg shadow-blue-500/25 transition-all ios-press flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {loading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="px-6 py-3.5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.05] dark:border-white/[0.06] text-center text-xs text-slate-400">
          Aislamiento garantizado en backend mediante filtrado estricto por sesión
        </div>
      </div>
    </div>
  );
};
