import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Anteprime servite da R2 in produzione; localhost in sviluppo.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
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
};

export default nextConfig;
