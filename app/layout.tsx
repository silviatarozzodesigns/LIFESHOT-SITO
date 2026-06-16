import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CinematicBackdrop } from "@/components/cinematic-backdrop";
import { EditModeProvider } from "@/components/cms/edit-mode";
import { ConsentProvider } from "@/components/legal/consent";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { getPublishedContent } from "@/lib/data/content";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// SEO gestita dal Visual CMS (pannello admin → Contenuti)
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = (await getPublishedContent()).pages.home;
  return {
    title: {
      default: seo.metaTitle,
      template: "%s · Lifeshot",
    },
    description: seo.metaDescription,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    ),
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        <ConsentProvider>
          <CinematicBackdrop />
          <EditModeProvider>{children}</EditModeProvider>
          <CookieBanner />
        </ConsentProvider>
      </body>
    </html>
  );
}
