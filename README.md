# Lifeshot — Piattaforma web

Piattaforma premium per l'agenzia creativa **Lifeshot** (fotografia, video, grafica): galleria foto eventi con ricerca per numero di gara, dashboard amministratore con bulk upload.

## Stack

- **Next.js** (App Router, React, TypeScript) — ottimizzato per Vercel Serverless
- **Tailwind CSS + Shadcn UI + Framer Motion** — design minimal, stile Apple
- **MongoDB Atlas + Mongoose** — eventi e foto
- **Storage ibrido** — `public/uploads` in locale, **Cloudflare R2** in produzione (auto-switch in base alle variabili d'ambiente)

## Avvio in locale

```bash
cp .env.example .env.local   # poi configura MONGODB_URI
npm install
npm run dev                  # http://localhost:3000
```

Senza chiavi R2 nel `.env.local`, gli upload finiscono in `public/uploads/` (ignorata da Git).

## Deploy (GitHub → Vercel)

1. Push su GitHub.
2. Importa la repo su Vercel.
3. Configura le variabili di `.env.example` in *Project Settings → Environment Variables* (incluse le chiavi R2: con quelle presenti lo storage passa automaticamente a Cloudflare R2).

## Architettura

```
app/                  # App Router (pagine pubbliche + admin)
components/
  brand/logo.tsx      # ⚠️ PLACEHOLDER logo SVG — sostituire con quello ufficiale
  gallery/            # componenti galleria (watermark overlay, ...)
lib/
  db.ts               # connessione Mongoose con cache serverless
  storage.ts          # astrazione storage Locale ⇄ Cloudflare R2
  parse-filename.ts   # estrazione numero di gara dal nome file
  watermark.ts        # placeholder watermark server-side
models/
  Event.ts            # eventi (nome, slug, data, luogo, copertina)
  Photo.ts            # foto (evento, storageKey, url, raceNumber)
```

### Workflow numero di gara

All'upload, `extractRaceNumber("evento_45_01.jpg")` → tag `"45"` salvato su MongoDB. Convenzione: `<nome>_<numeroGara>_<progressivo>.<ext>`.
