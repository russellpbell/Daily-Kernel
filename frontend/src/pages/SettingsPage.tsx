import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { getSettings, updateSettings } from "../api";
import type { UserSettings } from "../types";

export default function SettingsPage() {
  const { userName, logOut } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getSettings();
        if (!cancelled) setSettings(data);
      } catch {
        // settings might not exist yet
        if (!cancelled) setSettings({ cards_per_briefing: 10 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleCardsChange(value: number) {
    if (!settings) return;
    setSettings({ ...settings, cards_per_briefing: value });
    setSaving(true);
    try {
      await updateSettings({ cards_per_briefing: value });
    } catch {
      // silently fail, optimistic update
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logOut();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-28 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h2 className="text-xl font-bold text-white mb-6">Settings</h2>

      <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
            {userName?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-white font-medium text-sm">{userName}</p>
            <p className="text-gray-500 text-xs">Signed in</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-300">
            Cards per briefing
          </label>
          <span className="text-sm font-mono text-white min-w-[40px] text-right">
            {settings?.cards_per_briefing ?? 10}
            {saving && (
              <span className="ml-1 text-xs text-gray-500">...</span>
            )}
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={25}
          step={1}
          value={settings?.cards_per_briefing ?? 10}
          onChange={(e) => handleCardsChange(Number(e.target.value))}
          className="w-full h-1.5 appearance-none bg-white/10 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
        />
        <div className="flex justify-between mt-1.5 text-[10px] text-gray-600">
          <span>5</span>
          <span>15</span>
          <span>25</span>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="w-full h-11 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/20 active:scale-[0.98] transition-all"
        >
          Sign Out
        </button>
      </div>

      <p className="text-center text-[11px] text-gray-600 mt-8">
        Daily Kernel v1.0.0
      </p>
    </div>
  );
}
