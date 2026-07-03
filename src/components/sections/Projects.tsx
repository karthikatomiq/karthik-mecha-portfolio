"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import MaskReveal from "@/components/MaskReveal";
import NeonCard from "@/components/NeonCard";
import ParallaxKanji from "@/components/ParallaxKanji";
import { siteConfig } from "@/data/config";

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);

  // Stylized wipe: a void-colored cover slides off each visual as it scrolls in.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".wipe-cover").forEach((cover) => {
        gsap.to(cover, {
          x: () => cover.offsetWidth + 2,
          duration: 1,
          ease: "power3.inOut",
          force3D: true,
          roundProps: "x",
          scrollTrigger: { trigger: cover.parentElement, start: "top 80%" },
        });
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="projects" className="relative overflow-hidden px-6 py-32 md:px-12 md:py-44">
      {/* 武器庫 = Arsenal */}
      <ParallaxKanji className="-top-10 left-[2vw] text-[30vh] leading-none text-stroke-accent" speed={-20}>
        武器庫
      </ParallaxKanji>

      <div className="relative z-10 mb-16 flex items-end justify-between md:mb-24">
        <div>
          <p className="mb-4 font-mono text-xs tracking-[0.4em] text-accent">03 // ARSENAL</p>
          <MaskReveal>
            <h2 className="font-display text-5xl font-bold md:text-7xl neon-outline-purple">DEPLOYED UNITS</h2>
          </MaskReveal>
        </div>
        <span className="hidden font-mono text-[10px] tracking-[0.3em] text-white/40 md:block">
          {String(siteConfig.projects.length).padStart(2, "0")}_UNITS LOADED ▮▮▮▮
        </span>
      </div>

      <div className="relative z-10 grid gap-6 md:grid-cols-2 md:gap-8" style={{ perspective: "1200px" }}>
        {siteConfig.projects.map((p) => (
          <NeonCard key={p.id} project={p} />
        ))}
      </div>
    </section>
  );
}
