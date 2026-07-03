"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";

/** Giant background kanji that drifts at a different rate than the page (parallax). */
export default function ParallaxKanji({
  children,
  className = "",
  speed = -25,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Drive `y` in px (not yPercent): rounding is what keeps sub-pixel seams
    // away, but a whole *percent* of a viewport-sized glyph is a multi-pixel
    // jump — whole-pixel rounding stays seam-free and scrubs smoothly.
    const tween = gsap.to(el, {
      y: () => (el.offsetHeight * speed) / 100,
      ease: "none",
      force3D: true,
      roundProps: "y",
      scrollTrigger: {
        trigger: el.parentElement,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`kanji-background pointer-events-none absolute select-none font-jp font-black ${className}`}
    >
      {children}
    </div>
  );
}
