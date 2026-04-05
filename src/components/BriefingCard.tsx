'use client';

import React, { useState } from 'react';

interface BriefingCardProps {
  card: {
    id: string;
    category_name: string;
    title: string;
    summary: string;
    source_url: string | null;
    source_name: string | null;
  };
  style?: React.CSSProperties;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onSave?: () => void;
  isSaved?: boolean;
}

function categoryColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-indigo-500/20 text-indigo-300',
    'bg-emerald-500/20 text-emerald-300',
    'bg-amber-500/20 text-amber-300',
    'bg-rose-500/20 text-rose-300',
    'bg-cyan-500/20 text-cyan-300',
    'bg-violet-500/20 text-violet-300',
    'bg-orange-500/20 text-orange-300',
    'bg-teal-500/20 text-teal-300',
  ];
  return colors[Math.abs(hash) % colors.length];
}

export default function BriefingCard({
  card,
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSave,
  isSaved: isSavedProp = false,
}: BriefingCardProps) {
  const [saved, setSaved] = useState(isSavedProp);
  const [showToast, setShowToast] = useState(false);

  const handleSave = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (saved) return;
    setSaved(true);
    setShowToast(true);
    onSave?.();
    setTimeout(() => setShowToast(false), 1500);
  };

  return (
    <div
      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-surface to-surface-light border border-white/10 shadow-xl overflow-hidden select-none touch-none"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="flex flex-col h-full p-6">
        <div className="flex items-start justify-between">
          <span
            className={`self-start px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${categoryColor(card.category_name)}`}
          >
            {card.category_name}
          </span>
          <button
            onClick={handleSave}
            onPointerDown={e => e.stopPropagation()}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all ${
              saved ? 'text-primary-light' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label={saved ? 'Saved' : 'Save to reading list'}
          >
            <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {showToast && (
          <div
            className="absolute top-14 right-4 px-3 py-1.5 rounded-lg bg-primary/90 text-white text-xs font-medium"
            style={{ animation: 'fade-in-up 0.2s ease-out' }}
          >
            Saved!
          </div>
        )}

        <h2 className="mt-4 text-xl font-bold text-white leading-tight line-clamp-3">
          {card.title}
        </h2>

        <p className="mt-3 text-sm text-slate-300 leading-relaxed flex-1 overflow-y-auto line-clamp-[8]">
          {card.summary}
        </p>

        {card.source_url && (
          <a
            href={card.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary-light hover:text-primary transition-colors min-h-[44px]"
            onPointerDown={e => e.stopPropagation()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {card.source_name || 'Read source'}
          </a>
        )}
      </div>
    </div>
  );
}
