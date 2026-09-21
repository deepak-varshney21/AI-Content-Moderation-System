import React from 'react';
import { X, Calendar, Shield, Scissors, Info, Layers } from 'lucide-react';
import ToxicityCard from './ToxicityCard';

export default function DetailModal({ record, onClose }) {
  if (!record) return null;

  const toxicityLabels = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate'];
  const formattedDate = record.created_at
    ? new Date(record.created_at).toLocaleString()
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/80 shadow-2xl p-6 bg-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Moderation Record #{record.id}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-5 space-y-5">
          {/* Action & Severity Pill Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Action:</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {record.recommended_action}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Severity:</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                {record.severity?.level} ({(record.severity?.score * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

          {/* Comment Text */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Original Comment
            </label>
            <p className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono break-words">
              "{record.comment}"
            </p>
          </div>

          {/* Censored Comment if applicable */}
          {record.censored_comment && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5 mb-1.5">
                <Scissors className="w-3.5 h-3.5" />
                <span>Censored Masked Output</span>
              </label>
              <p className="p-3.5 rounded-xl bg-yellow-950/20 border border-yellow-500/30 text-sm text-yellow-200 font-mono font-semibold break-words">
                "{record.censored_comment}"
              </p>
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Policy Explanation</span>
            </label>
            <p className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {record.explanation}
            </p>
          </div>

          {/* 6 Labels Breakdown */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Toxicity Label Breakdown
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {toxicityLabels.map((lbl) => {
                const prob = record.toxicity ? record.toxicity[lbl] || 0 : 0;
                const isDetected = record.detected_labels?.includes(lbl);
                return (
                  <ToxicityCard
                    key={lbl}
                    labelKey={lbl}
                    probability={prob}
                    isDetected={isDetected}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
