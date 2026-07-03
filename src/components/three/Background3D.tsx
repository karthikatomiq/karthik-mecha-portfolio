"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

/** Fixed WebGL layer behind the DOM. Never intercepts clicks. */
export default function Background3D() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <Scene />
    </div>
  );
}
