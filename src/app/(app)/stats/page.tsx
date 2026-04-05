'use client';

import { useState } from 'react';
import { useStats } from '@/hooks/useStats';
import ProgressHeatmap from '@/components/ProgressHeatmap';

export default function StatsPage() {
  const { data, loading, error } = useStats();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-24 rounded-xl bg-surface/60"
            style={{
              background: 'linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-light) 50%, var(--color-surface) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-7.5rem)] px-4">
        <p className="text-rose-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { streak, completions } = data;

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">Stats</h2>

      {/* Streak cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl bg-surface border border-white/5 p-4 text-center">
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-2xl font-bold text-white">{streak.current_streak}</div>
          <div className="text-xs text-slate-500 mt-1">Current Streak</div>
        </div>
        <div className="rounded-xl bg-surface border border-white/5 p-4 text-center">
          <div className="text-3xl mb-1">🏆</div>
          <div className="text-2xl font-bold text-white">{streak.longest_streak}</div>
          <div className="text-xs text-slate-500 mt-1">Longest Streak</div>
        </div>
      </div>

      {/* Last review */}
      {streak.last_review_date && (
        <p className="text-sm text-slate-500 mb-6">
          Last reviewed:{' '}
          <span className="text-slate-300">
            {new Date(streak.last_review_date + 'T00:00:00').toLocaleDateString('default', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </p>
      )}

      {/* Monthly heatmap */}
      <div className="rounded-xl bg-surface border border-white/5 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Previous month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-white">{monthLabel}</span>
          <button
            onClick={goToNextMonth}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Next month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <ProgressHeatmap year={viewYear} month={viewMonth} completions={completions} />
      </div>
    </div>
  );
}
