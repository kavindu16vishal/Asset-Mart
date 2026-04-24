import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { AssetManagement } from "./components/AssetManagement";
import { IssueReporting } from "./components/IssueReporting";
import { Maintenance } from "./components/Maintenance";
import { UserManagement } from "./components/UserManagement";
import { Settings } from "./components/Settings";
import { LoginPage } from "./components/LoginPage";
import { UserProfile } from "./components/UserProfile";
import { AIChatbot } from "./components/AIChatbot";
import { PredictiveMaintenance } from "./components/PredictiveMaintenance";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("");
  const [dashboardDataRevision, setDashboardDataRevision] = useState(0);
  const bumpDashboardDataRevision = () => setDashboardDataRevision((n) => n + 1);

  useEffect(() => {
    const applyTheme = () => {
      const isDark = localStorage.getItem('darkMode') === 'true';
      document.documentElement.classList.toggle('dark', isDark);
    };

    applyTheme();
    window.addEventListener('storage', applyTheme);
    window.addEventListener('theme-change', applyTheme as EventListener);
    return () => {
      window.removeEventListener('storage', applyTheme);
      window.removeEventListener('theme-change', applyTheme as EventListener);
    };
  }, []);

  const handleLogin = (role: 'admin' | 'user', userData: any) => {
    setUserRole(role);
    setCurrentUser(userData);
    setIsLoggedIn(true);
    // Persist user for settings access
    localStorage.setItem('currentUser', JSON.stringify(userData));
    // Set default tab based on role
    setActiveTab(role === 'admin' ? 'dashboard' : 'profile');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('user');
    setCurrentUser(null);
    setActiveTab('');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // Admin Panel Routes
    if (userRole === 'admin') {
      switch (activeTab) {
        case "dashboard":
          return <Dashboard dataRevision={dashboardDataRevision} />;
        case "assets":
          return <AssetManagement onAssetsDataChanged={bumpDashboardDataRevision} />;
        case "issues":
          return (
            <IssueReporting currentUser={currentUser} onIssuesDataChanged={bumpDashboardDataRevision} />
          );
        case "maintenance":
          return (
            <Maintenance onNavigate={setActiveTab} onDataChanged={bumpDashboardDataRevision} />
          );
        case "predictive-maintenance":
          return (
            <PredictiveMaintenance
              onNavigate={setActiveTab}
              onMaintenanceDataChanged={bumpDashboardDataRevision}
            />
          );
        case "users":
          return <UserManagement />;
        case "settings":
          return <Settings onLogout={handleLogout} />;
        default:
          return <Dashboard dataRevision={dashboardDataRevision} />;
      }
    }
    
    // User Panel Routes
    switch (activeTab) {
      case "profile":
        return <UserProfile currentUser={currentUser} />;
      case "issues":
        return (
          <IssueReporting currentUser={currentUser} onIssuesDataChanged={bumpDashboardDataRevision} />
        );
      case "settings":
        return <Settings onLogout={handleLogout} />;
      default:
        return <UserProfile currentUser={currentUser} />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
      
      {/* AI Chatbot - Available for all users */}
      <AIChatbot currentUser={currentUser} />
    </div>
  );
}