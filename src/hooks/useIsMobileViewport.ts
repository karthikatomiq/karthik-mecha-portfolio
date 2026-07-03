"use client";

import { useEffect, useState } from "react";

/** Mirrors Tailwind's md breakpoint — true below 768px. */
const QUERY = "(max-width: 767px)";

export function useIsMobileViewport() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    setMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return mobile;
}
