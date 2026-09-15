"use client";
import Providers from "@/providers/base";
import "@/styles/globals.css";
import { Geist_Mono, Open_Sans } from "next/font/google";
const fontSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('linkdo-style-theme');
                  if (stored && ['default', 'twitter', 'vercel'].includes(stored)) {
                    document.documentElement.dataset.theme = stored;
                  } else {
                    document.documentElement.dataset.theme = 'default';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} text-pr bg-background flex h-screen flex-col overflow-hidden`}
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
