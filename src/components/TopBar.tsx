'use client';

import StreakBadge from './StreakBadge';

export default function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-bg/80 backdrop-blur-md border-b border-white/5">
      <h1 className="text-lg font-bold tracking-tight text-white">
        Daily Kernel
      </h1>
      <StreakBadge />
    </header>
  );
}
