'use client';

interface EmptyStateProps {
  icon: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
}

export default function EmptyState({ icon, message, actionLabel, onAction, disabled }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-4 text-center">
      <span className="text-5xl">{icon}</span>
      <p className="text-slate-400 text-base max-w-xs">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          disabled={disabled}
          className="mt-2 px-6 py-3 min-h-[44px] rounded-xl bg-primary hover:bg-primary-light text-white font-semibold transition-colors disabled:opacity-50"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
