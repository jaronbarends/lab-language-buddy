import type { Metadata, Viewport } from "next";
import { Baloo_2, Work_Sans } from "next/font/google";

import "./globals.css";

/*
 * next/font rather than the @font-face blocks the design system ships: it
 * self-hosts, preloads, serves WOFF2 instead of TTF, and generates a metric-matched
 * fallback so the swap costs no layout shift. The `variable` names are the two
 * primitives the type tokens build on, which is why type.css does not declare them.
 *
 * `latin` alone covers every character the six practice languages need — Norwegian
 * æ ø å and Spanish ñ all sit in Latin-1. No weight is given because both faces are
 * variable, so one file serves the whole range the tokens ask for.
 */
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-worksans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Language buddy",
  description:
    "Practice speaking a foreign language out loud with an AI partner.",
};

export const viewport: Viewport = {
  // Makes env(safe-area-inset-*) return real values on a notched iPhone; without
  // it the control bar sits above a dead strip.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  // --color-gray-50, the page background. Has to be a literal: the browser reads
  // this before any stylesheet resolves.
  themeColor: "#eff6fd",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${baloo.variable} ${workSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
