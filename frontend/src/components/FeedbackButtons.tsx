interface FeedbackButtonsProps {
  onThumbsDown: () => void;
  onSkip: () => void;
  onThumbsUp: () => void;
  disabled?: boolean;
}

export default function FeedbackButtons({
  onThumbsDown,
  onSkip,
  onThumbsUp,
  disabled = false,
}: FeedbackButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-4">
      <button
        onClick={onThumbsDown}
        disabled={disabled}
        aria-label="Dislike"
        className="w-14 h-14 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center justify-center text-2xl hover:bg-red-500/25 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        👎
      </button>
      <button
        onClick={onSkip}
        disabled={disabled}
        aria-label="Skip"
        className="w-12 h-12 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/30 flex items-center justify-center text-lg hover:bg-gray-500/25 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        ↷
      </button>
      <button
        onClick={onThumbsUp}
        disabled={disabled}
        aria-label="Like"
        className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl hover:bg-emerald-500/25 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        👍
      </button>
    </div>
  );
}
