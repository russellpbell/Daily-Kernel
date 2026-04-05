'use client';

import { useMemo, useState, useCallback } from 'react';
import { useBriefing } from '@/hooks/useBriefing';
import { api } from '@/lib/api';
import CardStack from '@/components/CardStack';
import FeedbackButtons from '@/components/FeedbackButtons';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';

function ConfettiParticles() {
  const particles = useMemo(() => {
    const colors = ['#6366f1', '#818cf8', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4', '#a78bfa', '#fbbf24'];
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 2}s`,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 6,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 pt-8">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-full max-w-sm h-64 rounded-2xl bg-surface/60"
          style={{
            background: 'linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-light) 50%, var(--color-surface) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            opacity: 1 - i * 0.25,
          }}
        />
      ))}
    </div>
  );
}

export default function BriefingPage() {
  const {
    cards,
    remainingCards,
    loading,
    generating,
    error,
    completed,
    totalCards,
    reviewedCount,
    generate,
    sendFeedback,
  } = useBriefing();

  const [savedCardIds, setSavedCardIds] = useState<Set<string>>(new Set());

  const handleSaveCard = useCallback(async (card: { id: string; title: string; summary: string; source_url: string | null; source_name: string | null; category_name: string }) => {
    try {
      await api.saveToReadingList({
        card_id: card.id,
        title: card.title,
        summary: card.summary,
        source_url: card.source_url ?? undefined,
        source_name: card.source_name ?? undefined,
        category_name: card.category_name,
      });
      setSavedCardIds(prev => new Set(prev).add(card.id));
    } catch (e) {
      console.error('Failed to save card:', e);
    }
  }, []);

  // Save current card to reading list and advance
  const handleSaveAndAdvance = useCallback(async () => {
    const card = remainingCards[0];
    if (!card) return;
    await handleSaveCard(card);
    sendFeedback('skip'); // Record as skip in feedback, but saved to reading list
  }, [remainingCards, handleSaveCard, sendFeedback]);

  // Swipe gestures: right = learned, left = not interested, up = save to reading list
  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    if (direction === 'right') {
      sendFeedback('thumbs_up');
    } else if (direction === 'up') {
      handleSaveAndAdvance();
    } else {
      sendFeedback('thumbs_down');
    }
  }, [sendFeedback, handleSaveAndAdvance]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        message={error}
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7.5rem)] px-4 gap-6">
        <EmptyState
          icon="📰"
          message="No briefing yet for today"
          actionLabel={generating ? 'Generating...' : 'Generate Briefing'}
          onAction={generate}
          disabled={generating}
        />
        <Link
          href="/categories"
          className="text-sm text-primary-light hover:text-primary transition-colors min-h-[44px] flex items-center"
        >
          Set up your categories first →
        </Link>
      </div>
    );
  }

  if (completed) {
    return (
      <>
        <ConfettiParticles />
        <div
          className="flex flex-col items-center justify-center min-h-[calc(100vh-7.5rem)] px-4 gap-6"
          style={{ animation: 'fade-in-up 0.5s ease-out' }}
        >
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-white text-center">
            Briefing Complete!
          </h2>
          <p className="text-slate-400 text-center max-w-xs">
            You reviewed all {totalCards} cards today. Your streak has been updated!
          </p>
          {savedCardIds.size > 0 && (
            <p className="text-blue-400 text-sm">
              {savedCardIds.size} card{savedCardIds.size !== 1 ? 's' : ''} saved to your reading list
            </p>
          )}
          <div className="flex gap-3 mt-4">
            <Link
              href="/library"
              className="px-5 py-3 min-h-[44px] rounded-xl bg-surface border border-white/10 text-white font-medium transition-colors hover:bg-surface-light"
            >
              View Library
            </Link>
            <button
              onClick={generate}
              disabled={generating}
              className="px-5 py-3 min-h-[44px] rounded-xl bg-primary hover:bg-primary-light text-white font-semibold transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'New Briefing'}
            </button>
          </div>
          <Link
            href="/feed"
            className="mt-2 text-sm text-primary-light hover:text-primary transition-colors min-h-[44px] flex items-center"
          >
            Browse your Interest Feed →
          </Link>
        </div>
      </>
    );
  }

  const currentCard = remainingCards[0];
  const isCurrentSaved = currentCard ? savedCardIds.has(currentCard.id) : false;

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-7.5rem)]">
      {/* Interest Feed link */}
      <div className="w-full max-w-sm px-4 pt-4">
        <Link
          href="/feed"
          className="flex items-center justify-center gap-2 text-sm text-primary-light hover:text-primary transition-colors min-h-[44px]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Browse your Interest Feed
        </Link>
      </div>

      {/* Progress */}
      <div className="w-full max-w-sm px-4 pt-2 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(reviewedCount / totalCards) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap">
          {reviewedCount}/{totalCards}
        </span>
      </div>

      {/* Swipe hint (first card only) */}
      {reviewedCount === 0 && (
        <div className="text-[11px] text-slate-500 mt-2 flex gap-4">
          <span>← Skip</span>
          <span>↑ Save</span>
          <span>Learned →</span>
        </div>
      )}

      {/* Card stack */}
      <div className="flex-1 flex items-center justify-center w-full max-w-sm px-4 py-6">
        <div className="relative w-full" style={{ height: 400 }}>
          <CardStack cards={remainingCards} onSwipe={handleSwipe} onSaveCard={handleSaveCard} savedCardIds={savedCardIds} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="pb-4 px-4">
        <FeedbackButtons
          onNotInterested={() => sendFeedback('thumbs_down')}
          onSaveToReadingList={handleSaveAndAdvance}
          onLearned={() => sendFeedback('thumbs_up')}
          isSaved={isCurrentSaved}
          disabled={remainingCards.length === 0}
        />
      </div>
    </div>
  );
}
