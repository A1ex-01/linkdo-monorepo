import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// const inter = localFont({
//   variable: "--font-inter",
//   display: "swap",
//   src: [
//     {
//       path: "./fonts/inter-400.woff2",
//       weight: "400",
//       style: "normal",
//     },
//     {
//       path: "./fonts/inter-500.woff2",
//       weight: "500",
//       style: "normal",
//     },
//     {
//       path: "./fonts/inter-600.woff2",
//       weight: "600",
//       style: "normal",
//     },
//     {
//       path: "./fonts/inter-700.woff2",
//       weight: "700",
//       style: "normal",
//     },
//     {
//       path: "./fonts/inter-800.woff2",
//       weight: "800",
//       style: "normal",
//     },
//   ],
// });

// const clashGrotesk = localFont({
//   src: "./fonts/clash-grotesk-500.woff2",
//   variable: "--font-clash-grotesk",
//   display: "swap",
//   weight: "500",
// });

// const clashDisplay = localFont({
//   src: "./fonts/clash-display-500.woff2",
//   variable: "--font-clash-display",
//   display: "swap",
//   weight: "500",
// });

// const polySans = localFont({
//   src: "./fonts/polysans-neutral-400.otf",
//   variable: "--font-polysans",
//   display: "swap",
//   weight: "400",
// });

export const metadata: Metadata = {
  metadataBase: new URL("https://linkdo.app"),
  title: "Linkdo | A focused task planning app",
  description:
    "Linkdo is a calm task planner and focus timer that helps you prioritize what matters and build momentum without the noise.",
  icons: {
    icon: "/seo/favicon.png",
    apple: "/seo/apple-touch-icon.png",
  },
  openGraph: {
    title: "Linkdo | A focused task planning app",
    description:
      "Plan your day, protect your focus, and get meaningful work done.",
    images: ["/seo/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={` h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
