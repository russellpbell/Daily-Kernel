'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFeed } from '@/hooks/useFeed';
import type { FeedItem } from '@/hooks/useFeed';
import Link from 'next/link';

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

function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(timestamp).toLocaleDateString();
}

function SourceBadge({ source }: { source: FeedItem['source'] }) {
  if (source === 'both') {
    return (
      <div className="flex gap-1.5">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
          Liked
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300">
          Saved
        </span>
      </div>
    );
  }
  if (source === 'liked') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
        Liked
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300">
      Saved
    </span>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-surface to-surface-light border border-white/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${categoryColor(item.category_name)}`}>
          {item.category_name}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <SourceBadge source={item.source} />
        </div>
      </div>

      <h3 className="mt-3 text-lg font-bold text-white leading-tight">
        {item.title}
      </h3>

      <p className="mt-2 text-sm text-slate-300 leading-relaxed">
        {item.summary}
      </p>

      <div className="mt-4 flex items-center justify-between">
        {item.source_url ? (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary-light hover:text-primary transition-colors min-h-[44px]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {item.source_name || 'Read source'}
          </a>
        ) : (
          <span />
        )}
        <span className="text-[11px] text-slate-500">
          {relativeTime(item.timestamp)}
        </span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="w-full h-48 rounded-2xl bg-surface/60"
          style={{
            background: 'linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-light) 50%, var(--color-surface) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            opacity: 1 - i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

const FILTERS = [
  { key: 'all' as const, label: 'All' },
  { key: 'liked' as const, label: 'Liked' },
  { key: 'saved' as const, label: 'Saved' },
];

export default function FeedPage() {
  const [filter, setFilter] = useState<'all' | 'liked' | 'saved'>('all');
  const { items, loading, loadingMore, hasMore, loadMore } = useFeed(filter);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll with IntersectionObserver
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRef.current();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length]); // Re-attach when items change so sentinel position updates

  return (
    <div className="flex flex-col min-h-[calc(100vh-7.5rem)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Interest Feed</h1>
          <Link
            href="/"
            className="text-sm text-primary-light hover:text-primary transition-colors min-h-[44px] flex items-center"
          >
            Daily Briefing
          </Link>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mt-3">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-primary text-white'
                  : 'bg-surface-light/50 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed content */}
      <div className="flex-1 px-4 pb-4">
        {loading ? (
          <LoadingSkeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">
              {filter === 'liked' ? '👍' : filter === 'saved' ? '🔖' : '📭'}
            </span>
            <p className="text-slate-400 text-base max-w-xs">
              {filter === 'liked'
                ? 'No liked cards yet. Swipe right on cards you find interesting!'
                : filter === 'saved'
                ? 'No saved cards yet. Swipe up or tap the bookmark to save cards.'
                : 'Your interest feed is empty. Start reviewing briefings to build your feed!'}
            </p>
            <Link
              href="/"
              className="mt-4 px-6 py-3 min-h-[44px] rounded-xl bg-primary hover:bg-primary-light text-white font-semibold transition-colors"
            >
              Go to Briefing
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item, index) => (
              <FeedCard key={`${item.id}-${index}`} item={item} />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <p className="text-center text-slate-500 text-sm py-4">
                You&apos;ve reached the end
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
