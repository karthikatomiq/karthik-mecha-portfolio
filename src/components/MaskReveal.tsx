"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Mask reveal: content slides up from behind an overflow-hidden
 * bounding box when it enters the viewport.
 */
export default function MaskReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inner = wrap.current?.firstElementChild;
    if (!inner) return;
    const tween = gsap.fromTo(
      inner,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 1.1,
        delay,
        ease: "power4.out",
        scrollTrigger: { trigger: wrap.current, start: "top 88%" },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay]);

  return (
    <div ref={wrap} className={`overflow-hidden ${className}`}>
      <div className="will-change-transform">{children}</div>
    </div>
  );
}
