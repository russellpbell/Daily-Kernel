'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface Card {
  id: string;
  category_name: string;
  title: string;
  summary: string;
  source_url: string | null;
  source_name: string | null;
  position: number;
}

interface BriefingState {
  cards: Card[];
  currentIndex: number;
  loading: boolean;
  generating: boolean;
  error: string | null;
  completed: boolean;
}

export function useBriefing() {
  const [state, setState] = useState<BriefingState>({
    cards: [],
    currentIndex: 0,
    loading: true,
    generating: false,
    error: null,
    completed: false,
  });

  const fetchBriefing = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.getBriefing();
      if (data.briefing && data.briefing.cards.length > 0) {
        const sorted = [...data.briefing.cards].sort((a, b) => a.position - b.position);
        setState(s => ({
          ...s,
          cards: sorted,
          currentIndex: 0,
          loading: false,
          completed: false,
        }));
      } else {
        setState(s => ({
          ...s,
          cards: [],
          currentIndex: 0,
          loading: false,
          completed: false,
        }));
      }
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load briefing',
      }));
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  const generate = useCallback(async () => {
    setState(s => ({ ...s, generating: true, error: null }));
    try {
      const data = await api.generateBriefing();
      const sorted = [...data.briefing.cards].sort((a, b) => a.position - b.position);
      setState(s => ({
        ...s,
        cards: sorted,
        currentIndex: 0,
        generating: false,
        completed: false,
      }));
    } catch (err) {
      setState(s => ({
        ...s,
        generating: false,
        error: err instanceof Error ? err.message : 'Failed to generate briefing',
      }));
    }
  }, []);

  const sendFeedback = useCallback(async (action: 'thumbs_up' | 'thumbs_down' | 'skip') => {
    setState(s => {
      const card = s.cards[s.currentIndex];
      if (card) {
        // Fire and forget - don't await inside setState
        api.sendFeedback(card.id, action).catch(() => {});
      }
      const nextIndex = s.currentIndex + 1;
      return nextIndex >= s.cards.length
        ? { ...s, currentIndex: nextIndex, completed: true }
        : { ...s, currentIndex: nextIndex };
    });
  }, []);

  return {
    cards: state.cards,
    currentIndex: state.currentIndex,
    remainingCards: state.cards.slice(state.currentIndex),
    loading: state.loading,
    generating: state.generating,
    error: state.error,
    completed: state.completed,
    totalCards: state.cards.length,
    reviewedCount: state.currentIndex,
    generate,
    sendFeedback,
    refresh: fetchBriefing,
  };
}
