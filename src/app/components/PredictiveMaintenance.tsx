import { useState, useEffect } from 'react';
import { Brain, AlertTriangle, TrendingUp, Calendar, Search, Filter, Download, ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Prediction {
  id: string;
  assetId: string;
  assetName: string;
  assetType: string;
  department: string;
  predictionType: 'Failure' | 'Performance Degradation' | 'Component Wear' | 'Overheating' | 'Battery Issue';
  confidenceScore: number;
  predictedDate: string;
  daysUntilAction: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Pending Review' | 'Acknowledged' | 'Action Scheduled' | 'Resolved' | 'False Positive';
  description: string;
  recommendedAction: string;
  historicalData: {
    uptime: number;
    avgTemperature: number;
    errorCount: number;
    lastMaintenance: string;
  };
  createdAt: string;
}

interface PredictiveMaintenanceProps {
  onNavigate?: (tab: string) => void;
}

export function PredictiveMaintenance({ onNavigate }: PredictiveMaintenanceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/maintenance/predictions');
      const data = await res.json();
      setPredictions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);



  // Filter predictions
  const filteredPredictions = predictions.filter(pred => {
    const matchesSearch = pred.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pred.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pred.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || pred.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || pred.status === filterStatus;
    const matchesType = filterType === 'all' || pred.predictionType === filterType;
    
    return matchesSearch && matchesSeverity && matchesStatus && matchesType;
  });

  // Calculate stats
  const stats = {
    total: predictions.length,
    critical: predictions.filter(p => p.severity === 'Critical').length,
    pendingReview: predictions.filter(p => p.status === 'Pending Review').length,
    avgConfidence: predictions.length > 0
      ? (predictions.reduce((sum, p) => sum + p.confidenceScore, 0) / predictions.length).toFixed(1)
      : '0.0'
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Review': return 'bg-purple-100 text-purple-700';
      case 'Acknowledged': return 'bg-blue-100 text-blue-700';
      case 'Action Scheduled': return 'bg-cyan-100 text-cyan-700';
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'False Positive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending Review': return <Clock className="w-4 h-4" />;
      case 'Acknowledged': return <CheckCircle className="w-4 h-4" />;
      case 'Action Scheduled': return <Calendar className="w-4 h-4" />;
      case 'Resolved': return <CheckCircle className="w-4 h-4" />;
      case 'False Positive': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportPredictions = () => {
    const csvContent = [
      ['ID', 'Asset', 'Type', 'Prediction', 'Confidence', 'Predicted Date', 'Days Until', 'Severity', 'Status'],
      ...filteredPredictions.map(p => [
        p.id,
        p.assetName,
        p.assetType,
        p.predictionType,
        p.confidenceScore,
        p.predictedDate,
        p.daysUntilAction,
        p.severity,
        p.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleScheduleAction = async (prediction: Prediction) => {
    setSchedulingId(prediction.id);
    try {
      const res = await fetch('http://localhost:5000/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: prediction.assetId,
          type: 'Preventive',
          description: prediction.recommendedAction,
          scheduledDate: prediction.predictedDate,
          priority: prediction.severity === 'Critical' ? 'Critical' : prediction.severity === 'High' ? 'High' : 'Medium',
          assignedTo: 'IT Team',
        })
      });
      if (res.ok) {
        setScheduleSuccess(prediction.id);
        setTimeout(() => setScheduleSuccess(null), 3000);
        await fetchPredictions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSchedulingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4 text-gray-500">
            <Brain className="w-12 h-12 text-purple-500 animate-pulse" />
            <p className="text-lg font-medium">Analyzing asset health data...</p>
            <p className="text-sm">Generating AI predictions from your live database</p>
          </div>
        </div>
      )}
      {!isLoading && (
      <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => onNavigate?.('maintenance')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">AI Predictive Maintenance</h2>
              <p className="text-gray-600 mt-1">View all maintenance predictions and analytics</p>
            </div>
          </div>
        </div>
        <button 
          onClick={exportPredictions}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Predictions</p>
              <p className="text-4xl font-bold mt-2">{stats.total}</p>
            </div>
            <Brain className="w-12 h-12 text-purple-200 opacity-80" />
          </div>
          <div className="mt-4 text-sm text-purple-100">
            Generated by AI analysis
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Critical Issues</p>
              <p className="text-4xl font-bold mt-2">{stats.critical}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-200 opacity-80" />
          </div>
          <div className="mt-4 text-sm text-red-100">
            Require immediate attention
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pending Review</p>
              <p className="text-4xl font-bold mt-2">{stats.pendingReview}</p>
            </div>
            <Clock className="w-12 h-12 text-orange-200 opacity-80" />
          </div>
          <div className="mt-4 text-sm text-orange-100">
            Awaiting acknowledgment
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Avg Confidence</p>
              <p className="text-4xl font-bold mt-2">{stats.avgConfidence}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
          <div className="mt-4 text-sm text-blue-100">
            AI prediction accuracy
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by asset, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Action Scheduled">Action Scheduled</option>
              <option value="Resolved">Resolved</option>
              <option value="False Positive">False Positive</option>
            </select>
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="Failure">Failure</option>
              <option value="Performance Degradation">Performance Degradation</option>
              <option value="Component Wear">Component Wear</option>
              <option value="Overheating">Overheating</option>
              <option value="Battery Issue">Battery Issue</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredPredictions.length}</span> of <span className="font-semibold">{predictions.length}</span> predictions
          </p>
          {(searchTerm || filterSeverity !== 'all' || filterStatus !== 'all' || filterType !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSeverity('all');
                setFilterStatus('all');
                setFilterType('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Predictions List */}
      <div className="space-y-4">
        {filteredPredictions.map((prediction) => (
          <div key={prediction.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg border-2 ${getSeverityColor(prediction.severity)}`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{prediction.assetName}</h3>
                      <span className="text-sm text-gray-500">({prediction.assetId})</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(prediction.severity)}`}>
                        {prediction.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="font-medium">{prediction.assetType}</span>
                      <span>•</span>
                      <span>{prediction.department}</span>
                      <span>•</span>
                      <span className="font-medium text-purple-600">{prediction.predictionType}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Confidence Score</div>
                    <div className={`text-2xl font-bold ${getConfidenceColor(prediction.confidenceScore)}`}>
                      {prediction.confidenceScore}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Timeline */}
              <div className="flex items-center gap-6 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(prediction.status)}
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(prediction.status)} mt-1`}>
                      {prediction.status}
                    </span>
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Predicted Date</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">{prediction.predictedDate}</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Time to Action</div>
                    <div className={`text-sm font-medium mt-1 ${
                      prediction.daysUntilAction <= 7 ? 'text-red-600' : 
                      prediction.daysUntilAction <= 30 ? 'text-orange-600' : 
                      'text-green-600'
                    }`}>
                      {prediction.daysUntilAction} days
                    </div>
                  </div>
                </div>
              </div>

              {/* Description and Action */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Analysis</div>
                  <p className="text-sm text-gray-700">{prediction.description}</p>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Recommended Action</div>
                  <p className="text-sm text-gray-900 font-medium">{prediction.recommendedAction}</p>
                </div>
              </div>

              {/* Historical Data */}
              <div className="border-t border-gray-200 pt-4">
                <div className="text-xs font-medium text-gray-500 uppercase mb-3">Historical Data</div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-600 font-medium">Uptime</div>
                    <div className="text-lg font-bold text-blue-900 mt-1">{prediction.historicalData.uptime}h</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-xs text-orange-600 font-medium">Avg Temperature</div>
                    <div className="text-lg font-bold text-orange-900 mt-1">{prediction.historicalData.avgTemperature}°C</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-xs text-red-600 font-medium">Error Count</div>
                    <div className="text-lg font-bold text-red-900 mt-1">{prediction.historicalData.errorCount}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600 font-medium">Last Maintenance</div>
                    <div className="text-sm font-bold text-green-900 mt-1">{prediction.historicalData.lastMaintenance}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Prediction ID: <span className="font-medium text-gray-700">{prediction.id}</span> • 
                  Created: <span className="font-medium text-gray-700">{prediction.createdAt}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPrediction(prediction)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  >
                    View Details
                  </button>
                  {scheduleSuccess === prediction.id ? (
                    <span className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Scheduled!
                    </span>
                  ) : (
                    <button
                      onClick={() => handleScheduleAction(prediction)}
                      disabled={schedulingId === prediction.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {schedulingId === prediction.id && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      Schedule Action
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPredictions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Predictions Found</h3>
          <p className="text-gray-600">Try adjusting your filters or search criteria</p>
        </div>
      )}
      </>)}

      {/* View Details Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedPrediction.assetName}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedPrediction.assetId} · {selectedPrediction.department}</p>
              </div>
              <button
                onClick={() => setSelectedPrediction(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedPrediction.severity)}`}>{selectedPrediction.severity} Severity</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPrediction.status)}`}>{selectedPrediction.status}</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{selectedPrediction.predictionType}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">Confidence Score</p>
                  <p className={`text-2xl font-bold mt-1 ${getConfidenceColor(selectedPrediction.confidenceScore)}`}>{selectedPrediction.confidenceScore}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">Days Until Action</p>
                  <p className={`text-2xl font-bold mt-1 ${selectedPrediction.daysUntilAction <= 7 ? 'text-red-600' : selectedPrediction.daysUntilAction <= 30 ? 'text-orange-600' : 'text-green-600'}`}>{selectedPrediction.daysUntilAction}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">Predicted Date</p>
                  <p className="text-sm font-bold mt-1 text-gray-900">{selectedPrediction.predictedDate}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Analysis</h4>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">{selectedPrediction.description}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Recommended Action</h4>
                <p className="text-sm text-gray-900 font-medium bg-blue-50 rounded-lg p-4 text-blue-900">{selectedPrediction.recommendedAction}</p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600 font-medium">Uptime</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">{selectedPrediction.historicalData.uptime}h</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-orange-600 font-medium">Avg Temp</p>
                  <p className="text-lg font-bold text-orange-900 mt-1">{selectedPrediction.historicalData.avgTemperature}°C</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-600 font-medium">Error Count</p>
                  <p className="text-lg font-bold text-red-900 mt-1">{selectedPrediction.historicalData.errorCount}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600 font-medium">Last Service</p>
                  <p className="text-xs font-bold text-green-900 mt-1">{selectedPrediction.historicalData.lastMaintenance}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { handleScheduleAction(selectedPrediction); setSelectedPrediction(null); }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Schedule Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}