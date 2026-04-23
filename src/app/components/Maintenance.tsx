import { Wrench, Calendar, CheckCircle, Clock, AlertTriangle, Brain } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { ScheduleMaintenanceModal } from './ScheduleMaintenanceModal';

interface MaintenanceProps {
  onNavigate?: (tab: string) => void;
}

export function Maintenance({ onNavigate }: MaintenanceProps) {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue = (t: any) => {
      if (!t?.scheduledDate) return false;
      if (t.status === 'Completed') return false;
      const d = new Date(String(t.scheduledDate));
      if (Number.isNaN(d.getTime())) return false;
      d.setHours(0, 0, 0, 0);
      return d < today;
    };

    return {
      total: maintenanceTasks.length,
      inProgress: maintenanceTasks.filter(t => t.status === 'In Progress').length,
      completed: maintenanceTasks.filter(t => t.status === 'Completed').length,
      overdue: maintenanceTasks.filter(isOverdue).length,
    };
  }, [maintenanceTasks]);

  const fetchTasks = () => {
    fetch('http://localhost:5000/api/maintenance')
      .then(res => res.json())
      .then(data => setMaintenanceTasks(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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
      if (res.ok) fetchTasks();
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <Wrench className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.inProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Overdue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overdue}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div>
        <h3 className="text-xl font-bold text-gray-900">Maintenance Schedule</h3>
        <p className="text-sm text-gray-600 mt-1">Upcoming and ongoing maintenance tasks</p>
      </div>

      {/* Maintenance Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Maintenance Schedule</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {maintenanceTasks.map((task) => (
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
                <button
                  onClick={() => setSelectedTask(task)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                  View Details
                </button>
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

              <button
                onClick={() => setSelectedTask(null)}
                className="w-full mt-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
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