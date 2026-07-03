"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { coreLink, MICRO_PULSE_MS } from "./coreLink";

const GREEN = "#B6FF00";
/* Overdrive hue — the scene's existing violet (fill light below, cursed
   palette) so the shifted mass still belongs to the page's color system. */
const PURPLE = "#8a4dff";

/* Distance the core sits behind the camera. CameraRig flies from z=9 to
   z=-11 over the page, so an absolute position would be overtaken mid-way;
   a fixed offset keeps the core framed identically at every scroll depth.
   NOTE: this is past the scene fog's end (19), so both materials keep
   fog={false} (LineMaterial ignores fog anyway) or they'd vanish. */
const CAMERA_OFFSET = 22;

/* Colossal on desktop; reined in below tablet width so the mass doesn't
   swallow narrow viewports. */
const SCALE_DESKTOP = 5.5;
const SCALE_MOBILE = 2.8;

/* Fixed seed: the abnormal mass is identical on every load. */
const SEED = 0xb6ff00;
const BLOB_DETAIL = 6; // ~490 verts / 1470 edges — round silhouette, smooth deform
const LOBE = 0.42; // relative displacement amplitude (r spans ~0.56..1.44)
/* Lines sit a hair off the surface so they can't z-fight the solid fill. */
const LINE_LIFT = 1.008;
/* Bright heart inside the translucent shell — the burst-core of the glow. */
const CORE_SCALE = 0.62;

/* Scroll overdrive: one smoothed page-progress value (0 at top, 1 at bottom)
   drives compression, hue shift, shake and spin together so they peak in sync. */
const MORPH_SHRINK = 0.55; // uniform scale loss at full compression (→45% of base)
const SPHERE_RADIUS = 1; // morph target: sphere at the blob's mean radius
const SPIN_BOOST = 6; // tumble speed multiplier at full progress (1 → 7×)
const SHAKE_AMP = 0.4; // world-units of positional jitter at full progress

/* Consumption pulse: a brief flare when the car is fully absorbed (see
   coreLink) — rides on top of whatever the scroll overdrive is doing. */
const PULSE_MS = 350;
const PULSE_SCALE = 0.25; // extra uniform scale at pulse peak
const PULSE_EMISSIVE = 1.6; // extra emissive intensity at pulse peak
const PULSE_SPIN = 1.5; // extra spin multiplier at pulse peak

/* Micro blip per absorbed ambient particle/raindrop — a fraction of the
   car pulse. Duration comes from coreLink's shared MICRO_PULSE_MS. */
const MICRO_SCALE = 0.04;
const MICRO_EMISSIVE = 0.25;

/* scratch for the per-frame screen projection */
const proj = new THREE.Vector3();

/**
 * Deterministic 3D value noise: seeded lattice hash, smootherstep
 * trilinear blend. ~20 lines instead of a simplex-noise dependency, and
 * integer-hash based so it's bit-identical across loads and engines.
 */
function makeNoise(seed: number) {
  const hash = (x: number, y: number, z: number) => {
    let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296; // [0,1)
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x: number, y: number, z: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const tx = fade(x - xi), ty = fade(y - yi), tz = fade(z - zi);
    let n = 0;
    for (let dx = 0; dx <= 1; dx++)
      for (let dy = 0; dy <= 1; dy++)
        for (let dz = 0; dz <= 1; dz++)
          n += (dx ? tx : 1 - tx) * (dy ? ty : 1 - ty) * (dz ? tz : 1 - tz) * hash(xi + dx, yi + dy, zi + dz);
    return n * 2 - 1; // [-1,1]
  };
}

/**
 * The abnormal mass: a high-subdivision icosahedron with each vertex pushed
 * along its radius by 3 octaves of seeded noise — big asymmetric lobes plus
 * finer dents, nothing like a clean solid or a tidy sphere. Vertices are
 * merged first so the displaced surface gets smooth (organic) normals, and
 * the wireframe below is derived from this same displaced geometry so the
 * lines lie exactly on the curved surface.
 */
