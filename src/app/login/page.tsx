'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

type Step = 'email' | 'otp' | 'magic-link-sent';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // If user is already logged in, redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
    });
  }, [router, supabase]);

  // Focus OTP input when step changes
  useEffect(() => {
    if (step === 'otp') {
      otpInputRef.current?.focus();
    }
  }, [step]);

  const handleSendMagicLink = async () => {
    if (!email.trim()) return;
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;
      setStep('magic-link-sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim()) return;
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (authError) throw authError;
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: 'email',
      });

      if (authError) throw authError;

      // Ensure profile exists
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          await fetch('/api/auth/ensure-profile', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch {
          // Best-effort
        }
      }

      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
  };

  const handleBack = () => {
    setStep('email');
    setOtp('');
    setError('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      {/* Branding */}
      <div className="mb-10 text-center" style={{ animation: 'fade-in-up 0.5s ease-out' }}>
        <div className="text-5xl mb-3">🌱</div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Daily Kernel</h1>
        <p className="text-sm text-slate-500 mt-1">AI-powered daily news briefing</p>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="w-full max-w-sm mb-4 p-3 rounded-lg bg-rose-500/15 text-rose-300 text-sm text-center"
          style={{ animation: 'fade-in-up 0.3s ease-out' }}
        >
          {error}
        </div>
      )}

      {/* Step: Email input */}
      {step === 'email' && (
        <div
          className="w-full max-w-sm space-y-4"
          style={{ animation: 'fade-in-up 0.5s ease-out 0.1s both' }}
        >
          <div>
            <label htmlFor="email" className="block text-sm text-slate-400 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && email.trim()) {
                  e.preventDefault();
                  handleSendOtp();
                }
              }}
              className="w-full min-h-[44px] px-4 rounded-xl bg-surface border border-white/10 text-white placeholder:text-slate-600 outline-none focus:border-primary transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loading || !email.trim()}
            className="w-full min-h-[44px] rounded-xl bg-primary hover:bg-primary-light text-white font-semibold transition-colors disabled:opacity-40"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              'Send Login Code'
            )}
          </button>

          <button
            type="button"
            onClick={handleSendMagicLink}
            disabled={loading || !email.trim()}
            className="w-full min-h-[44px] rounded-xl bg-transparent hover:bg-surface text-slate-400 hover:text-white font-semibold transition-colors border border-white/10 disabled:opacity-40"
          >
            Send Magic Link Instead
          </button>
        </div>
      )}

      {/* Step: OTP verification */}
      {step === 'otp' && (
        <form
          onSubmit={handleVerifyOtp}
          className="w-full max-w-sm space-y-4"
          style={{ animation: 'fade-in-up 0.5s ease-out' }}
        >
          <p className="text-sm text-slate-400 text-center">
            We sent a verification code to{' '}
            <span className="text-white font-medium">{email}</span>
          </p>

          <div>
            <label htmlFor="otp" className="block text-sm text-slate-400 mb-1.5">
              Verification code
            </label>
            <input
              ref={otpInputRef}
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => handleOtpChange(e.target.value)}
              placeholder="000000"
              autoComplete="one-time-code"
              className="w-full min-h-[44px] px-4 rounded-xl bg-surface border border-white/10 text-white text-center text-2xl tracking-[0.4em] font-mono placeholder:text-slate-600 placeholder:tracking-[0.4em] outline-none focus:border-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full min-h-[44px] rounded-xl bg-primary hover:bg-primary-light text-white font-semibold transition-colors disabled:opacity-40"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              'Verify Code'
            )}
          </button>

          <button
            type="button"
            onClick={handleBack}
            className="w-full min-h-[44px] text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Back to email
          </button>
        </form>
      )}

      {/* Step: Magic link sent */}
      {step === 'magic-link-sent' && (
        <div
          className="w-full max-w-sm space-y-4 text-center"
          style={{ animation: 'fade-in-up 0.5s ease-out' }}
        >
          <div className="rounded-xl bg-surface border border-white/5 p-6">
            <div className="text-3xl mb-3">✉️</div>
            <h2 className="text-lg font-semibold text-white mb-2">Check your email</h2>
            <p className="text-sm text-slate-400">
              We sent a magic link to{' '}
              <span className="text-white font-medium">{email}</span>.
              Click the link in the email to sign in.
            </p>
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="w-full min-h-[44px] text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Use a different email
          </button>
        </div>
      )}
    </div>
  );
}
