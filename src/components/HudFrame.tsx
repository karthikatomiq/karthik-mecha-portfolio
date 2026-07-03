import { siteConfig } from "@/data/config";

/** Fixed HUD chrome: viewport corner brackets + status readouts. */
export default function HudFrame() {
  const corner = "absolute h-6 w-6 border-accent/30";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-3 z-30 hidden md:block">
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.4em] text-white/25">
        {siteConfig.version} // DOMAIN_ONLINE // {siteConfig.location}
      </span>
    </div>
  );
}
