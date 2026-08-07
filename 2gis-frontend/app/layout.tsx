import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Providers } from "@/providers/Providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "City Guide AI — Уютный городской гид",
    template: "%s | City Guide AI",
  },
  description:
    "Интеллектуальный городской гид для поиска уютных кофеен, ресторанов, парков и интересных мест.",
  keywords: ["Астана", "городской гид", "ИИ", "рестораны", "кофейни", "места"],
  authors: [{ name: "City Guide AI" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "City Guide AI — Уютный городской гид",
    description: "AI-помощник для поиска лучших мест в городе",
    type: "website",
    locale: "ru_RU",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#141A17" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${outfit.variable} ${jakarta.variable} font-sans antialiased bg-[hsl(var(--background))] text-[hsl(var(--foreground))]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
