'use client';

import { useState } from 'react';
import { useReadingList, ReadingListItem } from '@/hooks/useReadingList';
import { useKnowledge, getLevelLabel, getLevelProgress, getNextThreshold } from '@/hooks/useKnowledge';

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

function levelColor(level: number): string {
  const colors: Record<number, string> = {
    1: 'text-slate-400',
    2: 'text-cyan-400',
    3: 'text-amber-400',
    4: 'text-violet-400',
    5: 'text-emerald-400',
  };
  return colors[level] || 'text-slate-400';
}

function levelBarColor(level: number): string {
  const colors: Record<number, string> = {
    1: 'bg-slate-400',
    2: 'bg-cyan-400',
    3: 'bg-amber-400',
    4: 'bg-violet-400',
    5: 'bg-emerald-400',
  };
  return colors[level] || 'bg-slate-400';
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="h-28 rounded-xl bg-surface/60"
          style={{
            background: 'linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-light) 50%, var(--color-surface) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      ))}
    </div>
  );
}

function ReadingListItemCard({
  item,
  onMarkRead,
  onDelete,
  onUpdateNotes,
}: {
  item: ReadingListItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(item.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await onUpdateNotes(item.id, notes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-surface border border-white/5 overflow-hidden">
      <button
        className="w-full text-left p-4 min-h-[44px]"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${categoryColor(item.category_name)}`}
              >
                {item.category_name}
              </span>
              {item.is_read && (
                <span className="text-[10px] text-slate-500 font-medium">READ</span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-white leading-snug">
              {item.title}
            </h3>
            {!expanded && (
              <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-2">
                {item.summary}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary-light hover:text-primary transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  {item.source_name || 'Source'}
                </a>
              )}
              <span className="text-[10px] text-slate-600">
                {new Date(item.saved_at).toLocaleDateString('default', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <p className="text-sm text-slate-300 leading-relaxed">{item.summary}</p>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add your notes..."
              className="w-full bg-bg/60 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-primary/50 transition-colors"
              rows={3}
            />
            {notes !== (item.notes || '') && (
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                className="mt-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-primary/20 text-primary-light text-xs font-medium hover:bg-primary/30 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            {!item.is_read && (
              <button
                onClick={() => onMarkRead(item.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Mark as Read
              </button>
            )}
            <button
              onClick={() => onDelete(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReadingListTab() {
  const { items, loading, filter, setFilter, markAsRead, updateNotes, remove } = useReadingList();

  const filters: Array<{ key: 'unread' | 'read' | 'all'; label: string }> = [
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter toggles */}
      <div className="flex gap-1 p-1 rounded-lg bg-bg/60 border border-white/5">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 py-2 min-h-[36px] rounded-md text-xs font-medium transition-all ${
              filter === f.key
                ? 'bg-surface-light text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 text-slate-600">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-slate-500 text-center max-w-xs">
            Save cards from your briefing to read later
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <ReadingListItemCard
              key={item.id}
              item={item}
              onMarkRead={markAsRead}
              onDelete={remove}
              onUpdateNotes={updateNotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KnowledgeTab() {
  const { expertise, recentTopics, totalTopics, totalCardsReviewed, loading, error } = useKnowledge();

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-rose-400">{error}</p>
      </div>
    );
  }

  const categoryCount = expertise.length;

  return (
    <div className="space-y-6">
      {/* Total stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalTopics}</div>
          <div className="text-[10px] text-slate-500 mt-1">Topics Covered</div>
        </div>
        <div className="rounded-xl bg-surface border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-white">{categoryCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Categories</div>
        </div>
      </div>

      {totalTopics > 0 && (
        <p className="text-xs text-slate-500 text-center">
          {totalTopics} topics covered across {categoryCount} categories
        </p>
      )}

      {/* Expertise cards */}
      {expertise.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Expertise</h3>
          <div className="space-y-2">
            {expertise.map(item => {
              const progress = getLevelProgress(item.cards_reviewed, item.level);
              const label = getLevelLabel(item.level);
              const nextThreshold = getNextThreshold(item.level);

              return (
                <div
                  key={item.category_name}
                  className="rounded-xl bg-surface border border-white/5 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{item.category_name}</span>
                    <span className={`text-xs font-semibold ${levelColor(item.level)}`}>
                      {label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-bg/60 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${levelBarColor(item.level)}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">
                      {item.topics_covered} topics
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {item.level < 5
                        ? `${item.cards_reviewed}/${nextThreshold} cards`
                        : `${item.cards_reviewed} cards`
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent topics */}
      {recentTopics.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Recent Topics</h3>
          <div className="rounded-xl bg-surface border border-white/5 divide-y divide-white/5">
            {recentTopics.slice(0, 20).map((topic, i) => (
              <div key={`${topic.topic}-${i}`} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-white block truncate">{topic.topic}</span>
                  <span className={`text-[10px] ${categoryColor(topic.category_name).split(' ')[1]}`}>
                    {topic.category_name}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-[10px] text-slate-600">
                    {topic.times_seen}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expertise.length === 0 && recentTopics.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl">🧠</span>
          <p className="text-sm text-slate-500 text-center max-w-xs">
            Review briefing cards to build your knowledge profile
          </p>
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  const [tab, setTab] = useState<'reading' | 'knowledge'>('reading');

  const tabs: Array<{ key: 'reading' | 'knowledge'; label: string }> = [
    { key: 'reading', label: 'Reading List' },
    { key: 'knowledge', label: 'Knowledge' },
  ];

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">Library</h2>

      {/* Tab switcher */}
      <div className="flex border-b border-white/10 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative min-h-[44px] ${
              tab === t.key ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {tab === 'reading' ? <ReadingListTab /> : <KnowledgeTab />}
    </div>
  );
}
