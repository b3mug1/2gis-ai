import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Providers } from "@/providers/Providers";

export const metadata: Metadata = {
  title: {
    default: "City Guide AI - Городской гид",
    template: "%s | City Guide AI",
  },
  description:
    "Минималистичный городской гид для поиска кофеен, ресторанов, парков и интересных мест.",
  keywords: ["Астана", "городской гид", "ИИ", "рестораны", "кофейни", "места"],
  authors: [{ name: "City Guide AI" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "City Guide AI - Городской гид",
    description: "AI-помощник для поиска лучших мест в городе",
    type: "website",
    locale: "ru_RU",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
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
      <body className="font-sans antialiased bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
