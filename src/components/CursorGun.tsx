"use client";

import { useEffect, useRef } from "react";
import { useIsFinePointer } from "@/hooks/useIsFinePointer";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";

/**
 * HUD weapon anchored bottom-right with its stock running off-screen.
 *
 * Desktop (md+, fine pointer): the gun pivots around its grip like a
 * turret, rotating to point the muzzle directly at the cursor anywhere
 * in the viewport (atan2 from the pivot's screen position, clamped so
 * it never flips); clicking fires a recoil kick, muzzle flash, gunshot
 * SFX and a brief impact vignette.
 *
 * Mobile (below md): there's no cursor to track, so the gun just holds
 * a fixed resting angle at a smaller scale, and a tap anywhere fires
 * the same shoot sequence aimed at the tap coordinates. Taps are only
 * recognized on touchend with minimal movement since touchstart, so a
 * scroll/swipe never accidentally fires a shot.
 *
 * Everything is pointer-events-none so page interactions are untouched.
 *
 * The "screen shake" is applied to this layer + vignette only: the About
 * section is ScrollTrigger-pinned, and a transform on body/main would
 * re-parent its position:fixed pin and visibly break it mid-scroll.
 */

/* public/images/gun.png is 933x247 with the muzzle pointing right; it renders
   flipped (scaleX(-1)) so the muzzle aims left, into the page. */
const GUN_W = 480;
const GUN_H = 127;
/* Scaled down so the HUD element doesn't overwhelm small viewports. */
const GUN_W_MOBILE = 220;
const GUN_H_MOBILE = 58;
const EDGE_RIGHT = -60;
const EDGE_BOTTOM = -34;
/* Turret pivot on the grip, as fractions of the flipped image box. */
const PIVOT_X = 0.6;
const PIVOT_Y = 0.6;
/* Max swing from resting (muzzle pointing due left) — full up is +90,
   so ±80 tracks nearly the whole screen without flipping the sprite. */
const MAX_SWING = 80;
/* Idle pose before the first mousemove arrives (desktop) — also the
   permanent resting angle on mobile, where there's no cursor to track. */
const IDLE_TILT = 20;
/* Gunshot SFX: pool size bounds how many shots can overlap in rapid fire. */
const SHOT_SRC = "/audio/gunsound.mp3";
const SHOT_VOLUME = 0.5;
const SHOT_POOL_SIZE = 4;
/* A tap must not drift more than this between touchstart and touchend,
   otherwise it's treated as a scroll/swipe and ignored. */
const TAP_MOVE_THRESHOLD = 10;

type Mode = "desktop" | "mobile" | "hidden";

