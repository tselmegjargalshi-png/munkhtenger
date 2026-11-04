import type { Metadata, Viewport } from "next";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/cyrillic-400.css";
import "@fontsource/manrope/cyrillic-500.css";
import "@fontsource/manrope/cyrillic-600.css";
import "@fontsource/manrope/cyrillic-700.css";
import "@fontsource/manrope/cyrillic-ext-400.css";
import "@fontsource/manrope/cyrillic-ext-500.css";
import "@fontsource/manrope/cyrillic-ext-600.css";
import "@fontsource/manrope/cyrillic-ext-700.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/cormorant-garamond/latin-700.css";
import "@fontsource/cormorant-garamond/cyrillic-500.css";
import "@fontsource/cormorant-garamond/cyrillic-600.css";
import "@fontsource/cormorant-garamond/cyrillic-700.css";
import "@fontsource/cormorant-garamond/cyrillic-ext-500.css";
import "@fontsource/cormorant-garamond/cyrillic-ext-600.css";
import "@fontsource/cormorant-garamond/cyrillic-ext-700.css";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { Boot } from "@/components/boot";
import { DemoBanner, Footer, Header } from "@/components/shell";
import { Toaster } from "@/components/ui";
import { CompareBar } from "@/components/compare-bar";

export const metadata: Metadata = {
  title: { default: "Мөнхтэнгэр | Munkhtenger Real Estate", template: "%s | Мөнхтэнгэр" },
  description: "Монголын үл хөдлөх хөрөнгийн зах зээл. Mongolian real estate marketplace and management platform. Demo build with fictional data.",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#FAF8F4" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>
        <LangProvider>
          <Boot />
          <DemoBanner />
          <Header />
          <main id="main" className="min-h-[60vh]">{children}</main>
          <Footer />
          <CompareBar />
          <Toaster />
        </LangProvider>
      </body>
    </html>
  );
}
