import Corners from "@/components/Corners";
import type { Operator } from "@/data/config";

/**
 * Terminal/HUD operator profile card for the LORE track: SYS.LOG header
 * bar, title + // subtitle, rotating targeting ring holding the card
 * number, left column of readout fields, right DATA_STREAM column of
 * "> " prefixed lines. Content comes from siteConfig.operators.
 */
export default function OperatorCard({ op }: { op: Operator }) {
  return (
    <article className="relative w-[86vw] shrink-0 border border-white/10 bg-mecha-purple/20 p-8 md:w-[62vw] md:p-12">
      <Corners />

      {/* header bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 font-mono text-[10px] tracking-[0.3em] text-white/40">
        <span>[ SYS.LOG: OPERATOR_PROFILE ]</span>
        <span className="text-accent">STATUS: DECRYPTED</span>
      </div>

      <div className="mt-6 flex items-start justify-between gap-6">
        <div>
          <h3 className="font-display text-[5.5vw] font-bold leading-[1.1] md:text-[2.2vw]">
            {op.title}
          </h3>
          <p className="mt-2 font-mono text-[11px] tracking-[0.3em] text-accent">{op.subtitle}</p>
        </div>

        {/* rotating targeting ring around the card number */}
        <div className="relative h-16 w-16 shrink-0 md:h-20 md:w-20" aria-hidden>
          <svg
            viewBox="0 0 80 80"
            fill="none"
            className="absolute inset-0 h-full w-full animate-spin"
            style={{ animationDuration: "14s" }}
          >
            <circle cx="40" cy="40" r="36" stroke="#B6FF00" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="10 6" />
            <circle cx="40" cy="40" r="28" stroke="#B6FF00" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 5" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold text-white md:text-2xl">
            {op.number}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.5fr] md:gap-12">
        {/* readout fields */}
        <dl className="space-y-5 font-mono">
          {op.fields.map((f) => (
            <div key={f.label}>
              <dt className="text-[10px] tracking-[0.3em] text-white/40">{f.label}</dt>
              <dd className="mt-1 text-sm tracking-[0.1em] text-white">{f.value}</dd>
            </div>
          ))}
        </dl>

        {/* data stream */}
        <div className="font-mono">
          <p className="text-[11px] tracking-[0.3em] text-accent">&lt; DATA_STREAM_INCOMING &gt;</p>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/60">
            {op.stream.map((line, i) => (
              <p key={i}>
                <span className="text-accent">&gt;</span> {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
