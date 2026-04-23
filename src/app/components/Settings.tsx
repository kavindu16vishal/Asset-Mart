import { Bell, Shield, Database, Globe, Moon, Sun, Download, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Settings({ onLogout }: { onLogout?: () => void }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [emailNotifications, setEmailNotifications] = useState(() => localStorage.getItem('emailNotifications') !== 'false');
  const [pushNotifications, setPushNotifications] = useState(() => localStorage.getItem('pushNotifications') !== 'false');
  const [autoBackup, setAutoBackup] = useState(() => localStorage.getItem('autoBackup') !== 'false');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  // Persist toggle settings
  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
    window.dispatchEvent(new Event('theme-change'));
  }, [darkMode]);
  useEffect(() => { localStorage.setItem('emailNotifications', String(emailNotifications)); }, [emailNotifications]);
  useEffect(() => { localStorage.setItem('pushNotifications', String(pushNotifications)); }, [pushNotifications]);
  useEffect(() => { localStorage.setItem('autoBackup', String(autoBackup)); }, [autoBackup]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const assetsRes = await fetch('http://localhost:5000/api/assets');
      const assets = await assetsRes.json();

      let content: string;
      let mimeType: string;
      let fileName: string;

      if (format === 'json') {
        const usersRes = await fetch('http://localhost:5000/api/users');
        const users = await usersRes.json();
        const issuesRes = await fetch('http://localhost:5000/api/issues');
        const issues = await issuesRes.json();
        content = JSON.stringify({ assets, users, issues }, null, 2);
        mimeType = 'application/json';
        fileName = `asset-mart-export-${new Date().toISOString().split('T')[0]}.json`;
      } else {
        // CSV for assets
        const headers = ['id', 'name', 'type', 'serialNumber', 'assignedTo', 'department', 'status', 'purchaseDate', 'warrantyExpiry', 'location', 'health', 'specifications'];
        const rows = assets.map((a: any) => headers.map(h => `"${(a[h] || '').toString().replace(/"/g, '""')}"`).join(','));
        content = [headers.join(','), ...rows].join('\n');
        mimeType = 'text/csv';
        fileName = `assets-export-${new Date().toISOString().split('T')[0]}.csv`;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg(`${format.toUpperCase()} exported successfully!`);
      setTimeout(() => setExportMsg(null), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !currentPassword) {
      setPwMsg({ text: 'Please fill all password fields.', type: 'error' }); return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ text: 'New passwords do not match.', type: 'error' }); return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ text: 'Password must be at least 6 characters.', type: 'error' }); return;
    }
    // Retrieve current logged in user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser?.id) {
      setPwMsg({ text: 'Unable to identify current user.', type: 'error' }); return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        setPwMsg({ text: 'Password updated successfully!', type: 'success' });
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setTimeout(() => setPwMsg(null), 4000);
      } else {
        setPwMsg({ text: 'Failed to update password.', type: 'error' });
      }
    } catch (err) {
      setPwMsg({ text: 'Server error. Try again.', type: 'error' });
    }
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : ''}`} />
    </button>
  );

  return (
    <div className="p-8 space-y-6">
      {/* Toast */}
      {exportMsg && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {exportMsg}
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Notifications */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground">Preferences are saved automatically</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Toggle value={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Get instant alerts</p>
                </div>
                <Toggle value={pushNotifications} onChange={() => setPushNotifications(!pushNotifications)} />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Security</h3>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {pwMsg && (
                <p className={`text-sm font-medium ${pwMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {pwMsg.text}
                </p>
              )}
              <button
                onClick={handleChangePassword}
                className="mt-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Password
              </button>
            </div>
          </div>

          {/* Data & Backup */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Data & Backup</h3>
                <p className="text-sm text-muted-foreground">Manage and export your live data</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Automatic Backup</p>
                  <p className="text-sm text-muted-foreground">Daily automatic backups</p>
                </div>
                <Toggle value={autoBackup} onChange={() => setAutoBackup(!autoBackup)} />
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="font-medium text-foreground mb-2">Export Live Data</p>
                <p className="text-sm text-muted-foreground mb-3">Download all assets, users and issues from the database</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export JSON
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                {darkMode ? <Moon className="w-5 h-5 text-orange-600" /> : <Sun className="w-5 h-5 text-orange-600" />}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Appearance</h3>
                <p className="text-sm text-muted-foreground">Preference saved to browser storage</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Use dark theme</p>
              </div>
              <Toggle value={darkMode} onChange={() => setDarkMode(!darkMode)} />
            </div>
          </div>
        </div>

        {/* Side Quick Info */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <Globe className="w-8 h-8 mb-4" />
            <h3 className="font-semibold mb-2">System Information</h3>
            <div className="space-y-2 text-sm text-blue-100">
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="text-white font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>License:</span>
                <span className="text-white font-medium">Enterprise</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-white font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span>Backend:</span>
                <span className="text-white font-medium text-xs">localhost:5000</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
