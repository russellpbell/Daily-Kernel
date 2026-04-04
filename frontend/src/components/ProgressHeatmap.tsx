import type { DailyCompletion } from "../types";
import { getDaysInMonth, getFirstDayOfMonth, getMonthName, toISODate } from "../lib/dates";

interface ProgressHeatmapProps {
  year: number;
  month: number;
  completions: DailyCompletion[];
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function ProgressHeatmap({
  year,
  month,
  completions,
}: ProgressHeatmapProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = toISODate(new Date());

  const completionMap = new Map<string, DailyCompletion>();
  for (const c of completions) {
    completionMap.set(c.date, c);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  function getCellColor(day: number): string {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const comp = completionMap.get(dateStr);
    if (!comp) return "bg-gray-700/50";
    const ratio = comp.cards_total > 0 ? comp.cards_reviewed / comp.cards_total : 0;
    if (ratio >= 1) return "bg-emerald-500";
    if (ratio > 0) return "bg-emerald-900";
    return "bg-gray-700/50";
  }

  function isToday(day: number): boolean {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === today;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 text-center">
        {getMonthName(month)} {year}
      </h3>

      <div className="grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="text-[10px] text-gray-500 font-medium text-center pb-1"
          >
            {label}
          </div>
        ))}

        {cells.map((day, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {day !== null ? (
              <div
                className={`w-full h-full rounded-sm ${getCellColor(day)} flex items-center justify-center text-[10px] text-white/40 ${
                  isToday(day) ? "ring-2 ring-primary ring-offset-1 ring-offset-[#0f0d2e]" : ""
                }`}
              >
                {day}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-700/50" />
          <span>No data</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-900" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>Complete</span>
        </div>
      </div>
    </div>
  );
}
