import React from 'react';
import { Bot, UserCheck, CheckCircle2, Terminal, Sparkles, AlertCircle } from 'lucide-react';
import { AiInteraction } from '../types';

export const AiLogView: React.FC = () => {
  const interactions: AiInteraction[] = [
    {
      id: 1,
      role: 'Analista & Arquitecto',
      objective: 'Diseñar la persistencia efectiva sin dependencias de servicios externos complejos (Docker/Cloud SQL) preservando datos tras reinicio.',
      prompt: '¿Cómo podemos persistir los datos de usuarios, sesiones y tareas para una arquitectura monolítica en Node.js que cualquier evaluador pueda clonar y ejecutar con solo npm install y npm run dev sin instalar bases de datos externas?',
      aiProposal: 'El modelo sugirió inicialmente almacenar los datos en variables en memoria (arrays de JavaScript en server.ts) o bien utilizar una base de datos remota MongoDB Atlas / Supabase con cadena de conexión en variables de entorno.',
      studentCorrections: 'Corrección del estudiante (Auditoría Humana): Rechazada la memoria volátil porque no cumple el criterio de retención de datos tras reinicio del servidor. Rechazada la base de datos externa en la nube porque incumple el criterio de "ejecución local sin dependencias de servicios externos complejos". Se instruyó implementar un motor de persistencia transaccional local en disco (/data/db.json) con escritura atómica (.tmp + renameSync) y migración/semilla inicial automática.',
      testResult: 'Se crearon tareas, se reinició el servidor Express y tras reiniciar el proceso los datos de Alice y Bob continuaron intactos. El archivo data/db.json conserva la información.',
      verdict: 'Aprobado: Persistencia efectiva cumplida al 100% de forma local y reproducible.',
    },
    {
      id: 2,
      role: 'Ingeniero de Seguridad',
      objective: 'Implementar autenticación robusta mediante hashing con sal criptográfica y gestión de sesiones mediante cookies HttpOnly contra ataques XSS y robo de tokens.',
      prompt: 'Genera el sistema de autenticación para los usuarios y las sesiones de la plataforma.',
      aiProposal: 'El modelo propuso almacenar contraseñas usando un hash simple MD5/SHA-256 sin sal y emitir un token JWT que se guardara en el localStorage del navegador del cliente.',
      studentCorrections: 'Corrección del estudiante (Auditoría Humana): Se identificaron dos fallas críticas en la propuesta de la IA: 1) Almacenar contraseñas con hashes rápidos sin sal facilita ataques por tablas rainbow; se exigió reemplazarlo por scrypt con sal aleatoria criptográfica de 16 bytes y comparación en tiempo constante (crypto.timingSafeEqual). 2) Almacenar tokens de autenticación en localStorage expone al usuario a robo de credenciales mediante ataques XSS (cualquier script inyectado puede leer localStorage); se exigió sustituirlo por sesiones gestionadas en el servidor con cookies seguras (HttpOnly, SameSite=Lax, Path=/) y token CSRF sincronizado.',
      testResult: 'Prueba con document.cookie en la consola del navegador: la cookie taskguard_session resulta inaccesible para scripts JS. Contraseñas verificadas en data/db.json: ninguna está en texto plano, todas poseen hash scrypt y sal única.',
      verdict: 'Aprobado: Cumplimiento estricto de seguridad de credenciales y sesiones.',
    },
    {
      id: 3,
      role: 'Tester de Penetración',
      objective: 'Garantizar el aislamiento estricto por usuario en el backend (Anti-IDOR) evitando confiar en identificadores enviados desde el cliente.',
      prompt: 'Crea los endpoints del CRUD de tareas en Express: listar, crear, actualizar y eliminar.',
      aiProposal: 'El modelo propuso endpoints donde el cliente enviaba el taskId y el userId en el body o query params (ej. DELETE /api/tasks/:id?userId=...) y en la base de datos se buscaba simplemente por task.id sin validar si pertenecía al usuario de la sesión.',
      studentCorrections: 'Corrección del estudiante (Auditoría Humana): Detección de vulnerabilidad IDOR (Insecure Direct Object Reference) de severidad crítica. Un usuario malicioso podría enviar el ID de la tarea de otro usuario y modificarla o borrarla. Se corrigió forzando que el backend NUNCA confíe en el userId del cliente: el userId se extrae exclusivamente del middleware de sesión autenticada (req.user.id). Las consultas a la base de datos fueron modificadas a: getTaskByIdAndUserId(taskId, req.user.id). Si el registro no pertenece al usuario autenticado, el backend retorna 404/403 de forma hermética.',
      testResult: 'Se ejecutó el script scripts/test-isolation.ts simulando al Usuario B (Bob) intentando leer, editar y eliminar la tarea de Alice (tsk_alice_001). Todas las peticiones fueron bloqueadas con HTTP 404/403. Cero fuga de datos.',
      verdict: 'Aprobado: Aislamiento por usuario validado y demostrado técnicamente.',
    },
  ];

  return (
    <div className="w-full space-y-6">
      
      {/* Cabecera estilo Apple Keynote / WWDC Notes con Liquid Glass */}
      <div className="liquid-glass p-6 sm:p-8 rounded-3xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#AF52DE] to-[#5856D6] text-white flex items-center justify-center shadow-md shadow-purple-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Bitácora de Trabajo Metodológico con IA (Criterios de Evaluación)
              </h3>
            </div>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-4xl leading-relaxed">
              Evidencia de auditoría y dirección humana según la rúbrica oficial (15% de ponderación). Demuestra el rol activo del estudiante como supervisor técnico, auditando el código sugerido por la IA y corrigiendo fallas de arquitectura, seguridad y aislamiento de datos.
            </p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-[#AF52DE]/10 text-[#AF52DE] dark:text-[#BF5AF2] font-semibold text-sm border border-[#AF52DE]/20 shrink-0">
            3 Iteraciones Clave
          </div>
        </div>
      </div>

      {/* Lista de Interacciones a Pantalla Completa con Liquid Cards */}
      <div className="space-y-6 w-full">
        {interactions.map((item) => (
          <div
            key={item.id}
            className="liquid-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm"
          >
            {/* Encabezado de la interacción */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/[0.05] dark:border-white/[0.06] gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#AF52DE] dark:text-[#BF5AF2] font-mono px-3 py-1 rounded-xl bg-[#AF52DE]/10">
                  Iteración #{item.id}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Rol: {item.role}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#34C759] dark:text-[#30D158] bg-[#34C759]/10 px-3.5 py-1.5 rounded-2xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>Supervisión Humana Aprobada</span>
              </div>
            </div>

            {/* Objetivo */}
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Objetivo Técnico Específico:
              </div>
              <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-snug">
                {item.objective}
              </p>
            </div>

            {/* Grid Prompt vs Propuesta vs Corrección Humana */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* 1. Prompt del Estudiante */}
              <div className="p-5 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.04] dark:border-white/[0.05] space-y-2 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#007AFF] uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    <span>Prompt Formulado</span>
                  </div>
                  <p className="text-sm sm:text-base font-mono text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{item.prompt}"
                  </p>
                </div>
                <div className="text-xs text-slate-400 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                  Instrucción estructurada sin sesgo
                </div>
              </div>

              {/* 2. Propuesta Inicial del Modelo */}
              <div className="p-5 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] rounded-2xl border border-amber-500/20 space-y-2 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#FF9500] dark:text-[#FF9F0A] uppercase tracking-wider flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    <span>Propuesta Inicial del Modelo</span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.aiProposal}
                  </p>
                </div>
                <div className="text-xs text-[#FF9500] font-medium pt-2 border-t border-amber-500/10 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Requirió intervención crítica</span>
                </div>
              </div>

              {/* 3. Correcciones del Estudiante (Auditoría Humana) */}
              <div className="p-5 bg-[#34C759]/[0.04] dark:bg-[#34C759]/[0.06] rounded-2xl border border-[#34C759]/30 space-y-2 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#34C759] dark:text-[#30D158] uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span>Auditoría y Corrección Humana</span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {item.studentCorrections}
                  </p>
                </div>
                <div className="text-xs text-[#34C759] font-semibold pt-2 border-t border-[#34C759]/15">
                  Decisión técnica respaldada
                </div>
              </div>

            </div>

            {/* Resultado de la prueba empírica */}
            <div className="p-4 sm:p-5 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.04] dark:border-white/[0.05] space-y-2">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Evidencia Experimental y Veredicto:
              </div>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {item.testResult}
              </p>
              <div className="text-sm font-bold text-[#34C759] dark:text-[#30D158] pt-1">
                {item.verdict}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};
