import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Grotesk, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CursorGun from "@/components/CursorGun";
import GlobalAudio from "@/components/GlobalAudio";
import LoadingScreen from "@/components/LoadingScreen";
import { siteConfig } from "@/data/config";

/* Local display face — aggressive mecha lettering for the hero/headers.
   Latin-only (no CJK), so the background kanji keep Noto Sans JP below. */
const display = localFont({
  src: "../../public/fonts/BruceForever-Regular.woff2",
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const notoJp = Noto_Sans_JP({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-jp", preload: false });

export const metadata: Metadata = {
  title: `${siteConfig.displayName} — ${siteConfig.role}`,
  description: `Portfolio of ${siteConfig.name}, ${siteConfig.role}. Clean architecture, scalable backends, pixel-perfect UIs.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} ${notoJp.variable}`}
    >
      <body className="bg-void font-sans text-white antialiased">
        <LoadingScreen />
        <SmoothScroll>{children}</SmoothScroll>
        <CursorGun />
        <GlobalAudio />
      </body>
    </html>
  );
}
