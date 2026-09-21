import React, { useState } from 'react';
import { Send, Trash2, Sliders, Sparkles, Check, Info } from 'lucide-react';

const PRESET_EXAMPLES = [
  {
    title: 'Safe Comment',
    type: 'safe',
    color: 'hover:border-emerald-500/40 hover:bg-emerald-500/5 text-emerald-400',
    text: 'Thank you very much for this comprehensive tutorial! It helped our team immensely.',
  },
  {
    title: 'Mild Profanity',
    type: 'censor',
    color: 'hover:border-yellow-500/40 hover:bg-yellow-500/5 text-yellow-400',
    text: 'This code is absolute crap and total bullshit, please fix it.',
  },
  {
    title: 'Toxic Insult',
    type: 'insult',
    color: 'hover:border-orange-500/40 hover:bg-orange-500/5 text-orange-400',
    text: 'You are a completely stupid idiot and you know nothing about programming.',
  },
  {
    title: 'Identity Hate',
    type: 'hate',
    color: 'hover:border-rose-500/40 hover:bg-rose-500/5 text-rose-400',
    text: 'I despise all people of that race and religion, they should all be expelled.',
  },
  {
    title: 'Direct Threat',
    type: 'threat',
    color: 'hover:border-purple-500/40 hover:bg-purple-500/5 text-purple-400',
    text: 'I am going to find your home address and kill you tomorrow.',
  },
];

export default function CommentInput({
  comment,
  setComment,
  onAnalyze,
  isLoading,
  customThreshold,
  setCustomThreshold,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const maxLength = 2500;

  const handlePresetClick = (text) => {
    setComment(text);
  };

  const handleClear = () => {
    setComment('');
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800">
      {/* Input Header & Character Counter */}
      <div className="flex items-center justify-between mb-3">
        <label
          htmlFor="comment-textarea"
          className="text-sm font-semibold text-slate-200 flex items-center gap-2"
        >
          <span>Comment Input</span>
          <span className="text-xs font-normal text-slate-400">
            (English text analysis)
          </span>
        </label>
        <span
          className={`text-xs font-mono ${
            comment.length > maxLength * 0.9 ? 'text-amber-400' : 'text-slate-500'
          }`}
        >
          {comment.length} / {maxLength}
        </span>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          id="comment-textarea"
          rows={4}
          maxLength={maxLength}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Enter a comment to analyze for toxicity, severity, policy actions, and censoring..."
          className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-xl p-4 text-sm sm:text-base border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-y min-h-[110px]"
        />
      </div>

      {/* Quick Test Presets */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-medium text-slate-400">
            Quick Test Examples:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_EXAMPLES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset.text)}
              className={`text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-all ${preset.color}`}
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Settings Accordion */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showAdvanced ? 'Hide Advanced Settings' : 'Advanced Settings (Threshold Override)'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Detection Threshold:</span>
              <span className="font-mono font-bold text-indigo-400">
                {customThreshold !== null ? customThreshold.toFixed(2) : 'Default (0.50)'}
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.05"
              value={customThreshold !== null ? customThreshold : 0.50}
              onChange={(e) => setCustomThreshold(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.10 (Sensitive)</span>
              <span>0.50 (Standard)</span>
              <span>0.90 (Strict)</span>
            </div>
            {customThreshold !== null && (
              <button
                type="button"
                onClick={() => setCustomThreshold(null)}
                className="mt-2 text-[11px] text-indigo-400 hover:underline"
              >
                Reset to default threshold
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleClear}
          disabled={!comment.trim() || isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={!comment.trim() || isLoading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:shadow-indigo-600/40 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Comment...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Analyze Comment</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
