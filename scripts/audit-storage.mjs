/**
 * AUDIT DELLO STORAGE CLOUDFLARE R2
 *
 * Confronta i file presenti sul bucket con quelli citati dal database e dice:
 *   • ORFANI    → file sul cloud che nessun record nomina (spazio sprecato)
 *   • DOPPIONI  → file con contenuto IDENTICO (stesso ETag), anche se il nome
 *                 è diverso: le chiavi hanno un suffisso casuale, quindi la
 *                 stessa foto caricata due volte finisce su due chiavi diverse
 *   • MANCANTI  → record che puntano a file non più sul cloud (foto rotte)
 *
 * USO (dalla cartella del progetto):
 *   node scripts/audit-storage.mjs            → solo REPORT, non tocca niente
 *   node scripts/audit-storage.mjs --elimina  → cancella SOLO gli orfani
 *
 * Servono le variabili di PRODUZIONE (le stesse di Vercel):
 *   MONGODB_URI, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET_NAME, R2_PUBLIC_URL
 * Vengono lette da .env.local, oppure passale a mano:
 *   MONGODB_URI="..." R2_BUCKET_NAME="..." node scripts/audit-storage.mjs
 *
 * I DOPPIONI non vengono mai cancellati in automatico: sono file veri, citati
 * dal database (la stessa foto caricata due volte). Vanno rimossi dal CMS,
 * altrimenti resterebbero record che puntano al vuoto.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import mongoose from "mongoose";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

/* ── configurazione: .env.local se presente, poi l'ambiente reale ── */
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const riga of fs.readFileSync(envPath, "utf8").split("\n")) {
    if (!riga.includes("=") || riga.trim().startsWith("#")) continue;
    const i = riga.indexOf("=");
    const chiave = riga.slice(0, i).trim();
    const valore = riga.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (valore && !process.env[chiave]) process.env[chiave] = valore;
  }
}

const RICHIESTE = [
  "MONGODB_URI",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
];
const mancanti = RICHIESTE.filter((k) => !process.env[k]);
if (mancanti.length) {
  console.error("Mancano le variabili:", mancanti.join(", "));
  console.error("Copiale dalle Environment Variables del progetto su Vercel.");
  process.exit(1);
}

const ELIMINA = process.argv.includes("--elimina");
const BUCKET = process.env.R2_BUCKET_NAME;
const BASE_PUBBLICA = process.env.R2_PUBLIC_URL.replace(/\/$/, "");
const mb = (b) => (b / 1048576).toFixed(1);

/** URL pubblico → chiave dello storage (null se non è del nostro bucket) */
function chiaveDaUrl(url) {
  if (typeof url !== "string" || !url) return null;
  return url.startsWith(BASE_PUBBLICA + "/")
    ? url.slice(BASE_PUBBLICA.length + 1)
    : null;
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/* ── 1. tutti gli oggetti del bucket ── */
async function leggiBucket() {
  const oggetti = [];
  let token;
  do {
    const r = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token })
    );
    for (const o of r.Contents ?? []) {
      oggetti.push({
        key: o.Key,
        size: o.Size ?? 0,
        etag: (o.ETag ?? "").replace(/"/g, ""),
        mod: o.LastModified,
      });
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return oggetti;
}

/* ── 2. tutte le chiavi citate dal database ── */
async function leggiChiaviUsate() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  const usate = new Map(); // chiave → chi la usa

  const segna = (chiave, chi) => {
    if (chiave) usate.set(chiave, chi);
  };

  for (const p of await db.collection("photos").find({}).toArray()) {
    const chi = `foto ${p._id}`;
    segna(p.storageKey, chi);
    segna(p.originalKey, chi);
    segna(p.previewKey, chi);
  }
  for (const e of await db.collection("events").find({}).toArray()) {
    segna(chiaveDaUrl(e.coverImage), `copertina evento "${e.name}"`);
  }
  for (const v of await db.collection("videos").find({}).toArray()) {
    segna(chiaveDaUrl(v.url), `video "${v.title}"`);
  }
  // CMS: bozza E pubblicato (un asset citato solo dalla bozza è comunque vivo)
  const cms = await db.collection("sitecontents").findOne({ key: "site" });
  for (const stato of ["published", "draft"]) {
    const pagine = cms?.[stato]?.pages ?? {};
    for (const [slug, pagina] of Object.entries(pagine)) {
      for (const [k, url] of Object.entries(pagina?.images ?? {})) {
        segna(chiaveDaUrl(url), `CMS ${slug} → ${k}`);
      }
      segna(chiaveDaUrl(pagina?.seo?.ogImage), `CMS ${slug} → OG image`);
    }
  }
  await mongoose.disconnect();
  return usate;
}

