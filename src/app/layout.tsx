import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Language buddy",
  description: "Practice speaking a foreign language out loud with an AI partner.",
};

export const viewport: Viewport = {
  // `viewport-fit=cover` is what makes env(safe-area-inset-*) return real values on
  // a notched iPhone; without it the control bar sits above a dead strip.
  viewportFit: "cover",
  // No user-scalable:false here — disabling pinch-zoom is an accessibility problem,
  // and the 16px minimum font size on controls already prevents the focus-zoom that
  // people usually reach for that flag to stop.
  width: "device-width",
  initialScale: 1,
  themeColor: "#eef1fb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
