"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import CyberRain from "@/components/3d/CyberRain";
import CameraRig from "@/components/3d/CameraRig";
import MechaCore from "@/components/3d/MechaCore";
import { pointer } from "@/components/3d/pointer";
import { commsActivation, coreLink, stampMicroPulse } from "@/components/3d/coreLink";

function makePositions(count: number, sx: number, sy: number, sz: number) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = (Math.random() - 0.5) * sx;
    arr[i * 3 + 1] = (Math.random() - 0.5) * sy;
    arr[i * 3 + 2] = (Math.random() - 0.5) * sz;
  }
  return arr;
}

/* Absorption of ambient particles by the core, active only while the comms
   section is in view — same coreLink channel and a²-gravity curve as the
   car's absorption in ParallaxCar. Everything runs on the raw position
   buffers; the only DOM read is one rect for the section gate. */
const PULL_RADIUS = 24; // world units around the core that feel the pull
const ABSORB_RADIUS = 3; // ≈ the compressed core's surface — consumed here
const PULL_SPEED = 26; // world units/s at maximum pull
const RESPAWN = true; // false: consumed particles stay gone for the session

const sphereLocal = new THREE.Vector3();

/**
 * Pull every particle inside PULL_RADIUS toward the core and consume it at
 * ABSORB_RADIUS. Consumed particles blip the core (coreLink.microPulseStart)
 * and respawn along the field's top edge, above the frustum, so the ambient
 * density holds while the core visibly feeds. Converging in 3D also means
 * sizeAttenuation + scene fog shrink and fade each particle on its way in —
 * the shrink/fade of the car's absorption, for free.
 */
function absorbParticles(
  points: THREE.Points | null,
  target: THREE.Vector3,
  act: number,
  dt: number,
  sx: number,
  sy: number,
  sz: number,
) {
  if (!points) return;
  const position = points.geometry.attributes.position;
  const arr = position.array as Float32Array;
  const r2 = PULL_RADIUS * PULL_RADIUS;
  for (let i = 0; i < arr.length; i += 3) {
    const dx = target.x - arr[i];
    const dy = target.y - arr[i + 1];
    const dz = target.z - arr[i + 2];
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 >= r2) continue;
    const d = Math.sqrt(d2);
    if (d < ABSORB_RADIUS) {
      stampMicroPulse();
      if (RESPAWN) {
        arr[i] = (Math.random() - 0.5) * sx;
        arr[i + 1] = sy / 2 + Math.random() * 2; // top edge, above the frustum
        arr[i + 2] = (Math.random() - 0.5) * sz;
      } else {
        arr[i + 1] = -1e4; // parked far below: clipped, never re-pulled
      }
      continue;
    }
    /* same gravity curve as the car: gentle at the rim, savage close in */
    const a = 1 - d / PULL_RADIUS;
    const step = PULL_SPEED * a * a * act * dt;
    arr[i] += dx * (step / d);
    arr[i + 1] += dy * (step / d);
    arr[i + 2] += dz * (step / d);
  }
  position.needsUpdate = true;
}

/** Cursed-energy particle field, tilting toward the cursor. */
function EnergyField() {
  const group = useRef<THREE.Group>(null);
  const cyanRef = useRef<THREE.Points>(null);
  const purpleRef = useRef<THREE.Points>(null);
  const cyan = useMemo(() => makePositions(2400, 24, 16, 34), []);
  const purple = useMemo(() => makePositions(1200, 30, 20, 34), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += (pointer.x * 0.25 - g.rotation.y) * 0.04;
    g.rotation.x += (pointer.y * 0.15 - g.rotation.x) * 0.04;
    g.rotation.z += delta * 0.015;

    /* particle absorption — gated to the comms section being on screen,
       ramping in as its top crosses up through the viewport */
    if (!coreLink.ready) return;
    const act = commsActivation(state.size.height);
    if (act <= 0) return;

    /* core center into this group's local space (rotation-only transform,
       so distances match world units) */
    sphereLocal.set(coreLink.wx, coreLink.wy, coreLink.wz);
    g.worldToLocal(sphereLocal);
    const dt = Math.min(delta, 0.1);
    absorbParticles(cyanRef.current, sphereLocal, act, dt, 24, 16, 34);
    absorbParticles(purpleRef.current, sphereLocal, act, dt, 30, 20, 34);
  });

  return (
    <group ref={group}>
      <Points ref={cyanRef} positions={cyan} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#B6FF00"
          size={0.045}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.8}
        />
      </Points>
      <Points ref={purpleRef} positions={purple} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#3C1A47"
          size={0.06}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.85}
        />
      </Points>
      {/* structural accents floating in the field */}
      <mesh position={[3.5, -1, -6]} rotation={[Math.PI / 3, 0, 0.4]}>
        <torusGeometry args={[2.2, 0.005, 8, 90]} />
        <meshBasicMaterial color="#B6FF00" transparent opacity={0.3} />
      </mesh>
      <mesh position={[-4, 2, -12]}>
        <icosahedronGeometry args={[1.4, 0]} />
        <meshBasicMaterial color="#3C1A47" wireframe transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export default function Scene() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 62 }} dpr={[1, 1.75]} gl={{ antialias: false }}>
      <color attach="background" args={["#050505"]} />
      <fog attach="fog" args={["#050505", 5, 19]} />
      <EnergyField />
      <MechaCore />
      <CyberRain />
      <CameraRig />
      {/* multisampling off: MSAA buffers cost more than they add on a
          fog-heavy additive scene that's already AA'd by bloom blur */}
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.15} intensity={1.8} mipmapBlur radius={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
