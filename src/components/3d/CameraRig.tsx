"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import { pointer } from "./pointer";

/**
 * Camera rig: scroll drives a fly-through along Z (preserved from the
 * original rig — the section ScrollTriggers depend on the page scroll it
 * mirrors), while the pointer adds a lerped look-around parallax on
 * position and rotation. Pointer comes from the shared window-listener
 * store, not state.pointer — see pointer.ts.
 */
export default function CameraRig() {
  // scrollHeight forces layout when read; cache it and refresh only when the
  // document actually resizes (covers ScrollTrigger pin-spacers, fonts, etc.)
  const maxScroll = useRef(1);
  useEffect(() => {
    const measure = () => {
      maxScroll.current = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  useFrame(({ camera }) => {
    const p = window.scrollY / maxScroll.current;
    camera.position.z = MathUtils.lerp(camera.position.z, 9 - p * 20, 0.05);
    camera.position.x = MathUtils.lerp(camera.position.x, pointer.x * 0.6, 0.03);
    camera.position.y = MathUtils.lerp(camera.position.y, -pointer.y * 0.4, 0.03);
    /* subtle look-around: a few degrees of rotation toward the cursor */
    camera.rotation.y = MathUtils.lerp(camera.rotation.y, -pointer.x * 0.045, 0.04);
    camera.rotation.x = MathUtils.lerp(camera.rotation.x, -pointer.y * 0.03, 0.04);
  });

  return null;
}
