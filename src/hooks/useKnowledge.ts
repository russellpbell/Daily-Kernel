'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface ExpertiseItem {
  category_name: string;
  level: number;
  topics_covered: number;
  cards_reviewed: number;
}

export interface RecentTopic {
  topic: string;
  category_name: string;
  times_seen: number;
  last_seen_at: string;
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Familiar',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

const LEVEL_THRESHOLDS = [0, 10, 30, 75, 150, 300];

export function getLevelLabel(level: number): string {
  return LEVEL_LABELS[level] || 'Beginner';
}

export function getLevelProgress(cards_reviewed: number, level: number): number {
  if (level >= 5) return 100;
  const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || 300;
  const progress = ((cards_reviewed - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(100, Math.max(0, progress));
}

export function getNextThreshold(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level + 1, 5)] || 300;
}

export function useKnowledge() {
  const [expertise, setExpertise] = useState<ExpertiseItem[]>([]);
  const [recentTopics, setRecentTopics] = useState<RecentTopic[]>([]);
  const [totalTopics, setTotalTopics] = useState(0);
  const [totalCardsReviewed, setTotalCardsReviewed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKnowledge = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getKnowledge();
      setExpertise(data.expertise);
      setRecentTopics(data.recent_topics);
      setTotalTopics(data.total_topics);
      setTotalCardsReviewed(data.total_cards_reviewed);
    } catch (e) {
      console.error('Failed to load knowledge:', e);
      setError(e instanceof Error ? e.message : 'Failed to load knowledge');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKnowledge(); }, [fetchKnowledge]);

  return {
    expertise,
    recentTopics,
    totalTopics,
    totalCardsReviewed,
    loading,
    error,
    refresh: fetchKnowledge,
  };
}
