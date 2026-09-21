import React from 'react';
import { 
  ShieldCheck, 
  Scissors, 
  EyeOff, 
  Flag, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import ToxicityCard from './ToxicityCard';

const ACTION_CONFIG = {
  ALLOW: {
    label: 'ALLOW',
    title: 'Approved / Safe to Publish',
    desc: 'No harmful content detected above policy limits.',
    icon: ShieldCheck,
    badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    bannerGradient: 'from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/30',
    accentColor: 'text-emerald-400',
  },
  CENSOR: {
    label: 'CENSOR',
    title: 'Mask Inappropriate Words',
    desc: 'Profanities or vulgar terms detected. Text masked with wildcards.',
    icon: Scissors,
    badgeBg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    bannerGradient: 'from-yellow-950/60 via-slate-900 to-slate-900 border-yellow-500/30',
    accentColor: 'text-yellow-400',
  },
  HIDE: {
    label: 'HIDE',
    title: 'Hide from Public Feed',
    desc: 'Contextual toxicity detected without clean word-level censor targets.',
    icon: EyeOff,
    badgeBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    bannerGradient: 'from-orange-950/60 via-slate-900 to-slate-900 border-orange-500/30',
    accentColor: 'text-orange-400',
  },
  FLAG: {
    label: 'FLAG',
    title: 'Flag for Moderator Review',
    desc: 'High-severity hostility or identity hate detected. Requires human moderator review.',
    icon: Flag,
    badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    bannerGradient: 'from-rose-950/60 via-slate-900 to-slate-900 border-rose-500/30',
    accentColor: 'text-rose-400',
  },
  DELETE: {
    label: 'DELETE',
    title: 'Immediate Deletion Required',
    desc: 'Critical threat or violent intent detected. Mandates immediate removal.',
    icon: Trash2,
    badgeBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    bannerGradient: 'from-purple-950/60 via-slate-900 to-slate-900 border-purple-500/30',
    accentColor: 'text-purple-400',
  },
};

const SEVERITY_CONFIG = {
  LOW: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  MEDIUM: {
    badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  HIGH: {
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
  },
  CRITICAL: {
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-400 animate-ping',
  },
};

export default function ResultView({ result }) {
  if (!result) return null;

  const actionMeta = ACTION_CONFIG[result.recommended_action] || ACTION_CONFIG.ALLOW;
  const severityMeta = SEVERITY_CONFIG[result.severity?.level] || SEVERITY_CONFIG.LOW;
  const ActionIcon = actionMeta.icon;
  const severityScorePct = Math.round((result.severity?.score || 0) * 100);

  const toxicityLabels = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate'];

  return (
    <div className="space-y-6 mt-8 animate-fadeIn">
      {/* 1. OVERALL RESULT BANNER */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 bg-gradient-to-r ${actionMeta.bannerGradient} shadow-xl backdrop-blur-md`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Action info */}
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 ${actionMeta.accentColor}`}>
              <ActionIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Recommended Action:
                </span>
                <span
                  className={`text-sm font-bold px-3 py-0.5 rounded-full border ${actionMeta.badgeBg}`}
                >
                  {result.recommended_action}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {actionMeta.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                {actionMeta.desc}
              </p>
            </div>
          </div>

          {/* Severity Meter Badge */}
          <div className="flex items-center gap-4 bg-slate-900/80 rounded-xl p-3 sm:p-4 border border-slate-800 self-start md:self-auto">
            <div className="text-right">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Severity Assessment
              </div>
              <div className="flex items-center gap-2 mt-0.5 justify-end">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${severityMeta.dot}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${severityMeta.dot}`}></span>
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md border ${severityMeta.badge}`}
                >
                  {result.severity?.level}
                </span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div className="text-center min-w-[60px]">
              <div className="text-[10px] font-medium text-slate-400 uppercase">
                Score
              </div>
              <div className="text-xl font-extrabold font-mono text-slate-100">
                {severityScorePct}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CENSORED COMMENT PREVIEW (IF ACTION == CENSOR) */}
      {result.recommended_action === 'CENSOR' && result.censored_comment && (
        <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-yellow-500/30 bg-yellow-950/10">
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="w-5 h-5 text-yellow-400" />
            <h4 className="text-base font-bold text-yellow-200">
              Censored Comment Output
            </h4>
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-medium">
              Word-Boundary Masked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span>Original Comment</span>
                <span className="text-[10px] text-slate-500 font-normal">Unmodified</span>
              </div>
              <p className="text-sm font-mono text-slate-300 break-words leading-relaxed">
                "{result.comment}"
              </p>
            </div>

            {/* Censored */}
            <div className="p-4 rounded-xl bg-yellow-950/30 border border-yellow-500/40">
              <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span>Safe Masked Version</span>
                <span className="text-[10px] text-yellow-500 font-normal">Active Censoring</span>
              </div>
              <p className="text-sm font-mono text-yellow-200 break-words leading-relaxed font-semibold">
                "{result.censored_comment}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. DETECTED CONTENT CARDS (6 TOXICITY LABELS) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              6 Multi-Label Toxicity Breakdown
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Sigmoid Probabilities &bull; Threshold: 0.50
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {toxicityLabels.map((lbl) => {
            const prob = result.toxicity ? result.toxicity[lbl] || 0 : 0;
            const isDetected = result.detected_labels?.includes(lbl);
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

      {/* 4. HUMAN-READABLE EXPLANATION & ARCHITECTURE TRANSPARENCY */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-indigo-400" />
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Policy Decision Explanation
          </h4>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
          {result.explanation}
        </p>

        {/* Pipeline Transparency Stages */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Pipeline Transparency Stages:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
              <span className="text-indigo-400 font-semibold block mb-0.5">1. ML Model</span>
              <span className="text-slate-400">6 Multi-label Sigmoid probabilities calculated.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
              <span className="text-indigo-400 font-semibold block mb-0.5">2. Severity Engine</span>
              <span className="text-slate-400">Categorized as {result.severity?.level} ({severityScorePct}%).</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
              <span className="text-indigo-400 font-semibold block mb-0.5">3. Policy Engine</span>
              <span className="text-slate-400">Recommended action: {result.recommended_action}.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
              <span className="text-indigo-400 font-semibold block mb-0.5">4. Censor Layer</span>
              <span className="text-slate-400">
                {result.recommended_action === 'CENSOR' ? 'Applied safe masking.' : 'Bypassed (Not applicable).'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
