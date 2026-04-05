'use client';

import { useMemo } from 'react';
import { useBriefing } from '@/hooks/useBriefing';
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
          <button
            onClick={generate}
            disabled={generating}
            className="mt-4 px-6 py-3 min-h-[44px] rounded-xl bg-primary hover:bg-primary-light text-white font-semibold transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate New Briefing'}
          </button>
        </div>
      </>
    );
  }

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    if (direction === 'right') sendFeedback('thumbs_up');
    else if (direction === 'left') sendFeedback('thumbs_down');
    else sendFeedback('skip');
  };

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-7.5rem)]">
      {/* Progress */}
      <div className="w-full max-w-sm px-4 pt-4 flex items-center gap-3">
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

      {/* Card stack */}
      <div className="flex-1 flex items-center justify-center w-full max-w-sm px-4 py-6">
        <div className="relative w-full" style={{ height: 400 }}>
          <CardStack cards={remainingCards} onSwipe={handleSwipe} />
        </div>
      </div>

      {/* Feedback buttons */}
      <div className="pb-4 px-4">
        <FeedbackButtons
          onThumbsDown={() => sendFeedback('thumbs_down')}
          onSkip={() => sendFeedback('skip')}
          onThumbsUp={() => sendFeedback('thumbs_up')}
        />
      </div>
    </div>
  );
}
