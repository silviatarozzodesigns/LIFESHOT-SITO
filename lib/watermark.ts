import sharp from "sharp";

/**
 * Watermark impresso nei pixel (server-side, con sharp).
 *
 * In fase di upload viene generata una "preview" pubblica: immagine
 * ridimensionata per il web con il wordmark LIFESHOT ripetuto in diagonale,
 * composto direttamente nei pixel. L'originale pulito resta nello storage
 * in una cartella separata e verrà consegnato solo dopo l'acquisto.
 *
 * Il marchio è il wordmark vettoriale ufficiale (path SVG, niente testo):
 * nessuna dipendenza dai font di sistema, rendering identico ovunque
 * (incluso l'ambiente serverless di Vercel).
 */

const PREVIEW_MAX_WIDTH = 1600;
const PREVIEW_JPEG_QUALITY = 80;

/** viewBox del wordmark ufficiale (public/brand/wordmark.svg) */
const WORDMARK_VIEWBOX = { width: 4803, height: 847 };

const WORDMARK_PATHS = `
<path d="M-0,837.065l0,-822.065l136.996,0l0,676.831l369.977,0l0,145.233l-506.973,0Z"/>
<rect x="626.134" y="9.538" width="143.846" height="827.527"/>
<path d="M1408.402,15l0,145.233l-369.89,0l0,212.344l269.917,0l0,145.233l-269.917,0l0,319.254l-136.996,0l0,-822.065l506.886,0Z"/>
<path d="M1512.545,350.728l0,-335.728l506.973,0l0,145.233l-369.977,0l0,190.494l-136.996,0Zm193.819,0l213.095,0l0,145.233l-213.095,0l0,-145.233Zm-56.823,145.233l0,195.87l369.977,0l0,145.233l-506.973,0l0,-341.104l136.996,-0Z"/>
<path d="M2371.555,701.456c12.833,0 27.92,-1.387 45.261,-4.162c16.409,-1.777 32.385,-6.806 47.949,-15.087c15.477,-7.283 28.722,-18.23 39.712,-32.862c10.058,-14.61 14.61,-33.772 13.7,-57.486c-0.932,-20.116 -7.782,-36.547 -20.549,-49.336c-12.789,-11.9 -27.833,-21.026 -45.174,-27.399c-26.532,-10.058 -53.931,-16.908 -82.198,-20.549c-28.331,-2.775 -57.118,-7.804 -86.36,-15.087c-23.758,-4.552 -46.605,-11.402 -68.498,-20.549c-21.915,-9.126 -42.009,-22.825 -60.261,-41.099c-18.273,-19.184 -32.905,-43.83 -43.874,-73.961c-11.857,-29.242 -16.431,-65.333 -13.7,-108.296c3.642,-41.099 13.7,-76.692 30.174,-106.822c15.477,-29.242 36.027,-53.455 61.648,-72.66c25.535,-19.119 55.232,-33.252 89.048,-42.4c33.816,-9.126 69.885,-13.7 108.21,-13.7c42.009,0 84.496,5.939 127.459,17.775c42.876,12.789 81.244,32.407 115.06,58.874l-54.799,130.233c-11.857,-9.126 -26.012,-17.818 -42.486,-26.099c-16.431,-7.283 -32.862,-13.656 -49.336,-19.162c-17.341,-5.484 -34.683,-9.581 -52.024,-12.312c-17.341,-2.775 -32.862,-4.162 -46.561,-4.162c-16.474,0 -33.382,0.932 -50.723,2.775c-17.341,2.775 -32.862,7.348 -46.561,13.7c-14.632,7.348 -26.511,16.951 -35.636,28.787c-10.058,12.789 -15.997,29.22 -17.775,49.336c-0.932,23.758 3.642,42.486 13.7,56.186c9.126,14.567 20.983,25.535 35.55,32.862c13.7,8.215 28.787,13.678 45.261,16.388c16.409,3.707 30.109,6.46 41.099,8.237c14.61,2.775 30.131,5.072 46.561,6.85c16.409,2.775 33.317,5.528 50.723,8.237c16.409,3.642 33.295,7.76 50.637,12.312c16.474,5.506 32.016,12.811 46.648,21.937c23.693,13.7 44.676,33.36 62.949,58.96c17.385,26.489 26.987,62.082 28.787,106.822c3.642,59.372 -5.029,107.321 -26.012,143.846c-20.983,36.547 -47.038,65.333 -78.123,86.36c-27.399,18.273 -57.096,30.586 -89.048,36.937c-31.973,7.327 -63.469,11.012 -94.51,11.012c-53.888,0 -104.113,-7.327 -150.696,-21.937c-47.515,-14.61 -91.822,-40.188 -132.921,-76.735l65.81,-127.459c19.119,15.564 37.392,28.353 54.799,38.411c17.341,10.058 34.683,18.273 52.024,24.625c17.341,6.416 35.593,10.99 54.799,13.7c18.252,2.775 38.346,4.162 60.261,4.162Z"/>
<path d="M2901.792,15l0,822.065l-136.996,0l0,-822.065l136.996,0Zm74.584,357.578l209.033,0l0,-357.578l136.996,0l0,822.065l-136.996,0l0,-319.254l-209.033,0l0,-145.233Z"/>
<path d="M3456.71,409.602c0,-56.641 6.373,-109.619 19.162,-158.933c12.768,-49.293 33.317,-92.689 61.648,-130.147c27.399,-37.457 62.992,-67.133 106.822,-89.048c42.941,-20.983 94.553,-31.474 154.858,-31.474c61.215,0 113.716,10.491 157.546,31.474c42.941,21.915 78.556,51.135 106.822,87.66c27.443,37.457 47.559,80.854 60.348,130.147c12.768,50.246 19.162,103.679 19.162,160.32c0,61.215 -5.029,118.311 -15.087,171.245c-10.925,53.888 -29.198,100.471 -54.799,139.771c-26.489,39.256 -61.648,69.864 -105.522,91.822c-44.741,22.847 -100.905,34.249 -168.471,34.249c-67.588,0 -123.297,-11.402 -167.17,-34.249c-43.83,-21.958 -78.534,-52.566 -104.135,-91.822c-26.489,-39.3 -44.741,-85.883 -54.799,-139.771c-10.925,-52.934 -16.388,-110.031 -16.388,-171.245Zm142.459,12.312c0,34.748 2.731,68.563 8.237,101.447c5.484,33.772 15.976,63.881 31.474,90.348c14.61,26.532 35.16,47.559 61.648,63.036c25.6,16.474 58.484,24.711 98.672,24.711c40.167,0 73.484,-8.237 99.973,-24.711c25.6,-15.477 46.15,-36.503 61.648,-63.036c14.61,-25.535 25.145,-55.232 31.561,-89.048c5.484,-33.751 8.237,-68 8.237,-102.747c0,-34.683 -2.753,-68.455 -8.237,-101.36c-6.416,-32.883 -16.951,-62.559 -31.561,-89.048c-15.499,-25.535 -36.048,-46.561 -61.648,-63.036c-26.489,-15.542 -59.806,-23.324 -99.973,-23.324c-40.188,0 -73.072,7.782 -98.672,23.324c-25.557,16.474 -45.651,37.501 -60.261,63.036c-15.564,26.489 -26.055,56.164 -31.474,89.048c-6.416,32.905 -9.624,66.677 -9.624,101.36Z"/>
<path d="M4563.64,837.065l-135.609,0l0,-676.831l-231.506,0l0,-145.233l605.559,0l0,145.233l-238.443,0l0,676.831Z"/>
`;

