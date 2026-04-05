'use client';

import { useSwipe, SwipeDirection } from '@/hooks/useSwipe';
import BriefingCard from './BriefingCard';

interface Card {
  id: string;
  category_name: string;
  title: string;
  summary: string;
  source_url: string | null;
  source_name: string | null;
  position: number;
}

interface CardStackProps {
  cards: Card[];
  onSwipe: (direction: SwipeDirection) => void;
  onSaveCard?: (card: Card) => void;
  savedCardIds?: Set<string>;
}

export default function CardStack({ cards, onSwipe, onSaveCard, savedCardIds }: CardStackProps) {
  const { offset, direction, handlers } = useSwipe(onSwipe);
  const visibleCards = cards.slice(0, 3);

  if (visibleCards.length === 0) return null;

  return (
    <>
      {/* Swipe indicators on top card */}
      {offset.swiping && direction && (
        <div className="absolute inset-0 z-30 flex items-start justify-center pt-8 pointer-events-none">
          {direction === 'right' && (
            <span className="px-4 py-2 rounded-lg bg-emerald-500/30 border-2 border-emerald-400 text-emerald-300 font-bold text-lg -rotate-12">
              LEARNED
            </span>
          )}
          {direction === 'left' && (
            <span className="px-4 py-2 rounded-lg bg-rose-500/30 border-2 border-rose-400 text-rose-300 font-bold text-lg rotate-12">
              SKIP
            </span>
          )}
          {direction === 'up' && (
            <span className="px-4 py-2 rounded-lg bg-blue-500/30 border-2 border-blue-400 text-blue-300 font-bold text-lg">
              SAVE
            </span>
          )}
        </div>
      )}

      {visibleCards.map((card, i) => {
        const isTop = i === 0;
        const scale = 1 - i * 0.05;
        const yOffset = i * 10;

        const baseStyle: React.CSSProperties = {
          zIndex: visibleCards.length - i,
          transform: isTop
            ? `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * 0.05}deg) scale(${scale})`
            : `translateY(${yOffset}px) scale(${scale})`,
          transition: isTop && offset.swiping ? 'none' : 'transform 0.3s ease-out',
          opacity: i >= 3 ? 0 : 1,
        };

        return (
          <BriefingCard
            key={card.id}
            card={card}
            style={baseStyle}
            onPointerDown={isTop ? handlers.onPointerDown : undefined}
            onPointerMove={isTop ? handlers.onPointerMove : undefined}
            onPointerUp={isTop ? handlers.onPointerUp : undefined}
            onSave={onSaveCard ? () => onSaveCard(card) : undefined}
            isSaved={savedCardIds?.has(card.id)}
          />
        );
      })}
    </>
  );
}
