import type { Card } from "../types";
import BriefingCard from "./BriefingCard";
import { useSwipe, type GestureType } from "../hooks/useSwipe";

interface CardStackProps {
  cards: Card[];
  onSwipe: (cardId: string, gesture: GestureType) => void;
}

export default function CardStack({ cards, onSwipe }: CardStackProps) {
  const visibleCards = cards.slice(0, 3);

  const handleSwipe = (gesture: GestureType) => {
    if (visibleCards.length === 0) return;
    const topCard = visibleCards[0];
    const feedback =
      gesture === "swipe_right"
        ? "thumbs_up"
        : gesture === "swipe_left"
        ? "thumbs_down"
        : "skip";
    onSwipe(topCard.id, feedback as unknown as GestureType);
  };

  const { dx, dy, isDragging, gesture, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useSwipe(handleSwipe);

  const getRotation = () => dx * 0.1;

  const getOpacityIndicator = () => {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX > 30 || (absY > 30 && dy < 0)) {
      return Math.min((Math.max(absX, absY) - 30) / 50, 1);
    }
    return 0;
  };

  return (
    <div className="relative w-full" style={{ height: "420px" }}>
      {visibleCards.map((card, index) => {
        const isTop = index === 0;
        const scale = 1 - index * 0.05;
        const translateY = index * 8;
        const zIndex = visibleCards.length - index;

        const topStyle: React.CSSProperties = isTop
          ? {
              transform: `translate(${dx}px, ${dy}px) rotate(${getRotation()}deg) scale(${scale})`,
              transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              zIndex,
              cursor: "grab",
            }
          : {
              transform: `translateY(${translateY}px) scale(${scale})`,
              transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              zIndex,
              pointerEvents: "none" as const,
            };

        return (
          <BriefingCard
            key={card.id}
            card={card}
            style={topStyle}
            onPointerDown={isTop ? onPointerDown : undefined}
            onPointerMove={isTop ? onPointerMove : undefined}
            onPointerUp={isTop ? onPointerUp : undefined}
            onPointerCancel={isTop ? onPointerCancel : undefined}
          />
        );
      })}

      {visibleCards.length > 0 && isDragging && (
        <>
          {gesture === "swipe_right" && (
            <div
              className="absolute top-6 left-6 z-50 px-4 py-2 rounded-lg border-2 border-emerald-400 text-emerald-400 font-bold text-lg -rotate-12"
              style={{ opacity: getOpacityIndicator() }}
            >
              LIKE
            </div>
          )}
          {gesture === "swipe_left" && (
            <div
              className="absolute top-6 right-6 z-50 px-4 py-2 rounded-lg border-2 border-red-400 text-red-400 font-bold text-lg rotate-12"
              style={{ opacity: getOpacityIndicator() }}
            >
              NOPE
            </div>
          )}
          {gesture === "swipe_up" && (
            <div
              className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border-2 border-gray-400 text-gray-400 font-bold text-lg"
              style={{ opacity: getOpacityIndicator() }}
            >
              SKIP
            </div>
          )}
        </>
      )}
    </div>
  );
}
