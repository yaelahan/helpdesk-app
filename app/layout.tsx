import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "HelpdeskApp",
  description: "Support ticket helpdesk -- register, reset, RBAC, throttled.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
      {/* Route-group layouts each set min-h-dvh on their own root -- a
          percentage min-height chain (html/body min-h-full) silently
          collapses to content height unless every ancestor has a definite
          `height`, not just `min-height`. Viewport units sidestep that. */}
      <body>{children}</body>
    </html>
  );
}
