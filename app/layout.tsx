import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "./components/layout/Navbar";
import Particles from "./components/effects/Particles";
import GsapProvider from "./providers/GsapProvider";
import FontLoader from "./components/layout/FontLoader";
import PageTransition from "./components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Arcana",
  description: "在静默中遇见答案",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <FontLoader />
        <GsapProvider>
          <Particles />
          <div className="noise-overlay pointer-events-none fixed inset-0 z-[1]" />
          <div className="relative z-10">
            <Navbar />
            <main>
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </GsapProvider>
      </body>
    </html>
  );
}
