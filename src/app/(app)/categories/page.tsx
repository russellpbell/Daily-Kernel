'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';

const SUGGESTIONS: { name: string; source_type: 'news' | 'biomedical' | 'stem' | 'academic' | 'curriculum' }[] = [
  { name: 'AI', source_type: 'stem' },
  { name: 'Climate', source_type: 'news' },
  { name: 'Space', source_type: 'stem' },
  { name: 'Health', source_type: 'biomedical' },
  { name: 'Tech', source_type: 'news' },
  { name: 'Finance', source_type: 'news' },
  { name: 'Science', source_type: 'academic' },
  { name: 'Politics', source_type: 'news' },
  { name: 'Organic Chemistry', source_type: 'curriculum' },
  { name: 'Machine Learning', source_type: 'curriculum' },
  { name: 'Statistics', source_type: 'curriculum' },
];

const SOURCE_TYPE_OPTIONS: { value: 'news' | 'biomedical' | 'stem' | 'academic' | 'curriculum'; label: string; icon: string }[] = [
  { value: 'news', label: 'News', icon: '\u{1F4F0}' },
  { value: 'biomedical', label: 'Biomedical', icon: '\u{1F9EC}' },
  { value: 'stem', label: 'STEM', icon: '\u{1F52C}' },
  { value: 'academic', label: 'Academic', icon: '\u{1F4DA}' },
  { value: 'curriculum', label: 'Learn', icon: '\u{1F393}' },
];

export default function CategoriesPage() {
  const { categories, loading, error, addCategory, updateCategory, deleteCategory } = useCategories();
  const [input, setInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleAdd = async () => {
    const name = input.trim();
    if (!name) return;
    await addCategory(name);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const existingNames = new Set(categories.map(c => c.name.toLowerCase()));
  const availableSuggestions = SUGGESTIONS.filter(s => !existingNames.has(s.name.toLowerCase()));

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="h-20 rounded-xl bg-surface/60"
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

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">Categories</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/15 text-rose-300 text-sm">{error}</div>
      )}

      {/* Add input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a category..."
          className="flex-1 min-h-[44px] px-4 rounded-xl bg-surface border border-white/10 text-white placeholder:text-slate-500 outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="min-h-[44px] px-5 rounded-xl bg-primary hover:bg-primary-light text-white font-semibold transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {/* Suggestion chips */}
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {availableSuggestions.map(s => (
            <button
              key={s.name}
              onClick={() => addCategory(s.name, s.source_type)}
              className="px-3 py-1.5 min-h-[36px] rounded-full bg-surface-light/60 hover:bg-surface-light text-sm text-slate-300 hover:text-white border border-white/5 transition-colors"
            >
              + {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Category list */}
      {categories.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">📂</p>
          <p>No categories yet. Add some above!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="rounded-xl bg-surface border border-white/5 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-white">{cat.name}</span>
                <div className="flex items-center gap-3">
                  {/* Toggle */}
                  <button
                    onClick={() => updateCategory(cat.id, { is_active: !cat.is_active })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      cat.is_active ? 'bg-primary' : 'bg-slate-600'
                    }`}
                    aria-label={cat.is_active ? 'Disable' : 'Enable'}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        cat.is_active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  {/* Delete */}
                  {confirmDelete === cat.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          deleteCategory(cat.id);
                          setConfirmDelete(null);
                        }}
                        className="min-h-[44px] px-3 text-sm text-rose-400 hover:text-rose-300 font-medium"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="min-h-[44px] px-2 text-sm text-slate-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(cat.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-rose-400 transition-colors"
                      aria-label="Delete"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.5 h-4.5">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Source type selector */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-500 w-14">Source</span>
                <div className="flex gap-1 flex-1">
                  {SOURCE_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateCategory(cat.id, { source_type: opt.value })}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        cat.source_type === opt.value
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-surface-light/40 text-slate-400 hover:text-slate-300 border border-white/5'
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-14">Weight</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(cat.weight * 100)}
                  onChange={e => updateCategory(cat.id, { weight: Number(e.target.value) / 100 })}
                  className="flex-1 h-1.5 appearance-none bg-surface-light rounded-full cursor-pointer accent-primary"
                />
                <span className="text-xs text-slate-400 tabular-nums w-10 text-right">
                  {Math.round(cat.weight * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
