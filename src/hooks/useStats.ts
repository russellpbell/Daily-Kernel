'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface StatsData {
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
}

export function useStats() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await api.getStats();
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    data,
    loading,
    error,
    refresh: fetchStats,
  };
}
