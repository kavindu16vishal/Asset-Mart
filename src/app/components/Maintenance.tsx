import { Wrench, Calendar, CheckCircle, Clock, AlertTriangle, Brain, Loader2, Trash2, History, RotateCcw } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { ScheduleMaintenanceModal } from './ScheduleMaintenanceModal';

interface MaintenanceProps {
  onNavigate?: (tab: string) => void;
  /** Bump when maintenance tasks change so Dashboard (and other views) can refetch aggregates. */
  onDataChanged?: () => void;
}

/** In progress: Scheduled/… → In Progress; In Progress → Scheduled; Completed → In Progress (reopen). */
function nextStatusForInProgressToggle(current: string): string {
  if (current === 'In Progress') return 'Scheduled';
  return 'In Progress';
}

/** Completed: any non-completed → Completed; Completed → Scheduled. */
function nextStatusForCompletedToggle(current: string): string {
  if (current === 'Completed') return 'Scheduled';
  return 'Completed';
}

function taskIsOverdue(t: any): boolean {
  if (!t?.scheduledDate) return false;
  if (t.status === 'Completed') return false;
  const d = new Date(String(t.scheduledDate));
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

type StatsListFilter = 'all' | 'in-progress' | 'completed' | 'overdue';

const FILTER_SUBLABEL: Record<StatsListFilter, string> = {
  all: 'All tasks',
  'in-progress': 'In progress only',
  completed: 'Completed only',
  overdue: 'Overdue only (past scheduled date, not completed)',
};

const ACTION_BTN =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

function completedToggleClasses(isOn: boolean) {
  return isOn
    ? `${ACTION_BTN} border-green-600 bg-green-600 text-white shadow-md ring-2 ring-green-200/80 focus-visible:ring-green-500`
    : `${ACTION_BTN} border-green-400 bg-green-50 text-green-600 hover:bg-green-100/90 focus-visible:ring-green-500`;
}

function inProgressToggleClasses(isOn: boolean) {
  return isOn
    ? `${ACTION_BTN} border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-200/80 focus-visible:ring-blue-500`
    : `${ACTION_BTN} border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100/90 focus-visible:ring-blue-500`;
}

const deleteActionClasses = `${ACTION_BTN} border-red-400 bg-red-50 text-red-600 hover:bg-red-100/90 focus-visible:ring-red-500`;

export function Maintenance({ onNavigate, onDataChanged }: MaintenanceProps) {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);
  const [listFilter, setListFilter] = useState<StatsListFilter>('all');
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<number | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [deletedHistory, setDeletedHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [restoringHistoryId, setRestoringHistoryId] = useState<number | null>(null);

  const stats = useMemo(() => {
    return {
      total: maintenanceTasks.length,
      inProgress: maintenanceTasks.filter((t) => t.status === 'In Progress').length,
      completed: maintenanceTasks.filter((t) => t.status === 'Completed').length,
      overdue: maintenanceTasks.filter(taskIsOverdue).length,
    };
  }, [maintenanceTasks]);

  const filteredTasks = useMemo(() => {
    switch (listFilter) {
      case 'in-progress':
        return maintenanceTasks.filter((t) => t.status === 'In Progress');
      case 'completed':
        return maintenanceTasks.filter((t) => t.status === 'Completed');
      case 'overdue':
        return maintenanceTasks.filter(taskIsOverdue);
      default:
        return maintenanceTasks;
    }
  }, [maintenanceTasks, listFilter]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/maintenance');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        console.error('Failed to load maintenance tasks', data);
        return;
      }
      setMaintenanceTasks(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const fetchDeletedHistory = useCallback(async (silent = false) => {
    if (!silent) {
      setHistoryLoading(true);
      setHistoryError(null);
    }
    try {
      const res = await fetch('http://localhost:5000/api/maintenance/history');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!silent) {
          setHistoryError(typeof data.error === 'string' ? data.error : 'Could not load history.');
          setDeletedHistory([]);
        }
        return;
      }
      setDeletedHistory(Array.isArray(data) ? data : []);
    } catch {
      if (!silent) {
        setHistoryError('Network error.');
        setDeletedHistory([]);
      }
    } finally {
      if (!silent) setHistoryLoading(false);
    }
  }, []);

  const restoreDeletedTask = useCallback(
    async (taskId: number) => {
      setRestoringHistoryId(taskId);
      setHistoryError(null);
      try {
        const res = await fetch(`http://localhost:5000/api/maintenance/${taskId}/restore`, {
          method: 'POST',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setHistoryError(typeof data.error === 'string' ? data.error : 'Could not restore task.');
          return;
        }
        await fetchTasks();
        onDataChanged?.();
        await fetchDeletedHistory(true);
      } catch {
        setHistoryError('Network error.');
      } finally {
        setRestoringHistoryId(null);
      }
    },
    [fetchTasks, onDataChanged, fetchDeletedHistory]
  );

  useEffect(() => {
    if (selectedTask) setStatusError(null);
  }, [selectedTask?.id]);

  const updateTaskStatus = useCallback(
    async (taskId: number, nextStatus: string) => {
      setSavingTaskId(taskId);
      setStatusError(null);
      try {
        const res = await fetch(`http://localhost:5000/api/maintenance/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatusError(typeof data.error === 'string' ? data.error : 'Could not update status.');
          return;
        }
        setMaintenanceTasks((prev) =>
          Array.isArray(prev)
            ? prev.map((t) => (Number(t.id) === taskId ? { ...t, status: nextStatus } : t))
            : prev
        );
        setSelectedTask((prev) =>
          prev && Number(prev.id) === taskId ? { ...prev, status: nextStatus } : prev
        );
        await fetchTasks();
        onDataChanged?.();
      } catch {
        setStatusError('Network error. Try again.');
      } finally {
        setSavingTaskId(null);
      }
    },
    [fetchTasks, onDataChanged]
  );

  const deleteTask = useCallback(
    async (taskId: number) => {
      if (
        !window.confirm(
          'Remove this task from the schedule? You can still view it under History (deleted tasks).'
        )
      )
        return;
      setSavingTaskId(taskId);
      setStatusError(null);
      try {
        const res = await fetch(`http://localhost:5000/api/maintenance/${taskId}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatusError(typeof data.error === 'string' ? data.error : 'Could not delete task.');
          return;
        }
        setMaintenanceTasks((prev) =>
          Array.isArray(prev) ? prev.filter((t) => Number(t.id) !== taskId) : prev
        );
        setSelectedTask((prev) => (prev && Number(prev.id) === taskId ? null : prev));
        await fetchTasks();
        onDataChanged?.();
        void fetchDeletedHistory(true);
      } catch {
        setStatusError('Network error. Try again.');
      } finally {
        setSavingTaskId(null);
      }
    },
    [fetchTasks, onDataChanged, fetchDeletedHistory]
  );

  const handleSaveMaintenance = async (maintenanceData: any) => {
    try {
      const res = await fetch('http://localhost:5000/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: maintenanceData.assetId || maintenanceData.assetName,
          type: maintenanceData.maintenanceType,
          description: maintenanceData.description,
          scheduledDate: maintenanceData.scheduledDate,
          priority: maintenanceData.priority,
          assignedTo: maintenanceData.assignedTo || 'Unassigned',
        })
      });
      if (res.ok) {
        await fetchTasks();
        onDataChanged?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Scheduled': return 'bg-purple-100 text-purple-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'In Progress': return <Wrench className="w-5 h-5 text-blue-600" />;
      case 'Scheduled': return <Clock className="w-5 h-5 text-purple-600" />;
      case 'Overdue': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Maintenance Management</h2>
          <p className="text-gray-600 mt-1">Schedule and track maintenance activities</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate?.('predictive-maintenance')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Brain className="w-5 h-5" />
            AI Predictions
          </button>
          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Schedule Maintenance
          </button>
        </div>
      </div>

      {statusError && (
        <div
          className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <span>{statusError}</span>
          <button
            type="button"
            onClick={() => setStatusError(null)}
            className="shrink-0 rounded p-1 hover:bg-red-100 text-red-700"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats — clickable filters for the list below */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          type="button"
          onClick={() => setListFilter('all')}
          aria-pressed={listFilter === 'all'}
          className={`text-left rounded-xl p-6 shadow-sm border transition-all cursor-pointer hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            listFilter === 'all'
              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-200'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">Click to show all</p>
            </div>
            <Wrench className="w-8 h-8 text-blue-600 shrink-0" />
          </div>
        </button>
        <button
          type="button"
          onClick={() => setListFilter('in-progress')}
          aria-pressed={listFilter === 'in-progress'}
          className={`text-left rounded-xl p-6 shadow-sm border transition-all cursor-pointer hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            listFilter === 'in-progress'
              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-200'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.inProgress}</p>
              <p className="text-xs text-gray-400 mt-1">Filter list</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600 shrink-0" />
          </div>
        </button>
        <button
          type="button"
          onClick={() => setListFilter('completed')}
          aria-pressed={listFilter === 'completed'}
          className={`text-left rounded-xl p-6 shadow-sm border transition-all cursor-pointer hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${
            listFilter === 'completed'
              ? 'border-green-600 bg-green-50/60 ring-2 ring-green-200'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
              <p className="text-xs text-gray-400 mt-1">Filter list</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
          </div>
        </button>
        <button
          type="button"
          onClick={() => setListFilter('overdue')}
          aria-pressed={listFilter === 'overdue'}
          className={`text-left rounded-xl p-6 shadow-sm border transition-all cursor-pointer hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${
            listFilter === 'overdue'
              ? 'border-red-500 bg-red-50/60 ring-2 ring-red-200'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Overdue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overdue}</p>
              <p className="text-xs text-gray-400 mt-1">Filter list</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
          </div>
        </button>
      </div>

      {/* Section Title */}
      <div>
        <h3 className="text-xl font-bold text-gray-900">Maintenance Schedule</h3>
        <p className="text-sm text-gray-600 mt-1">
          {FILTER_SUBLABEL[listFilter]} · {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} shown
        </p>
      </div>

      {/* Maintenance Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Maintenance Schedule</h3>
          <div className="flex items-center gap-2 shrink-0">
            {listFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setListFilter('all')}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Clear filter
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsHistoryOpen(true);
                void fetchDeletedHistory();
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <History className="w-4 h-4" aria-hidden />
              History
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredTasks.length === 0 && (
            <div className="p-10 text-center text-gray-500 text-sm">
              No tasks match this filter. Try another summary card or clear the filter.
            </div>
          )}
          {filteredTasks.map((task) => (
            <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="pt-1">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{task.assetId}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Task ID:</span>
                        <span>{task.id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Type:</span>
                        <span>{task.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{task.scheduledDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Assigned:</span>
                        <span>{task.assignedTo}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <div
                    className="flex flex-row gap-2 justify-end items-center min-h-[2.75rem]"
                    aria-label="Task actions"
                  >
                    <button
                      type="button"
                      disabled={savingTaskId !== null}
                      aria-pressed={task.status === 'Completed'}
                      aria-label={
                        task.status === 'Completed' ? 'Resolved: on — click to undo' : 'Mark resolved (completed)'
                      }
                      title="Resolved / completed — click to turn on or off"
                      onClick={() =>
                        updateTaskStatus(
                          Number(task.id),
                          nextStatusForCompletedToggle(String(task.status ?? ''))
                        )
                      }
                      className={`${completedToggleClasses(task.status === 'Completed')} disabled:opacity-50`}
                    >
                      <CheckCircle className="w-5 h-5" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      disabled={savingTaskId !== null}
                      aria-pressed={task.status === 'In Progress'}
                      aria-label={
                        task.status === 'In Progress' ? 'In progress: on — click to undo' : 'Mark in progress'
                      }
                      title="In progress — click to turn on or off"
                      onClick={() =>
                        updateTaskStatus(
                          Number(task.id),
                          nextStatusForInProgressToggle(String(task.status ?? ''))
                        )
                      }
                      className={`${inProgressToggleClasses(task.status === 'In Progress')} disabled:opacity-50`}
                    >
                      <Clock className="w-5 h-5" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      disabled={savingTaskId !== null}
                      aria-label="Delete maintenance task"
                      title="Delete task"
                      onClick={() => deleteTask(Number(task.id))}
                      className={`${deleteActionClasses} disabled:opacity-50`}
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={2} />
                    </button>
                    {savingTaskId === Number(task.id) && (
                      <Loader2
                        className="w-5 h-5 shrink-0 animate-spin text-gray-400"
                        aria-hidden
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* View Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Maintenance Task Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Task ID: <span className="font-medium text-gray-700">{selectedTask.id}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Asset</span>
                <span className="font-medium text-gray-900">{selectedTask.assetId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                  {selectedTask.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Priority</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium text-gray-900">{selectedTask.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Scheduled Date</span>
                <span className="font-medium text-gray-900">{selectedTask.scheduledDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Assigned To</span>
                <span className="font-medium text-gray-900">{selectedTask.assignedTo}</span>
              </div>
              <div className="pt-2">
                <div className="text-gray-500 mb-1">Description</div>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-800">
                  {selectedTask.description || '—'}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Update status</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Green and blue buttons fill with solid color when active; click again to undo. Red deletes the task.
                  </p>
                </div>
                {statusError && (
                  <p className="text-sm text-red-600" role="alert">
                    {statusError}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={savingTaskId !== null}
                    aria-pressed={selectedTask.status === 'Completed'}
                    aria-label={
                      selectedTask.status === 'Completed'
                        ? 'Resolved: on — click to undo'
                        : 'Mark resolved (completed)'
                    }
                    title="Resolved / completed — click to turn on or off"
                    onClick={() =>
                      updateTaskStatus(
                        Number(selectedTask.id),
                        nextStatusForCompletedToggle(String(selectedTask.status ?? ''))
                      )
                    }
                    className={`${completedToggleClasses(selectedTask.status === 'Completed')} disabled:opacity-50`}
                  >
                    <CheckCircle className="w-5 h-5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    disabled={savingTaskId !== null}
                    aria-pressed={selectedTask.status === 'In Progress'}
                    aria-label={
                      selectedTask.status === 'In Progress'
                        ? 'In progress: on — click to undo'
                        : 'Mark in progress'
                    }
                    title="In progress — click to turn on or off"
                    onClick={() =>
                      updateTaskStatus(
                        Number(selectedTask.id),
                        nextStatusForInProgressToggle(String(selectedTask.status ?? ''))
                      )
                    }
                    className={`${inProgressToggleClasses(selectedTask.status === 'In Progress')} disabled:opacity-50`}
                  >
                    <Clock className="w-5 h-5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    disabled={savingTaskId !== null}
                    aria-label="Delete maintenance task"
                    title="Delete task"
                    onClick={() => deleteTask(Number(selectedTask.id))}
                    className={`${deleteActionClasses} disabled:opacity-50`}
                  >
                    <Trash2 className="w-5 h-5" strokeWidth={2} />
                  </button>
                  {savingTaskId === Number(selectedTask.id) && (
                    <Loader2 className="w-5 h-5 shrink-0 animate-spin text-gray-400" aria-hidden />
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="w-full mt-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deleted tasks history */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-gray-200"
            role="dialog"
            aria-labelledby="maintenance-history-title"
          >
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4 shrink-0">
              <div>
                <h2 id="maintenance-history-title" className="text-xl font-bold text-gray-900">
                  Deleted tasks history
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Records kept when a task is removed from the schedule. Newest first.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 shrink-0"
                aria-label="Close history"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {historyLoading && (
                <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading history…
                </div>
              )}
              {!historyLoading && historyError && (
                <p className="text-sm text-red-600 text-center py-8" role="alert">
                  {historyError}
                </p>
              )}
              {!historyLoading && !historyError && deletedHistory.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-12">No deleted tasks yet.</p>
              )}
              {!historyLoading && !historyError && deletedHistory.length > 0 && (
                <ul className="space-y-3">
                  {deletedHistory.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div className="font-semibold text-gray-900">
                          {row.assetId}{' '}
                          <span className="font-normal text-gray-500">· Task #{row.id}</span>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          Removed:{' '}
                          {row.deletedAt
                            ? new Date(row.deletedAt).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(row.status)}`}>
                          Last status: {row.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(row.priority)}`}>
                          {row.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {row.type}
                        </span>
                      </div>
                      <p className="text-gray-600 line-clamp-3">{row.description || '—'}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>Scheduled: {row.scheduledDate || '—'}</span>
                        <span>Assigned: {row.assignedTo || '—'}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200/80">
                        <button
                          type="button"
                          disabled={restoringHistoryId !== null}
                          onClick={() => restoreDeletedTask(Number(row.id))}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {restoringHistoryId === Number(row.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                          ) : (
                            <RotateCcw className="w-4 h-4" aria-hidden />
                          )}
                          Restore to schedule
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      <ScheduleMaintenanceModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSave={handleSaveMaintenance}
      />
    </div>
  );
}