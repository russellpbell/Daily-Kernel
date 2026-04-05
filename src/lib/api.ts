import { getToken, clearAuth } from '@/lib/storage';

const BASE = '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (name: string, pin: string) =>
    request<{
      token: string;
      user: { id: string; name: string; cards_per_briefing: number };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name, pin }),
    }),

  register: (name: string, pin: string) =>
    request<{
      token: string;
      user: { id: string; name: string; cards_per_briefing: number };
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, pin }),
    }),

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
      }>;
    }>('/api/categories'),

  addCategory: (name: string) =>
    request<{
      category: {
        id: string;
        name: string;
        weight: number;
        is_active: boolean;
      };
    }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  updateCategory: (id: string, updates: { weight?: number; is_active?: boolean }) =>
    request<{
      category: {
        id: string;
        name: string;
        weight: number;
        is_active: boolean;
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

  // Settings
  updateSettings: (settings: { cards_per_briefing?: number }) =>
    request<{
      user: { id: string; name: string; cards_per_briefing: number };
    }>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),

  getMe: () =>
    request<{
      user: { id: string; name: string; cards_per_briefing: number };
    }>('/api/auth/me'),
};
