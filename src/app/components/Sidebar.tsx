import { LayoutDashboard, Package, AlertCircle, Settings, Users, FileText, User, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: 'admin' | 'user';
  onLogout: () => void;
  currentUser?: any;
}

export function Sidebar({ activeTab, onTabChange, userRole, onLogout, currentUser }: SidebarProps) {
  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: 'Asset Management', icon: Package },
    { id: 'issues', label: 'Issue Reports', icon: AlertCircle },
    { id: 'maintenance', label: 'Maintenance', icon: FileText },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userMenuItems = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'issues', label: 'Report Issue', icon: AlertCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground h-screen flex flex-col border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl">Asset Mart</h1>
            <p className="text-xs text-sidebar-foreground/70">
              {userRole === 'admin' ? 'Admin Panel' : 'User Panel'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
            <span className="font-medium">
              {currentUser?.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('') : 'JD'}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm flex-wrap w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {currentUser?.name || 'John Doe'}
            </p>
            <p className="text-xs text-sidebar-foreground/70 capitalize whitespace-nowrap">
              {currentUser?.role || (userRole === 'admin' ? 'Administrator' : 'Department User')}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sidebar-foreground/80 hover:bg-sidebar-accent rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}