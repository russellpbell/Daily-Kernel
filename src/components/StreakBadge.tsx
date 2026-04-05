'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function StreakBadge() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    api.getStats()
      .then(data => setStreak(data.streak.current_streak))
      .catch(() => {});
  }, []);

  if (streak === 0) return null;

  return (
    <div
      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-light/60 text-sm font-semibold"
      style={{ animation: 'pulse-streak 2s ease-in-out infinite' }}
    >
      <span className="text-base">🔥</span>
      <span className="text-secondary">{streak}</span>
    </div>
  );
}
