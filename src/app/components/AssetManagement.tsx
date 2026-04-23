import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Package,
  Activity,
  AlertTriangle,
  X,
  Image as ImageIcon,
  FileText,
  Cpu,
  User,
  Building2,
} from 'lucide-react';
import { useState, useEffect, type ComponentType } from 'react';
import { AddDeviceModal } from './AddDeviceModal';

const API_ORIGIN = 'http://localhost:5000';

function getAssetImageFiles(asset: any): string[] {
  if (Array.isArray(asset?.files)) {
    return asset.files.map((f: unknown) => String(f).trim()).filter(Boolean);
  }
  try {
    const raw = asset?.attachments;
    if (raw == null || raw === '') return [];
    if (Array.isArray(raw)) return raw.map((f: unknown) => String(f).trim()).filter(Boolean);
    const a = JSON.parse(String(raw));
    if (!Array.isArray(a)) return [];
    return a.map((f: unknown) => String(f).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function parseSpecificationParts(spec: string): { label: string; value: string }[] {
  if (!spec?.trim()) return [];
  return spec
    .split(/\s*\|\s*/)
    .map((part) => {
      const idx = part.indexOf(':');
      if (idx === -1) return { label: 'Detail', value: part.trim() };
      return { label: part.slice(0, idx).trim(), value: part.slice(idx + 1).trim() };
    })
    .filter((p) => p.label || p.value);
}

export function AssetManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewAsset, setViewAsset] = useState<any>(null);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [assets, setAssets] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAssets = () => {
    fetch(`${API_ORIGIN}/api/assets`)
      .then(res => res.json())
      .then(data => setAssets(data))
      .catch(console.error);
  };

  useEffect(() => { fetchAssets(); }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const openAssetDetails = (summary: any) => {
    setViewAsset(summary);
    void (async () => {
      try {
        const res = await fetch(`${API_ORIGIN}/api/assets/${encodeURIComponent(summary.id)}`);
        if (res.ok) {
          const full = await res.json();
          setViewAsset((current: any) => (current?.id === full.id ? full : current));
        }
      } catch (e) {
        console.error(e);
      }
    })();
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/assets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAssets();
        setDeleteConfirm(null);
        showSuccess('Asset deleted successfully.');
      }
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { fetchAssets(); showSuccess('Asset status updated.'); }
    } catch (err) { console.error(err); }
  };

  const handleEditSave = async () => {
    if (!editAsset) return;
    try {
      const res = await fetch(`${API_ORIGIN}/api/assets/${editAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAsset),
      });
      if (res.ok) { fetchAssets(); setEditAsset(null); showSuccess('Asset updated successfully.'); }
    } catch (err) { console.error(err); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Maintenance': return 'bg-orange-100 text-orange-700';
      case 'Inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Excellent': return 'text-green-600';
      case 'Good': return 'text-blue-600';
      case 'Fair': return 'text-yellow-600';
      case 'Needs Attention': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Success Toast */}
      {successMsg && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Asset Management</h2>
          <p className="text-gray-600 mt-1">Manage and track all your IT assets</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Asset
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{assets.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {assets.filter(a => a.status === 'Active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {assets.filter(a => a.status === 'Maintenance').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Health Issues</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {assets.filter(a => a.health === 'Needs Attention' || a.health === 'Fair').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets by name, ID, or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="Laptop">Laptops</option>
              <option value="Desktop">Desktops</option>
              <option value="Server">Servers</option>
              <option value="Printer">Printers</option>
              <option value="Tablet">Tablets</option>
              <option value="Network Device">Network Devices</option>
              <option value="Monitor">Monitors</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div>
        <h3 className="text-xl font-bold text-gray-900">Asset Inventory</h3>
        <p className="text-sm text-gray-600 mt-1">All registered assets in your organization</p>
      </div>

      {/* Asset Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAssets.length === 0 && (
          <div className="text-center py-12 text-gray-400">No assets found.</div>
        )}
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                    {asset.status}
                  </span>
                  <span className={`text-sm font-medium ${getHealthColor(asset.health)}`}>
                    {asset.health === 'Excellent' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                    {asset.health === 'Needs Attention' && <XCircle className="w-4 h-4 inline mr-1" />}
                    {asset.health}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Asset ID: {asset.id}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm font-medium text-gray-900">{asset.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="text-sm font-medium text-gray-900">{asset.assignedTo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium text-gray-900">{asset.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Purchase Date</p>
                    <p className="text-sm font-medium text-gray-900">{asset.purchaseDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{asset.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Warranty: {asset.warrantyExpiry}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {/* View Details */}
                <button
                  type="button"
                  onClick={() => openAssetDetails(asset)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-5 h-5" />
                </button>
                {/* Edit */}
                <button
                  onClick={() => setEditAsset({ ...asset })}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit Asset"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                {/* Delete */}
                <button
                  onClick={() => setDeleteConfirm(asset.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Asset"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Asset Modal */}
      <AddDeviceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={async (deviceData) => {
          try {
            const id = deviceData.id || `AST-${Date.now()}`;
            const specifications = [
              deviceData.modelNo ? `Model: ${deviceData.modelNo}` : '',
              deviceData.manufacturer ? `Manufacturer: ${deviceData.manufacturer}` : '',
              deviceData.supplier ? `Supplier: ${deviceData.supplier}` : '',
              deviceData.unitCost ? `Unit Cost: ${deviceData.unitCost}` : '',
              deviceData.quantity ? `Qty: ${deviceData.quantity}` : '',
              deviceData.notes ? `Notes: ${deviceData.notes}` : '',
            ]
              .filter(Boolean)
              .join(' | ');

            const fd = new FormData();
            fd.append('id', id);
            fd.append('name', deviceData.assetName);
            fd.append('type', deviceData.category);
            fd.append('serialNumber', deviceData.serialNumber || '');
            fd.append('assignedTo', 'Unassigned');
            fd.append('department', deviceData.company || '');
            fd.append('status', 'Active');
            fd.append('purchaseDate', deviceData.purchaseDate || '');
            fd.append('warrantyExpiry', '');
            fd.append('location', deviceData.location || '');
            fd.append('health', 'Excellent');
            fd.append('specifications', specifications);
            if (deviceData.assetImage) {
              fd.append('assetImage', deviceData.assetImage);
            }

            const res = await fetch(`${API_ORIGIN}/api/assets`, {
              method: 'POST',
              body: fd,
            });
            if (res.ok) {
              fetchAssets();
              showSuccess('Asset added successfully!');
            } else {
              const errBody = await res.json().catch(() => ({}));
              alert(errBody?.error || `Could not save asset (${res.status})`);
            }
          } catch (err) {
            console.error(err);
          }
          setShowAddModal(false);
        }}
      />

      {/* View Details Modal */}
      {viewAsset && (() => {
        const mediaFiles = getAssetImageFiles(viewAsset);
        const specParts = parseSpecificationParts(String(viewAsset.specifications || ''));
        const fileUrl = (name: string) => `${API_ORIGIN}/uploads/${encodeURIComponent(name)}`;
        const isImageFile = (name: string) => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(name);
        const isVideoFile = (name: string) => /\.(mp4|webm|ogg|mov|m4v)$/i.test(name);
        const heroFile =
          mediaFiles.find((f) => isImageFile(f)) ?? mediaFiles.find((f) => isVideoFile(f)) ?? null;
        const detailRows: { icon: ComponentType<{ className?: string }>; label: string; value: string }[] = [
          { icon: Cpu, label: 'Asset ID', value: viewAsset.id || '—' },
          { icon: Package, label: 'Type', value: viewAsset.type || '—' },
          { icon: FileText, label: 'Serial number', value: viewAsset.serialNumber || '—' },
          { icon: User, label: 'Assigned to', value: viewAsset.assignedTo || '—' },
          { icon: Building2, label: 'Department', value: viewAsset.department || '—' },
          { icon: MapPin, label: 'Location', value: viewAsset.location || '—' },
          {
            icon: Calendar,
            label: 'Purchase date',
            value: viewAsset.purchaseDate || '—',
          },
          {
            icon: Calendar,
            label: 'Warranty expiry',
            value: viewAsset.warrantyExpiry || '—',
          },
        ];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 px-6 pb-8 pt-6 text-white">
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-indigo-500/15 blur-2xl" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Asset</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">{viewAsset.name || 'Untitled'}</h2>
                    <p className="mt-1 truncate font-mono text-sm text-slate-300">{viewAsset.id}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          viewAsset.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30'
                            : viewAsset.status === 'Maintenance'
                            ? 'bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/30'
                            : 'bg-slate-500/30 text-slate-200 ring-1 ring-slate-400/20'
                        }`}
                      >
                        {viewAsset.status || 'Unknown'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10">
                        {viewAsset.health === 'Excellent' && <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />}
                        {viewAsset.health === 'Good' && <CheckCircle className="h-3.5 w-3.5 text-blue-300" />}
                        {viewAsset.health === 'Fair' && <Activity className="h-3.5 w-3.5 text-amber-300" />}
                        {viewAsset.health === 'Needs Attention' && <XCircle className="h-3.5 w-3.5 text-red-300" />}
                        {viewAsset.health || 'Health'}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start gap-3">
                    {heroFile && isImageFile(heroFile) && (
                      <div className="hidden overflow-hidden rounded-xl ring-2 ring-white/20 sm:block">
                        <img
                          src={fileUrl(heroFile)}
                          alt=""
                          className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setViewAsset(null)}
                      className="rounded-xl bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {heroFile && (
                  <div className="border-b border-gray-200 bg-gradient-to-b from-gray-100 to-gray-50">
                    <div className="relative mx-auto max-h-64 w-full overflow-hidden sm:max-h-72">
                      {isImageFile(heroFile) ? (
                        <a
                          href={fileUrl(heroFile)}
                          target="_blank"
                          rel="noreferrer"
                          className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                          <img
                            src={fileUrl(heroFile)}
                            alt={`${viewAsset.name || 'Asset'} photo`}
                            className="max-h-64 w-full object-contain object-center sm:max-h-72"
                          />
                        </a>
                      ) : (
                        <video
                          src={fileUrl(heroFile)}
                          controls
                          className="max-h-64 w-full bg-black object-contain sm:max-h-72"
                          preload="metadata"
                        />
                      )}
                    </div>
                    <p className="truncate px-4 py-2 text-center text-xs text-gray-500" title={heroFile}>
                      {heroFile}
                    </p>
                  </div>
                )}

                <div className="border-b border-gray-100 bg-white px-6 py-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <ImageIcon className="h-4 w-4 shrink-0 text-blue-600" />
                      Photos &amp; attachments
                    </h3>
                    {mediaFiles.length > 0 && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {mediaFiles.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-4 py-10 text-center">
                      <ImageIcon className="mx-auto h-10 w-10 text-gray-300" aria-hidden />
                      <p className="mt-2 text-sm font-medium text-gray-700">No uploads for this asset</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Images you add in <span className="font-semibold">Register New Device</span> appear here.
                        Older assets may need a new photo added via re-registration or a future edit flow.
                      </p>
                    </div>
                  ) : mediaFiles.length === 1 ? (
                    <p className="rounded-lg bg-blue-50/80 px-4 py-3 text-center text-sm text-blue-900">
                      Full preview is shown above.{' '}
                      <a
                        href={fileUrl(mediaFiles[0])}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold underline decoration-blue-400 underline-offset-2 hover:text-blue-700"
                      >
                        Open original
                      </a>
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {mediaFiles.map((filename: string, idx: number) => {
                        const url = fileUrl(filename);
                        const isImage = isImageFile(filename);
                        const isVideo = isVideoFile(filename);
                        const isHero = filename === heroFile;
                        return (
                          <div
                            key={`${filename}-${idx}`}
                            className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${
                              isHero ? 'ring-2 ring-blue-100' : ''
                            }`}
                          >
                            <div
                              className="truncate px-2 py-1.5 text-[10px] text-gray-500"
                              title={filename}
                            >
                              {filename}
                              {isHero ? ' · main preview' : ''}
                            </div>
                            {isImage ? (
                              <a href={url} target="_blank" rel="noreferrer" className="block bg-gray-50">
                                <img
                                  src={url}
                                  alt=""
                                  className="h-36 w-full object-cover transition-opacity hover:opacity-95"
                                />
                              </a>
                            ) : isVideo ? (
                              <video src={url} controls className="h-36 w-full bg-black object-cover" />
                            ) : (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-36 items-center justify-center bg-gray-100 text-sm font-medium text-blue-600 hover:bg-gray-200"
                              >
                                Open file
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="px-6 py-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Details</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {detailRows.map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
                          <Icon className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500">{label}</p>
                          <p className="mt-0.5 text-sm font-semibold text-gray-900 break-words">{value || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {specParts.length > 0 && (
                  <div className="border-t border-gray-100 px-6 py-5">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">Specifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {specParts.map((p, i) => (
                        <div
                          key={`${p.label}-${i}`}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            {p.label}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-gray-900">{p.value || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setViewAsset(null)}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Asset Modal */}
      {editAsset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Asset</h2>
              <button onClick={() => setEditAsset(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Name', key: 'name' },
                { label: 'Assigned To', key: 'assignedTo' },
                { label: 'Department', key: 'department' },
                { label: 'Location', key: 'location' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={editAsset[key] || ''}
                    onChange={e => setEditAsset({ ...editAsset, [key]: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editAsset.status || 'Active'}
                  onChange={e => setEditAsset({ ...editAsset, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Health</label>
                <select
                  value={editAsset.health || 'Good'}
                  onChange={e => setEditAsset({ ...editAsset, health: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Needs Attention">Needs Attention</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditAsset(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleEditSave} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Asset?</h2>
            <p className="text-gray-600 mb-6">This action cannot be undone. Are you sure you want to permanently delete this asset?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}