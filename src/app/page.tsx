"use client";

import { useCallback, useEffect, useState } from "react";
import { useNeonScroll } from "@/hooks/useNeonScroll";
import { onBooted } from "@/lib/boot";
import CustomCursor from "@/components/CustomCursor";
import ParallaxCar from "@/components/ParallaxCar";
import Background3D from "@/components/three/Background3D";
import Navbar from "@/components/Navbar";
import HudFrame from "@/components/HudFrame";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Projects from "@/components/sections/Projects";
import Contact from "@/components/sections/Contact";

export default function Home() {
  const [booted, setBooted] = useState(false);
  const handleBoot = useCallback(() => setBooted(true), []);

  useNeonScroll();

  // The boot signal comes from LoadingScreen, mounted up in the root layout.
  useEffect(() => onBooted(handleBoot), [handleBoot]);

  return (
    <>
      <CustomCursor />
      <Background3D />
      <ParallaxCar />
      <HudFrame />
      <Navbar />

      {/* CRT scanline overlay */}
      <div aria-hidden className="scanlines pointer-events-none fixed inset-0 z-40" />

      <main>
        <Hero booted={booted} />
        <About />
        <Projects />
        <Contact />
      </main>
    </>
  );
}
