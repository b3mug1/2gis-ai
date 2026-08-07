import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Providers } from "@/providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "City Guide AI — Find the perfect place in Astana",
    template: "%s | City Guide AI",
  },
  description:
    "AI-powered city guide. Ask natural questions and get ranked recommendations for restaurants, cafes, and places in Astana.",
  keywords: ["Astana", "city guide", "AI", "restaurants", "cafes", "places"],
  authors: [{ name: "City Guide AI" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "City Guide AI",
    description: "AI-powered city guide for Astana",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#080c18" },
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
