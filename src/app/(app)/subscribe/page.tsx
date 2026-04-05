'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function SubscribePage() {
  const [showFreePass, setShowFreePass] = useState(false);
  const [passCode, setPassCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    setCheckoutLoading(plan);
    try {
      const { url } = await api.createCheckout(plan);
      window.location.href = url;
    } catch {
      setRedeemError('Failed to start checkout. Please try again.');
      setCheckoutLoading(null);
    }
  };

  const handleRedeem = async () => {
    if (passCode.length !== 8) {
      setRedeemError('Please enter an 8-character code.');
      return;
    }
    setRedeemLoading(true);
    setRedeemError('');
    setRedeemSuccess(false);
    try {
      await api.redeemFreePass(passCode.toUpperCase());
      setRedeemSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { url } = await api.createPortalSession();
      window.location.href = url;
    } catch {
      setRedeemError('Failed to open subscription portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="mr-2">🌱</span>Daily Kernel
          </h1>
          <p className="text-slate-400 text-lg">Keep up with your field.</p>
          <p className="mt-2 text-sm text-primary-light">Start with a 7-day free trial.</p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Monthly */}
          <div className="rounded-xl bg-surface border border-white/10 p-5 flex flex-col items-center text-center">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Monthly</h3>
            <div className="text-3xl font-bold text-white mb-1">$1</div>
            <div className="text-sm text-slate-500 mb-4">per month</div>
            <div className="text-xs text-slate-500 mb-5">7 days free, then $1/mo</div>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={checkoutLoading !== null}
              className="w-full min-h-[40px] rounded-lg bg-primary hover:bg-primary-light text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {checkoutLoading === 'monthly' ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                'Subscribe'
              )}
            </button>
          </div>

          {/* Annual */}
          <div className="rounded-xl bg-surface border border-primary/30 p-5 flex flex-col items-center text-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary rounded-full text-xs font-semibold text-white">
              Save 17%
            </div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Annual</h3>
            <div className="text-3xl font-bold text-white mb-1">$10</div>
            <div className="text-sm text-slate-500 mb-1">per year</div>
            <div className="text-xs text-primary-light mb-5">7 days free, then $0.83/mo</div>
            <button
              onClick={() => handleSubscribe('annual')}
              disabled={checkoutLoading !== null}
              className="w-full min-h-[40px] rounded-lg bg-primary hover:bg-primary-light text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {checkoutLoading === 'annual' ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                'Subscribe'
              )}
            </button>
          </div>
        </div>

        {/* Free pass */}
        <div className="text-center">
          {!showFreePass ? (
            <button
              onClick={() => setShowFreePass(true)}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Have a free pass?
            </button>
          ) : (
            <div className="rounded-xl bg-surface border border-white/5 p-4 space-y-3">
              <div className="text-sm text-slate-400 mb-2">Enter your 8-character pass code</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={passCode}
                  onChange={(e) => setPassCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  maxLength={8}
                  placeholder="XXXXXXXX"
                  className="flex-1 min-h-[40px] px-3 rounded-lg bg-surface-light border border-white/10 text-white text-center text-lg font-mono tracking-widest uppercase outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleRedeem}
                  disabled={redeemLoading || passCode.length !== 8}
                  className="min-h-[40px] px-4 rounded-lg bg-primary hover:bg-primary-light text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {redeemLoading ? '...' : 'Redeem'}
                </button>
              </div>
              {redeemError && (
                <div className="text-xs text-rose-400">{redeemError}</div>
              )}
              {redeemSuccess && (
                <div className="text-xs text-green-400">Free pass activated! Redirecting...</div>
              )}
            </div>
          )}
        </div>

        {/* Manage subscription */}
        <div className="text-center">
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="text-sm text-slate-600 hover:text-slate-400 transition-colors"
          >
            {portalLoading ? 'Opening...' : 'Already subscribed? Manage your subscription'}
          </button>
        </div>
      </div>
    </div>
  );
}
