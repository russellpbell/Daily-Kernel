'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

export interface FeedItem {
  id: string;
  title: string;
  summary: string;
  source_url: string | null;
  source_name: string | null;
  category_name: string;
  timestamp: string;
  source: 'liked' | 'saved' | 'both';
  is_read?: boolean;
}

export function useFeed(filter: 'all' | 'liked' | 'saved' = 'all') {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | null>(null);

  const fetchItems = useCallback(async (cursor?: string) => {
    const isLoadMore = !!cursor;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      if (filter !== 'all') params.set('filter', filter);
      params.set('limit', '20');

      const data = await api.getFeed(params.toString());

      if (isLoadMore) {
        setItems(prev => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setHasMore(data.has_more);

      if (data.items.length > 0) {
        cursorRef.current = data.items[data.items.length - 1].timestamp;
      }
    } catch (e) {
      console.error('Failed to load feed:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    cursorRef.current = null;
    fetchItems();
  }, [fetchItems]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && cursorRef.current) {
      fetchItems(cursorRef.current);
    }
  }, [loadingMore, hasMore, fetchItems]);

  return { items, loading, loadingMore, hasMore, loadMore };
}
