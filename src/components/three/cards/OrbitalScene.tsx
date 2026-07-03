"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GREEN = "#B6FF00";

/** ORBITAL — deployment orbit: wireframe core, ring path, two satellites. */
export default function OrbitalScene() {
  const root = useRef<THREE.Group>(null);
  const satA = useRef<THREE.Mesh>(null);
  const satB = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    if (root.current) root.current.rotation.y += delta * 0.25;
    satA.current?.position.set(Math.cos(t * 0.9) * 1.5, 0, Math.sin(t * 0.9) * 1.5);
    /* second satellite on a flatter ellipse, counter-rotating */
    satB.current?.position.set(Math.cos(-t * 0.6 + 2) * 1.9, 0, Math.sin(-t * 0.6 + 2) * 1.1);
  });

  return (
    <group ref={root} scale={0.85}>
      <mesh>
        <icosahedronGeometry args={[0.85, 1]} />
        <meshBasicMaterial color={GREEN} wireframe transparent opacity={0.5} />
      </mesh>

      {/* tilted orbital plane: visible ring path + satellite riding it */}
      <group rotation={[1.05, 0, 0.35]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.008, 4, 64]} />
          <meshBasicMaterial color={GREEN} transparent opacity={0.3} />
        </mesh>
        <mesh ref={satA}>
          <icosahedronGeometry args={[0.12, 0]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      </group>

      <group rotation={[1.4, 0.5, -0.4]}>
        <mesh ref={satB}>
          <icosahedronGeometry args={[0.09, 0]} />
          <meshBasicMaterial color={GREEN} wireframe />
        </mesh>
      </group>
    </group>
  );
}
