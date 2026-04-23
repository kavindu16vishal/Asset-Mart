import { Upload, Camera, Video, FileText, AlertCircle, Send, X, Image as ImageIcon, User, Clock, Trash2, CheckCircle as CheckCircleIcon, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';

type UndoableAction =
  | {
      kind: 'status';
      issueId: number;
      prevStatus: string;
      nextStatus: string;
      label: string;
    }
  | {
      kind: 'delete';
      issueId: number;
      issueSnapshot: any;
      label: string;
      deleteTimeoutId: number;
    };

export function IssueReporting({ currentUser }: { currentUser?: any }) {
  const [assetId, setAssetId] = useState('');
  const [issueType, setIssueType] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<UndoableAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoableAction[]>([]);
  const [toastAction, setToastAction] = useState<UndoableAction | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    fetchIssues();
  }, [currentUser]);

  const fetchIssues = async () => {
    try {
      const url = currentUser?.role === 'user' 
        ? `http://localhost:5000/api/issues?userId=${currentUser.id}`
        : 'http://localhost:5000/api/issues';
        
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecentReports(data);
      }
    } catch (err) {
      console.error('Failed to fetch issues', err);
    }
  };

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const res = await fetch('http://localhost:5000/api/issues/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, issueType, assetId })
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.analysis);
      } else {
        const errData = await res.json();
        setAiAnalysis(`Error: ${errData.error} ${errData.details ? `(${errData.details})` : ''}`);
      }
    } catch (err) {
      setAiAnalysis("Error communicating with AI service.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    const input = e.target;
    if (list?.length) {
      setUploadedFiles((prev) => [...prev, ...Array.from(list)]);
    }
    // Defer reset so the browser always finishes the change cycle (hidden inputs can skip updates)
    queueMicrotask(() => {
      input.value = '';
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('assetId', assetId);
      formData.append('issueType', issueType);
      formData.append('priority', priority);
      formData.append('description', description);
      if (currentUser?.id) {
        formData.append('reportedBy', currentUser.id.toString());
      }
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch('http://localhost:5000/api/issues', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setAssetId('');
          setIssueType('');
          setPriority('Medium');
          setDescription('');
          setUploadedFiles([]);
        }, 3000);
        fetchIssues();
      } else {
        let msg = `Could not submit report (${res.status})`;
        try {
          const errBody = await res.json();
          if (errBody?.error) msg = errBody.error;
        } catch {
          /* ignore */
        }
        console.error('Issue submit failed:', msg);
        alert(msg);
      }
    } catch (err) {
      console.error('Failed to submit issue', err);
      alert('Failed to submit issue. Check that the server is running.');
    }
  };

  const issueTypes = [
    'Hardware Malfunction',
    'Software Error',
    'Network Issue',
    'Performance Problem',
    'Security Concern',
    'Maintenance Request',
    'Other',
  ];

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const current = recentReports.find(r => r.id === id);
      const prevStatus = current?.status;
      if (!prevStatus || prevStatus === newStatus) return;

      // Optimistic UI update
      setRecentReports(prev => prev.map(r => (r.id === id ? { ...r, status: newStatus } : r)));

      const res = await fetch(`http://localhost:5000/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        // Revert if backend failed
        setRecentReports(prev => prev.map(r => (r.id === id ? { ...r, status: prevStatus } : r)));
        return;
      }

      const action: UndoableAction = {
        kind: 'status',
        issueId: id,
        prevStatus,
        nextStatus: newStatus,
        label: `Status changed to "${newStatus}"`,
      };
      setUndoStack(prev => [...prev, action]);
      setRedoStack([]);
      setToastAction(action);
    } catch (err) {
      console.error(err);
    }
  };

  const scheduleDeleteIssue = async (issue: any) => {
    // Optimistic remove from UI
    setRecentReports(prev => prev.filter(r => r.id !== issue.id));

    const timeoutId = window.setTimeout(async () => {
      try {
        await fetch(`http://localhost:5000/api/issues/${issue.id}`, { method: 'DELETE' });
      } catch (err) {
        console.error(err);
      } finally {
        // keep UI as-is; if delete fails, a refetch will restore
      }
    }, 6000);

    const action: UndoableAction = {
      kind: 'delete',
      issueId: issue.id,
      issueSnapshot: issue,
      label: 'Issue deleted',
      deleteTimeoutId: timeoutId,
    };
    setUndoStack(prev => [...prev, action]);
    setRedoStack([]);
    setToastAction(action);
  };

  const undoLastAction = async () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;

    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, last]);

    try {
      if (last.kind === 'status') {
        // Optimistic revert
        setRecentReports(prev => prev.map(r => (r.id === last.issueId ? { ...r, status: last.prevStatus } : r)));
        const res = await fetch(`http://localhost:5000/api/issues/${last.issueId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: last.prevStatus })
        });
        if (!res.ok) fetchIssues();
      } else {
        // Cancel pending delete + restore in UI
        window.clearTimeout(last.deleteTimeoutId);
        setRecentReports(prev => {
          const exists = prev.some(r => r.id === last.issueSnapshot.id);
          if (exists) return prev;
          return [last.issueSnapshot, ...prev].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        });
      }
    } catch (err) {
      console.error(err);
      fetchIssues();
    }
  };

  const redoLastAction = async () => {
    const last = redoStack[redoStack.length - 1];
    if (!last) return;

    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, last]);
    setToastAction(last);

    try {
      if (last.kind === 'status') {
        setRecentReports(prev => prev.map(r => (r.id === last.issueId ? { ...r, status: last.nextStatus } : r)));
        const res = await fetch(`http://localhost:5000/api/issues/${last.issueId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: last.nextStatus })
        });
        if (!res.ok) fetchIssues();
      } else {
        // Re-run delete with a new delay (so it can be undone again)
        const issue = last.issueSnapshot;
        await scheduleDeleteIssue(issue);
      }
    } catch (err) {
      console.error(err);
      fetchIssues();
    }
  };

  const getPriorityBadge = (p: string) => {
    switch(p) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getStatusBadge = (s: string) => {
    switch(s) {
      case 'Resolved': return 'bg-green-50 text-green-700 border-green-100';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">{currentUser?.role === 'admin' ? 'Issue Management' : 'Report an Issue'}</h2>
        <p className="text-gray-600 mt-1">
          {currentUser?.role === 'admin' 
            ? 'Manage all technical issues and track resolutions across the organization' 
            : 'Submit technical issues with multimedia support (images, videos, documents)'}
        </p>
      </div>

      {currentUser?.role === 'admin' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Active Issue Console
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={undoLastAction}
                disabled={undoStack.length === 0}
                className="px-3 py-1 text-xs font-bold rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo last action"
              >
                Undo
              </button>
              <button
                onClick={redoLastAction}
                disabled={redoStack.length === 0}
                className="px-3 py-1 text-xs font-bold rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo last undone action"
              >
                Redo
              </button>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {recentReports.length} Total Issues
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-100">
                  <th className="px-6 py-4">Reporter / Asset</th>
                  <th className="px-6 py-4">Issue Description</th>
                  <th className="px-6 py-4">Priority / Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentReports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                      No issues have been reported yet.
                    </td>
                  </tr>
                )}
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{report.reporterName || 'System / Unassigned'}</p>
                          <p className="text-xs text-gray-500">{report.assetId || 'No Asset ID'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-gray-700 line-clamp-2">{report.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] text-gray-400">
                          {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(report.priority)}`}>
                          {report.priority}
                        </span>
                        <p className="text-xs text-gray-500">{report.issueType}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {report.status !== 'Resolved' && (
                          <button 
                            onClick={() => handleUpdateStatus(report.id, 'Resolved')}
                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                            title="Mark Resolved"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {report.status !== 'In Progress' && report.status !== 'Resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(report.id, 'In Progress')}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            title="Mark In Progress"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (confirm('Delete this issue permanently?')) {
                              await scheduleDeleteIssue(report);
                            }
                          }}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                          title="Delete Issue"
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
      )}

      {/* Undo/Redo Toast */}
      {toastAction && currentUser?.role === 'admin' && (
        <div className="fixed bottom-8 right-8 bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 z-50 flex items-center gap-3">
          <div className="text-sm text-gray-800 font-medium">{toastAction.label}</div>
          <button
            onClick={undoLastAction}
            className="px-3 py-1 text-sm font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Undo
          </button>
          <button
            onClick={redoLastAction}
            className="px-3 py-1 text-sm font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Redo
          </button>
          <button
            onClick={() => setToastAction(null)}
            className="p-1 text-gray-400 hover:text-gray-700"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {currentUser?.role === 'admin' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-800 font-medium">Issue Filing Form - For creating reports on behalf of others or personal requests</p>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Need Help?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Our AI assistant will analyze your issue and provide instant diagnostics. Include screenshots or videos for faster resolution.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asset ID or Name</label>
                <input
                  type="text"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="e.g., AST-001 or MacBook Pro"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select issue type</option>
                  {issueTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setPriority(level)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        priority === level
                          ? level === 'Critical'
                            ? 'bg-red-600 text-white'
                            : level === 'High'
                            ? 'bg-orange-600 text-white'
                            : level === 'Medium'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the Issue
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide detailed information about the issue you're experiencing..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Multimedia Upload */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">Attach Media</h3>
              {uploadedFiles.length > 0 && (
                <span className="text-sm font-medium text-blue-600">
                  {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload images, videos, or documents to help explain the issue
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <label className="relative flex min-h-[120px] flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  multiple
                />
                <ImageIcon className="w-8 h-8 text-gray-400 pointer-events-none" />
                <span className="text-sm font-medium text-gray-700 pointer-events-none">Upload Image</span>
              </label>

              <label className="relative flex min-h-[120px] flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  multiple
                />
                <Video className="w-8 h-8 text-gray-400 pointer-events-none" />
                <span className="text-sm font-medium text-gray-700 pointer-events-none">Upload Video</span>
              </label>

              <label className="relative flex min-h-[120px] flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  multiple
                />
                <FileText className="w-8 h-8 text-gray-400 pointer-events-none" />
                <span className="text-sm font-medium text-gray-700 pointer-events-none">Upload Document</span>
              </label>
            </div>

            <div
              className={`rounded-lg border p-4 ${
                uploadedFiles.length > 0 ? 'border-gray-200 bg-gray-50/80' : 'border-dashed border-gray-200 bg-gray-50/40'
              }`}
            >
              <p className="text-sm font-medium text-gray-800 mb-2">Files to submit</p>
              {uploadedFiles.length === 0 ? (
                <p className="text-sm text-gray-500">No files yet — use the boxes above to add attachments.</p>
              ) : (
                <ul className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                      className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Upload className="w-5 h-5 shrink-0 text-gray-400" />
                        <span className="truncate text-sm text-gray-900">{file.name}</span>
                        <span className="shrink-0 text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Send className="w-5 h-5" />
            Submit Issue Report
          </button>
        </div>

        {/* AI Assistant & Tips */}
        <div className="space-y-6">
          {/* AI Analysis */}
          <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">AI Assistant</h3>
                {!aiAnalysis && !isAnalyzing && (
                  <>
                    <p className="text-sm text-blue-100 mb-4">
                      Our AI will analyze your issue description and attachments to provide instant diagnostics and suggest solutions.
                    </p>
                    <button 
                      onClick={handleAnalyze}
                      disabled={!description.trim()}
                      className="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Analyze My Issue
                    </button>
                  </>
                )}
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-sm text-blue-100">
                     <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                     Analyzing issue...
                  </div>
                )}
                {aiAnalysis && !isAnalyzing && (
                  <div className="text-sm mt-2 whitespace-pre-wrap bg-black/10 p-4 rounded-lg">
                    {aiAnalysis}
                    <button onClick={() => setAiAnalysis(null)} className="mt-3 text-xs underline text-blue-200 hover:text-white block">Close Analysis</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Reporting Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Provide specific error messages if available</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Include screenshots showing the problem</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Describe when the issue started</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>List any recent changes or updates</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Videos are great for intermittent issues</span>
              </li>
            </ul>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Your Recent Reports</h3>
            <div className="space-y-3">
              {recentReports.slice(0, 5).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{report.assetId || `Issue #${report.id}`}</p>
                    <p className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                      <span>{new Date(report.createdAt).toLocaleString()}</span>
                      {Array.isArray(report.files) && report.files.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700">
                          <Upload className="h-3 w-3" aria-hidden />
                          {report.files.length} attachment{report.files.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      report.status === 'Resolved'
                        ? 'bg-green-100 text-green-700'
                        : report.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {report.status}
                    </span>
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition-colors text-gray-700"
                      title="View details"
                      aria-label="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {recentReports.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recent issues reported.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">Issue Reported Successfully!</p>
            <p className="text-sm text-green-100">Our team will review it shortly.</p>
          </div>
        </div>
      )}

      {/* Recent Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Issue #{selectedReport.id} • {selectedReport.assetId || 'Unknown Asset'}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                title="Close"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  selectedReport.status === 'Resolved'
                    ? 'bg-green-100 text-green-700'
                    : selectedReport.status === 'In Progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedReport.status}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded bg-purple-100 text-purple-700">
                  {selectedReport.issueType || 'Other'}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                  {selectedReport.priority || 'Medium'}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleString() : ''}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
                  {selectedReport.description || '—'}
                </div>
              </div>

              {Array.isArray(selectedReport.files) && selectedReport.files.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Attachments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.files.map((filename: string) => {
                      const url = `http://localhost:5000/uploads/${encodeURIComponent(filename)}`;
                      const lower = String(filename).toLowerCase();
                      const isImage = /\.(png|jpe?g|gif|webp|svg|avif)$/.test(lower);
                      const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/.test(lower);

                      return (
                        <div key={filename} className="bg-white border border-gray-200 rounded-xl p-3">
                          <div className="text-xs text-gray-500 mb-2 break-all">{filename}</div>
                          {isImage ? (
                            <a href={url} target="_blank" rel="noreferrer">
                              <img
                                src={url}
                                alt={filename}
                                className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                loading="lazy"
                              />
                            </a>
                          ) : isVideo ? (
                            <video
                              src={url}
                              controls
                              className="w-full h-48 object-cover rounded-lg border border-gray-200 bg-black"
                            />
                          ) : (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center w-full px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-800"
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
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-800 font-medium"
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