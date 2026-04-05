'use client';

import { useRef, useCallback, useState } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up';

interface SwipeState {
  x: number;
  y: number;
  swiping: boolean;
}

const THRESHOLD = 80;

export function useSwipe(onSwipe: (direction: SwipeDirection) => void) {
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState<SwipeState>({ x: 0, y: 0, swiping: false });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setOffset({ x: 0, y: 0, swiping: true });
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setOffset({ x: dx, y: dy, swiping: true });
  }, []);

  const onPointerUp = useCallback(() => {
    if (!startPos.current) return;
    const { x, y } = offset;

    if (x > THRESHOLD) {
      onSwipe('right');
    } else if (x < -THRESHOLD) {
      onSwipe('left');
    } else if (y < -THRESHOLD) {
      onSwipe('up');
    }

    startPos.current = null;
    setOffset({ x: 0, y: 0, swiping: false });
  }, [offset, onSwipe]);

  const direction: SwipeDirection | null =
    offset.x > THRESHOLD ? 'right' :
    offset.x < -THRESHOLD ? 'left' :
    offset.y < -THRESHOLD ? 'up' :
    null;

  return {
    offset,
    direction,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}
