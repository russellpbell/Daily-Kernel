import type { Card } from "../types";

const CATEGORY_COLORS = [
  "from-indigo-600 to-purple-700",
  "from-emerald-600 to-teal-700",
  "from-rose-600 to-pink-700",
  "from-amber-600 to-orange-700",
  "from-cyan-600 to-blue-700",
  "from-violet-600 to-fuchsia-700",
  "from-lime-600 to-green-700",
  "from-red-600 to-rose-700",
  "from-sky-600 to-indigo-700",
  "from-teal-600 to-cyan-700",
];

function hashCategory(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getCategoryGradient(name: string): string {
  return CATEGORY_COLORS[hashCategory(name) % CATEGORY_COLORS.length];
}

interface BriefingCardProps {
  card: Card;
  style?: React.CSSProperties;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: (e: React.PointerEvent) => void;
}

export default function BriefingCard({
  card,
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: BriefingCardProps) {
  const gradient = getCategoryGradient(card.category_name);

  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl shadow-2xl overflow-hidden select-none touch-none`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="flex flex-col h-full p-5">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white uppercase tracking-wider">
            {card.category_name}
          </span>
        </div>

        <h2 className="text-xl font-bold text-white leading-snug mb-3">
          {card.title}
        </h2>

        <p className="text-sm text-white/85 leading-relaxed flex-1 overflow-y-auto">
          {card.summary}
        </p>

        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
          <span className="text-xs text-white/60">{card.source_name}</span>
          <a
            href={card.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/80 underline underline-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            Read source
          </a>
        </div>
      </div>
    </div>
  );
}
