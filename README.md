# KARTHIK://OS — Mecha Portfolio

Ultra-premium single-page portfolio with a Modern Anime / Mecha UI aesthetic.
Next.js App Router · TypeScript · Tailwind · GSAP ScrollTrigger · Lenis · Framer Motion · React Three Fiber.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Edit your content

Everything personal lives in **`src/data/config.ts`** — name, role, email,
nav labels, social links (currently `#`), the four project cards, and the
three horizontal-scroll LORE panels.

## Architecture

| Path | What it does |
|---|---|
| `src/components/SmoothScroll.tsx` | Lenis instance wired into GSAP's ticker (ScrollTrigger sync) |
| `src/components/three/Scene.tsx` | R3F particle field + camera fly-through mapped to scroll |
| `src/components/Preloader.tsx` | Boot counter → sword-slash → horizontal slice open |
| `src/components/CustomCursor.tsx` | Targeting reticle (rotates 45°/inverts on interactive targets) |
| `src/components/Magnetic.tsx` | Spring-physics magnetic pull for CTAs/nav |
| `src/components/MaskReveal.tsx` | overflow-hidden text mask reveal on scroll |
| `src/components/sections/*` | Hero / About (pinned horizontal) / Projects / Contact |

The 3D canvas is fixed at `-z-10` with `pointer-events: none` — it never
blocks DOM interaction. The custom cursor only mounts on `(pointer: fine)`
devices, and `prefers-reduced-motion` disables looping animations.
