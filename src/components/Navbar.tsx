"use client";

import type { MouseEvent } from "react";
import Magnetic from "@/components/Magnetic";
import { getLenis } from "@/lib/scroll";
import { siteConfig } from "@/data/config";

export default function Navbar() {
  const scrollTo = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    getLenis()?.scrollTo(href, { duration: 1.6 });
  };

  return (
    <header className="fixed left-0 top-0 z-50 flex w-full items-center justify-between px-6 py-5 mix-blend-difference md:px-10">
      <Magnetic strength={0.25}>
        <a
          href="#"
          onClick={(e) => scrollTo(e, "#top")}
          className="font-display text-sm font-bold tracking-[0.25em]"
        >
          K—OS<span className="text-accent">//</span>
        </a>
      </Magnetic>

      <nav className="flex items-center gap-6 md:gap-10">
        {siteConfig.nav.map((item) => (
          <Magnetic key={item.href} strength={0.3}>
            <a
              href={item.href}
              onClick={(e) => scrollTo(e, item.href)}
              className="group/nav relative py-2 font-mono text-[11px] tracking-[0.3em] text-white/70 transition-colors duration-200 hover:text-white"
            >
              <span className="text-accent">/</span>
              {item.label}
              <span className="absolute bottom-0 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover/nav:w-full" />
            </a>
          </Magnetic>
        ))}
      </nav>
    </header>
  );
}
