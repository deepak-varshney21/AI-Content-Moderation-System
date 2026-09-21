import React from 'react';
import { AlertCircle, Skull, Flame, ShieldAlert, UserX, HeartCrack } from 'lucide-react';

const LABEL_META = {
  toxic: {
    name: 'Toxic',
    desc: 'Rude, disrespectful, or unreasonable language',
    icon: Flame,
    color: 'from-amber-500 to-orange-500',
    barColor: 'bg-amber-500',
    bgLight: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  severe_toxic: {
    name: 'Severe Toxic',
    desc: 'Extremely hateful, aggressive, or destructive toxicity',
    icon: Skull,
    color: 'from-red-600 to-rose-700',
    barColor: 'bg-red-600',
    bgLight: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  obscene: {
    name: 'Obscene',
    desc: 'Vulgar, profane, or sexually explicit expressions',
    icon: AlertCircle,
    color: 'from-yellow-500 to-amber-600',
    barColor: 'bg-yellow-500',
    bgLight: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  threat: {
    name: 'Threat',
    desc: 'Intimidation or threats of violence/physical harm',
    icon: ShieldAlert,
    color: 'from-purple-600 to-red-600',
    barColor: 'bg-purple-600',
    bgLight: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  insult: {
    name: 'Insult',
    desc: 'Disparaging, demeaning, or inflammatory remarks',
    icon: HeartCrack,
    color: 'from-orange-500 to-rose-500',
    barColor: 'bg-orange-500',
    bgLight: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  identity_hate: {
    name: 'Identity Hate',
    desc: 'Hate speech targeting religion, race, gender, or orientation',
    icon: UserX,
    color: 'from-rose-600 to-pink-600',
    barColor: 'bg-rose-600',
    bgLight: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
};

export default function ToxicityCard({ labelKey, probability, isDetected, threshold = 0.50 }) {
  const meta = LABEL_META[labelKey] || {
    name: labelKey.replace('_', ' ').toUpperCase(),
    desc: 'Harmful language category',
    icon: AlertCircle,
    color: 'from-slate-500 to-slate-700',
    barColor: 'bg-slate-500',
    bgLight: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const Icon = meta.icon;
  const percentage = Math.min(Math.max(Math.round(probability * 100), 0), 100);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 ${
        isDetected
          ? 'bg-slate-900/90 border-red-500/40 shadow-lg shadow-red-500/5'
          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top row: Icon, Name, and Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg ${
              isDetected ? meta.bgLight : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
              {meta.name}
            </h4>
            <p className="text-xs text-slate-400 line-clamp-1">{meta.desc}</p>
          </div>
        </div>

        {/* Detected badge */}
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
            isDetected
              ? 'bg-red-500/15 text-red-400 border-red-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {isDetected ? 'Detected' : 'Not Detected'}
        </span>
      </div>

      {/* Probability Progress and Percentage */}
      <div className="mt-3">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs font-medium text-slate-400">Probability Score</span>
          <span
            className={`text-sm font-bold font-mono ${
              isDetected ? 'text-red-400' : percentage > 30 ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            {percentage}%
            <span className="text-[10px] font-normal text-slate-500 ml-1">
              ({probability.toFixed(3)})
            </span>
          </span>
        </div>

        {/* Progress bar container */}
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isDetected ? meta.barColor : percentage > 30 ? 'bg-amber-500' : 'bg-slate-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
