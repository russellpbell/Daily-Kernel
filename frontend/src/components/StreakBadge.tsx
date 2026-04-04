interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  const hasStreak = streak > 0;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
        hasStreak
          ? "bg-orange-500/20 text-orange-300"
          : "bg-gray-700/50 text-gray-500"
      }`}
    >
      <span
        className={`text-base ${hasStreak ? "animate-pulse" : "opacity-40"}`}
        role="img"
        aria-label="streak"
      >
        🔥
      </span>
      <span>{streak}</span>
    </div>
  );
}
