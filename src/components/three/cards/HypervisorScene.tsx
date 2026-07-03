"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* Readable tint of the site's cursed purple (#3C1A47) for thin lines. */
const PURPLE = new THREE.Color("#a06bc0");
const GREEN = new THREE.Color("#B6FF00");
const NODE = 0.4;
const GAP = 0.62;

/** HYPERVISOR — server rack lattice with hot nodes lighting up in turn. */
export default function HypervisorScene() {
  const root = useRef<THREE.Group>(null);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  /* 3 x 3 x 2 cluster, centered on the origin */
  const nodes = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = 0; z <= 1; z++) out.push([x * GAP, y * GAP, z * GAP - GAP / 2]);
    return out;
  }, []);

  useFrame(({ clock }, delta) => {
    if (root.current) root.current.rotation.y += delta * 0.18;
    const t = clock.elapsedTime;
    /* two "hot" nodes wander the rack on different clocks */
    const hotA = Math.floor(t * 0.8) % nodes.length;
    const hotB = Math.floor(t * 1.3 + 7) % nodes.length;
    const pulse = (Math.sin(t * 6) + 1) / 2;
    mats.current.forEach((m, i) => {
      if (!m) return;
      const hot = i === hotA || i === hotB;
      m.color.copy(hot ? GREEN : PURPLE);
      m.opacity = hot ? 0.55 + pulse * 0.45 : 0.4;
    });
  });

  return (
    <group ref={root} scale={0.95} rotation={[0.5, 0.6, 0]}>
      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[NODE, NODE, NODE]} />
          <meshBasicMaterial
            ref={(el) => {
              mats.current[i] = el;
            }}
            color={PURPLE}
            wireframe
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}
