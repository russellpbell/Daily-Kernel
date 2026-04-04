import { useState } from "react";
import { useCategories } from "../hooks/useCategories";

const SUGGESTED = [
  "AI",
  "Climate",
  "Space",
  "Health",
  "Tech",
  "Finance",
  "Science",
  "Politics",
];

export default function CategoriesPage() {
  const { categories, loading, addCategory, editCategory, removeCategory } =
    useCategories();
  const [newName, setNewName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const existingNames = new Set(categories.map((c) => c.name.toLowerCase()));
  const suggestions = SUGGESTED.filter(
    (s) => !existingNames.has(s.toLowerCase())
  );

  async function handleAdd(name: string) {
    if (!name.trim()) return;
    await addCategory(name.trim());
    setNewName("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleAdd(newName);
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId === id) {
      await removeCategory(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-20 bg-white/5 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h2 className="text-xl font-bold text-white mb-4">Categories</h2>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a category..."
          className="flex-1 h-11 px-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="h-11 px-5 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-30 hover:bg-primary/90 active:scale-[0.97] transition-all"
        >
          Add
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2">Suggested:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleAdd(s)}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 hover:text-white active:scale-95 transition-all min-h-[36px]"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          No categories yet. Add some above to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white/5 rounded-xl p-4 border border-white/5 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      editCategory(cat.id, { is_active: !cat.is_active })
                    }
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      cat.is_active ? "bg-primary" : "bg-gray-600"
                    }`}
                    aria-label={`Toggle ${cat.name}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        cat.is_active ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span
                    className={`font-medium text-sm ${
                      cat.is_active ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {cat.name}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-sm transition-all ${
                    confirmDeleteId === cat.id
                      ? "bg-red-500/20 text-red-400"
                      : "text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                  }`}
                  aria-label={
                    confirmDeleteId === cat.id
                      ? "Confirm delete"
                      : `Delete ${cat.name}`
                  }
                >
                  {confirmDeleteId === cat.id ? "Confirm?" : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={cat.weight}
                  onChange={(e) =>
                    editCategory(cat.id, { weight: Number(e.target.value) })
                  }
                  disabled={!cat.is_active}
                  className="flex-1 h-1.5 appearance-none bg-white/10 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 disabled:opacity-30"
                />
                <span
                  className={`text-xs font-mono min-w-[36px] text-right ${
                    cat.is_active ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {cat.weight}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
