"use client";
import Providers from "@/providers/base";
import "@/styles/globals.css";
import { Inter } from "next/font/google";

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
    <html lang="en" className="dark h-screen">
      <body
        className={`${inter.className} text-pr flex h-screen flex-col overflow-hidden bg-background`}
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
