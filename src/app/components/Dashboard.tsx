import { AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type DashboardProps = {
  /** Increment when maintenance (or related) data changes elsewhere so stats/charts refetch. */
  dataRevision?: number;
};

export function Dashboard({ dataRevision = 0 }: DashboardProps) {
  const [totalAssets, setTotalAssets] = useState(0);
  const [activeIssues, setActiveIssues] = useState(0);
  const [resolvedIssues, setResolvedIssues] = useState(0);
  const [pendingMaintenance, setPendingMaintenance] = useState(0);
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>({
    assetTrendData: [],
    assetTypeData: [],
    maintenanceData: [],
    upcomingAlert: null,
    departmentAssetData: [],
    issueResolutionData: [],
  });

  useEffect(() => {
    const load = () => {
      fetch('http://localhost:5000/api/assets')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setTotalAssets(data.length);
        })
        .catch(console.error);

      fetch('http://localhost:5000/api/issues')
        .then((res) => res.json())
        .then((data) => {
          if (!Array.isArray(data)) return;
          setActiveIssues(data.filter((i: any) => i.status === 'Pending' || i.status === 'In Progress').length);
          setResolvedIssues(data.filter((i: any) => i.status === 'Resolved').length);
          setRecentIssues(data.slice(0, 5));
        })
        .catch(console.error);

      fetch('http://localhost:5000/api/maintenance')
        .then((res) => res.json())
        .then((data) => {
          if (!Array.isArray(data)) return;
          setPendingMaintenance(
            data.filter((t: any) => t.status === 'Scheduled' || t.status === 'In Progress').length
          );
        })
        .catch(console.error);

      // Merge into chart state so parallel analytics fetch cannot wipe maintenanceData (race fix).
      fetch('http://localhost:5000/api/dashboard/stats')
        .then((res) => res.json())
        .then((data) => {
          setChartData((prev: any) => ({
            ...prev,
            ...data,
          }));
        })
        .catch(console.error);

      fetch('http://localhost:5000/api/analytics')
        .then((res) => res.json())
        .then((data) => {
          setChartData((prev: any) => ({
            ...prev,
            departmentAssetData: data?.departmentAssetData ?? [],
            issueResolutionData: data?.issueResolutionData ?? [],
          }));
        })
        .catch(console.error);
    };

    load();
  }, [dataRevision]);

  const maintenanceChartKey = useMemo(() => {
    const rows = chartData.maintenanceData;
    if (!Array.isArray(rows) || rows.length === 0) return '0';
    return rows.map((r: any) => `${r.status}:${r.count}`).join('|');
  }, [chartData.maintenanceData]);

  const stats = [
    { label: 'Total Assets', value: totalAssets.toString(), icon: Package, color: 'bg-blue-500' },
    { label: 'Active Issues', value: activeIssues.toString(), icon: AlertTriangle, color: 'bg-orange-500' },
    { label: 'Resolved Issues', value: resolvedIssues.toString(), icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Pending Maintenance', value: pendingMaintenance.toString(), icon: Clock, color: 'bg-purple-500' },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome to Asset Mart</h1>
            <p className="text-blue-100 text-lg">Smart IT Asset Management System - Admin Dashboard</p>
            <p className="text-blue-200 text-sm mt-2">Monitor your assets, track issues, and manage maintenance efficiently</p>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-blue-200">Today's Date</p>
              <p className="font-semibold">{today}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Overview of your asset management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-xs mt-2 text-blue-600 font-medium">● Live Data</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Asset Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.departmentAssetData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="department" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Issue Resolution Tracking */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Resolution Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.issueResolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="resolved" fill="#10b981" name="resolved" />
              <Bar dataKey="pending" fill="#f59e0b" name="pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Type Distribution - LIVE from DB */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Distribution by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.assetTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.assetTypeData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Maintenance Status - LIVE from DB */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart key={maintenanceChartKey} data={chartData.maintenanceData ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Issues - LIVE from DB */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Issues</h3>
          <div className="space-y-3">
            {recentIssues.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No issues reported yet.</p>
            )}
            {recentIssues.map((issue) => (
              <div key={issue.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{issue.assetId || `Issue #${issue.id}`}</p>
                    <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 font-medium">
                      <Package className="w-3 h-3" />
                      <span>Reported by: {issue.reporterName || issue.reporterEmail || 'System / Unassigned'}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{issue.issueType}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                    {issue.priority}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}