/* ── 3. confronto e report ── */
const oggetti = await leggiBucket();
const usate = await leggiChiaviUsate();
const presenti = new Set(oggetti.map((o) => o.key));

console.log(`\nBUCKET: ${BUCKET}`);
console.log(
  `File sul cloud: ${oggetti.length} · ${mb(
    oggetti.reduce((s, o) => s + o.size, 0)
  )} MB · citati dal database: ${usate.size}\n`
);

const perCartella = {};
for (const o of oggetti) {
  const c = o.key.split("/")[0];
  (perCartella[c] ??= []).push(o);
}
console.log("PER CARTELLA");
for (const [c, lista] of Object.entries(perCartella).sort(
  (a, b) => b[1].length - a[1].length
)) {
  console.log(
    `  ${c.padEnd(10)} ${String(lista.length).padStart(5)} file  ${mb(
      lista.reduce((s, o) => s + o.size, 0)
    ).padStart(9)} MB`
  );
}

/* ORFANI */
const orfani = oggetti.filter((o) => !usate.has(o.key));
const pesoOrfani = orfani.reduce((s, o) => s + o.size, 0);
console.log(`\nORFANI (sul cloud ma nessun record li nomina): ${orfani.length} · ${mb(pesoOrfani)} MB`);
for (const o of orfani.slice(0, 40)) {
  console.log(`  ${mb(o.size).padStart(7)} MB  ${o.mod?.toISOString().slice(0, 10)}  ${o.key}`);
}
if (orfani.length > 40) console.log(`  …e altri ${orfani.length - 40}`);

/* DOPPIONI: stesso contenuto, nomi diversi */
const perEtag = {};
for (const o of oggetti) {
  // gli ETag con "-" sono upload multipart: non confrontabili come hash
  if (o.etag && !o.etag.includes("-")) (perEtag[o.etag] ??= []).push(o);
}
const doppioni = Object.values(perEtag).filter((g) => g.length > 1);
const pesoDoppioni = doppioni.reduce((s, g) => s + g[0].size * (g.length - 1), 0);
console.log(`\nDOPPIONI (contenuto identico, nome diverso): ${doppioni.length} gruppi · ${mb(pesoDoppioni)} MB recuperabili`);
for (const g of doppioni.sort((a, b) => b[0].size * b.length - a[0].size * a.length).slice(0, 20)) {
  console.log(`  ${g.length}x ${mb(g[0].size)} MB:`);
  for (const o of g) {
    const chi = usate.get(o.key);
    console.log(`     ${o.key}  ${chi ? `← ${chi}` : "← ORFANO"}`);
  }
}
if (doppioni.length) {
  console.log("  Nota: i doppioni citati dal database sono la STESSA foto caricata");
  console.log("  due volte. Vanno tolti dal CMS, non da qui: cancellarli a mano");
  console.log("  lascerebbe dei record che puntano al vuoto.");
}

/* MANCANTI: record che puntano a file spariti */
const mancantiSuCloud = [...usate.entries()].filter(([k]) => !presenti.has(k));
console.log(`\nMANCANTI (il database li cita ma sul cloud non ci sono): ${mancantiSuCloud.length}`);
for (const [k, chi] of mancantiSuCloud.slice(0, 20)) console.log(`  ${k}  ← ${chi}`);

/* ── 4. eliminazione (solo su richiesta esplicita) ── */
if (!ELIMINA) {
  console.log(
    orfani.length
      ? `\nNessun file è stato toccato. Per cancellare i ${orfani.length} orfani: node scripts/audit-storage.mjs --elimina\n`
      : "\nNessun file è stato toccato. Non ci sono orfani da cancellare.\n"
  );
  process.exit(0);
}
if (!orfani.length) {
  console.log("\nNiente da cancellare.\n");
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const risposta = await rl.question(
  `\nSto per cancellare DEFINITIVAMENTE ${orfani.length} file (${mb(pesoOrfani)} MB) dal bucket "${BUCKET}".\nL'operazione è irreversibile. Scrivi ELIMINA per procedere: `
);
rl.close();
if (risposta.trim() !== "ELIMINA") {
  console.log("Annullato: nessun file toccato.\n");
  process.exit(0);
}

for (let i = 0; i < orfani.length; i += 1000) {
  const lotto = orfani.slice(i, i + 1000);
  await client.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: lotto.map((o) => ({ Key: o.key })) },
    })
  );
  console.log(`  cancellati ${Math.min(i + 1000, orfani.length)}/${orfani.length}`);
}
console.log(`\nFatto: ${orfani.length} orfani rimossi, ${mb(pesoOrfani)} MB liberati.\n`);
