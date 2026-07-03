"use client";

import { useState, type FormEvent } from "react";
import Corners from "@/components/Corners";
import Magnetic from "@/components/Magnetic";
import MaskReveal from "@/components/MaskReveal";
import ParallaxKanji from "@/components/ParallaxKanji";
import { siteConfig } from "@/data/config";

type SendState = "idle" | "sending" | "sent" | "error";

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const [sendState, setSendState] = useState<SendState>("idle");

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — email stays visible as plain text anyway
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sendState === "sending") return;
    const fd = new FormData(e.currentTarget);
    setSendState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          payload: fd.get("message"),
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setSendState("sent");
    } catch {
      /* keep the entered values in the DOM so the user can just retry */
      setSendState("error");
    }
  };

  const inputCls =
    "w-full bg-transparent border-b border-white/20 py-3 font-mono text-sm text-white outline-none transition-colors duration-200 focus:border-accent placeholder:text-white/25";

  return (
    <section id="contact" className="relative overflow-hidden px-6 pt-32 md:px-12 md:pt-44">
      {/* 通信 = Comms */}
      <ParallaxKanji className="right-[2vw] top-[6vh] text-[34vh] leading-none text-stroke" speed={-18}>
        通信
      </ParallaxKanji>

      <p className="relative z-10 mb-4 font-mono text-xs tracking-[0.4em] text-accent">
        04 // SECURE_COMMS — 通信回線
      </p>

      <div className="relative z-10 font-display text-[8vw] font-bold leading-[1.05] md:text-[7vw]">
        <MaskReveal><span>LET&apos;S BUILD</span></MaskReveal>
        <MaskReveal delay={0.08}><span>SOMETHING</span></MaskReveal>
        <MaskReveal delay={0.16}>
          <span className="text-stroke-accent">INSANE.</span>
        </MaskReveal>
      </div>

      {/* click-to-copy email */}
      <div className="relative z-10 mt-12">
        <Magnetic strength={0.25}>
          <button
            type="button"
            onClick={copyEmail}
            className="group relative border border-white/20 px-6 py-4 font-mono text-sm tracking-[0.15em] text-white/80 transition-colors duration-300 hover:border-accent hover:text-white md:px-8 md:text-base"
          >
            <Corners className="border-white/30 group-hover:border-accent" />
            {copied ? (
              <span className="text-accent">[ COPIED_TO_CLIPBOARD ✓ ]</span>
            ) : (
              <>
                {siteConfig.email}
                <span className="ml-4 text-[10px] tracking-[0.3em] text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  CLICK_TO_COPY
                </span>
              </>
            )}
          </button>
        </Magnetic>
      </div>

      {/* terminal transmission form */}
      <div className="relative z-10 mt-20 max-w-2xl border border-white/15 bg-mecha-purple/50">
        <div className="flex items-center gap-2 border-b border-white/15 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-cursed/80" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-white/30" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/80" aria-hidden />
          <span className="ml-3 font-mono text-[10px] tracking-[0.2em] text-white/40">
            ~/secure_comms — encrypted_channel
          </span>
        </div>

        {sendState === "sent" ? (
          /* transmission complete: the channel closes in the same voice */
          <div className="flex flex-col gap-3 p-6 md:p-8 font-mono text-xs leading-relaxed">
            <p className="text-white/40">$ transmit --status</p>
            <p className="text-accent">&gt; TRANSMISSION_RECEIVED. STANDBY FOR RESPONSE.</p>
            <p className="text-white/40">channel closed. connection archived.</p>
          </div>
        ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-6 p-6 md:p-8">
          <p className="font-mono text-xs leading-relaxed text-white/40">
            $ init_handshake --to={siteConfig.name.toLowerCase()} --priority=high
            <br />
            <span className="text-accent/80">channel open. identify yourself:</span>
          </p>

          <div>
            <label htmlFor="name" className="mb-1 block font-mono text-[10px] tracking-[0.3em] text-accent/80">
              &gt; IDENTIFY_NAME *
            </label>
            <input id="name" name="name" required autoComplete="name" placeholder="pilot name" className={inputCls} />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block font-mono text-[10px] tracking-[0.3em] text-accent/80">
              &gt; RETURN_FREQUENCY *
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@domain.dev" className={inputCls} />
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block font-mono text-[10px] tracking-[0.3em] text-accent/80">
              &gt; PAYLOAD *
            </label>
            <textarea id="message" name="message" required rows={4} placeholder="describe the mission…" className={`${inputCls} resize-none`} />
          </div>

          {sendState === "error" && (
            <p role="alert" className="font-mono text-xs tracking-[0.15em] text-[#ff3c8c]">
              &gt; TRANSMISSION_FAILED. RETRY OR CONTACT DIRECTLY.
            </p>
          )}

          <Magnetic strength={0.2} className="self-start">
            <button
              type="submit"
              disabled={sendState === "sending"}
              className="group relative border border-accent/50 bg-accent/10 px-8 py-4 font-mono text-xs tracking-[0.4em] text-accent transition-all duration-300 hover:bg-accent hover:text-void hover:shadow-glow disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-accent/10 disabled:hover:text-accent"
            >
              <Corners className="border-accent group-hover:border-void" />
              {sendState === "sending" ? (
                <>TRANSMITTING&hellip;</>
              ) : (
                <>
                  TRANSMIT
                  <svg className="ml-3 inline-block" width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </>
              )}
            </button>
          </Magnetic>
        </form>
        )}
      </div>

      {/* footer */}
      <footer className="relative z-10 mt-24 flex flex-col items-start justify-between gap-6 py-8 md:flex-row md:items-center">
        <p className="font-mono text-[10px] tracking-[0.25em] text-white/40">
          © 2026 {siteConfig.displayName} — ALL SYSTEMS NOMINAL
        </p>
        <nav className="flex gap-6" aria-label="Social links">
          {siteConfig.socials.map((s) => (
            <Magnetic key={s.label} strength={0.3}>
              <a
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="py-2 font-mono text-[11px] tracking-[0.3em] text-white/60 transition-colors duration-200 hover:text-accent"
              >
                [{s.label}]
              </a>
            </Magnetic>
          ))}
        </nav>
        <p className="font-mono text-[10px] tracking-[0.25em] text-white/40">
          DESIGNED IN THE DOMAIN <span className="text-cursed">領域</span>
        </p>
      </footer>
    </section>
  );
}
