import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const themeScript = `(() => {
  try {
    const saved = localStorage.getItem("linkdo-theme");
    document.documentElement.dataset.theme = saved === "light" ? "light" : "dark";
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();`;

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
  title: "Linkdo | 专注任务规划应用",
  description:
    "Linkdo 是一款简洁的任务规划与专注计时应用，帮你确定优先级，远离干扰，持续推进重要工作。",
  icons: {
    icon: "/seo/favicon.png",
    apple: "/seo/apple-touch-icon.png",
  },
  openGraph: {
    title: "Linkdo | 专注任务规划应用",
    description: "规划一天，守护专注，完成真正重要的工作。",
    images: ["/seo/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
