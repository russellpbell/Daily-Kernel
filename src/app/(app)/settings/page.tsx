'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [cardsPerBriefing, setCardsPerBriefing] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMe()
      .then(data => {
        setUserName(data.user.name);
        setCardsPerBriefing(data.user.cards_per_briefing);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSliderChange = async (value: number) => {
    setCardsPerBriefing(value);
    setSaving(true);
    try {
      await api.updateSettings({ cards_per_briefing: value });
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        {[0, 1].map(i => (
          <div
            key={i}
            className="h-20 rounded-xl bg-surface/60"
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

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">Settings</h2>

      {/* User info */}
      <div className="rounded-xl bg-surface border border-white/5 p-4 mb-4">
        <div className="text-xs text-slate-500 mb-1">Signed in as</div>
        <div className="text-lg font-semibold text-white">{userName}</div>
      </div>

      {/* Cards per briefing */}
      <div className="rounded-xl bg-surface border border-white/5 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Cards per briefing</span>
          <span className="text-sm text-primary-light tabular-nums">
            {cardsPerBriefing}
            {saving && <span className="ml-2 text-xs text-slate-500">saving...</span>}
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={25}
          value={cardsPerBriefing}
          onChange={e => handleSliderChange(Number(e.target.value))}
          className="w-full h-1.5 appearance-none bg-surface-light rounded-full cursor-pointer accent-primary"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-600">5</span>
          <span className="text-[10px] text-slate-600">25</span>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full min-h-[44px] rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold transition-colors border border-rose-500/20"
      >
        Sign Out
      </button>
    </div>
  );
}