export default function CursorGun() {
  const fine = useIsFinePointer();
  const mobileViewport = useIsMobileViewport();
  const mode: Mode = mobileViewport ? "mobile" : fine ? "desktop" : "hidden";

  const layerRef = useRef<HTMLDivElement>(null);
  const swayRef = useRef<HTMLDivElement>(null);
  const recoilRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const rot = useRef(IDLE_TILT); // angle currently rendered
  const target = useRef(IDLE_TILT); // angle the cursor demands (desktop only)
  const raf = useRef(0);
  const shots = useRef<HTMLAudioElement[]>([]);
  const shotIdx = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (mode === "hidden") return;

    const gunW = mode === "mobile" ? GUN_W_MOBILE : GUN_W;
    const gunH = mode === "mobile" ? GUN_H_MOBILE : GUN_H;
    const barrelLen = gunW * PIVOT_X;

    shots.current = Array.from({ length: SHOT_POOL_SIZE }, () => {
      const a = new Audio(SHOT_SRC);
      a.preload = "auto";
      a.volume = SHOT_VOLUME;
      return a;
    });

    /* The pivot's screen position, derived from the anchor geometry. */
    const pivot = () => ({
      x: window.innerWidth - EDGE_RIGHT - gunW * (1 - PIVOT_X),
      y: window.innerHeight - EDGE_BOTTOM - gunH * (1 - PIVOT_Y),
    });

    /* Ease the rendered angle toward the target; the loop parks itself
       once settled and aim() restarts it, so idle frames cost nothing.
       Desktop only — mobile never moves target, so this never runs. */
    const tick = () => {
      raf.current = 0;
      const d = target.current - rot.current;
      rot.current = Math.abs(d) < 0.05 ? target.current : rot.current + d * 0.15;
      if (swayRef.current) {
        swayRef.current.style.transform = `rotate(${rot.current}deg)`;
      }
      if (rot.current !== target.current) raf.current = requestAnimationFrame(tick);
    };

    const aim = (e: MouseEvent) => {
      const p = pivot();
      /* atan2 gives the bearing to the cursor; the flipped muzzle faces
         180° at rest, so subtract that and clamp the swing. */
      let deg = (Math.atan2(e.clientY - p.y, e.clientX - p.x) * 180) / Math.PI - 180;
      if (deg < -180) deg += 360;
      target.current = Math.min(MAX_SWING, Math.max(-MAX_SWING, deg));
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };

    /* Neon burst where the bullet lands: expanding ring + 6 scattering
       sparks. Self-removing on animation end (plus a safety timeout). */
    const spawnSplash = (x: number, y: number) => {
      const layer = layerRef.current;
      if (!layer) return;
      const splash = document.createElement("div");
      splash.className = "gun-splash";
      splash.style.transform = `translate(${x}px, ${y}px)`;
      const ring = document.createElement("span");
      ring.className = "gun-splash-ring";
      splash.appendChild(ring);
      for (let i = 0; i < 6; i++) {
        const spark = document.createElement("span");
        spark.className = "gun-splash-spark";
        splash.appendChild(spark);
        const a = i * 60 + Math.random() * 24 - 12;
        spark.animate(
          [
            { transform: `rotate(${a}deg) translateX(2px)`, opacity: 1 },
            { transform: `rotate(${a}deg) translateX(${20 + Math.random() * 10}px)`, opacity: 0 },
          ],
          { duration: 260, easing: "cubic-bezier(0.1, 0.8, 0.4, 1)" },
        );
      }
      const ringAnim = ring.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.25)", opacity: 1 },
          { transform: "translate(-50%, -50%) scale(1.5)", opacity: 0 },
        ],
        { duration: 280, easing: "ease-out" },
      );
      ringAnim.onfinish = () => splash.remove();
      window.setTimeout(() => splash.remove(), 800);
      layer.appendChild(splash);
    };

    /* Instant laser: a full-length beam from muzzle to target, held ~55ms,
       then faded. The impact splash fires immediately — laser travel is
       visually instantaneous. */
    const spawnBeam = (tx: number, ty: number) => {
      const layer = layerRef.current;
      if (!layer) return;
      const p = pivot();
      const rad = ((180 + rot.current) * Math.PI) / 180;
      const mx = p.x + Math.cos(rad) * barrelLen;
      const my = p.y + Math.sin(rad) * barrelLen;
      const ang = (Math.atan2(ty - my, tx - mx) * 180) / Math.PI;
      const dist = Math.hypot(tx - mx, ty - my);

      const beam = document.createElement("div");
      beam.className = "gun-beam";
      beam.style.width = `${dist}px`;
      beam.style.transform = `translate(${mx}px, ${my}px) rotate(${ang}deg)`;
      layer.appendChild(beam);
      const anim = beam.animate(
        [{ opacity: 1 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }],
        { duration: 180, easing: "ease-out" },
      );
      anim.onfinish = () => beam.remove();
      window.setTimeout(() => beam.remove(), 800);

      spawnSplash(tx, ty);
    };

    /* Full shoot sequence shared by desktop click and mobile tap: beam,
       hit-detection broadcast, SFX, recoil, muzzle flash, impact vignette
       and a small camera jolt. */
    const fire = (x: number, y: number) => {
      spawnBeam(x, y);
      window.dispatchEvent(new CustomEvent("kos:shot", { detail: { x, y } }));

      /* Round-robin through the pool so rapid shots each restart the SFX
         without cutting off the still-ringing previous shot. play() can
         reject (autoplay policy, file missing) — fail silently. */
      const shot = shots.current[shotIdx.current++ % shots.current.length];
      if (shot) {
        shot.currentTime = 0;
        shot.play().catch(() => {});
      }

      /* In the gun's local frame the muzzle points -X, so recoil kicks the
         gun +X (back toward the corner) while the muzzle flips up. */
      recoilRef.current?.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)" },
          { transform: "translate(22px, 8px) rotate(5deg)", offset: 0.25 },
          { transform: "translate(0, 0) rotate(0deg)" },
        ],
        { duration: 220, easing: "cubic-bezier(0.25, 0.9, 0.3, 1)" },
      );
      flashRef.current?.animate(
        [
          { opacity: 1, transform: "translate(-50%, -50%) scale(0.3)" },
          { opacity: 0.9, transform: "translate(-50%, -50%) scale(1.15)", offset: 0.45 },
          { opacity: 0, transform: "translate(-50%, -50%) scale(1.4)" },
        ],
        { duration: 180, easing: "ease-out" },
      );
      /* Impact: rim-light vignette pulse + a small random jolt of the layer. */
      vignetteRef.current?.animate(
        [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }],
        { duration: 150, easing: "ease-out" },
      );
      const j = () => (Math.random() - 0.5) * 6;
      layerRef.current?.animate(
        [
          { transform: "translate(0, 0)" },
          { transform: `translate(${j()}px, ${j()}px)` },
          { transform: `translate(${j()}px, ${j()}px)` },
          { transform: "translate(0, 0)" },
        ],
        { duration: 110, easing: "linear" },
      );
    };

    if (mode === "desktop") {
      const shoot = (e: PointerEvent) => {
        if (e.button !== 0) return;
        fire(e.clientX, e.clientY);
      };

      window.addEventListener("mousemove", aim, { passive: true });
      window.addEventListener("pointerdown", shoot, { passive: true });
      return () => {
        window.removeEventListener("mousemove", aim);
        window.removeEventListener("pointerdown", shoot);
        cancelAnimationFrame(raf.current);
        for (const a of shots.current) a.pause();
        shots.current = [];
      };
    }

    /* mode === "mobile": no cursor to track, so hold a fixed resting
       angle — reset it here in case a desktop→mobile resize left the
       gun mid-swing from a previous aim. */
    rot.current = IDLE_TILT;
    target.current = IDLE_TILT;
    if (swayRef.current) swayRef.current.style.transform = `rotate(${IDLE_TILT}deg)`;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        touchStart.current = null;
        return;
      }
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
    };

    /* Tap = touchend with minimal drift since touchstart. Anything past
       the threshold is a scroll/swipe, not a shot — and since we never
       call preventDefault, scrolling and normal element taps (buttons,
       links, form fields) are completely unaffected either way. */
    const onTouchEnd = (e: TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start || e.changedTouches.length !== 1) return;
      const t = e.changedTouches[0];
      const dist = Math.hypot(t.clientX - start.x, t.clientY - start.y);
      if (dist > TAP_MOVE_THRESHOLD) return;
      fire(t.clientX, t.clientY);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      for (const a of shots.current) a.pause();
      shots.current = [];
    };
  }, [mode]);

  if (mode === "hidden") return null;

  const gunW = mode === "mobile" ? GUN_W_MOBILE : GUN_W;
  const gunH = mode === "mobile" ? GUN_H_MOBILE : GUN_H;
  const flashSize = mode === "mobile" ? 48 : 96;

  return (
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
    >
      <div
        ref={vignetteRef}
        className="absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(95, 242, 214, 0.14) 82%, rgba(255, 60, 140, 0.12) 100%)",
        }}
      />
      <div
        className="absolute"
        style={{ right: EDGE_RIGHT, bottom: EDGE_BOTTOM, width: gunW, height: gunH }}
      >
        <div
          ref={swayRef}
          className="h-full w-full"
          style={{
            transform: `rotate(${IDLE_TILT}deg)`,
            transformOrigin: `${PIVOT_X * 100}% ${PIVOT_Y * 100}%`,
          }}
        >
          <div ref={recoilRef} className="relative h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/gun.png"
              alt=""
              width={gunW}
              height={gunH}
              draggable={false}
              className="h-full w-full -scale-x-100 select-none"
              style={{ filter: "drop-shadow(0 0 22px rgba(95, 242, 214, 0.28))" }}
            />
            <div
              ref={flashRef}
              className="absolute opacity-0"
              style={{
                left: 0,
                top: "48%",
                width: flashSize,
                height: flashSize,
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(95,242,214,0.85) 25%, rgba(255,60,140,0.35) 55%, transparent 70%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
