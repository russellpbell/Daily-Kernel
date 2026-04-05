'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || pin.length !== 4) return;

    setError('');
    setLoading(true);

    try {
      const fn = isRegister ? api.register : api.login;
      const data = await fn(name.trim(), pin);
      localStorage.setItem('token', data.token);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      {/* Branding */}
      <div className="mb-10 text-center" style={{ animation: 'fade-in-up 0.5s ease-out' }}>
        <div className="text-5xl mb-3">🌱</div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Daily Kernel</h1>
        <p className="text-sm text-slate-500 mt-1">AI-powered daily news briefing</p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4"
        style={{ animation: 'fade-in-up 0.5s ease-out 0.1s both' }}
      >
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/15 text-rose-300 text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm text-slate-400 mb-1.5">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="username"
            className="w-full min-h-[44px] px-4 rounded-xl bg-surface border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label htmlFor="pin" className="block text-sm text-slate-400 mb-1.5">
            4-digit PIN
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={e => handlePinChange(e.target.value)}
            placeholder="••••"
            autoComplete="current-password"
            className="w-full min-h-[44px] px-4 rounded-xl bg-surface border border-white/10 text-white text-center text-lg tracking-[0.5em] placeholder:text-slate-600 placeholder:tracking-[0.3em] outline-none focus:border-primary transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim() || pin.length !== 4}
          className="w-full min-h-[44px] rounded-xl bg-primary hover:bg-primary-light text-white font-semibold transition-colors disabled:opacity-40"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isRegister ? 'Creating account...' : 'Signing in...'}
            </span>
          ) : (
            isRegister ? 'Create Account' : 'Sign In'
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
          className="w-full min-h-[44px] text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
        </button>
      </form>
    </div>
  );
}
