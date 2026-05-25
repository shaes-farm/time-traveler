import type { Metadata } from "next";
import {
  Instrument_Serif,
  Inter_Tight,
  JetBrains_Mono,
} from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

/**
 * Google Fonts loaded via next/font, bound to the CSS variables the
 * design system references in `packages/ui/src/styles/tokens.css`.
 *
 * Substitute picks per docs/design/admin/fidelity-2-plan.md — licensed
 * alternatives (GT Sectra / Söhne) may replace these later. Swapping
 * means changing both the next/font import here and the corresponding
 * variable name in tokens.css.
 */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Time Traveler",
  description: "Temporal content management — admin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
