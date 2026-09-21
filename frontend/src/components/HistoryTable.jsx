import React, { useEffect, useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import DetailModal from './DetailModal';

const ACTION_COLORS = {
  ALLOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  CENSOR: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  HIDE: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  FLAG: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  DELETE: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

const SEVERITY_COLORS = {
  LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  HIGH: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  CRITICAL: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

export default function HistoryTable() {
  const [historyItems, setHistoryItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 10;

  // Modal inspection
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getHistory({
        skip: page * limit,
        limit,
        severity: severityFilter,
        action: actionFilter,
        search,
      });
      setHistoryItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, severityFilter, actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchHistory();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete audit record #${id}?`)) return;
    try {
      await api.deleteHistoryRecord(id);
      fetchHistory();
    } catch (err) {
      alert(`Error deleting record: ${err.message}`);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Moderation Audit History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full compliance log and historical analysis records
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments..."
            className="w-full bg-slate-900 text-xs text-slate-200 placeholder-slate-500 pl-9 pr-4 py-2 rounded-lg border border-slate-700/80 focus:border-indigo-500 outline-none"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(0);
            }}
            className="bg-slate-900 text-xs text-slate-300 px-3 py-2 rounded-lg border border-slate-700/80 outline-none focus:border-indigo-500"
          >
            <option value="">All Severities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="bg-slate-900 text-xs text-slate-300 px-3 py-2 rounded-lg border border-slate-700/80 outline-none focus:border-indigo-500"
          >
            <option value="">All Actions</option>
            <option value="ALLOW">ALLOW</option>
            <option value="CENSOR">CENSOR</option>
            <option value="HIDE">HIDE</option>
            <option value="FLAG">FLAG</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-3.5 pl-5">ID</th>
                <th className="p-3.5">Comment</th>
                <th className="p-3.5">Detected Labels</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Date / Time</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit records...
                  </td>
                </tr>
              ) : historyItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No moderation records found.
                  </td>
                </tr>
              ) : (
                historyItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="p-3.5 pl-5 font-mono text-slate-500 font-bold">
                      #{item.id}
                    </td>
                    <td className="p-3.5 max-w-xs truncate font-mono text-slate-200">
                      {item.comment}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {item.detected_labels && item.detected_labels.length > 0 ? (
                          item.detected_labels.map((lbl) => (
                            <span
                              key={lbl}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              {lbl}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                          SEVERITY_COLORS[item.severity?.level] || 'text-slate-400'
                        }`}
                      >
                        {item.severity?.level}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          ACTION_COLORS[item.recommended_action] || 'bg-slate-800'
                        }`}
                      >
                        {item.recommended_action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(item)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
          <div>
            Showing <span className="text-slate-200 font-medium">{historyItems.length}</span> of{' '}
            <span className="text-slate-200 font-medium">{total}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0 || isLoading}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono">
              Page {page + 1} of {Math.max(totalPages, 1)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              disabled={page >= totalPages - 1 || isLoading}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Inspection Modal */}
      {selectedRecord && (
        <DetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
