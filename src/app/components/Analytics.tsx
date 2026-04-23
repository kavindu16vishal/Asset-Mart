import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Download } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const exportReport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const rows: string[] = [];
      const esc = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

      // Section 1: KPIs
      rows.push('SECTION,KPI SUMMARY');
      rows.push(['Metric', 'Value', 'Change', 'Trend'].map(esc).join(','));
      data.kpiData.forEach((k: any) =>
        rows.push([k.label, k.value, k.change, k.trend].map(esc).join(','))
      );
      rows.push('');

      // Section 2: Assets by Department
      rows.push('SECTION,ASSETS BY DEPARTMENT');
      rows.push(['Department', 'Asset Count'].map(esc).join(','));
      data.departmentAssetData.forEach((d: any) =>
        rows.push([d.department, d.count].map(esc).join(','))
      );
      rows.push('');

      // Section 3: Issue Resolution
      rows.push('SECTION,ISSUE RESOLUTION RATE');
      rows.push(['Week', 'Resolved', 'Pending'].map(esc).join(','));
      data.issueResolutionData.forEach((d: any) =>
        rows.push([d.week, d.resolved, d.pending].map(esc).join(','))
      );
      rows.push('');

      // Section 4: Cost Analysis
      rows.push('SECTION,COST ANALYSIS');
      rows.push(['Month', 'Maintenance ($)', 'Replacement ($)', 'New ($)'].map(esc).join(','));
      data.costAnalysisData.forEach((d: any) =>
        rows.push([d.month, d.maintenance, d.replacement, d.new].map(esc).join(','))
      );
      rows.push('');

      // Section 5: Asset Lifecycle
      rows.push('SECTION,ASSET LIFECYCLE SUMMARY');
      rows.push(['Category', 'Count', 'Percentage'].map(esc).join(','));
      const lc = data.lifecycleSummary;
      rows.push([['New (0-1yr)', lc.new.count, lc.new.percentage],
        ['Active (1-3yr)', lc.active.count, lc.active.percentage],
        ['Aging (3-5yr)', lc.aging.count, lc.aging.percentage],
        ['End of Life (5+yr)', lc.eol.count, lc.eol.percentage]]
        .map(r => r.map(esc).join(',')).join('\n'));
      rows.push('');

      // Section 6: Upcoming Maintenance
      rows.push('SECTION,UPCOMING MAINTENANCE');
      rows.push(['Asset', 'Asset ID', 'Type', 'Description', 'Scheduled Date'].map(esc).join(','));
      data.upcomingMaintenance.forEach((t: any) =>
        rows.push([t.assetName || t.assetId, t.assetId, t.type, t.description, t.scheduledDate].map(esc).join(','))
      );

      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics data');
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500">
        Failed to load analytics data.
      </div>
    );
  }

  const {
    assetPerformanceData,
    departmentAssetData,
    issueResolutionData,
    costAnalysisData,
    kpiData,
    lifecycleSummary,
    upcomingMaintenance
  } = data;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics & Insights</h2>
          <p className="text-gray-600 mt-1">Comprehensive asset performance metrics</p>
        </div>
        <button
          onClick={exportReport}
          disabled={exporting || !data}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          {exporting ? 'Exporting...' : 'Export Report'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi: any, index: number) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">{kpi.label}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
              <div className={`flex items-center gap-1 ${kpi.color}`}>
                {kpi.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{kpi.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Performance Over Time */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Asset Performance Trends</h3>
            <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
              <option>Last 6 Months</option>
              <option>Last 12 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={assetPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="uptime" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costAnalysisData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
              <Line type="monotone" dataKey="maintenance" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="replacement" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="new" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictive Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">AI Predictive Maintenance</h3>
              <p className="text-blue-100 mb-4">
                Based on usage patterns and historical data, {upcomingMaintenance.length} assets are predicted to require maintenance soon.
              </p>
              <ul className="space-y-2 text-sm">
                {upcomingMaintenance.length > 0 ? upcomingMaintenance.map((task: any, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div>
                    <span className="truncate">{task.assetName || task.assetId}: {task.description} by {new Date(task.scheduledDate).toLocaleDateString()}</span>
                  </li>
                )) : (
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    <span>No upcoming maintenance predicted.</span>
                  </li>
                )}
              </ul>
              <button className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                View All Predictions
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Lifecycle Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">New Assets (0-1 year)</p>
                <p className="text-2xl font-bold text-gray-900">{lifecycleSummary.new.count}</p>
              </div>
              <div className="text-blue-600 text-right">
                <p className="text-sm">{lifecycleSummary.new.percentage}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Active (1-3 years)</p>
                <p className="text-2xl font-bold text-gray-900">{lifecycleSummary.active.count}</p>
              </div>
              <div className="text-green-600 text-right">
                <p className="text-sm">{lifecycleSummary.active.percentage}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Aging (3-5 years)</p>
                <p className="text-2xl font-bold text-gray-900">{lifecycleSummary.aging.count}</p>
              </div>
              <div className="text-yellow-600 text-right">
                <p className="text-sm">{lifecycleSummary.aging.percentage}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">End of Life (5+ years)</p>
                <p className="text-2xl font-bold text-gray-900">{lifecycleSummary.eol.count}</p>
              </div>
              <div className="text-red-600 text-right">
                <p className="text-sm">{lifecycleSummary.eol.percentage}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
