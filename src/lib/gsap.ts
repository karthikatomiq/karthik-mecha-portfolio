import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // Recompute trigger positions on these events so stale measurements
  // (e.g. from a tab restore or a font/layout shift) don't leave pinned
  // sections or scrubbed tweens misaligned mid-scroll.
  ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize" });
}

export { gsap, ScrollTrigger };
