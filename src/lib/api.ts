import { createBrowserClient } from '@/lib/supabase';
import { clearAuth } from '@/lib/storage';

const BASE = '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const supabase = createBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Briefing
  getBriefing: (date?: string) =>
    request<{
      briefing: {
        id: string;
        date: string;
        cards: Array<{
          id: string;
          category_name: string;
          title: string;
          summary: string;
          source_url: string | null;
          source_name: string | null;
          position: number;
        }>;
      } | null;
    }>(`/api/briefing${date ? `?date=${date}` : ''}`),

  generateBriefing: () =>
    request<{
      briefing: {
        id: string;
        date: string;
        cards: Array<{
          id: string;
          category_name: string;
          title: string;
          summary: string;
          source_url: string | null;
          source_name: string | null;
          position: number;
        }>;
      };
    }>('/api/briefing/generate', {
      method: 'POST',
    }),

  // Feedback
  sendFeedback: (cardId: string, action: 'thumbs_up' | 'thumbs_down' | 'skip') =>
    request<{ feedback: { id: string } }>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ card_id: cardId, action }),
    }),

  // Categories
  getCategories: () =>
    request<{
      categories: Array<{
        id: string;
        name: string;
        weight: number;
        is_active: boolean;
        source_type: 'news' | 'biomedical' | 'stem' | 'academic';
      }>;
    }>('/api/categories'),

  addCategory: (name: string, source_type?: string) =>
    request<{
      category: {
        id: string;
        name: string;
        weight: number;
        is_active: boolean;
        source_type: 'news' | 'biomedical' | 'stem' | 'academic';
      };
    }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, ...(source_type ? { source_type } : {}) }),
    }),

  updateCategory: (id: string, updates: { weight?: number; is_active?: boolean; source_type?: string }) =>
    request<{
      category: {
        id: string;
        name: string;
        weight: number;
        is_active: boolean;
        source_type: 'news' | 'biomedical' | 'stem' | 'academic';
      };
    }>(`/api/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteCategory: (id: string) =>
    request<{ success: boolean }>(`/api/categories/${id}`, {
      method: 'DELETE',
    }),

  // Stats
  getStats: () =>
    request<{
      streak: {
        current_streak: number;
        longest_streak: number;
        last_review_date: string | null;
      };
      completions: Array<{
        date: string;
        cards_reviewed: number;
        cards_total: number;
      }>;
    }>('/api/stats'),

  // Reading List
  getReadingList: (readFilter?: boolean) => {
    const params = readFilter !== undefined ? `?read=${readFilter}` : '';
    return request<{ items: Array<{
      id: string; card_id: string | null; title: string; summary: string;
      source_url: string | null; source_name: string | null; category_name: string;
      notes: string | null; is_read: boolean; saved_at: string;
    }> }>(`/api/reading-list${params}`);
  },

  saveToReadingList: (data: {
    card_id?: string; title: string; summary: string;
    source_url?: string; source_name?: string; category_name: string;
  }) => request<{ item: { id: string } }>('/api/reading-list', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateReadingListItem: (id: string, updates: { is_read?: boolean; notes?: string }) =>
    request<{ item: { id: string } }>(`/api/reading-list/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  removeFromReadingList: (id: string) =>
    request<{ success: boolean }>(`/api/reading-list/${id}`, { method: 'DELETE' }),

  // Knowledge/Expertise
  getKnowledge: () =>
    request<{
      expertise: Array<{ category_name: string; level: number; topics_covered: number; cards_reviewed: number }>;
      recent_topics: Array<{ topic: string; category_name: string; times_seen: number; last_seen_at: string }>;
      total_topics: number;
      total_cards_reviewed: number;
    }>('/api/knowledge'),

  // Settings
  getSettings: () =>
    request<{
      user: { id: string; name: string; email: string; cards_per_briefing: number };
    }>('/api/settings'),

  updateSettings: (settings: { cards_per_briefing?: number; name?: string }) =>
    request<{
      user: { id: string; name: string; email: string; cards_per_briefing: number };
    }>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
};
