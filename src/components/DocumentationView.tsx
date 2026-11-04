import React from 'react';
import { BookOpen, Copy, Check, Terminal, Shield, Layers, Server, HardDrive, Key, CheckCircle } from 'lucide-react';

export const DocumentationView: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const cloneCommands = `# Clonar repositorio
git clone <URL_DEL_REPOSITORIO>
cd taskguard

# Instalar dependencias exactas
npm install

# Iniciar servidor monolítico seguro (Frontend + Backend)
npm run dev`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cloneCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Banner Principal estilo macOS Sequoia Control Card con Liquid Glass */}
      <div className="liquid-glass p-6 sm:p-8 rounded-3xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                <BookOpen className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                README Reproducible y Guía de Arquitectura Monolítica
              </h3>
            </div>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-4xl leading-relaxed">
              Guía técnica paso a paso para levantar el proyecto desde cero, configuración de variables de entorno seguras, decisiones de arquitectura y comandos de verificación de seguridad para la defensa universitaria.
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#34C759]/10 text-[#34C759] dark:text-[#30D158] font-semibold text-sm border border-[#34C759]/20 shrink-0">
            <CheckCircle className="w-4 h-4" />
            <span>100% Reproducible</span>
          </div>
        </div>
      </div>

      {/* Grid de 2 Columnas para Máximo Aprovechamiento del Viewport (100% de la pantalla) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        
        {/* 1. Paso a paso para levantar el proyecto */}
        <div className="liquid-card p-6 sm:p-8 rounded-3xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-[#34C759]" />
                <span>1. Despliegue y Ejecución Local desde Cero</span>
              </h4>
              <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] text-slate-500">
                Node.js 18+
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              La plataforma es completamente autosuficiente. No requiere Docker, bases de datos externas en la nube ni servicios adicionales:
            </p>

            <div className="relative group">
              <pre className="p-5 bg-[#1C1C1E] text-slate-200 rounded-2xl font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed border border-white/10 shadow-lg">
                {cloneCommands}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-3.5 right-3.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all text-xs font-semibold flex items-center gap-1.5 ios-press backdrop-blur-md"
              >
                {copied ? <Check className="w-4 h-4 text-[#34C759]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl text-xs sm:text-sm space-y-1.5 border border-black/[0.03] dark:border-white/[0.04] mt-2">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#34C759]" />
              URL de Acceso Local Inmediato:
            </span>
            <div className="font-mono text-sm sm:text-base font-bold text-[#007AFF] dark:text-[#0A84FF]">
              http://localhost:3000
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              El proceso inicializa automáticamente la base de datos local en <code className="font-mono font-semibold">./data/db.json</code> con usuarios de prueba precargados (Alice y Bob).
            </p>
          </div>
        </div>

        {/* 2. Variables de entorno */}
        <div className="liquid-card p-6 sm:p-8 rounded-3xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Key className="w-5 h-5 text-[#007AFF]" />
                <span>2. Variables de Entorno Seguras (.env)</span>
              </h4>
              <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-blue-500/10 text-[#007AFF] font-semibold">
                Sin Secretos Expuestos
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Cumpliendo el criterio de seguridad, ninguna clave secreta se sube a control de versiones. Se suministra exclusivamente un archivo de plantilla <code className="font-mono text-[#007AFF] font-bold">.env.example</code>:
            </p>

            <pre className="p-5 bg-[#1C1C1E] text-slate-200 rounded-2xl font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed border border-white/10 shadow-lg">
{`# Archivo de configuración: .env.example
PORT=3000
SESSION_SECRET="super-secret-taskguard-encryption-key-change-in-production"
NODE_ENV=development`}
            </pre>
          </div>

          <div className="p-4 bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl text-xs sm:text-sm space-y-1.5 border border-black/[0.03] dark:border-white/[0.04] mt-2">
            <span className="font-semibold text-slate-900 dark:text-white">
              Criterio de Evaluación Cumplido:
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Las claves de sesión se cargan mediante <code className="font-mono">process.env</code> con fallback seguro en desarrollo, aislando completamente las credenciales reales del código fuente.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Arquitectura y Seguridad Defensiva a Pantalla Completa */}
      <div className="liquid-card p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
          <Layers className="w-6 h-6 text-[#AF52DE]" />
          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            3. Decisiones de Arquitectura y Seguridad Defensiva (Para Defensa del Proyecto)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          
          <div className="p-5 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.04] dark:border-white/[0.05] space-y-2.5">
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4.5 h-4.5 text-[#007AFF]" />
              <span>Monolito Unificado</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Un único proceso Express en el puerto 3000 coordina la API REST segura y sirve los componentes React de Vite en dev y prod. Evita problemas de CORS y latencia de red entre servicios.
            </p>
          </div>

          <div className="p-5 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.04] dark:border-white/[0.05] space-y-2.5">
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-[#34C759]" />
              <span>Anti-IDOR Estricto</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Toda consulta CRUD en el backend exige forzosamente <code className="font-mono text-[#007AFF]">userId === req.user.id</code> extraído de la sesión. Es imposible que el cliente suplante el ID de otro usuario.
            </p>
          </div>

          <div className="p-5 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.04] dark:border-white/[0.05] space-y-2.5">
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4.5 h-4.5 text-[#FF9500]" />
              <span>Cookies & scrypt</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Cookies seguras con <code className="font-mono text-xs">HttpOnly; SameSite</code> inmunes a lectura por scripts JS (anti-XSS). Contraseñas con 16 bytes de sal criptográfica aleatoria y 64 bytes derivados vía scrypt.
            </p>
          </div>

          <div className="p-5 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.04] dark:border-white/[0.05] space-y-2.5">
            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-4.5 h-4.5 text-[#AF52DE]" />
              <span>Persistencia Atómica</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Escritura atómica en <code className="font-mono">./data/db.json</code> usando archivo temporal y <code className="font-mono">fs.renameSync</code>. Los datos persisten de manera confiable tras recargas o reinicios de servidor.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
