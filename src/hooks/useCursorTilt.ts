"use client";

import { useEffect, useRef, type RefObject } from "react";

/* Past the card's edge the tilt fades out over this many half-card-widths,
   so the emblem eases home instead of snapping when the cursor leaves. */
const FALLOFF = 0.5;

/**
 * Tracks the cursor relative to `ref`'s bounding box and exposes a mutable
 * tilt target, -1..1 per axis, 0 when the cursor is far from the card.
 * A window listener is used because the card's canvas layer is
 * pointer-events-none and never receives mouse events itself. Listens only
 * while `enabled` — callers wire this to their IntersectionObserver
 * visibility so off-screen cards do no tracking work.
 */
export function useCursorTilt(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const target = useRef({ x: 0, y: 0 }).current;

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const reach = Math.max(Math.abs(nx), Math.abs(ny));
      const influence = reach <= 1 ? 1 : Math.max(0, 1 - (reach - 1) / FALLOFF);
      target.x = Math.max(-1, Math.min(1, nx)) * influence;
      target.y = Math.max(-1, Math.min(1, ny)) * influence;
    };
    document.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMove);
      target.x = 0;
      target.y = 0;
    };
  }, [ref, enabled, target]);

  return target;
}
