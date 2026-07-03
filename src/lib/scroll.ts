import type Lenis from "lenis";

// Shared handle to the active Lenis instance (set by <SmoothScroll/>).
let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}
