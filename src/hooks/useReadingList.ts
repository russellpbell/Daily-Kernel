'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface ReadingListItem {
  id: string;
  card_id: string | null;
  title: string;
  summary: string;
  source_url: string | null;
  source_name: string | null;
  category_name: string;
  notes: string | null;
  is_read: boolean;
  saved_at: string;
}

export function useReadingList() {
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'unread' | 'read' | 'all'>('unread');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const readParam = filter === 'all' ? undefined : filter === 'read';
      const data = await api.getReadingList(readParam);
      setItems(data.items);
    } catch (e) {
      console.error('Failed to load reading list:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const markAsRead = async (id: string) => {
    await api.updateReadingListItem(id, { is_read: true });
    setItems(prev => prev.map(item => item.id === id ? { ...item, is_read: true } : item));
  };

  const updateNotes = async (id: string, notes: string) => {
    await api.updateReadingListItem(id, { notes });
    setItems(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
  };

  const remove = async (id: string) => {
    await api.removeFromReadingList(id);
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return { items, loading, filter, setFilter, markAsRead, updateNotes, remove, refresh: fetchItems };
}
