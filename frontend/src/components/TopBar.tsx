import StreakBadge from "./StreakBadge";

interface TopBarProps {
  streak: number;
}

export default function TopBar({ streak }: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0d2e]/95 backdrop-blur-md border-b border-white/5 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-[480px] flex items-center justify-between h-14 px-4">
        <h1 className="text-lg font-bold text-white tracking-tight">
          Daily Kernel
        </h1>
        <StreakBadge streak={streak} />
      </div>
    </header>
  );
}
