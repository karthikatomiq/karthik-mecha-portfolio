"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GREEN = "#B6FF00";
const YELLOW = "#fce205";

/** NEON-COMMERCE — crate + package: inner cube bobbing inside the shell. */
export default function NeonCommerceScene() {
  const root = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    if (root.current) root.current.rotation.y += delta * 0.22;
    if (inner.current) {
      inner.current.position.y = Math.sin(t * 1.4) * 0.28;
      inner.current.rotation.y -= delta * 0.5;
    }
  });

  return (
    <group ref={root} scale={0.9} rotation={[0.35, 0, 0]}>
      {/* storefront crate */}
      <mesh>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshBasicMaterial color={GREEN} wireframe transparent opacity={0.45} />
      </mesh>
      {/* the package being processed */}
      <mesh ref={inner}>
        <boxGeometry args={[0.55, 0.55, 0.55]} />
        <meshBasicMaterial color={YELLOW} wireframe />
      </mesh>
    </group>
  );
}
