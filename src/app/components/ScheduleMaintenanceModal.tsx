import { X, Calendar, Clock, Wrench, AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface ScheduleMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (maintenanceData: any) => void;
}

export function ScheduleMaintenanceModal({ isOpen, onClose, onSave }: ScheduleMaintenanceModalProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    assetId: '',
    assetName: '',
    maintenanceType: '',
    priority: 'Medium',
    scheduledDate: '',
    scheduledTime: '',
    assignedTo: '',
    description: '',
    estimatedDuration: '',
    notifyUser: true,
    recurringMaintenance: false,
    recurringInterval: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!isOpen) return;
    fetch('http://localhost:5000/api/assets')
      .then(r => r.json())
      .then(setAssets)
      .catch(console.error);
  }, [isOpen]);

  const matchedAsset = useMemo(() => {
    const id = formData.assetId.trim().toLowerCase();
    if (!id) return null;
    return assets.find(a => String(a.id).toLowerCase() === id) || null;
  }, [assets, formData.assetId]);

  useEffect(() => {
    if (matchedAsset && !formData.assetName) {
      setFormData(prev => ({ ...prev, assetName: matchedAsset.name || prev.assetName }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedAsset]);

  const validate = () => {
    const next: Record<string, string> = {};

    const assetId = formData.assetId.trim();
    if (!assetId) next.assetId = 'Asset ID is required.';
    else if (!matchedAsset) next.assetId = 'Asset ID not found in database.';

    if (!formData.maintenanceType) next.maintenanceType = 'Maintenance type is required.';

    if (!formData.scheduledDate) next.scheduledDate = 'Scheduled date is required.';
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = new Date(`${formData.scheduledDate}T00:00:00.000Z`);
      if (Number.isNaN(d.getTime())) next.scheduledDate = 'Scheduled date is invalid.';
      else if (d < today) next.scheduledDate = 'Scheduled date cannot be in the past.';
    }

    if (formData.estimatedDuration) {
      const n = Number(formData.estimatedDuration);
      if (Number.isNaN(n) || n <= 0) next.estimatedDuration = 'Estimated duration must be a positive number.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(formData);
    onClose();
    // Reset form
    setFormData({
      assetId: '',
      assetName: '',
      maintenanceType: '',
      priority: 'Medium',
      scheduledDate: '',
      scheduledTime: '',
      assignedTo: '',
      description: '',
      estimatedDuration: '',
      notifyUser: true,
      recurringMaintenance: false,
      recurringInterval: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Schedule Maintenance</h2>
              <p className="text-sm text-blue-100 mt-1">Plan a maintenance task for an asset</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Asset Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.assetId}
                  onChange={(e) => {
                    setErrors(prev => ({ ...prev, assetId: '' }));
                    handleInputChange('assetId', e.target.value);
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.assetId ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="e.g., LAP-001"
                  required
                />
                {errors.assetId ? (
                  <p className="text-xs text-red-600 mt-1">{errors.assetId}</p>
                ) : matchedAsset ? (
                  <p className="text-xs text-green-600 mt-1">Found: {matchedAsset.name}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Enter an existing Asset ID (e.g. AST-001)</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={formData.assetName}
                  onChange={(e) => handleInputChange('assetName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Asset name"
                />
              </div>
            </div>

            {/* Maintenance Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maintenance Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.maintenanceType}
                onChange={(e) => {
                  setErrors(prev => ({ ...prev, maintenanceType: '' }));
                  handleInputChange('maintenanceType', e.target.value);
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.maintenanceType ? 'border-red-400' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select maintenance type</option>
                <option value="Preventive">Preventive Maintenance</option>
                <option value="Corrective">Corrective Maintenance</option>
                <option value="Routine">Routine Maintenance</option>
                <option value="Upgrade">Upgrade</option>
                <option value="Inspection">Inspection</option>
                <option value="Repair">Repair</option>
                <option value="Replacement">Component Replacement</option>
              </select>
              {errors.maintenanceType && <p className="text-xs text-red-600 mt-1">{errors.maintenanceType}</p>}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {['Low', 'Medium', 'High', 'Critical'].map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => handleInputChange('priority', priority)}
                    className={`py-2 px-4 rounded-lg font-medium transition-all border-2 ${
                      formData.priority === priority
                        ? priority === 'Critical'
                          ? 'bg-red-600 text-white border-red-600'
                          : priority === 'High'
                          ? 'bg-orange-600 text-white border-orange-600'
                          : priority === 'Medium'
                          ? 'bg-yellow-600 text-white border-yellow-600'
                          : 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => {
                      setErrors(prev => ({ ...prev, scheduledDate: '' }));
                      handleInputChange('scheduledDate', e.target.value);
                    }}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.scheduledDate ? 'border-red-400' : 'border-gray-300'
                    }`}
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.scheduledDate && <p className="text-xs text-red-600 mt-1">{errors.scheduledDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select technician</option>
                <option value="IT Team">IT Team</option>
                <option value="John Smith">John Smith</option>
                <option value="Sarah Johnson">Sarah Johnson</option>
                <option value="Mark Wilson">Mark Wilson</option>
                <option value="Emily Brown">Emily Brown</option>
              </select>
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => {
                    setErrors(prev => ({ ...prev, estimatedDuration: '' }));
                    handleInputChange('estimatedDuration', e.target.value);
                  }}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.estimatedDuration ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 2"
                  min="0"
                  step="0.5"
                />
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Hours</option>
                  <option>Days</option>
                  <option>Minutes</option>
                </select>
              </div>
              {errors.estimatedDuration && <p className="text-xs text-red-600 mt-1">{errors.estimatedDuration}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe the maintenance task..."
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifyUser"
                  checked={formData.notifyUser}
                  onChange={(e) => handleInputChange('notifyUser', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notifyUser" className="text-sm text-gray-700">
                  Send notification to assigned technician
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="recurringMaintenance"
                  checked={formData.recurringMaintenance}
                  onChange={(e) => handleInputChange('recurringMaintenance', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="flex-1">
                  <label htmlFor="recurringMaintenance" className="text-sm text-gray-700 block">
                    Recurring maintenance
                  </label>
                  {formData.recurringMaintenance && (
                    <select
                      value={formData.recurringInterval}
                      onChange={(e) => handleInputChange('recurringInterval', e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select interval</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annually">Annually</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">Important Notice</h4>
                  <p className="text-sm text-amber-700">
                    Scheduled maintenance may cause temporary service interruption. Users will be notified 24 hours before the scheduled time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center gap-2 shadow-lg"
          >
            <Calendar className="w-4 h-4" />
            Schedule Maintenance
          </button>
        </div>
      </div>
    </div>
  );
}
