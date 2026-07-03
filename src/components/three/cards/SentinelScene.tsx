"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const MAGENTA = "#ff003c";

/** SENTINEL — scanning beacon: wireframe core + expanding radar ring. */
export default function SentinelScene() {
  const root = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }, delta) => {
    if (root.current) root.current.rotation.y += delta * 0.2;
    /* radar sweep: the equator ring grows and fades on a 2s loop */
    const p = (clock.elapsedTime % 2) / 2;
    ring.current?.scale.setScalar(1 + p * 0.75);
    if (ringMat.current) ringMat.current.opacity = (1 - p) * 0.8;
  });

  return (
    <group ref={root} scale={0.85} rotation={[0.3, 0, 0]}>
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={MAGENTA} wireframe transparent opacity={0.5} />
      </mesh>

      {/* apex beacon */}
      <mesh position={[0, 1.25, 0]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshBasicMaterial color="#ffffff" wireframe />
      </mesh>

      {/* pulsing equator sweep */}
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.012, 4, 48]} />
        <meshBasicMaterial ref={ringMat} color={MAGENTA} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
