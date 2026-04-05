'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { createBrowserClient } from '@/lib/supabase';
import { clearAuth } from '@/lib/storage';

export default function SettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [cardsPerBriefing, setCardsPerBriefing] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [subPlan, setSubPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getSettings()
        .then(data => {
          setUserName(data.user.name);
          setUserEmail(data.user.email);
          setCardsPerBriefing(data.user.cards_per_briefing);
        })
        .catch(() => {}),
      api.getSubscriptionStatus()
        .then(data => {
          setSubStatus(data.status);
          setSubPlan(data.plan);
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
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

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput.trim() === userName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const data = await api.updateSettings({ name: nameInput.trim() });
      setUserName(data.user.name);
      setEditingName(false);
    } catch {
      // Silent fail
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    clearAuth();
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
      <div className="rounded-xl bg-surface border border-white/5 p-4 mb-4 space-y-3">
        <div>
          <div className="text-xs text-slate-500 mb-1">Email</div>
          <div className="text-sm text-slate-300">{userEmail}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Display name</div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                autoFocus
                className="flex-1 min-h-[36px] px-3 rounded-lg bg-surface-light border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={handleSaveName}
                disabled={savingName}
                className="min-h-[36px] px-3 rounded-lg bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors disabled:opacity-40"
              >
                {savingName ? '...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="min-h-[36px] px-3 rounded-lg text-slate-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-white">{userName}</div>
              <button
                onClick={() => {
                  setNameInput(userName);
                  setEditingName(true);
                }}
                className="text-xs text-primary-light hover:text-primary transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>
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

      {/* Subscription */}
      <div className="rounded-xl bg-surface border border-white/5 p-4 mb-4 space-y-3">
        <div className="text-xs text-slate-500 mb-1">Subscription</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">
              {subPlan === 'monthly' ? 'Monthly' : subPlan === 'annual' ? 'Annual' : subPlan === 'free_pass' ? 'Free Pass' : subPlan ?? 'None'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {subStatus === 'active' ? 'Active' : subStatus === 'free_pass' ? 'Active' : subStatus === 'canceled' ? 'Canceled' : subStatus === 'past_due' ? 'Past Due' : subStatus ?? 'No subscription'}
            </div>
          </div>
          {subStatus === 'free_pass' ? (
            <span className="px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold">
              Free Pass
            </span>
          ) : subStatus === 'active' || subStatus === 'canceled' || subStatus === 'past_due' ? (
            <button
              onClick={async () => {
                setPortalLoading(true);
                try {
                  const { url } = await api.createPortalSession();
                  window.location.href = url;
                } catch {
                  // Silent fail
                } finally {
                  setPortalLoading(false);
                }
              }}
              disabled={portalLoading}
              className="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary-light text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {portalLoading ? 'Opening...' : 'Manage Subscription'}
            </button>
          ) : (
            <button
              onClick={() => router.push('/subscribe')}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-light text-white text-xs font-semibold transition-colors"
            >
              Subscribe
            </button>
          )}
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
