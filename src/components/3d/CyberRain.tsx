"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { commsActivation, coreLink, stampMicroPulse } from "./coreLink";

/**
 * Volumetric acid rain: one Points cloud with per-drop fall speeds.
 * Streak elongation comes from a generated vertical-gradient sprite
 * texture on the point material (point sprites are always square, so the
 * "motion blur" is baked into the sprite's alpha instead of a shader).
 */

const COUNT = 1100;
/* Field bounds — wide enough in X/Z to cover the camera's scroll
   fly-through (z 9 -> -11), tall enough that resets happen off-screen. */
const AREA_X = 60;
const AREA_Z = 50;
const Z_CENTER = -4;
const TOP_Y = 18;
const BOTTOM_Y = -18;
const SPEED_MIN = 14;
const SPEED_MAX = 26;

/* Comms-section absorption (same coreLink channel as the car and the
   ambient particle field). A bounded pull added on top of full fall speed
   just deflects drops past the core, so capture works differently here:
   inside PULL_RADIUS the drop's motion is owned by a position-lerp onto
   the core's exact center whose per-second rate is PULL_GAIN / d² — an
   inverse-square ramp that grows without bound as the drop closes in, so
   trajectories converge instead of curving by at a tangent — while the
   normal fall velocity is handed off (faded out) over the same approach.
   Consumption at ABSORB_RADIUS (≈ the compressed core's surface) is a
   separate unconditional check, so nothing slingshots through. */
const PULL_RADIUS = 24;
const ABSORB_RADIUS = 3;
const PULL_GAIN = 240; // units²/s: lerp rate 0.4/s at the rim → 15/s at d=4

function makeStreakTexture() {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.35, "rgba(255,255,255,0.9)");
  g.addColorStop(0.65, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(6, 0, 4, 64);
  return new THREE.CanvasTexture(c);
}

export default function CyberRain() {
  const geomRef = useRef<THREE.BufferGeometry>(null);

  const { positions, speeds, streak } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * AREA_X;
      positions[i * 3 + 1] = BOTTOM_Y + Math.random() * (TOP_Y - BOTTOM_Y);
      positions[i * 3 + 2] = Z_CENTER + (Math.random() - 0.5) * AREA_Z;
      speeds[i] = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
    }
    return { positions, speeds, streak: makeStreakTexture() };
  }, []);

  useFrame((state, delta) => {
    const geom = geomRef.current;
    if (!geom) return;
    const pos = geom.attributes.position.array as Float32Array;
    /* Clamp delta so a background-tab resume doesn't teleport every drop. */
    const dt = Math.min(delta, 0.1);
    /* Absorption gate evaluated once per frame; when the comms section is
       off screen the per-drop cost is a single branch. */
    const act = coreLink.ready ? commsActivation(state.size.height) : 0;
    const r2 = PULL_RADIUS * PULL_RADIUS;
    for (let i = 0; i < COUNT; i++) {
      const xi = i * 3;
      const yi = xi + 1;
      const zi = xi + 2;

      if (act > 0) {
        const dx = coreLink.wx - pos[xi];
        const dy = coreLink.wy - pos[yi];
        const dz = coreLink.wz - pos[zi];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < r2) {
          /* surface check first, independent of trajectory: anything this
             close is consumed — blip the core (throttled inside) and
             recycle through the normal top spawn */
          if (d2 < ABSORB_RADIUS * ABSORB_RADIUS) {
            stampMicroPulse();
            pos[yi] = TOP_Y + Math.random() * 3;
            pos[xi] = (Math.random() - 0.5) * AREA_X;
            pos[zi] = Z_CENTER + (Math.random() - 0.5) * AREA_Z;
            continue;
          }
          /* captured: fall hands off to the pull (fully suppressed near
             the core), and an inverse-square-ramped lerp converges the
             drop onto the exact center */
          const d = Math.sqrt(d2);
          const a = 1 - d / PULL_RADIUS;
          pos[yi] -= speeds[i] * dt * (1 - a * act);
          const k = Math.min(1, (PULL_GAIN * act * dt) / d2);
          pos[xi] += dx * k;
          pos[yi] += dy * k;
          pos[zi] += dz * k;
          continue; // captured drops can't reach the bottom reset this frame
        }
      }

      pos[yi] -= speeds[i] * dt;
      if (pos[yi] < BOTTOM_Y) {
        pos[yi] = TOP_Y + Math.random() * 3;
        pos[xi] = (Math.random() - 0.5) * AREA_X;
        pos[zi] = Z_CENTER + (Math.random() - 0.5) * AREA_Z;
      }
    }
    geom.attributes.position.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#B6FF00"
        map={streak}
        alphaMap={streak}
        size={0.5}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.4}
      />
    </points>
  );
}
