import { User, Mail, Phone, MapPin, Briefcase, Package, Calendar, CheckCircle, AlertCircle, Clock, Eye, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function UserProfile({ currentUser }: { currentUser?: any }) {
  const userInfo = currentUser ? {
    name: currentUser.name,
    email: currentUser.email,
    phone: '+1 234 567 8900',
    department: currentUser.department || 'Unassigned',
    employeeId: `EMP-2026-${String(currentUser.id).padStart(3, '0')}`,
    joinDate: 'Recently',
    location: 'Building A, Floor 1',
  } : {
    name: 'Loading...',
    email: '',
    phone: '',
    department: '',
    employeeId: '',
    joinDate: '',
    location: '',
  };

  const [assignedDevices, setAssignedDevices] = useState<any[]>([]);
  const [issueHistory, setIssueHistory] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  useEffect(() => {
    if (currentUser?.name) {
      fetch(`http://localhost:5000/api/assets?assignedTo=${encodeURIComponent(currentUser.name)}`)
        .then(res => res.json())
        .then(data => setAssignedDevices(data))
        .catch(console.error);
    }
    
    if (currentUser?.id) {
      fetch(`http://localhost:5000/api/issues?userId=${currentUser.id}`)
        .then(res => res.json())
        .then(data => setIssueHistory(data))
        .catch(console.error);
    }
  }, [currentUser]);

  return (
    <div className="p-8 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome, {userInfo.name}!</h1>
            <p className="text-blue-100 text-lg">
              User Dashboard - {userInfo.department}
            </p>
            <p className="text-blue-200 text-sm mt-2">
              View your assigned devices, report issues, and track your requests
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-blue-200">Your Employee ID</p>
              <p className="font-semibold">{userInfo.employeeId}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-foreground">My Profile</h2>
        <p className="text-muted-foreground mt-1">View your personal information and assigned devices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {userInfo.name === 'Loading...' ? '?' : userInfo.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h3 className="text-xl font-bold text-foreground mt-4">{userInfo.name}</h3>
              <p className="text-sm text-muted-foreground">{userInfo.department}</p>
              <span className="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Active Employee
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground">{userInfo.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm text-foreground">{userInfo.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Employee ID</p>
                  <p className="text-sm text-foreground">{userInfo.employeeId}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Join Date</p>
                  <p className="text-sm text-foreground">{userInfo.joinDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm text-foreground">{userInfo.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Devices</span>
                <span className="font-semibold text-foreground">{assignedDevices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Issues Reported</span>
                <span className="font-semibold text-foreground">{issueHistory.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resolved Issues</span>
                <span className="font-semibold text-green-600">{issueHistory.filter(i => i.status === 'Resolved').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Devices */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Assigned Devices</h3>
              <span className="text-sm text-muted-foreground">{assignedDevices.length} devices</span>
            </div>

            <div className="space-y-4">
              {assignedDevices.map((device) => (
                <div key={device.id} className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{device.name}</h4>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                            {device.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{device.type} • {device.id}</p>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Serial Number</p>
                            <p className="text-foreground font-medium">{device.serialNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Purchase Date</p>
                            <p className="text-foreground font-medium">{device.purchaseDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Health</p>
                            <p className="text-foreground font-medium">{device.health}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Warranty</p>
                            <p className="text-foreground font-medium">{device.warrantyExpiry}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issue History */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Issue History</h3>
            <div className="space-y-3">
              {issueHistory.map((issue) => (
                <div key={issue.id} className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">#{issue.id}</p>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          issue.status === 'Resolved'
                            ? 'bg-green-100 text-green-700'
                            : issue.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.assetId || 'Unknown Asset'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-muted-foreground">{new Date(issue.createdAt).toLocaleDateString()}</p>
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-foreground"
                        title="View details"
                        aria-label="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">{issue.description}</p>
                      {issue.resolution && (
                        <p className="text-sm text-green-600 mt-1">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          {issue.resolution}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Issue Details Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-6 border-b border-border flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Issue Details</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Issue #{selectedIssue.id} • {selectedIssue.assetId || 'Unknown Asset'}
                </p>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
                title="Close"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  selectedIssue.status === 'Resolved'
                    ? 'bg-green-100 text-green-700'
                    : selectedIssue.status === 'In Progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedIssue.status}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded bg-purple-100 text-purple-700">
                  {selectedIssue.issueType || 'Other'}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                  {selectedIssue.priority || 'Medium'}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {selectedIssue.createdAt ? new Date(selectedIssue.createdAt).toLocaleString() : ''}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                <div className="bg-background border border-border rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap">
                  {selectedIssue.description || '—'}
                </div>
              </div>

              {Array.isArray(selectedIssue.files) && selectedIssue.files.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Attachments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedIssue.files.map((filename: string) => {
                      const url = `http://localhost:5000/uploads/${encodeURIComponent(filename)}`;
                      const lower = String(filename).toLowerCase();
                      const isImage = /\.(png|jpe?g|gif|webp|svg|avif)$/.test(lower);
                      const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/.test(lower);

                      return (
                        <div key={filename} className="bg-background border border-border rounded-xl p-3">
                          <div className="text-xs text-muted-foreground mb-2 break-all">{filename}</div>
                          {isImage ? (
                            <a href={url} target="_blank" rel="noreferrer">
                              <img
                                src={url}
                                alt={filename}
                                className="w-full h-48 object-cover rounded-lg border border-border"
                                loading="lazy"
                              />
                            </a>
                          ) : isVideo ? (
                            <video
                              src={url}
                              controls
                              className="w-full h-48 object-cover rounded-lg border border-border bg-black"
                            />
                          ) : (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center w-full px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium text-foreground"
                            >
                              Open file
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-foreground font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}