import { useState, useEffect, useCallback } from "react";
import type { Briefing } from "../types";
import { getTodayBriefing, generateBriefing, submitFeedback } from "../api";

export function useBriefing() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTodayBriefing();
      setBriefing(data);
      if (data) {
        const firstUnreviewed = data.cards.findIndex((c) => !c.feedback);
        setCurrentIndex(firstUnreviewed === -1 ? data.cards.length : firstUnreviewed);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load briefing");
    } finally {
      setLoading(false);
    }
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateBriefing();
      setBriefing(data);
      setCurrentIndex(0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate briefing");
    } finally {
      setLoading(false);
    }
  }, []);

  const sendFeedback = useCallback(
    async (cardId: string, feedback: "thumbs_up" | "thumbs_down" | "skip") => {
      try {
        await submitFeedback(cardId, feedback);
        setBriefing((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            cards: prev.cards.map((c) =>
              c.id === cardId ? { ...c, feedback } : c
            ),
          };
        });
        setCurrentIndex((i) => i + 1);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to submit feedback");
      }
    },
    []
  );

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  const remainingCards = briefing
    ? briefing.cards.slice(currentIndex)
    : [];

  const isComplete =
    briefing !== null && currentIndex >= briefing.cards.length;

  const reviewedCount = briefing
    ? briefing.cards.filter((c) => c.feedback).length
    : 0;

  return {
    briefing,
    loading,
    error,
    currentIndex,
    remainingCards,
    isComplete,
    reviewedCount,
    totalCards: briefing?.cards.length ?? 0,
    fetchBriefing,
    generate,
    sendFeedback,
  };
}
