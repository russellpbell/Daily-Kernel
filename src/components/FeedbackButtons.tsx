'use client';

interface FeedbackButtonsProps {
  onNotInterested: () => void;
  onSaveToReadingList: () => void;
  onLearned: () => void;
  isSaved?: boolean;
  disabled?: boolean;
}

export default function FeedbackButtons({
  onNotInterested,
  onSaveToReadingList,
  onLearned,
  isSaved = false,
  disabled = false,
}: FeedbackButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Not Interested */}
      <button
        onClick={onNotInterested}
        disabled={disabled}
        className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all active:scale-90 disabled:opacity-30"
        aria-label="Not interested"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[10px] mt-0.5 font-medium">Skip</span>
      </button>

      {/* Save to Reading List */}
      <button
        onClick={onSaveToReadingList}
        disabled={disabled || isSaved}
        className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all active:scale-90 disabled:opacity-30 ${
          isSaved
            ? 'bg-blue-500/25 text-blue-300'
            : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'
        }`}
        aria-label={isSaved ? 'Saved to reading list' : 'Save to reading list'}
      >
        <svg viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[10px] mt-0.5 font-medium">{isSaved ? 'Saved' : 'Read Later'}</span>
      </button>

      {/* Learned / Interested */}
      <button
        onClick={onLearned}
        disabled={disabled}
        className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all active:scale-90 disabled:opacity-30"
        aria-label="Learned something"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[10px] mt-0.5 font-medium">Learned</span>
      </button>
    </div>
  );
}
