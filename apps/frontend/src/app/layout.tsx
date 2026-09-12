"use client";
import Providers from "@/providers/base";
import "@/styles/globals.css";
import { Inter } from "next/font/google";

import { Merriweather, Montserrat, Ubuntu_Mono } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-merriweather",
});

const ubuntuMono = Ubuntu_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-ubuntu-mono",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen" suppressHydrationWarning>
      <head />
      <body
        className={`${montserrat.variable} ${merriweather.variable} ${ubuntuMono.variable} text-pr bg-background flex h-screen flex-col overflow-hidden`}
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
