"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCursorTilt } from "@/hooks/useCursorTilt";

/* Tilt at the card's edge, radians. Kept subtle so the emblems' own idle
   animation stays the dominant motion. */
const MAX_TILT = 0.25;

/**
 * Eases the emblem toward the cursor's tilt target each frame, composing
 * with whatever idle animation the child scene runs on its own groups.
 * Signs turn the front face toward the cursor: +rotation.y faces right
 * (+target.x), +rotation.x pitches down (+target.y, screen-down). Damp is
 * a frame-rate independent lerp, so motion stays fluid at any refresh rate.
 */
function TiltRig({ target, children }: { target: { x: number; y: number }; children: ReactNode }) {
  const rig = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!rig.current) return;
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, target.y * MAX_TILT, 5, delta);
    rig.current.rotation.y = THREE.MathUtils.damp(rig.current.rotation.y, target.x * MAX_TILT, 5, delta);
  });
  return <group ref={rig}>{children}</group>;
}

/**
 * Shared canvas shell for the project-card 3D emblems. Fills the card's
 * visual area behind the codename/wipe layers, never intercepts the
 * pointer, and only runs its render loop while the card is actually on
 * screen (IntersectionObserver -> frameloop). The same visibility gates the
 * cursor-tilt tracking, which leans each emblem toward the mouse on top of
 * its idle animation. With reduced motion the scene renders a single static
 * frame instead of animating.
 */
export default function CardScene({ accent, children }: { accent: string; children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const tilt = useCursorTilt(wrapRef, visible && !reduced);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);

    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "100px" },
    );
    if (wrapRef.current) io.observe(wrapRef.current);
    return () => {
      mq.removeEventListener("change", onChange);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} aria-hidden className="pointer-events-none absolute inset-0">
      <Canvas
        frameloop={!visible ? "never" : reduced ? "demand" : "always"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        gl={{ alpha: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[2, 2, 3]} color={accent} intensity={0.8} />
        <TiltRig target={tilt}>{children}</TiltRig>
      </Canvas>
    </div>
  );
}