function buildBlobGeometry() {
  const noise = makeNoise(SEED);
  const fbm = (x: number, y: number, z: number) =>
    0.6 * noise(x * 1.4 + 13.7, y * 1.4 + 7.3, z * 1.4 + 5.1) +
    0.3 * noise(x * 2.9 + 3.1, y * 2.9 + 17.9, z * 2.9 + 11.4) +
    0.15 * noise(x * 5.6 + 23.3, y * 5.6 + 2.7, z * 5.6 + 19.8);

  const geometry = mergeVertices(new THREE.IcosahedronGeometry(1, BLOB_DETAIL));
  const position = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).normalize();
    const r = 1 + LOBE * fbm(v.x, v.y, v.z);
    position.setXYZ(i, v.x * r, v.y * r, v.z * r);
  }
  geometry.computeVertexNormals();
  /* groups ride along on the geometry — the per-frame morph re-welds with them */
  geometry.userData.weldGroups = findWeldGroups(geometry);
  weldNormals(geometry, geometry.userData.weldGroups as number[][]);
  return geometry;
}

/**
 * mergeVertices dedupes by a quantized hash, so seam duplicates whose
 * coordinates sit on a hash-bucket boundary stay split at any tolerance
 * (a few dozen here). Split vertices get normals from only their own
 * faces — a visible crease on smooth shading. Find the position-duplicate
 * groups once (the O(n^2) scan is a one-time microsecond cost at this
 * vertex count) so weldNormals can re-average cheaply after every
 * computeVertexNormals — the morph below recomputes normals per frame.
 * Duplicates share coordinates, so groups survive the morph unchanged.
 */
function findWeldGroups(geometry: THREE.BufferGeometry) {
  const position = geometry.attributes.position;
  const welded = new Array<boolean>(position.count).fill(false);
  const groups: number[][] = [];
  for (let i = 0; i < position.count; i++) {
    if (welded[i]) continue;
    const group = [i];
    for (let j = i + 1; j < position.count; j++) {
      if (
        !welded[j] &&
        Math.abs(position.getX(i) - position.getX(j)) < 1e-6 &&
        Math.abs(position.getY(i) - position.getY(j)) < 1e-6 &&
        Math.abs(position.getZ(i) - position.getZ(j)) < 1e-6
      ) {
        group.push(j);
        welded[j] = true;
      }
    }
    if (group.length > 1) groups.push(group);
  }
  return groups;
}

const weldSum = new THREE.Vector3();
function weldNormals(geometry: THREE.BufferGeometry, groups: number[][]) {
  const normal = geometry.attributes.normal;
  for (const group of groups) {
    weldSum.set(0, 0, 0);
    for (const k of group) weldSum.set(weldSum.x + normal.getX(k), weldSum.y + normal.getY(k), weldSum.z + normal.getZ(k));
    weldSum.normalize();
    for (const k of group) normal.setXYZ(k, weldSum.x, weldSum.y, weldSum.z);
  }
  normal.needsUpdate = true;
}

/**
 * Abnormal mecha mass in the background void: a seeded organic blob
 * rendered as a smooth, solid mass of light — a translucent lime emissive
 * shell over a bright basic-material heart (the burst core), with a faint
 * wireframe net kept as HUD texture. The net is drawn with fat lines
 * (LineSegments2/LineMaterial, screen-space pixel width): browsers cap
 * GL_LINES at 1px, which made raw `wireframe: true` edges alias in and
 * out at certain rotation angles; fat lines hold at any angle. Net
 * depthWrite stays off (overlapping edges can't z-fight each other), it
 * renders after the solid, and it's lifted 0.8% off the surface. The
 * shape is fixed per load (seeded, deterministic); the slow X/Y tumble
 * and the camera rig's pointer parallax remain. Bloom comes from the
 * scene-level EffectComposer in Scene.tsx.
 *
 * Scroll overdrive: page-scroll progress (0 top → 1 bottom, smoothed in a
 * ref inside useFrame) drives four synchronized effects that peak together
 * at the page bottom — a per-vertex morph of the irregular blob into a
 * compact sphere (uniform shrink, normals recomputed, net dragged along;
 * plus a rim light so the small ball stays visibly shaded), a green→purple
 * hue lerp on shell/heart/net/key-light, per-frame positional shake, and a
 * spin-up of the tumble. All layered on top of the fly-through and bloom.
 */