export interface WatermarkOptions {
  /** Opacità del marchio (0–1) */
  opacity?: number;
  /** Larghezza di ogni marchio rispetto all'immagine (0–1) */
  markScale?: number;
  /** Colore del marchio (default scuro: ben visibile sulle foto chiare) */
  color?: string;
}

/** SVG full-size con il wordmark ripetuto in diagonale */
function watermarkSvg(
  width: number,
  height: number,
  { opacity = 0.42, markScale = 0.34, color = "#0a0e1a" }: WatermarkOptions
): string {
  const markWidth = width * markScale;
  const scale = markWidth / WORDMARK_VIEWBOX.width;
  const markHeight = WORDMARK_VIEWBOX.height * scale;
  const stepX = markWidth * 1.4;
  const stepY = markHeight * 3.6;

  let uses = "";
  let row = 0;
  // Griglia abbondante oltre i bordi, così la rotazione non lascia vuoti
  for (let y = -height; y < height * 2; y += stepY, row += 1) {
    const offsetX = row % 2 === 0 ? 0 : stepX / 2;
    for (let x = -width; x < width * 2; x += stepX) {
      uses += `<use xlink:href="#lswm" transform="translate(${(x + offsetX).toFixed(1)},${y.toFixed(1)}) scale(${scale.toFixed(5)})"/>`;
    }
  }

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs><g id="lswm" fill="${color}" fill-opacity="${opacity}">${WORDMARK_PATHS}</g></defs>
  <g transform="rotate(-27 ${width / 2} ${height / 2})">${uses}</g>
</svg>`;
}

export interface PreviewResult {
  buffer: Buffer;
  width: number;
  height: number;
}

/**
 * Genera la preview pubblica: ridimensiona per il web (max 1600px),
 * imprime il watermark nei pixel e ricomprime in JPEG.
 */
export async function createWatermarkedPreview(
  input: Buffer,
  options: WatermarkOptions = {}
): Promise<PreviewResult> {
  // .rotate() senza argomenti applica l'orientamento EXIF
  const resized = await sharp(input)
    .rotate()
    .resize({ width: PREVIEW_MAX_WIDTH, withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });

  const { width, height } = resized.info;
  const overlay = Buffer.from(watermarkSvg(width, height, options));

  const buffer = await sharp(resized.data)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: PREVIEW_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  return { buffer, width, height };
}

/**
 * Dimensioni che avrà la preview servita da /api/images (max 1600px),
 * calcolate senza generare l'immagine: servono al layout della galleria.
 */
export async function getPreviewDimensions(
  input: Buffer
): Promise<{ width: number; height: number }> {
  const meta = await sharp(input).rotate().metadata();
  const w = meta.width ?? PREVIEW_MAX_WIDTH;
  const h = meta.height ?? Math.round((PREVIEW_MAX_WIDTH * 2) / 3);
  const scale = Math.min(1, PREVIEW_MAX_WIDTH / w);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/** Ridimensiona una copertina per il web, senza watermark. */
export async function createCoverImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: PREVIEW_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
}
