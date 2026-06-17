import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cache lunga delle immagini ottimizzate + formati moderni più leggeri
    minimumCacheTTL: 31536000,
    formats: ["image/avif", "image/webp"],
    // Anteprime servite da R2 in produzione; localhost in sviluppo.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      // Thumbnail del lite-player YouTube nel portfolio video
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      // Aggiungere qui il dominio custom del bucket R2 (es. media.lifeshot.it)
      ...(process.env.R2_PUBLIC_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(process.env.R2_PUBLIC_URL).hostname,
            },
          ]
        : []),
    ],
  },
  experimental: {
    // Consente upload bulk di file di grandi dimensioni nelle Server Actions
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // I binari nativi di sharp (libvips) devono finire nel bundle di TUTTE
  // le funzioni API che elaborano immagini (upload admin e watermark
  // on-the-fly di /api/images)
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/@img/**/*"],
  },
};

export default nextConfig;
