"use client";
import Providers from "@/providers/base";
import "@/styles/globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/**
 * Runs before React mounts to apply the persisted theme and avoid a flash
 * of the wrong palette. Mirrors the logic in `components/theme-toggle.tsx`.
 */
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('linkdo-theme');
    var resolved = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: required theme bootstrap to avoid FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${inter.className} text-pr bg-background flex h-screen flex-col overflow-hidden`}
      >
        <Providers>
          <div className="bg-background flex-1 overflow-y-scroll">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
