import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  ShieldCheck, 
  Scissors, 
  EyeOff, 
  Flag, 
  Trash2, 
  AlertOctagon, 
  Users,
  CheckCircle2,
  Percent
} from 'lucide-react';
import { api } from '../services/api';

export default function StatsDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading moderation analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center border border-red-500/20 bg-red-950/10">
        <AlertOctagon className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-300 mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  const total = stats?.total_comments || 0;
  const toxicPct = total > 0 ? Math.round((stats.toxic_comments / total) * 100) : 0;
  const cleanPct = total > 0 ? Math.round((stats.non_toxic_comments / total) * 100) : 0;

  // Max label count for scaling bar chart
  const maxLabelCount = Math.max(
    ...(stats?.label_distribution ? Object.values(stats.label_distribution) : [1]),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Moderation Analytics Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time aggregate telemetry across analyzed English comments
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Comments */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Analyzed</div>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {total}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Logged Comments</div>
        </div>

        {/* Toxic Count */}
        <div className="glass-panel rounded-xl p-4 border border-red-500/20 bg-red-950/5">
          <div className="text-xs text-red-400 font-medium">Toxic Content</div>
          <div className="text-2xl font-black font-mono text-red-400 mt-1">
            {stats?.toxic_comments || 0}
          </div>
          <div className="text-[11px] text-red-400/80 mt-1 font-mono">
            {toxicPct}% of total
          </div>
        </div>

        {/* Non-Toxic Count */}
        <div className="glass-panel rounded-xl p-4 border border-emerald-500/20 bg-emerald-950/5">
          <div className="text-xs text-emerald-400 font-medium">Clean / Non-Toxic</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {stats?.non_toxic_comments || 0}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">
            {cleanPct}% of total
          </div>
        </div>

        {/* Flagged */}
        <div className="glass-panel rounded-xl p-4 border border-rose-500/20">
          <div className="text-xs text-rose-400 font-medium flex items-center justify-between">
            <span>Flagged</span>
            <Flag className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 mt-1">
            {stats?.comments_flagged || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Review queue</div>
        </div>

        {/* Deleted */}
        <div className="glass-panel rounded-xl p-4 border border-purple-500/20">
          <div className="text-xs text-purple-400 font-medium flex items-center justify-between">
            <span>Deleted</span>
            <Trash2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-400 mt-1">
            {stats?.comments_deleted || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Critical threats</div>
        </div>
      </div>

      {/* 2-Column Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Label Distribution Chart */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
            Toxicity Label Distribution
          </h3>
          <div className="space-y-3">
            {stats?.label_distribution &&
              Object.entries(stats.label_distribution).map(([label, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const barWidth = Math.max((count / maxLabelCount) * 100, count > 0 ? 5 : 0);

                return (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 uppercase tracking-wide">
                        {label.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-slate-400">
                        {count} <span className="text-slate-500">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Action & Severity Distribution */}
        <div className="space-y-6">
          {/* Action Breakdown */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
              Action Recommendation Breakdown
            </h3>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                <div className="text-[11px] font-bold text-emerald-400">ALLOW</div>
                <div className="text-lg font-black font-mono text-emerald-300 mt-1">
                  {stats?.comments_allowed || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-yellow-950/20 border border-yellow-500/20">
                <div className="text-[11px] font-bold text-yellow-400">CENSOR</div>
                <div className="text-lg font-black font-mono text-yellow-300 mt-1">
                  {stats?.comments_censored || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/20">
                <div className="text-[11px] font-bold text-orange-400">HIDE</div>
                <div className="text-lg font-black font-mono text-orange-300 mt-1">
                  {stats?.comments_hidden || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20">
                <div className="text-[11px] font-bold text-rose-400">FLAG</div>
                <div className="text-lg font-black font-mono text-rose-300 mt-1">
                  {stats?.comments_flagged || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
                <div className="text-[11px] font-bold text-purple-400">DELETE</div>
                <div className="text-lg font-black font-mono text-purple-300 mt-1">
                  {stats?.comments_deleted || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
              Severity Level Breakdown
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {stats?.severity_distribution &&
                Object.entries(stats.severity_distribution).map(([sev, count]) => (
                  <div
                    key={sev}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800"
                  >
                    <div className="text-[11px] font-bold text-slate-300">{sev}</div>
                    <div className="text-lg font-black font-mono text-white mt-1">
                      {count}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
