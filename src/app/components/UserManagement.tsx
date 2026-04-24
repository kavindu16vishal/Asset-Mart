import { Users, Mail, Shield, Edit2, Trash2, KeyRound, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { AddUserModal } from './AddUserModal';

export function UserManagement() {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetInfo, setResetInfo] = useState<{ userName: string; tempPassword: string; recoveryCodes: string[] } | null>(null);
  const [userSearch, setUserSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const fields = [u.name, u.email, u.role, u.department, u.status, u.lastActive]
        .filter(Boolean)
        .map((s: string) => String(s).toLowerCase());
      return fields.some((f) => f.includes(q));
    });
  }, [users, userSearch]);

  const fetchUsers = () => {
    fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(console.error);
  };

  useEffect(() => { fetchUsers(); }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSaveUser = async (userData: any) => {
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          role: userData.role || 'user',
          department: userData.department || 'Unassigned',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchUsers();
        showSuccess('User added successfully!');
        if (data?.tempPassword && Array.isArray(data?.recoveryCodes)) {
          setResetInfo({ userName: data.name, tempPassword: data.tempPassword, recoveryCodes: data.recoveryCodes });
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editUser.role, status: editUser.status, department: editUser.department }),
      });
      if (res.ok) { fetchUsers(); setEditUser(null); showSuccess('User updated successfully!'); }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) { fetchUsers(); setDeleteConfirm(null); showSuccess('User deleted.'); }
    } catch (err) { console.error(err); }
  };

  const handleAdminReset = async (user: any) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.id}/admin-reset`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResetInfo({ userName: user.name, tempPassword: data.tempPassword, recoveryCodes: data.recoveryCodes || [] });
        showSuccess('Password reset generated.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleColor = (role: string) => {
    const r = role?.toLowerCase();
    if (r === 'admin' || r === 'administrator') return 'bg-purple-100 text-purple-700';
    if (r === 'manager') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) =>
    status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';

  return (
    <div className="p-8 space-y-6">
      {/* Success Toast */}
      {successMsg && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50">
          {successMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage users and permissions</p>
        </div>
        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Users className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users.filter(u => u.status === 'Active').length}</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Administrators</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {users.filter(u => u.role?.toLowerCase() === 'admin' || u.role?.toLowerCase() === 'administrator').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Inactive</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users.filter(u => u.status !== 'Active').length}</p>
            </div>
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 sm:px-6 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name, email, role, or department…"
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300"
              aria-label="Search users"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No users found.</td></tr>
              )}
              {users.length > 0 && filteredUsers.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No users match your search.</td></tr>
              )}
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastActive}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditUser({ ...user })}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAdminReset(user)}
                        className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                        title="Reset Password (Admin)"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Reset Info Modal */}
      {resetInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">User access reset</h2>
              <p className="text-sm text-gray-600 mt-1">
                Share these with <span className="font-medium">{resetInfo.userName}</span> securely.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Temporary password</p>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                  {resetInfo.tempPassword}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Recovery codes (one-time)</p>
                <div className="grid grid-cols-2 gap-2">
                  {resetInfo.recoveryCodes.map((c) => (
                    <div key={c} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                      {c}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `Temp password: ${resetInfo.tempPassword}\n\nRecovery codes:\n${resetInfo.recoveryCodes.join('\n')}`
                    );
                  } catch {
                    // ignore
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-800 font-medium"
              >
                Copy
              </button>
              <button
                onClick={() => setResetInfo(null)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSave={handleSaveUser}
      />

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User: {editUser.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editUser.role || 'user'}
                  onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editUser.status || 'Active'}
                  onChange={e => setEditUser({ ...editUser, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editUser.department || ''}
                  onChange={e => setEditUser({ ...editUser, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditUser(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleEditSave} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete User?</h2>
            <p className="text-gray-600 mb-6">This will permanently remove the user from the system.</p>
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