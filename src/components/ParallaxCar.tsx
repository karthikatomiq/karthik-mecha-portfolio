"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { coreLink } from "@/components/3d/coreLink";

/**
 * 2D parallax car that drives "into the screen" as the page scrolls:
 * rear view, large at bottom center, scaling/rising/fading toward a
 * vanishing point across the ENTIRE document — it disappears into the
 * horizon exactly as the footer arrives (scrub reverses it).
 * Fixed layer at z-[-5]: above the WebGL canvas (-10), below all
 * normal-flow DOM content, so it reads as mid-ground scenery. The "neon
 * tires" are absolutely-positioned glow dots inside the scaling wrapper,
 * sized/offset in %, so they shrink with the car and stay on the wheels.
 * Scroll velocity feeds a --boost CSS var that brightens/scales them.
 *
 * Absorption: when the car's scroll-driven position nears the WebGL core
 * (screen coords shared via coreLink), a dedicated wrapper layer pulls it
 * toward the core's center, spinning/shrinking/blurring/fading it out —
 * all derived from scroll geometry, so it scrubs both directions. Past the
 * core it stays consumed; at full absorption the core is told to pulse.
 */

/* |scroll velocity| (px/s) that counts as full acceleration */
const MAX_VELOCITY = 2500;

/* Absorption by the WebGL core (screen position via coreLink): the pull
   begins inside ABSORB_RADIUS px of the core's center and completes at
   ABSORB_CORE px — everything about it is derived from the scroll-driven
   car position, so the whole sequence scrubs and reverses with scroll. */
const ABSORB_RADIUS = 300;
const ABSORB_CORE = 60;
const ABSORB_SPIN_DEG = 640; // vortex turns accumulated by full absorption
const ABSORB_BLUR_PX = 7; // motion-streak blur at full absorption
/* Shots to destroy the car; respawn delay after the explosion. */
const MAX_HITS = 6;
const RESPAWN_MS = 2000;
const SHARD_COLORS = ["#B6FF00", "#5ff2d6", "#ff3c8c", "#7cc7ff", "#ffffff"];

/* Click-to-destroy: a second, independent destruction mechanic (separate
   from the CursorGun shot system above) driven by a direct click on the
   car — instant plasma-burst-and-warp-back-in, on its own dedicated child
   element so its GSAP tweens never fight the shot system's WAAPI calls or
   the scroll tween owning carRef.
   Real pointer-events/onClick can't reach this layer: it sits at z-[-5]
   (intentionally, so the car renders behind page content), and foreground
   sections with default pointer-events:auto win the hit-test at that
   screen position regardless of stacking order. So — same fix the shot
   system above already uses — this is a window-level listener doing its
   own coordinate hit-test against the car's rect. */
const CLICK_RESPAWN_MS = 1500;
const CLICK_AUDIO_VOLUME = 0.4;

/* TODO: no explosion audio asset yet — drop a file at
   public/audio/explosion.mp3 and wire it here, e.g.:
   const a = new Audio("/audio/explosion.mp3"); a.volume = 0.6;
   a.play().catch(() => {}); */
function playExplosionSound() {}

