import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Check,
  Clock,
  Calendar,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  Layers,
  Flag,
  Sparkles,
  Inbox,
  ArrowUpDown,
  TrendingUp,
  CheckCircle2,
  ArrowUpToLine,
  Copy,
  Link,
  MoreHorizontal,
} from 'lucide-react';
import { api } from '../lib/api';
import { Task, TaskCounts, TaskPriority, TaskStatus, User } from '../types';

interface TaskWorkspaceProps {
  user: User;
}

export const TaskWorkspace: React.FC<TaskWorkspaceProps> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState<TaskCounts>({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros al estilo Apple Reminders
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estado del Menú Contextual macOS
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    task: Task | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    task: null,
  });

  // Notificación flotante estilo macOS HUD / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2400);
  };

  // Cierre automático del menú contextual al hacer clic fuera, scroll o presionar Escape
  useEffect(() => {
    const handleClose = () => {
      if (contextMenu.visible) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu.visible]);

  // Carga inicial y reactiva
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTasks({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: search.trim() ? search.trim() : undefined,
      });
      setTasks(res.tasks);
      setCounts(res.counts);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las tareas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user.id, statusFilter, priorityFilter, search]);

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsFormModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    try {
      setDeleteLoading(true);
      await api.deleteTask(deletingTask.id);
      setDeletingTask(null);
      showToast('Recordatorio eliminado');
      await loadTasks();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleQuickStatusToggle = async (task: Task) => {
    const nextStatus: TaskStatus =
      task.status === 'completed' ? 'pending' : task.status === 'pending' ? 'in_progress' : 'completed';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      showToast(nextStatus === 'completed' ? 'Recordatorio marcado como completado' : 'Estado actualizado');
      await loadTasks();
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  // Apertura del Menú Contextual Secundario (clic derecho)
  const handleTaskContextMenu = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 230;
    const menuHeight = 280;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 16;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 16;
    }

    setContextMenu({
      visible: true,
      x: Math.max(16, x),
      y: Math.max(16, y),
      task,
    });
  };

  // Acción: Mover al principio
  const handleMoveToTop = async (task: Task) => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
    try {
      await api.moveTaskToTop(task.id);
      showToast('Recordatorio movido al principio');
      await loadTasks();
    } catch (err: any) {
      alert(`Error al mover: ${err.message}`);
    }
  };

  // Acción: Duplicar tarea
  const handleDuplicate = async (task: Task) => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
    try {
      await api.createTask({
        title: `${task.title} (Copia)`,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
      });
      showToast('Recordatorio duplicado');
      await loadTasks();
    } catch (err: any) {
      alert(`Error al duplicar: ${err.message}`);
    }
  };

  // Acción: Copiar enlace de la tarea
  const handleCopyLink = async (task: Task) => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
    try {
      const url = `${window.location.origin}/#task-${task.id}`;
      await navigator.clipboard.writeText(url);
      showToast('Enlace de la tarea copiado al portapapeles');
    } catch (err) {
      showToast(`ID copiado: ${task.id}`);
    }
  };

  const priorityMeta: Record<TaskPriority, { label: string; color: string; iconCount: number }> = {
    low: { label: 'Baja', color: 'text-slate-400 dark:text-slate-500', iconCount: 1 },
    medium: { label: 'Media', color: 'text-[#007AFF] dark:text-[#0A84FF]', iconCount: 1 },
    high: { label: 'Alta', color: 'text-[#FF9500] dark:text-[#FF9F0A]', iconCount: 2 },
    urgent: { label: 'Urgente', color: 'text-[#FF3B30] dark:text-[#FF453A]', iconCount: 3 },
  };

  const statusLabels: Record<TaskStatus, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completada',
  };

  const completionPercentage =
    counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

  const getMotivationalMessage = () => {
    if (counts.total === 0) return 'Sin tareas registradas en tu espacio de trabajo.';
    if (completionPercentage === 100) return '¡Objetivos alcanzados al 100%! Excelente productividad.';
    if (completionPercentage >= 75) return '¡Casi listo! Solo faltan unos pocos recordatorios.';
    if (completionPercentage >= 50) return '¡Más de la mitad completada! Mantén el ritmo.';
    if (completionPercentage > 0) return 'Progreso activo en curso hacia tus objetivos.';
    return 'Comienza completando tus primeras tareas pendientes.';
  };

  return (
    <div className="space-y-6">
      
      {/* Tarjetas KPI de Apple Reminders con Liquid Glass y Tipografía Cómoda */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total (Apple Blue) */}
        <div className="liquid-card p-5 rounded-3xl hover:translate-y-[-2px] transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Inbox className="w-5 h-5" />
            </div>
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
              {counts.total}
            </span>
          </div>
          <div className="mt-3.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
            Todas las Tareas
          </div>
        </div>

        {/* Pendientes (Apple Orange) */}
        <div className="liquid-card p-5 rounded-3xl hover:translate-y-[-2px] transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#FF9500] text-white flex items-center justify-center shadow-md shadow-orange-500/25">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#FF9500] dark:text-[#FF9F0A] font-mono tabular-nums">
              {counts.pending}
            </span>
          </div>
          <div className="mt-3.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
            Pendientes
          </div>
        </div>

        {/* En Progreso (Apple Purple) */}
        <div className="liquid-card p-5 rounded-3xl hover:translate-y-[-2px] transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#AF52DE] text-white flex items-center justify-center shadow-md shadow-purple-500/25">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#AF52DE] dark:text-[#BF5AF2] font-mono tabular-nums">
              {counts.inProgress}
            </span>
          </div>
          <div className="mt-3.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
            En Progreso
          </div>
        </div>

        {/* Completadas (Apple Green) */}
        <div className="liquid-card p-5 rounded-3xl hover:translate-y-[-2px] transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#34C759] text-white flex items-center justify-center shadow-md shadow-green-500/25">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#34C759] dark:text-[#30D158] font-mono tabular-nums">
              {counts.completed}
            </span>
          </div>
          <div className="mt-3.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
            Completadas
          </div>
        </div>
      </div>

      {/* Barra de Progreso Visual Estilo Apple Activity / Reminders Liquid Card */}
      <div className="liquid-card p-5 sm:p-6 rounded-3xl space-y-3.5 hover:translate-y-[-1px] transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#007AFF] via-[#5856D6] to-[#34C759] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Progreso de Cumplimiento
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#34C759]/15 text-[#34C759] dark:text-[#30D158]">
                  {counts.completed} de {counts.total} completadas
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {getMotivationalMessage()}
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 self-start sm:self-center">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white tabular-nums">
              {completionPercentage}%
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">
              completado
            </span>
          </div>
        </div>

        {/* Pista de la Barra con Refracción Especular y Animación de Resorte de Apple */}
        <div className="relative w-full h-3.5 sm:h-4 bg-black/[0.05] dark:bg-white/[0.07] rounded-full p-0.5 overflow-hidden shadow-inner border border-black/[0.03] dark:border-white/[0.05]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#007AFF] via-[#5856D6] to-[#34C759] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative shadow-[0_0_14px_rgba(52,199,89,0.35)]"
            style={{ width: `${Math.max(completionPercentage, 0)}%` }}
          >
            {/* Brillo especular superior simulando cristal curvado */}
            <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 to-transparent rounded-full pointer-events-none" />
          </div>
        </div>

        {/* Desglose rápido de métricas con micro-indicadores */}
        <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34C759] shadow-xs shadow-green-500/50" />
              <span>{counts.completed} Finalizadas</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#AF52DE] shadow-xs shadow-purple-500/50" />
              <span>{counts.inProgress} En Progreso</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500] shadow-xs shadow-orange-500/50" />
              <span>{counts.pending} Pendientes</span>
            </span>
          </div>
          {counts.total > 0 && (
            <span className="font-mono text-xs sm:text-sm text-slate-400">
              {counts.total - counts.completed} restantes
            </span>
          )}
        </div>
      </div>

      {/* Barra de Controles y Búsqueda Liquid Glass */}
      <div className="liquid-glass p-5 rounded-3xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Buscador estilo Spotlight con mayor visibilidad */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, contenido o notas..."
              className="w-full pl-12 pr-4 py-3 text-sm sm:text-base bg-black/[0.04] dark:bg-white/[0.08] border border-transparent rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#1E1E1E] focus:ring-2 focus:ring-[#007AFF] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Botón de Acción Primaria */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2.5 px-6 py-3 bg-[#007AFF] hover:bg-[#0066D6] text-white text-sm sm:text-base font-semibold rounded-2xl shadow-lg shadow-blue-500/25 transition-all ios-press shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Nuevo Recordatorio</span>
          </button>
        </div>

        {/* Segmented Control iOS para Estados y Prioridades */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
          
          {/* Selector de Estado */}
          <div className="flex items-center p-1.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl border border-black/[0.04] dark:border-white/[0.05]">
            {(['all', 'pending', 'in_progress', 'completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all ios-press ${
                  statusFilter === st
                    ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st === 'all' ? 'Todas' : statusLabels[st]}
              </button>
            ))}
          </div>

          {/* Selector de Prioridad */}
          <div className="flex items-center p-1.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl border border-black/[0.04] dark:border-white/[0.05]">
            {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((pr) => (
              <button
                key={pr}
                onClick={() => setPriorityFilter(pr)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all ios-press ${
                  priorityFilter === pr
                    ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {pr === 'all' ? 'Prioridad' : priorityMeta[pr].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Tareas Liquid Glass con Tipografía Cómoda */}
      {loading ? (
        <div className="liquid-card p-14 text-center rounded-3xl">
          <div className="w-10 h-10 border-3 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            Sincronizando recordatorios...
          </p>
        </div>
      ) : error ? (
        <div className="liquid-card p-6 bg-red-500/10 border-red-500/20 rounded-3xl text-center">
          <p className="text-sm text-[#FF3B30] dark:text-[#FF453A] font-semibold">{error}</p>
          <button
            onClick={loadTasks}
            className="mt-3 px-5 py-2 text-sm font-semibold bg-[#FF3B30] text-white rounded-2xl ios-press"
          >
            Reintentar
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="liquid-card p-16 text-center rounded-3xl border-dashed">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#007AFF]/15 flex items-center justify-center text-[#007AFF] mb-4 shadow-inner">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Lista de Tareas Vacía</h3>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {search || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'No se encontraron recordatorios con los filtros seleccionados.'
              : 'No tienes recordatorios pendientes asignados a tu cuenta. Agrega uno nuevo para comenzar.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#007AFF] hover:bg-[#0066D6] text-white text-sm font-semibold rounded-2xl shadow-lg shadow-blue-500/25 ios-press"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Crear Recordatorio</span>
          </button>
        </div>
      ) : (
        <div className="liquid-card rounded-3xl divide-y divide-black/[0.05] dark:divide-white/[0.06] overflow-hidden shadow-sm">
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const meta = priorityMeta[task.priority];

            return (
              <div
                key={task.id}
                onContextMenu={(e) => handleTaskContextMenu(e, task)}
                className="p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors flex items-start justify-between gap-4 group cursor-default"
              >
                {/* Lado Izquierdo: Checkbox circular */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <button
                    onClick={() => handleQuickStatusToggle(task)}
                    className="mt-1 shrink-0 ios-press group/check"
                    title={`Estado: ${statusLabels[task.status]}. Clic para cambiar.`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-[#34C759] text-white border-transparent shadow-xs'
                          : task.status === 'in_progress'
                          ? 'border-2 border-[#007AFF] text-[#007AFF] bg-blue-500/10'
                          : 'border-2 border-slate-300 dark:border-slate-600 group-hover/check:border-[#007AFF]'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : task.status === 'in_progress' ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />
                      ) : null}
                    </div>
                  </button>

                  {/* Detalles de la Tarea con Tipografía Cómoda */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h4
                        className={`text-base sm:text-lg font-semibold tracking-tight truncate ${
                          isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h4>

                      <span className={`flex items-center text-sm font-bold ${meta.color}`} title={`Prioridad ${meta.label}`}>
                        {Array.from({ length: meta.iconCount }).map((_, i) => (
                          <span key={i}>!</span>
                        ))}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Metadatos Legibles */}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-400 pt-1">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {statusLabels[task.status]}
                      </span>
                      {task.dueDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1.5 font-mono text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-[#007AFF]" />
                            {task.dueDate}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-xs text-slate-400">ID: {task.id}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="flex items-center gap-1.5 shrink-0 self-center">
                  <button
                    onClick={(e) => handleTaskContextMenu(e, task)}
                    className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all ios-press"
                    title="Menú secundario (clic derecho o clic aquí)"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(task)}
                    className="p-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all ios-press"
                    title="Editar recordatorio"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeletingTask(task)}
                    className="p-2.5 rounded-2xl text-slate-400 hover:text-[#FF3B30] dark:hover:text-[#FF453A] hover:bg-red-500/10 transition-all ios-press"
                    title="Eliminar recordatorio"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Creación / Edición estilo iOS Sheet / macOS Window */}
      {isFormModalOpen && (
        <TaskFormModal
          task={editingTask}
          onClose={() => setIsFormModalOpen(false)}
          onSaved={() => {
            setIsFormModalOpen(false);
            loadTasks();
          }}
        />
      )}

      {/* Modal de Confirmación de Eliminación al estilo Apple Alert Sheet con Liquid Glass */}
      {deletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xl animate-apple-fade-in">
          <div className="w-full max-w-md liquid-glass p-6 sm:p-7 rounded-3xl shadow-2xl space-y-5 border border-white/20 dark:border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FF3B30]/15 text-[#FF3B30] dark:text-[#FF453A] flex items-center justify-center shrink-0 shadow-inner">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  ¿Eliminar Recordatorio?
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Se eliminará permanentemente <span className="font-semibold text-slate-900 dark:text-white">"{deletingTask.title}"</span> de la base de datos local.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setDeletingTask(null)}
                disabled={deleteLoading}
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-2xl transition-all ios-press"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-[#FF3B30] hover:bg-[#E03126] rounded-2xl shadow-lg shadow-red-500/25 transition-all ios-press"
              >
                {deleteLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menú Contextual Secundario estilo macOS Sequoia / Liquid Glass */}
      {contextMenu.visible && contextMenu.task && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 min-w-[220px] p-1.5 rounded-2xl liquid-glass shadow-2xl border border-white/40 dark:border-white/15 backdrop-blur-3xl animate-apple-fade-in text-xs sm:text-sm font-medium space-y-0.5 select-none"
        >
          {/* Encabezado del menú con título del recordatorio */}
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate max-w-[210px] border-b border-black/[0.05] dark:border-white/[0.06] mb-1">
            {contextMenu.task.title}
          </div>

          {/* Mover al Principio */}
          <button
            onClick={() => handleMoveToTop(contextMenu.task!)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-[#007AFF] hover:text-white transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <ArrowUpToLine className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-white" />
              <span>Mover al principio</span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-white/80 font-mono">⌘↑</span>
          </button>

          {/* Duplicar */}
          <button
            onClick={() => handleDuplicate(contextMenu.task!)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-[#007AFF] hover:text-white transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-white" />
              <span>Duplicar</span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-white/80 font-mono">⌘D</span>
          </button>

          {/* Copiar enlace de la tarea */}
          <button
            onClick={() => handleCopyLink(contextMenu.task!)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-[#007AFF] hover:text-white transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <Link className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-white" />
              <span>Copiar enlace</span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-white/80 font-mono">⌘C</span>
          </button>

          <div className="h-px bg-black/[0.05] dark:border-white/[0.06] my-1" />

          {/* Cambiar Estado Rápido */}
          <button
            onClick={() => {
              const t = contextMenu.task!;
              setContextMenu((prev) => ({ ...prev, visible: false }));
              handleQuickStatusToggle(t);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-[#007AFF] hover:text-white transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-white" />
              <span>
                {contextMenu.task.status === 'completed'
                  ? 'Marcar como pendiente'
                  : 'Marcar como completada'}
              </span>
            </div>
          </button>

          {/* Editar */}
          <button
            onClick={() => {
              const t = contextMenu.task!;
              setContextMenu((prev) => ({ ...prev, visible: false }));
              handleOpenEditModal(t);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-[#007AFF] hover:text-white transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <Edit3 className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-white" />
              <span>Editar recordatorio</span>
            </div>
          </button>

          <div className="h-px bg-black/[0.05] dark:border-white/[0.06] my-1" />

          {/* Eliminar (Destructive) */}
          <button
            onClick={() => {
              const t = contextMenu.task!;
              setContextMenu((prev) => ({ ...prev, visible: false }));
              setDeletingTask(t);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#FF3B30] dark:text-[#FF453A] hover:bg-[#FF3B30] hover:text-white transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4 text-[#FF3B30] dark:text-[#FF453A] group-hover:text-white" />
              <span>Eliminar</span>
            </div>
            <span className="text-[10px] text-[#FF3B30] dark:text-[#FF453A] group-hover:text-white/80 font-mono">⌫</span>
          </button>
        </div>
      )}

      {/* macOS Floating Toast HUD */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl liquid-glass border border-white/40 dark:border-white/15 shadow-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white animate-apple-fade-in backdrop-blur-3xl">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34C759] shadow-xs shadow-green-500/50" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

// Subcomponente de Formulario de Tarea al estilo Apple macOS Sheet con Liquid Glass
interface TaskFormModalProps {
  task: Task | null;
  onClose: () => void;
  onSaved: () => void;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ task, onClose, onSaved }) => {
  const [title, setTitle] = useState(task ? task.title : '');
  const [description, setDescription] = useState(task ? task.description : '');
  const [priority, setPriority] = useState<TaskPriority>(task ? task.priority : 'medium');
  const [status, setStatus] = useState<TaskStatus>(task ? task.status : 'pending');
  const [dueDate, setDueDate] = useState(task ? task.dueDate || '' : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título del recordatorio es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (task) {
        await api.updateTask(task.id, {
          title: title.trim(),
          description: description.trim(),
          priority,
          status,
          dueDate: dueDate ? dueDate : undefined,
        });
      } else {
        await api.createTask({
          title: title.trim(),
          description: description.trim(),
          priority,
          status,
          dueDate: dueDate ? dueDate : undefined,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Error al guardar en el servidor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xl animate-apple-fade-in">
      <div className="w-full max-w-xl liquid-glass rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10">
        
        {/* Cabecera estilo macOS Window con Traffic Lights */}
        <div className="px-6 sm:px-8 py-5 border-b border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#007AFF] shadow-xs shadow-blue-500/50" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {task ? 'Modificar Recordatorio' : 'Nuevo Recordatorio'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all ios-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 text-xs sm:text-sm text-[#FF3B30] dark:text-[#FF453A] bg-red-500/10 border border-red-500/20 rounded-2xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Título
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Revisar informe de auditoría de seguridad"
              className="w-full px-4 py-3 text-sm sm:text-base bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notas y Detalles
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas adicionales o contexto..."
              className="w-full px-4 py-3 text-sm sm:text-base bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-2 focus:ring-[#007AFF] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 text-sm bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2.5 text-sm bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Fecha Límite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF] font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-2xl transition-all ios-press"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm sm:text-base font-semibold text-white bg-[#007AFF] hover:bg-[#0066D6] rounded-2xl shadow-lg shadow-blue-500/25 transition-all ios-press"
            >
              {saving ? 'Guardando...' : task ? 'Guardar Cambios' : 'Añadir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
