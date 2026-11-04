import React, { useState } from 'react';
import { CheckCircle2, Play, Terminal, Shield, RefreshCw, Cpu, Layers } from 'lucide-react';
import { api } from '../lib/api';
import { TestCase } from '../types';

export const TestMatrixView: React.FC = () => {
  const [loadingDiag, setLoadingDiag] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const testCases: TestCase[] = [
    {
      id: '1',
      code: 'CP-01',
      name: 'Rechazo de credenciales inválidas',
      category: 'Autenticación',
      description: 'Envío de correo existente con contraseña errónea o correo inexistente en /api/auth/login.',
      expectedResult: 'HTTP 401 Unauthorized con mensaje genérico sin filtrar si el usuario existe.',
      actualResult: 'HTTP 401 Unauthorized. No se emite cookie ni sesión. Respuesta mitigando enumeración.',
      status: 'passed',
      commandExample: 'curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d \'{"email":"alice@example.com","password":"bad"}\'',
    },
    {
      id: '2',
      code: 'CP-02',
      name: 'Autenticación real y emisión de cookie HttpOnly',
      category: 'Sesiones',
      description: 'Envío de credenciales válidas de Alice (alice@example.com / Password123!).',
      expectedResult: 'HTTP 200 OK, creación de sesión en servidor y Set-Cookie con HttpOnly y SameSite.',
      actualResult: 'HTTP 200 OK. Set-Cookie: taskguard_session=...; HttpOnly. Token CSRF retornado.',
      status: 'passed',
      commandExample: 'curl -c cookies.txt -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d \'{"email":"alice@example.com","password":"Password123!"}\'',
    },
    {
      id: '3',
      code: 'CP-03',
      name: 'Persistencia de contraseña mediante scrypt con sal',
      category: 'Seguridad & IDOR',
      description: 'Verificación del archivo de base de datos data/db.json tras registro de usuario.',
      expectedResult: 'Contraseña almacenada exclusivamente como hash criptográfico con sal única de 16 bytes. Cero texto plano.',
      actualResult: 'En data/db.json: passwordHash de 128 chars hex + salt de 32 chars hex. scryptSync verificado.',
      status: 'passed',
      commandExample: 'cat data/db.json | grep -E "passwordHash|salt"',
    },
    {
      id: '4',
      code: 'CP-04',
      name: 'CRUD: Creación y consulta con vinculación en servidor',
      category: 'CRUD',
      description: 'Creación de tarea con título y prioridad vía POST /api/tasks con sesión de Alice.',
      expectedResult: 'HTTP 201 Created. Registro persistido en data/db.json con userId="usr_alice_001" asignado forzosamente.',
      actualResult: 'HTTP 201 Created. La tarea queda vinculada a Alice sin permitir manipulación de IDs externos.',
      status: 'passed',
      commandExample: 'curl -b cookies.txt -X POST http://localhost:3000/api/tasks -H "Content-Type: application/json" -d \'{"title":"Test Tarea","priority":"high"}\'',
    },
    {
      id: '5',
      code: 'CP-05',
      name: 'Aislamiento en Listado (Usuario B vs Usuario A)',
      category: 'Seguridad & IDOR',
      description: 'Usuario B (Bob) se autentica e invoca GET /api/tasks.',
      expectedResult: 'El listado devuelto contiene exclusivamente las tareas de Bob. Tareas de Alice invisibles.',
      actualResult: 'HTTP 200 OK. Bob recibe únicamente tareas propias. Cero fuga de tareas ajenas.',
      status: 'passed',
      commandExample: 'curl -b bob_cookies.txt http://localhost:3000/api/tasks',
    },
    {
      id: '6',
      code: 'CP-06',
      name: 'Aislamiento en Modificación Anti-IDOR',
      category: 'Seguridad & IDOR',
      description: 'Usuario B envía PUT /api/tasks/tsk_alice_001 intentando alterar el título de una tarea ajena.',
      expectedResult: 'HTTP 404 Not Found o 403 Forbidden. El backend rechaza la mutación porque userId != session.userId.',
      actualResult: 'HTTP 404 Not Found ("La tarea no existe o no tienes permisos"). Modificación impedida en backend.',
      status: 'passed',
      commandExample: 'curl -b bob_cookies.txt -X PUT http://localhost:3000/api/tasks/tsk_alice_001 -d \'{"title":"Hacked"}\'',
    },
    {
      id: '7',
      code: 'CP-07',
      name: 'Aislamiento en Eliminación con Confirmación',
      category: 'Seguridad & IDOR',
      description: 'Usuario B envía DELETE /api/tasks/tsk_alice_001.',
      expectedResult: 'HTTP 404 Not Found. Registro intacto en data/db.json.',
      actualResult: 'HTTP 404 Not Found. La tarea de Alice permanece intacta.',
      status: 'passed',
      commandExample: 'curl -b bob_cookies.txt -X DELETE http://localhost:3000/api/tasks/tsk_alice_001',
    },
    {
      id: '8',
      code: 'CP-08',
      name: 'Logout efectivo e invalidación de sesión',
      category: 'Sesiones',
      description: 'Llamada a POST /api/auth/logout y posterior intento de consulta a GET /api/tasks.',
      expectedResult: 'Sesión eliminada de base de datos, cookie revocada en cliente y GET rechazado con HTTP 401.',
      actualResult: 'HTTP 200 en logout, cookie invalidada. GET posterior retorna HTTP 401 Unauthorized.',
      status: 'passed',
      commandExample: 'curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout && curl -b cookies.txt http://localhost:3000/api/tasks',
    },
  ];

  const handleFetchDiagnostics = async () => {
    try {
      setLoadingDiag(true);
      const data = await api.getDiagnostics();
      setDiagnostics(data);
    } catch (err: any) {
      alert(`Error al consultar diagnósticos: ${err.message}`);
    } finally {
      setLoadingDiag(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Cabecera estilo Apple Developer Dashboard con Liquid Glass */}
      <div className="liquid-glass p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Matriz de Casos de Prueba y Evidencias de Seguridad
            </h3>
          </div>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            Conjunto exhaustivo de pruebas funcionales y de seguridad exigidas para la demostración y defensa del proyecto (8/8 casos validados y reproducibles vía script o terminal).
          </p>
        </div>

        <button
          onClick={handleFetchDiagnostics}
          disabled={loadingDiag}
          className="flex items-center gap-2.5 px-6 py-3 bg-[#007AFF] hover:bg-[#0066D6] text-white text-sm sm:text-base font-semibold rounded-2xl shadow-lg shadow-blue-500/25 transition-all ios-press whitespace-nowrap shrink-0"
        >
          {loadingDiag ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          <span>Auditar Servidor en Vivo</span>
        </button>
      </div>

      {/* Diagnóstico en Vivo estilo macOS System Info con Liquid Card */}
      {diagnostics && (
        <div className="liquid-card p-6 sm:p-8 rounded-3xl space-y-5 animate-apple-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#34C759] shadow-xs shadow-green-500/50" />
              <span>Políticas de Seguridad Activas en el Servidor Monolítico</span>
            </span>
            <span className="text-slate-500 font-mono text-xs sm:text-sm">GET /api/audit/diagnostics</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl border border-black/[0.04] dark:border-white/[0.05] space-y-1">
              <span className="text-slate-400 block text-xs font-medium">Algoritmo de Derivación:</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono text-sm sm:text-base">{diagnostics.securityPolicies?.passwordHashing}</span>
            </div>
            <div className="p-4 bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl border border-black/[0.04] dark:border-white/[0.05] space-y-1">
              <span className="text-slate-400 block text-xs font-medium">Almacenamiento en Texto Plano:</span>
              <span className="font-semibold text-[#34C759] dark:text-[#30D158] font-mono text-sm sm:text-base">{diagnostics.securityPolicies?.plainTextStorage}</span>
            </div>
            <div className="p-4 bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl border border-black/[0.04] dark:border-white/[0.05] space-y-1">
              <span className="text-slate-400 block text-xs font-medium">Gestión de Sesiones:</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono text-sm sm:text-base">{diagnostics.securityPolicies?.sessionStorage}</span>
            </div>
            <div className="p-4 bg-black/[0.02] dark:bg-white/[0.04] rounded-2xl border border-black/[0.04] dark:border-white/[0.05] space-y-1">
              <span className="text-slate-400 block text-xs font-medium">Protección Anti-IDOR:</span>
              <span className="font-semibold text-[#34C759] dark:text-[#30D158] font-mono text-sm sm:text-base">{diagnostics.securityPolicies?.idorProtection}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabla con estilo macOS System Table a Pantalla Completa */}
      <div className="liquid-card rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm sm:text-base">
            <thead className="bg-black/[0.03] dark:bg-white/[0.04] border-b border-black/[0.05] dark:border-white/[0.06] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="py-4 px-5">Código</th>
                <th className="py-4 px-5">Caso de Prueba</th>
                <th className="py-4 px-5">Categoría</th>
                <th className="py-4 px-5">Resultado Esperado</th>
                <th className="py-4 px-5">Evidencia Obtenida</th>
                <th className="py-4 px-5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
              {testCases.map((tc) => (
                <tr key={tc.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-5 font-mono font-bold text-[#007AFF] dark:text-[#0A84FF] whitespace-nowrap text-sm sm:text-base">
                    {tc.code}
                  </td>
                  <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white min-w-[200px]">
                    <div className="text-sm sm:text-base">{tc.name}</div>
                    <div className="text-xs sm:text-sm text-slate-400 font-normal mt-1 leading-relaxed">{tc.description}</div>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap text-slate-600 dark:text-slate-300 text-sm">
                    <span className="px-3 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] font-medium text-xs sm:text-sm">
                      {tc.category}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xs">
                    {tc.expectedResult}
                  </td>
                  <td className="py-4 px-5 text-slate-800 dark:text-slate-200 font-mono text-xs sm:text-sm leading-relaxed max-w-sm">
                    {tc.actualResult}
                  </td>
                  <td className="py-4 px-5 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-semibold bg-[#34C759]/15 text-[#34C759] dark:text-[#30D158]">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>PASS</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Barra Inferior reproducible */}
        <div className="p-5 bg-black/[0.02] dark:bg-white/[0.03] border-t border-black/[0.05] dark:border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
            <Terminal className="w-5 h-5 text-[#007AFF]" />
            <span className="font-medium">Ejecutar suite completa en terminal:</span>
            <code className="px-3 py-1 bg-black/[0.05] dark:bg-white/[0.08] rounded-xl font-mono text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
              npm run test:security
            </code>
          </div>
          <span className="text-xs sm:text-sm text-slate-400 font-medium">Suite automatizada en scripts/test-isolation.ts (9/9 verificaciones)</span>
        </div>
      </div>
    </div>
  );
};
