"use client";

import { useEffect } from "react";

const SHOT_SRC = "/sounds/gunsound.mp3";
const SHOT_VOLUME = 0.35;

/**
 * Tactical click/tap accent: fires a gunshot on every mousedown/touchstart
 * anywhere on the site. A fresh Audio instance is created per trigger
 * (instead of resetting one shared element) so rapid clicks overlap
 * instead of cutting each other off.
 */
export default function GlobalAudio() {
  useEffect(() => {
    const fire = () => {
      const fireSound = new Audio(SHOT_SRC);
      fireSound.volume = SHOT_VOLUME;
      fireSound.play().catch((e) => console.log("Audio blocked by browser", e));
    };

    window.addEventListener("mousedown", fire);
    window.addEventListener("touchstart", fire, { passive: true });
    return () => {
      window.removeEventListener("mousedown", fire);
      window.removeEventListener("touchstart", fire);
    };
  }, []);

  return null;
}
