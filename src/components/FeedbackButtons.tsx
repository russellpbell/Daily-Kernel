'use client';

interface FeedbackButtonsProps {
  onThumbsDown: () => void;
  onSkip: () => void;
  onThumbsUp: () => void;
}

export default function FeedbackButtons({ onThumbsDown, onSkip, onThumbsUp }: FeedbackButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-6">
      <button
        onClick={onThumbsDown}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-2xl transition-colors active:scale-90"
        aria-label="Thumbs down"
      >
        👎
      </button>
      <button
        onClick={onSkip}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-500/15 hover:bg-slate-500/25 text-slate-400 text-xl transition-colors active:scale-90"
        aria-label="Skip"
      >
        Skip
      </button>
      <button
        onClick={onThumbsUp}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-2xl transition-colors active:scale-90"
        aria-label="Thumbs up"
      >
        👍
      </button>
    </div>
  );
}
