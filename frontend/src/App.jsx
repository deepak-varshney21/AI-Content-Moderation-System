import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Navbar from './components/Navbar';
import CommentInput from './components/CommentInput';
import ResultView from './components/ResultView';
import StatsDashboard from './components/StatsDashboard';
import HistoryTable from './components/HistoryTable';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'dashboard' | 'history'
  const [healthStatus, setHealthStatus] = useState(null);
  const [comment, setComment] = useState('');
  const [customThreshold, setCustomThreshold] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Check health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await api.getHealth();
        setHealthStatus(data);
      } catch (err) {
        console.warn('Backend connection error:', err);
        setHealthStatus({ status: 'unreachable' });
      }
    };
    checkHealth();
  }, []);

  const handleAnalyze = async () => {
    if (!comment.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Execute full moderation pipeline with DB audit record logging
      const data = await api.moderateComment(comment, customThreshold);
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred while moderating the comment.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthStatus={healthStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Studio View */}
        {activeTab === 'studio' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="text-center space-y-2 mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Toxicity &amp; Policy Pipeline</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                AI Content Moderation System
              </h2>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
                Severity-Aware Multi-Label Comment Analysis with 6 Toxicity Categories, Dynamic Severity Scoring, and Word-Boundary Censoring.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-200">Analysis Error</div>
                  <div className="mt-0.5 text-red-300/90">{error}</div>
                </div>
              </div>
            )}

            {/* Input Component */}
            <CommentInput
              comment={comment}
              setComment={setComment}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              customThreshold={customThreshold}
              setCustomThreshold={setCustomThreshold}
            />

            {/* Live Result View */}
            <ResultView result={result} />
          </div>
        )}

        {/* Dashboard / Analytics View */}
        {activeTab === 'dashboard' && <StatsDashboard />}

        {/* Moderation History View */}
        {activeTab === 'history' && <HistoryTable />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            AI-Powered Severity-Aware Multi-Label Content Moderation System &bull; Version 1.0
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>6 Independent Toxicity Labels</span>
            <span>&bull;</span>
            <span>Sigmoid Multi-Label Inference</span>
            <span>&bull;</span>
            <span>Pretrained Hugging Face Transformers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
