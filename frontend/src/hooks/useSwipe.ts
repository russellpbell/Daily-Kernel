import { useState, useRef, useCallback } from "react";

export type GestureType = "swipe_left" | "swipe_right" | "swipe_up" | "none";

interface SwipeState {
  dx: number;
  dy: number;
  isDragging: boolean;
  gesture: GestureType;
}

interface SwipeHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
}

const THRESHOLD = 80;

export function useSwipe(
  onSwipe: (gesture: GestureType) => void
): SwipeState & SwipeHandlers {
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const active = useRef(false);

  const resolveGesture = useCallback(
    (deltaX: number, deltaY: number): GestureType => {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absY > THRESHOLD && absY > absX && deltaY < 0) {
        return "swipe_up";
      }
      if (absX > THRESHOLD) {
        return deltaX > 0 ? "swipe_right" : "swipe_left";
      }
      return "none";
    },
    []
  );

  const currentGesture = resolveGesture(dx, dy);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    active.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!active.current) return;
    setDx(e.clientX - startX.current);
    setDy(e.clientY - startY.current);
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!active.current) return;
      active.current = false;
      const finalDx = e.clientX - startX.current;
      const finalDy = e.clientY - startY.current;
      const gesture = resolveGesture(finalDx, finalDy);

      if (gesture !== "none") {
        onSwipe(gesture);
      }

      setDx(0);
      setDy(0);
      setIsDragging(false);
    },
    [onSwipe, resolveGesture]
  );

  const onPointerCancel = useCallback(() => {
    active.current = false;
    setDx(0);
    setDy(0);
    setIsDragging(false);
  }, []);

  return {
    dx,
    dy,
    isDragging,
    gesture: currentGesture,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}
