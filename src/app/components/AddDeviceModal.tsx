import { X, Upload, Package, Calendar, Trash2 } from 'lucide-react';
import { useState, useRef } from 'react';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deviceData: any) => void;
}

export function AddDeviceModal({ isOpen, onClose, onSave }: AddDeviceModalProps) {
  const assetImageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    company: '',
    assetName: '',
    category: '',
    categoryCustom: '',
    supplier: '',
    manufacturer: '',
    location: '',
    modelNo: '',
    serialNumber: '',
    purchaseDate: '',
    unitCost: '',
    quantity: 1,
    notes: '',
    assetImage: null as File | null
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, assetImage: e.target.files![0] }));
    }
  };

  const handleClearAssetImage = () => {
    setFormData(prev => ({ ...prev, assetImage: null }));
    if (assetImageInputRef.current) {
      assetImageInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    const resolvedCategory =
      formData.category === 'Other'
        ? formData.categoryCustom.trim()
        : formData.category;
    if (!formData.assetName || !resolvedCategory) {
      alert(
        formData.category === 'Other'
          ? 'Please enter a category name when "Other" is selected'
          : 'Please fill in all required fields'
      );
      return;
    }

    onSave({ ...formData, category: resolvedCategory });
    onClose();
    // Reset form
    setFormData({
      company: '',
      assetName: '',
      category: '',
      categoryCustom: '',
      supplier: '',
      manufacturer: '',
      location: '',
      modelNo: '',
      serialNumber: '',
      purchaseDate: '',
      unitCost: '',
      quantity: 1,
      notes: '',
      assetImage: null
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Register New Device</h2>
            <p className="text-sm text-gray-600 mt-1">Add a new asset to the inventory</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Company */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Select Company"
              />
            </div>

            {/* Asset Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.assetName}
                onChange={(e) => handleInputChange('assetName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter asset name"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      category: v,
                      ...(v !== 'Other' ? { categoryCustom: '' } : {}),
                    }));
                  }}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  required
                >
                  <option value="">Select a Category</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Server">Server</option>
                  <option value="Printer">Printer</option>
                  <option value="Network Device">Network Device</option>
                  <option value="Mobile Device">Mobile Device</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Accessory">Accessory</option>
                  <option value="Other">Other</option>
                </select>
                <button className="absolute right-10 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded">
                  NEW
                </button>
              </div>
              {formData.category === 'Other' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specify category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.categoryCustom}
                    onChange={(e) =>
                      handleInputChange('categoryCustom', e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter category name"
                  />
                </div>
              )}
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Select a Supplier"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded">
                  NEW
                </button>
              </div>
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Select a Manufacturer"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded">
                  NEW
                </button>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Select a Location"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded">
                  NEW
                </button>
              </div>
            </div>

            {/* Model No */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model No.
              </label>
              <input
                type="text"
                value={formData.modelNo}
                onChange={(e) => handleInputChange('modelNo', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter model number"
              />
            </div>

            {/* Serial Number */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serial Number
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter serial number"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">USD</span>
                <input
                  type="number"
                  value={formData.unitCost}
                  onChange={(e) => handleInputChange('unitCost', e.target.value)}
                  className="w-full pl-16 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                <input type="checkbox" className="w-3 h-3 rounded" />
                <span>?</span>
              </div>
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Enter any additional notes..."
              />
            </div>

            {/* Upload Image */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <div className="rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-blue-500">
                <div className="relative min-h-[140px] p-6">
                  <input
                    ref={assetImageInputRef}
                    type="file"
                    id="assetImage"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.gif,.svg,.avif,.webp"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="pointer-events-none flex flex-col items-center justify-center">
                    <Upload className="mb-3 h-10 w-10 text-gray-400" />
                    <span className="text-sm font-medium text-blue-600">Select File...</span>
                    <span className="mt-2 text-center text-xs text-gray-500">
                      Accepted filetypes are jpg, webp, png, gif, svg and avif. The maximum upload size allowed is 400M.
                    </span>
                  </div>
                </div>
                {formData.assetImage && (
                  <div className="flex flex-col items-center gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:justify-between">
                    <p className="text-center text-sm font-medium text-gray-900 sm:text-left">
                      <span className="text-gray-500">Selected:</span>{' '}
                      <span className="break-all">{formData.assetImage.name}</span>
                    </p>
                    <button
                      type="button"
                      onClick={handleClearAssetImage}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                )}
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
