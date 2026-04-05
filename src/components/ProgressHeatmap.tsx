'use client';

interface Completion {
  date: string;
  cards_reviewed: number;
  cards_total: number;
}

interface ProgressHeatmapProps {
  year: number;
  month: number; // 0-indexed
  completions: Completion[];
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getRatioColor(ratio: number): string {
  if (ratio === 0) return 'bg-surface-light/40';
  if (ratio < 0.33) return 'bg-primary/30';
  if (ratio < 0.66) return 'bg-primary/50';
  if (ratio < 1) return 'bg-primary/70';
  return 'bg-primary';
}

export default function ProgressHeatmap({ year, month, completions }: ProgressHeatmapProps) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const completionMap = new Map<string, number>();
  completions.forEach(c => {
    const ratio = c.cards_total > 0 ? c.cards_reviewed / c.cards_total : 0;
    completionMap.set(c.date, ratio);
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="w-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="text-[10px] text-slate-500 text-center font-medium">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const ratio = completionMap.get(dateStr) ?? 0;
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-colors ${getRatioColor(ratio)} ${
                isToday ? 'ring-2 ring-primary-light ring-offset-1 ring-offset-bg' : ''
              }`}
              title={`${dateStr}: ${Math.round(ratio * 100)}%`}
            >
              <span className={ratio > 0 ? 'text-white' : 'text-slate-500'}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
