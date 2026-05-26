import type { Metadata } from "next";
import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

/**
 * Google Fonts loaded via next/font, bound to the CSS variables the
 * design system references in `packages/ui/src/styles/tokens.css`.
 *
 * Display: Fraunces — variable serif standing in for the licensed
 * GT Sectra named in docs/design/admin/03-aesthetic-notes.md. Single
 * 400 weight to start; bring in the wght / SOFT / opsz axes later if
 * a primitive needs them.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fraunces",
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
      className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
