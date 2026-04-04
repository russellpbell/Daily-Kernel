import { useState } from "react";
import { useStats } from "../hooks/useStats";
import ProgressHeatmap from "../components/ProgressHeatmap";

export default function StatsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { stats, loading } = useStats();

  function goToPreviousMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function goToNextMonth() {
    const isCurrentMonth =
      year === now.getFullYear() && month === now.getMonth();
    if (isCurrentMonth) return;
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h2 className="text-xl font-bold text-white mb-6">Your Stats</h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
          <div className="text-3xl mb-1">
            <span role="img" aria-label="fire">🔥</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.current_streak ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Current Streak</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
          <div className="text-3xl mb-1">
            <span role="img" aria-label="trophy">🏆</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.longest_streak ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Longest Streak</div>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Previous month"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-300">Activity</span>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            aria-label="Next month"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <ProgressHeatmap
          year={year}
          month={month}
          completions={stats?.monthly_completions ?? []}
        />
      </div>

      {stats?.last_review_date && (
        <p className="text-center text-xs text-gray-600 mt-4">
          Last reviewed: {stats.last_review_date}
        </p>
      )}
    </div>
  );
}
