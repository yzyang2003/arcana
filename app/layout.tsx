import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "./components/layout/Navbar";
import GsapProvider from "./providers/GsapProvider";
import FontLoader from "./components/layout/FontLoader";
import PageTransition from "./components/layout/PageTransition";
import ErrorBoundary from "./components/ErrorBoundary";
import ClientParticles from "./components/effects/ClientParticles";

export const metadata: Metadata = {
  title: "Arcana - AI 塔罗牌占卜",
  description: "在静默中遇见答案 — AI驱动的在线塔罗牌占卜体验",
  openGraph: {
    title: "Arcana - AI 塔罗牌占卜",
    description: "在静默中遇见答案 — AI驱动的在线塔罗牌占卜体验",
    url: "https://arcana-hazel.vercel.app",
    siteName: "Arcana",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  metadataBase: new URL("https://arcana-hazel.vercel.app"),
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <meta name="theme-color" content="#9b8cff" />
      </head>
      <body className="min-h-full">
        <FontLoader />
        <ErrorBoundary>
          <GsapProvider>
            <ClientParticles />
            <div className="noise-overlay pointer-events-none fixed inset-0 z-[1]" />
            <div className="relative z-10">
              <Navbar />
              <main>
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </GsapProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
