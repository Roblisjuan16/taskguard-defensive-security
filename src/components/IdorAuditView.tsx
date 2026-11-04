import React, { useState } from 'react';
import {
  ShieldCheck,
  Play,
  Terminal,
  Lock,
  ArrowRightLeft,
  RefreshCw,
  Cpu,
  Key,
} from 'lucide-react';
import { api } from '../lib/api';
import { User } from '../types';

interface IdorAuditViewProps {
  currentUser: User;
  onSwitchUser: (email: string, pass: string) => Promise<void>;
}

export const IdorAuditView: React.FC<IdorAuditViewProps> = ({ currentUser, onSwitchUser }) => {
  const [targetId, setTargetId] = useState('tsk_alice_001');
  const [running, setRunning] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [switching, setSwitching] = useState(false);

  const isAlice = currentUser.email === 'alice@example.com';

  const handleRunSimulation = async () => {
    try {
      setRunning(true);
      const result = await api.simulateIdor(targetId);
      setAuditResult(result);
    } catch (err: any) {
      setAuditResult({
        error: true,
        message: err.message,
        statusCode: err.status || 500,
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSwitchIdentity = async () => {
    try {
      setSwitching(true);
      if (isAlice) {
        await onSwitchUser('bob@example.com', 'SecurePass456!');
        setTargetId('tsk_alice_001'); // Bob intentando acceder a tarea de Alice
      } else {
        await onSwitchUser('alice@example.com', 'Password123!');
        setTargetId('tsk_bob_001'); // Alice intentando acceder a tarea de Bob
      }
      setAuditResult(null);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Banner Principal estilo macOS Sequoia Control Card con Liquid Glass */}
      <div className="liquid-glass p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#34C759] text-white flex items-center justify-center shadow-md shadow-green-500/25">
                <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Auditoría de Aislamiento y Control de Acceso (Anti-IDOR)
              </h3>
            </div>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-4xl leading-relaxed">
              Verifica en vivo que el backend de TaskGuard aplique el principio de <span className="font-semibold text-slate-900 dark:text-white">Confianza Cero en el Cliente</span>. El servidor valida obligatoriamente que cada registro pertenezca al <code className="font-mono text-[#007AFF] font-bold">userId</code> de la sesión autenticada.
            </p>
          </div>

          {/* Botón de alternancia rápida estilo Apple System Control */}
          <button
            onClick={handleSwitchIdentity}
            disabled={switching}
            className="flex items-center gap-3 px-6 py-3.5 bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] text-slate-900 dark:text-white text-sm sm:text-base font-semibold rounded-2xl transition-all ios-press whitespace-nowrap shrink-0 self-start md:self-center border border-black/[0.04] dark:border-white/[0.06] shadow-sm"
          >
            <ArrowRightLeft className="w-5 h-5 text-[#007AFF]" />
            <span>
              {switching ? 'Alternando...' : isAlice ? 'Cambiar a Bob (Usuario B)' : 'Cambiar a Alice (Usuario A)'}
            </span>
          </button>
        </div>
      </div>

      {/* Grid de Configuración y Terminal macOS a Pantalla Completa (100% Viewport) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        
        {/* Panel de Configuración de la Prueba Liquid Card */}
        <div className="lg:col-span-5 liquid-card p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
              <Lock className="w-5 h-5 text-[#007AFF]" />
              <span>Escenario de Prueba Activo</span>
            </div>

            <div className="p-5 bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl space-y-3 text-sm sm:text-base border border-black/[0.03] dark:border-white/[0.04]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Usuario Autenticado:</span>
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
                  {currentUser.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Correo de Sesión:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 text-sm font-medium">{currentUser.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">ID en Servidor:</span>
                <span className="font-mono text-sm font-semibold text-[#007AFF]">{currentUser.id}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
                ID de Tarea Objetivo (Manipulación forzada en Cliente):
              </label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="tsk_alice_001"
                className="w-full px-4 py-3 text-sm sm:text-base font-mono bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setTargetId('tsk_alice_001')}
                  className="text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-[#007AFF] font-mono ios-press border border-black/[0.04] dark:border-white/[0.05]"
                >
                  Tarea de Alice: tsk_alice_001
                </button>
                <button
                  type="button"
                  onClick={() => setTargetId('tsk_bob_001')}
                  className="text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-[#007AFF] font-mono ios-press border border-black/[0.04] dark:border-white/[0.05]"
                >
                  Tarea de Bob: tsk_bob_001
                </button>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={running}
              className="w-full py-3.5 px-6 bg-[#34C759] hover:bg-[#2FB34F] text-white text-sm sm:text-base font-semibold rounded-2xl shadow-lg shadow-green-500/25 transition-all ios-press flex items-center justify-center gap-2.5"
            >
              {running ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              <span>Ejecutar Prueba de Acceso Cruzado</span>
            </button>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs sm:text-sm text-blue-900 dark:text-blue-300 space-y-2 mt-4">
            <span className="font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#007AFF]" />
              <span>Regla de Seguridad Enforzada en Backend:</span>
            </span>
            <p className="leading-relaxed">
              Aun si un cliente malicioso inyecta el ID ajeno en la URL o cuerpo de la petición, la consulta interna siempre ejecuta:
            </p>
            <code className="block p-2.5 bg-black/[0.05] dark:bg-black/40 rounded-xl font-mono text-xs text-[#007AFF] dark:text-[#5AC8FA]">
              WHERE id = :taskId AND userId = :currentSessionUserId
            </code>
          </div>
        </div>

        {/* Ventana de Terminal al estilo macOS Terminal / iTerm */}
        <div className="lg:col-span-7 bg-[#1C1C1E] text-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/[0.1] flex flex-col font-mono text-xs sm:text-sm overflow-hidden">
          
          {/* Barra de Título de la Ventana macOS */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block shadow-xs" />
            </div>
            <div className="text-xs text-slate-400 font-sans font-medium flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>taskguard-security-auditor — zsh</span>
            </div>
            <div className="w-12" />
          </div>

          {auditResult ? (
            <div className="space-y-3.5 flex-1 overflow-auto max-h-[460px] pt-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">[AUDIT LOG]</span>
                <span className="text-[#30D158]">POST /api/audit/simulate-idor</span>
                <span className="text-slate-500 font-sans">
                  {new Date(auditResult.timestamp || Date.now()).toLocaleTimeString()}
                </span>
              </div>

              <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/[0.06] space-y-1.5 text-xs sm:text-sm">
                <div><span className="text-slate-400">Emisor:</span> <span className="text-white">{auditResult.attacker?.email}</span> (ID: {auditResult.attacker?.userId})</div>
                <div><span className="text-slate-400">Objetivo:</span> <span className="text-amber-400 font-bold">{auditResult.target?.taskId}</span></div>
                <div><span className="text-slate-400">¿Existe en BD?:</span> <span className="text-white">{auditResult.target?.existsInDatabase ? 'SÍ' : 'NO'}</span></div>
                <div><span className="text-slate-400">Dueño Real:</span> <span className="text-blue-400">{auditResult.target?.realOwnerUserId}</span></div>
                <div><span className="text-slate-400">¿Intento Cruzado?:</span> <span className="text-[#FF453A] font-bold">{auditResult.target?.isBelongingToAnotherUser ? 'SÍ (REQUERÍA BLOQUEO)' : 'NO (MISMO USUARIO)'}</span></div>
              </div>

              <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/[0.06] space-y-1.5 text-xs sm:text-sm">
                <div className="text-slate-400 font-semibold">// Respuesta del Servidor:</div>
                <div className="text-emerald-400">Filtro aplicado: {auditResult.backendVerification?.queryFilter}</div>
                <div>Código HTTP Retornado: <span className="text-amber-400 font-bold">{auditResult.backendVerification?.httpStatusCode}</span></div>
                <div>Estado de Defensa: <span className="text-[#30D158] font-bold">{auditResult.backendVerification?.defenseStatus}</span></div>
                <div>¿Información Expuesta?: <span className="text-white font-bold">{auditResult.backendVerification?.dataExposed ? 'SÍ (VULNERABLE)' : 'NO (CERO FUGA)'}</span></div>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-emerald-300 text-xs sm:text-sm">
                <div className="font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Veredicto de Auditoría:</span>
                </div>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-emerald-200 font-sans">
                  {auditResult.verdict}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-500 space-y-3">
              <Terminal className="w-10 h-10 opacity-30" />
              <p className="text-sm font-sans max-w-sm">
                Presiona "Ejecutar Prueba de Acceso Cruzado" para observar la respuesta del servidor en tiempo real.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
