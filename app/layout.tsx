import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lifeshot — Fotografia, Video e Grafica",
    template: "%s · Lifeshot",
  },
  description:
    "Lifeshot è l'agenzia creativa specializzata in fotografia sportiva, video e grafica. Trova e acquista le foto dei tuoi eventi.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