export default function ParallaxCar() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const absorbRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const absorptionRef = useRef(0); // last absorption progress, 0..1
  const hitsRef = useRef(0);
  const aliveRef = useRef(true);
  const respawnTimer = useRef(0);
  const [hits, setHits] = useState(0);

  /* Click-to-destroy */
  const clickTargetRef = useRef<HTMLDivElement>(null);
  const clickRespawnTimer = useRef(0);
  const isDestroyedRef = useRef(false); // synchronous mirror for the listener below
  const [, setIsDestroyed] = useState(false);

  useEffect(() => {
    const triggerDestroy = () => {
      isDestroyedRef.current = true;
      setIsDestroyed(true);

      const blastAudio = new Audio("/sounds/blast.mp3");
      const spawnAudio = new Audio("/sounds/spawn.mp3");
      blastAudio.volume = CLICK_AUDIO_VOLUME;
      spawnAudio.volume = CLICK_AUDIO_VOLUME;

      blastAudio.play().catch(() => {});
      gsap.to(clickTargetRef.current, {
        scale: 1.5,
        opacity: 0,
        filter: "brightness(200%) hue-rotate(90deg)",
        duration: 0.2,
        ease: "power4.out",
      });

      clickRespawnTimer.current = window.setTimeout(() => {
        spawnAudio.play().catch(() => {});
        gsap.fromTo(
          clickTargetRef.current,
          { scale: 0, opacity: 0, filter: "brightness(100%)" },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(1.7)",
            onComplete: () => {
              isDestroyedRef.current = false;
              setIsDestroyed(false);
            },
          },
        );
      }, CLICK_RESPAWN_MS);
    };

    /* Coordinate hit-test against the car's own rect, mirroring the
       kos:shot handler below — the only reliable way to detect a "click
       on the car" given it renders behind foreground page content. */
    const hitTest = (x: number, y: number) => {
      if (isDestroyedRef.current || absorptionRef.current >= 0.999) return;
      const img = imgRef.current;
      if (!img) return;
      const r = img.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
      triggerDestroy();
    };

    const onMouseDown = (e: globalThis.MouseEvent) => hitTest(e.clientX, e.clientY);
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) hitTest(t.clientX, t.clientY);
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.clearTimeout(clickRespawnTimer.current);
    };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const car = carRef.current;
    if (!wrap || !car) return;

    /* Z-axis illusion: the rear-view car starts large at bottom center
       and drives away toward a vanishing point — shrinking, rising and
       fading. x stays 0 / xPercent -50 so GSAP owns the centering and
       the whole transform stack. */
    const tween = gsap.fromTo(
      car,
      {
        x: 0,
        xPercent: -50,
        y: "10vh",
        scale: 1,
        opacity: 1,
        transformOrigin: "center center",
      },
      {
        y: "-80vh",
        scale: 0.02,
        opacity: 0,
        /* linear against scroll: constant driving speed down the whole
           page, no snap at either end */
        ease: "none",
        duration: 1,
        paused: true,
      },
    );

    /* Manual scrub instead of a ScrollTrigger: a trigger spanning the
       whole document straddles the About pin, and every end recipe
       ("bottom bottom", maxScroll(), "max") gets measured during
       refresh() with the pin reverted — losing its ~2300px and making
       the car finish early or oscillate. Here the target progress is
       simply scrollY / maxScroll read live each tick (pins applied, so
       always exact: 1.0 at the absolute page bottom), smoothed
       exponentially for the heavy scrub-like lag. */
    const SCRUB_TAU = 1.1; // seconds to shed ~63% of the remaining gap
    let progress = 0;
    let boost = 0;
    let lastY = window.scrollY;

    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 100) / 1000;
      if (dt <= 0) return;
      const y = window.scrollY;

      /* accelerating: fast scroll flares the tire glow, then it decays */
      const v = Math.min(Math.abs(y - lastY) / dt / MAX_VELOCITY, 1);
      lastY = y;
      boost = Math.max(boost - dt * 1.4, v);
      wrap.style.setProperty("--boost", boost.toFixed(3));

      const target = gsap.utils.clamp(0, 1, y / (ScrollTrigger.maxScroll(window) || 1));
      progress += (target - progress) * (1 - Math.exp(-dt / SCRUB_TAU));
      if (Math.abs(target - progress) < 0.0005) progress = target;
      tween.progress(progress);

      /* Absorption by the core. Proximity comes from the OUTER (tween-owned)
         rect, which excludes this pull layer's own transform — the progress
         is pure scroll geometry, so there's no feedback loop and scrolling
         back up walks the exact same values in reverse. */
      const fx = absorbRef.current;
      if (fx && coreLink.ready) {
        const r = car.getBoundingClientRect();
        const dx = coreLink.x - (r.x + r.width / 2);
        const dy = coreLink.y - (r.y + r.height / 2);
        /* Once the natural path has carried the car past (above) the core,
           it stays consumed instead of popping back out mid-page. */
        const a =
          dy >= 0
            ? 1
            : gsap.utils.clamp(0, 1, (ABSORB_RADIUS - Math.hypot(dx, dy)) / (ABSORB_RADIUS - ABSORB_CORE));
        if (a > 0 || absorptionRef.current > 0) {
          /* flare the core the instant the car is fully consumed */
          if (a >= 1 && absorptionRef.current < 1) coreLink.pulseStart = performance.now();
          /* gravity: gentle at the rim, savage at the core */
          const pull = a * a;
          /* px → this layer's local units (the parent tween scales it) */
          const carScale = Number(gsap.getProperty(car, "scale")) || 1;
          fx.style.transform = `translate(${(dx * pull) / carScale}px, ${(dy * pull) / carScale}px) rotate(${pull * ABSORB_SPIN_DEG}deg) scale(${1 - a})`;
          fx.style.opacity = String(1 - a * a);
          fx.style.filter = a > 0 ? `blur(${(a * ABSORB_BLUR_PX).toFixed(2)}px)` : "";
          fx.style.visibility = a >= 0.999 ? "hidden" : "";
        }
        absorptionRef.current = a;
        coreLink.absorption = a;
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      tween.kill();
    };
  }, []);

  /* Destructible: shots from CursorGun arrive as kos:shot events. Damage
     visuals live on the inner body wrapper only — the outer carRef stays
     owned by the GSAP scroll tween, so the two never fight. */
  useEffect(() => {
    const explodeFx = (cx: number, cy: number) => {
      const layer = wrapRef.current;
      if (!layer) return;

      /* core flash */
      const flash = document.createElement("div");
      flash.className = "car-explode-flash";
      layer.appendChild(flash);
      const fa = flash.animate(
        [
          { transform: `translate(${cx}px, ${cy}px) scale(0.2)`, opacity: 1 },
          { transform: `translate(${cx}px, ${cy}px) scale(2.6)`, opacity: 0 },
        ],
        { duration: 380, easing: "ease-out" },
      );
      fa.onfinish = () => flash.remove();
      window.setTimeout(() => flash.remove(), 900);

      /* shard burst with random trajectories */
      for (let i = 0; i < 16; i++) {
        const s = document.createElement("span");
        s.className = "car-shard";
        const size = 3 + Math.random() * 6;
        const color = SHARD_COLORS[i % SHARD_COLORS.length];
        s.style.width = s.style.height = `${size}px`;
        s.style.background = color;
        s.style.boxShadow = `0 0 8px ${color}`;
        layer.appendChild(s);
        const a = Math.random() * Math.PI * 2;
        const d = 90 + Math.random() * 190;
        const dur = 500 + Math.random() * 300;
        const an = s.animate(
          [
            { transform: `translate(${cx}px, ${cy}px)`, opacity: 1 },
            {
              transform: `translate(${cx + Math.cos(a) * d}px, ${cy + Math.sin(a) * d - 20}px) rotate(${Math.random() * 320}deg)`,
              opacity: 0,
            },
          ],
          { duration: dur, easing: "cubic-bezier(0.2, 0.7, 0.4, 1)" },
        );
        an.onfinish = () => s.remove();
        window.setTimeout(() => s.remove(), dur + 500);
      }

      /* layer shake — body/main can't be transformed (it would re-parent
         the About section's ScrollTrigger pin), so the jolt hits this
         full-viewport layer instead */
      const j = () => (Math.random() - 0.5) * 16;
      layer.animate(
        [
          { transform: "translate(0, 0)" },
          { transform: `translate(${j()}px, ${j()}px)` },
          { transform: `translate(${j()}px, ${j()}px)` },
          { transform: `translate(${j()}px, ${j()}px)` },
          { transform: "translate(0, 0)" },
        ],
        { duration: 190, easing: "linear" },
      );

      /* brief white-out */
      const white = document.createElement("div");
      white.style.cssText =
        "position:absolute;inset:0;background:rgba(255,255,255,0.6);pointer-events:none;opacity:0";
      layer.appendChild(white);
      const wa = white.animate([{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }], {
        duration: 170,
        easing: "ease-out",
      });
      wa.onfinish = () => white.remove();
      window.setTimeout(() => white.remove(), 600);
    };

    const respawn = () => {
      const body = bodyRef.current;
      hitsRef.current = 0;
      setHits(0);
      aliveRef.current = true;
      if (!body) return;
      body.style.visibility = "";
      /* fall in from above with a weighty overshoot-and-settle */
      body.animate(
        [
          { transform: "translateY(-110vh)", easing: "cubic-bezier(0.45, 0, 0.85, 0.65)" },
          { transform: "translateY(2.5vh)", offset: 0.82, easing: "ease-out" },
          { transform: "translateY(0)" },
        ],
        { duration: 800 },
      );
    };

    const onShot = (ev: Event) => {
      const { x, y } = (ev as CustomEvent<{ x: number; y: number }>).detail;
      const img = imgRef.current;
      const body = bodyRef.current;
      /* a consumed car can't be shot — its rect still exists (visibility:
         hidden doesn't move it), so gate on absorption explicitly */
      if (!aliveRef.current || absorptionRef.current >= 0.999 || !img || !body) return;
      const r = img.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;

      hitsRef.current += 1;
      setHits(hitsRef.current);

      if (hitsRef.current < MAX_HITS) {
        /* hit response: hot flash on the whole body */
        body.animate(
          [
            { filter: "brightness(1)" },
            { filter: "brightness(2.4) saturate(0.6)", offset: 0.3 },
            { filter: "brightness(1)" },
          ],
          { duration: 160, easing: "ease-out" },
        );
        return;
      }

      /* 6th hit: destroyed */
      aliveRef.current = false;
      const cr = carRef.current?.getBoundingClientRect();
      const cx = cr ? cr.x + cr.width / 2 : x;
      const cy = cr ? cr.y + cr.height / 2 : y;
      body.style.visibility = "hidden";
      explodeFx(cx, cy);
      playExplosionSound();
      respawnTimer.current = window.setTimeout(respawn, RESPAWN_MS);
    };

    window.addEventListener("kos:shot", onShot);
    return () => {
      window.removeEventListener("kos:shot", onShot);
      window.clearTimeout(respawnTimer.current);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[-5] overflow-hidden"
      style={{ "--boost": 0 } as React.CSSProperties}
    >
      <div
        ref={carRef}
        className="absolute left-1/2 top-[55vh] w-[42vw] min-w-[260px] max-w-[560px] -translate-x-1/2"
      >
        {/* core-absorption pull/spin/shrink lives on this layer, written
            only by the scroll ticker — a third transform owner so it never
            fights the scroll tween (outer) or the damage WAAPI (inner) */}
        <div ref={absorbRef}>
          {/* damage/explosion/respawn all animate this inner body, leaving
              the outer element to the GSAP scroll tween */}
          <div ref={bodyRef} className="relative">
            {/* click-to-destroy target: purely a GSAP animation target
                (see the coordinate hit-test above) — this layer stays
                pointer-events-none like the rest of the fixed car layer,
                since the real click never reaches it directly anyway. */}
            <div ref={clickTargetRef} className="relative">
              {/* public/images/car.png is 800x654 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src="/images/car.png"
                alt=""
                width={800}
                height={654}
                draggable={false}
                className="h-auto w-full select-none"
                style={{
                  /* progressive battle damage: duller, darker, bruised hue */
                  filter: `drop-shadow(0 0 26px rgba(60, 26, 71, 0.85)) saturate(${1 - hits * 0.1}) contrast(${1 + hits * 0.05}) brightness(${1 - hits * 0.06}) hue-rotate(-${hits * 4}deg)`,
                }}
              />
              {/* neon tire flashes — % offsets track the rear wheels responsively */}
              <span className="car-tire absolute bottom-[3%] left-[10%] aspect-square w-[7%]" />
              <span className="car-tire absolute bottom-[3%] right-[10%] aspect-square w-[7%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
