/**
 * Shared channel between the WebGL core (MechaCore) and the DOM car layer
 * (ParallaxCar) — same pattern as pointer.ts: a plain mutable store written
 * inside frame loops, never React state. MechaCore projects its center into
 * screen px every frame; the car's ticker reads that for proximity, writes
 * back its absorption progress, and stamps pulseStart the instant the car
 * is fully consumed so the core can flare in response.
 */
export const coreLink = {
  /* core center in screen px — only valid while ready is true */
  x: 0,
  y: 0,
  ready: false,
  /* core center in world units (scene space) — for in-canvas consumers */
  wx: 0,
  wy: 0,
  wz: 0,
  /* car absorption progress: 0 free → 1 fully consumed (scroll-driven) */
  absorption: 0,
  /* performance.now() of the last full absorption; drives the core's pulse */
  pulseStart: -Infinity,
  /* performance.now() of the last ambient-particle/raindrop absorption —
     the core answers with a much smaller blip than the car pulse */
  microPulseStart: -Infinity,
};

export const MICRO_PULSE_MS = 160;

/**
 * Stamp a micro pulse unless one is already playing. Heavy feeders (rain
 * can absorb several drops per second) would otherwise restamp every
 * frame and hold the sine envelope at its zero start — this throttles to
 * at most one full blip per MICRO_PULSE_MS.
 */
export function stampMicroPulse() {
  const now = performance.now();
  if (now - coreLink.microPulseStart > MICRO_PULSE_MS) coreLink.microPulseStart = now;
}

let contactEl: HTMLElement | null = null;

/**
 * Comms-section gate shared by the absorption effects: 0 while the section
 * is below the fold, ramping to 1 as its top rises through the viewport.
 * One cached element + one rect read per call.
 */
export function commsActivation(viewportHeight: number) {
  contactEl ||= document.getElementById("contact");
  if (!contactEl) return 0;
  const top = contactEl.getBoundingClientRect().top;
  return Math.min(1, Math.max(0, (viewportHeight - top) / (viewportHeight * 0.6)));
}
