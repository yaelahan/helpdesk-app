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

/**
 * Applies the stored theme before first paint. As an inline script in <head>
 * it runs ahead of rendering, which is what prevents the white flash a
 * useEffect-based toggle produces on a dark-mode reload. No stored choice
 * means no attribute, and the prefers-color-scheme block in tokens.css
 * handles it.
 */
const THEME_INIT = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      {/* Route-group layouts each set min-h-dvh on their own root -- a
          percentage min-height chain (html/body min-h-full) silently
          collapses to content height unless every ancestor has a definite
          `height`, not just `min-height`. Viewport units sidestep that. */}
      <body>{children}</body>
    </html>
  );
}