export default function MechaCore() {
  const root = useRef<THREE.Group>(null);
  const shrink = useRef<THREE.Group>(null);
  const shellMat = useRef<THREE.MeshStandardMaterial>(null);
  const heartMat = useRef<THREE.MeshBasicMaterial>(null);
  const keyLight = useRef<THREE.PointLight>(null);
  const rimLight = useRef<THREE.PointLight>(null);
  const progress = useRef(0); // smoothed page-scroll progress, 0..1
  const isNarrow = useThree((state) => state.size.width < 768);
  const size = useThree((state) => state.size);

  /* Lerp endpoints allocated once — per-frame color writes stay GC-free. */
  const palette = useMemo(
    () => ({
      glowFrom: new THREE.Color(GREEN),
      glowTo: new THREE.Color(PURPLE),
      shellFrom: new THREE.Color("#3a4d00"),
      shellTo: new THREE.Color("#2a1a4d"),
      heartFrom: new THREE.Color("#f4ffd6"),
      heartTo: new THREE.Color("#e9d9ff"),
    }),
    [],
  );

  /* scrollHeight forces layout when read; cache it and refresh only when the
     document actually resizes — same measurement scheme as CameraRig. */
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

  const blobGeometry = useMemo(buildBlobGeometry, []);
  const lines = useMemo(() => {
    const wireframe = new THREE.WireframeGeometry(blobGeometry);
    const geometry = new LineSegmentsGeometry().fromWireframeGeometry(wireframe);
    wireframe.dispose();
    const material = new LineMaterial({
      color: new THREE.Color(GREEN).getHex(),
      linewidth: 1.1, // px — constant on screen regardless of angle/depth
      transparent: true,
      opacity: 0.3, // subtle HUD texture over the glowing fill, not the star of the show
      depthWrite: false,
    });
    material.toneMapped = false; // keep the green hot for Bloom
    const segments = new LineSegments2(geometry, material);
    segments.scale.setScalar(LINE_LIFT);
    segments.renderOrder = 1; // composite the glow over the solid fill
    return segments;
  }, [blobGeometry]);

  /* Morph endpoints: the original noise-displaced surface vs. a perfect
     sphere at the blob's mean radius — every vertex slides along its own
     radius, so the mass reads as squeezed into a ball, never flattened.
     `applied` caches the last written progress so idle frames skip all
     vertex work. Captured before any frame runs, so `from` is pristine. */
  const morph = useMemo(() => {
    const from = Float32Array.from(blobGeometry.attributes.position.array as Float32Array);
    const to = new Float32Array(from.length);
    const v = new THREE.Vector3();
    for (let i = 0; i < from.length; i += 3) {
      v.set(from[i], from[i + 1], from[i + 2]).normalize().multiplyScalar(SPHERE_RADIUS);
      to[i] = v.x;
      to[i + 1] = v.y;
      to[i + 2] = v.z;
    }
    return { from, to, applied: -1 };
  }, [blobGeometry]);

  /* The net's fat-line buffer is baked from the blob's vertices, so it can't
     follow the morph by itself. Wireframe endpoints are bit-exact copies of
     source vertices — map each one back to its vertex index once, then the
     frame loop rewrites the interleaved buffer from the morphed positions. */
  const netMap = useMemo(() => {
    const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
    const position = blobGeometry.attributes.position;
    const source = new Map<string, number>();
    for (let i = 0; i < position.count; i++)
      source.set(key(position.getX(i), position.getY(i), position.getZ(i)), i);
    const start = lines.geometry.attributes.instanceStart as THREE.InterleavedBufferAttribute;
    const ends = start.data.array as Float32Array; // [sx,sy,sz,ex,ey,ez, ...]
    const map = new Uint16Array(ends.length / 3);
    for (let k = 0; k < map.length; k++)
      map[k] = source.get(key(ends[k * 3], ends[k * 3 + 1], ends[k * 3 + 2])) ?? 0;
    return map;
  }, [blobGeometry, lines]);

  /* LineMaterial resolves px width against the drawing size. */
  useEffect(() => {
    lines.material.resolution.set(size.width, size.height);
  }, [lines, size]);

  /* R3F doesn't own <primitive> resources — dispose on unmount/HMR. */
  useEffect(
    () => () => {
      blobGeometry.dispose();
      lines.geometry.dispose();
      lines.material.dispose();
      coreLink.ready = false; // stale screen coords must not drive the car
    },
    [blobGeometry, lines],
  );

  useFrame(({ camera }, delta) => {
    const g = root.current;
    if (!g) return;
    /* smooth the overdrive driver so every effect ramps instead of snapping;
       the shake itself stays randomized per frame for a genuine vibration */
    const raw = Math.min(1, window.scrollY / maxScroll.current);
    const p = (progress.current = THREE.MathUtils.lerp(progress.current, raw, 0.06));

    /* ride the camera fly-through, shaking harder as progress climbs
       (quadratic so the top of the page stays dead calm) */
    const amp = SHAKE_AMP * p * p;
    g.position.x = (Math.random() - 0.5) * 2 * amp;
    g.position.y = (Math.random() - 0.5) * 2 * amp;
    g.position.z = camera.position.z - CAMERA_OFFSET;

    /* publish the core's screen position (car proximity) and world
       position (in-canvas particle absorption) */
    proj.copy(g.position).project(camera);
    coreLink.x = (proj.x * 0.5 + 0.5) * size.width;
    coreLink.y = (0.5 - proj.y * 0.5) * size.height;
    coreLink.wx = g.position.x;
    coreLink.wy = g.position.y;
    coreLink.wz = g.position.z;
    coreLink.ready = true;

    /* consumption pulse envelope: 0 except for PULSE_MS after the car is
       fully absorbed — sine in/out, so it flares and settles on its own.
       microPulse is the same shape, tiny, per absorbed ambient particle. */
    const now = performance.now();
    const k = (now - coreLink.pulseStart) / PULSE_MS;
    const pulse = k >= 0 && k < 1 ? Math.sin(k * Math.PI) : 0;
    const mk = (now - coreLink.microPulseStart) / MICRO_PULSE_MS;
    const micro = mk >= 0 && mk < 1 ? Math.sin(mk * Math.PI) : 0;

    /* slow continuous tumble, ramping to a fast spin at page bottom; a third
       axis fades in with progress so the compressed ball still visibly
       tumbles in 3D (idle rotation stays exactly the original two-axis) */
    const spin = (1 + p * SPIN_BOOST) * (1 + PULSE_SPIN * pulse);
    g.rotation.x += delta * 0.18 * spin;
    g.rotation.y += delta * 0.3 * spin;
    g.rotation.z += delta * 0.45 * p * (1 + PULSE_SPIN * pulse);

    /* compression: uniform shrink (all axes) on top of the viewport base
       size — the squeeze itself comes from the vertex morph below */
    const base = (isNarrow ? SCALE_MOBILE : SCALE_DESKTOP) * (1 - MORPH_SHRINK * p);
    shrink.current?.scale.setScalar(base * (1 + PULSE_SCALE * pulse + MICRO_SCALE * micro));

    /* morph blob → sphere: lerp every vertex between its noise-displaced
       and spherical position, recompute normals so shading stays smoothly
       3D at every step, and drag the net's line buffer along. Skipped
       whenever progress hasn't moved, so idle frames cost nothing. */
    if (Math.abs(p - morph.applied) > 0.0008) {
      morph.applied = p;
      const arr = blobGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length; i++) arr[i] = morph.from[i] + (morph.to[i] - morph.from[i]) * p;
      blobGeometry.attributes.position.needsUpdate = true;
      blobGeometry.computeVertexNormals();
      weldNormals(blobGeometry, blobGeometry.userData.weldGroups as number[][]);
      const net = (lines.geometry.attributes.instanceStart as THREE.InterleavedBufferAttribute).data;
      const netArr = net.array as Float32Array;
      for (let k = 0; k < netMap.length; k++) {
        const s = netMap[k] * 3;
        netArr[k * 3] = arr[s];
        netArr[k * 3 + 1] = arr[s + 1];
        netArr[k * 3 + 2] = arr[s + 2];
      }
      net.needsUpdate = true;
    }

    /* rim light fades in with compression so the small sphere keeps a bright
       edge highlight against its dark side — shaded ball, not a flat disc */
    if (rimLight.current) rimLight.current.intensity = 1300 * p * p;

    /* hue shift green → purple across shell, heart, net and key light;
       emissive also intensifies so the bloom halo runs hotter at the bottom */
    if (shellMat.current) {
      shellMat.current.color.lerpColors(palette.shellFrom, palette.shellTo, p);
      shellMat.current.emissive.lerpColors(palette.glowFrom, palette.glowTo, p);
      shellMat.current.emissiveIntensity =
        1.15 + p * 0.65 + PULSE_EMISSIVE * pulse + MICRO_EMISSIVE * micro;
    }
    heartMat.current?.color.lerpColors(palette.heartFrom, palette.heartTo, p);
    lines.material.color.lerpColors(palette.glowFrom, palette.glowTo, p);
    keyLight.current?.color.lerpColors(palette.glowFrom, palette.glowTo, p);
  });

  return (
    <group ref={root} position={[0, 0, -13]}>
      {/* size lives on this wrapper only; the lights ride inside so their
          geometry scales with the mass (intensities ~scale^2 for falloff) */}
      <group ref={shrink} scale={isNarrow ? SCALE_MOBILE : SCALE_DESKTOP}>
        {/* local key/fill so the metallic mass has something to reflect —
            the rest of the scene is unlit basic/point materials */}
        <pointLight ref={keyLight} position={[2.5, 2, 3]} intensity={900} color={GREEN} />
        <pointLight position={[-3, -1.5, 2]} intensity={420} color="#8a4dff" />
        {/* rim light behind/above: off at the top of the page, ramped in by
            the frame loop as the mass compresses — edge highlight that keeps
            the small sphere reading as a lit 3D ball */}
        <pointLight ref={rimLight} position={[-0.5, 3, -4]} intensity={0} color="#ffffff" />

        {/* the glowing shell: smooth-shaded solid mass of light. Slightly
            translucent so the bright heart below shines through the middle
            (the burst-core gradient); depthWrite stays on so the subtle net's
            back half is properly occluded. Tone mapping stays on to keep the
            rim lime instead of clipping to white — Bloom (already in Scene's
            EffectComposer) supplies the halo */}
        <mesh geometry={blobGeometry}>
          <meshStandardMaterial
            ref={shellMat}
            color="#3a4d00"
            emissive={GREEN}
            emissiveIntensity={1.15}
            roughness={0.55}
            metalness={0}
            transparent
            opacity={0.72}
            fog={false}
          />
        </mesh>

        {/* bright heart: same blob shrunken inside the shell — hot center
            for the bloom burst, visible through the translucent shell */}
        <mesh geometry={blobGeometry} scale={CORE_SCALE}>
          <meshBasicMaterial ref={heartMat} color="#f4ffd6" toneMapped={false} fog={false} />
        </mesh>

        <primitive object={lines} />
      </group>
    </group>
  );
}
