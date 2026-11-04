/**
 * Generated property imagery. All demo photos are original SVG illustrations produced here,
 * so there are no licensing concerns. Real listings use uploaded photos (data URLs in demo mode,
 * Supabase Storage URLs in production).
 */
function rng(seed: number) {
  let a = seed * 2654435761 + 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SKIES: [string, string][] = [
  ["#BFD7EA", "#EAF2F8"],
  ["#F3D9B8", "#FBEFDD"],
  ["#C9D9E8", "#F2F6FA"],
  ["#D8D0E6", "#F6F2FA"],
  ["#CFE3DC", "#F1F8F5"],
];
const WALLS = ["#EFE7DA", "#E7ECEF", "#F2EBE0", "#E4E0D6", "#ECE4EE"];
const ACCENT = ["#A9814A", "#1E3A5F", "#2F6B4F", "#7A4F4F", "#6B4F7A"];

function mountains(r: () => number, w: number, h: number, base: number) {
  let d1 = `M0 ${base}`;
  let x = 0;
  while (x < w) {
    x += 60 + r() * 90;
    d1 += ` L${x.toFixed(0)} ${(base - 40 - r() * 70).toFixed(0)}`;
  }
  d1 += ` L${w} ${base} Z`;
  let d2 = `M0 ${base}`;
  x = -40;
  while (x < w) {
    x += 90 + r() * 120;
    d2 += ` Q${(x - 50).toFixed(0)} ${(base - 70 - r() * 50).toFixed(0)} ${x.toFixed(0)} ${base - 10}`;
  }
  d2 += ` L${w} ${base} Z`;
  return `<path d="${d1}" fill="#9DB0BF" opacity=".55"/><path d="${d2}" fill="#7C95A6" opacity=".6"/>`;
}

function windows(x: number, y: number, w: number, h: number, cols: number, rows: number, r: () => number, lit = 0.25) {
  const cw = w / cols;
  const rh = h / rows;
  let s = "";
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const on = r() < lit;
      s += `<rect x="${(x + i * cw + cw * 0.22).toFixed(1)}" y="${(y + j * rh + rh * 0.2).toFixed(1)}" width="${(cw * 0.56).toFixed(1)}" height="${(rh * 0.55).toFixed(1)}" rx="1.5" fill="${on ? "#F4D58D" : "#5C7589"}" opacity="${on ? 0.95 : 0.7}"/>`;
    }
  return s;
}

function exterior(kind: string, r: () => number, W: number, H: number) {
  const ground = H * 0.78;
  const acc = ACCENT[Math.floor(r() * ACCENT.length)];
  const wall = WALLS[Math.floor(r() * WALLS.length)];
  let body = mountains(r, W, H, ground);
  body += `<rect y="${ground}" width="${W}" height="${H - ground}" fill="#B9C2AE"/><rect y="${ground + 18}" width="${W}" height="${H - ground - 18}" fill="#9FA991" opacity=".6"/>`;
  if (kind === "apartment" || kind === "development") {
    const n = 3 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const bw = 90 + r() * 60;
      const bh = 160 + r() * 200 + (kind === "development" ? 60 : 0);
      const bx = 40 + i * ((W - 120) / n) + r() * 20;
      const by = ground - bh;
      body += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${i % 2 ? wall : "#DCD6CA"}" stroke="#B7AF9F"/>`;
      body += `<rect x="${bx}" y="${by}" width="${bw}" height="10" fill="${acc}"/>`;
      body += windows(bx + 6, by + 18, bw - 12, bh - 30, 5, Math.floor(bh / 22), r);
    }
    if (kind === "development") {
      body += `<g stroke="#C9A46B" stroke-width="3" fill="none"><path d="M${W - 120} ${ground} V${ground - 330} H${W - 300}"/><path d="M${W - 120} ${ground - 330} L${W - 60} ${ground - 300} M${W - 120} ${ground - 330} L${W - 140} ${ground - 380}"/><path d="M${W - 280} ${ground - 330} V${ground - 250}"/></g><rect x="${W - 292}" y="${ground - 250}" width="24" height="18" fill="#C9A46B"/>`;
    }
  } else if (kind === "house") {
    const hx = W * 0.22, hw = W * 0.56, hy = ground - 150;
    body += `<rect x="${hx}" y="${hy}" width="${hw}" height="150" fill="${wall}" stroke="#B7AF9F"/>`;
    body += `<path d="M${hx - 20} ${hy} L${hx + hw / 2} ${hy - 90} L${hx + hw + 20} ${hy} Z" fill="${acc}"/>`;
    body += `<rect x="${hx + hw / 2 - 22}" y="${ground - 88}" width="44" height="88" fill="#6E5640"/>`;
    body += windows(hx + 18, hy + 24, hw * 0.34, 60, 2, 1, r, 0.5) + windows(hx + hw * 0.62, hy + 24, hw * 0.34, 60, 2, 1, r, 0.5);
    body += `<path d="M${W * 0.08} ${ground} v-40 h${W * 0.84} v40" stroke="#8A7B66" stroke-width="3" fill="none"/>`;
    for (let i = 0; i < 3; i++) body += `<circle cx="${W * 0.1 + i * W * 0.38}" cy="${ground - 36}" r="${16 + r() * 8}" fill="#4F7A58"/>`;
  } else if (kind === "land" || kind === "landplot") {
    body += `<path d="M0 ${ground} Q${W * 0.3} ${ground - 30} ${W * 0.6} ${ground - 8} T${W} ${ground - 20} V${H} H0 Z" fill="#B5C09E"/>`;
    for (let i = 0; i < 9; i++) body += `<path d="M${W * 0.12 + i * 70} ${ground + 40} v-30" stroke="#7B6A55" stroke-width="3"/>`;
    body += `<path d="M${W * 0.12} ${ground + 18} H${W * 0.12 + 8 * 70}" stroke="#7B6A55" stroke-width="2"/>`;
    body += `<rect x="${W * 0.62}" y="${ground + 6}" width="46" height="30" fill="#fff" stroke="${acc}" stroke-width="2"/><text x="${W * 0.62 + 23}" y="${ground + 26}" font-size="12" text-anchor="middle" fill="${acc}" font-family="sans-serif">M2</text>`;
  } else if (kind === "commercial" || kind === "office") {
    const bw = W * 0.4, bh = 300 + r() * 80, bx = W * 0.3;
    body += `<rect x="${bx}" y="${ground - bh}" width="${bw}" height="${bh}" fill="#CBD5DC" stroke="#9FB0BB"/>`;
    for (let i = 0; i < 14; i++) body += `<rect x="${bx}" y="${ground - bh + i * (bh / 14)}" width="${bw}" height="${bh / 14 - 2}" fill="${acc}" opacity="${0.18 + (i % 2) * 0.1}"/>`;
    body += windows(bx + 8, ground - bh + 10, bw - 16, bh - 20, 6, 14, r, 0.3);
    body += `<rect x="${bx - 40}" y="${ground - 120}" width="${bw + 80}" height="120" fill="#B9C6CF" stroke="#9FB0BB"/>`;
    body += windows(bx - 32, ground - 110, bw + 64, 100, 8, 4, r, 0.3);
  } else if (kind === "retail") {
    const bx = W * 0.15, bw = W * 0.7;
    body += `<rect x="${bx}" y="${ground - 190}" width="${bw}" height="190" fill="${wall}" stroke="#B7AF9F"/>`;
    body += `<rect x="${bx}" y="${ground - 190}" width="${bw}" height="40" fill="${acc}"/>`;
    body += `<rect x="${bx + 24}" y="${ground - 120}" width="${bw - 48}" height="100" fill="#8FB1C6" opacity=".7" stroke="#fff" stroke-width="4"/>`;
    for (let i = 0; i < 5; i++) body += `<path d="M${bx + 24 + i * ((bw - 48) / 4)} ${ground - 120} v100" stroke="#fff" stroke-width="3"/>`;
    body += `<path d="M${bx} ${ground - 150} h${bw} l-14 24 h-${bw - 28} Z" fill="${acc}" opacity=".85"/>`;
  } else if (kind === "warehouse") {
    const bx = W * 0.12, bw = W * 0.76;
    body += `<path d="M${bx} ${ground} V${ground - 130} L${bx + bw / 2} ${ground - 190} L${bx + bw} ${ground - 130} V${ground} Z" fill="#C9CFD3" stroke="#9AA3A9"/>`;
    for (let i = 0; i < 3; i++) body += `<rect x="${bx + 40 + i * (bw / 3)}" y="${ground - 100}" width="${bw / 3 - 70}" height="100" fill="#5C7589" stroke="#fff" stroke-width="3"/>`;
    for (let i = 0; i < 24; i++) body += `<path d="M${bx + 20 + i * ((bw - 40) / 24)} ${ground - 128} v-40" stroke="#B2BAC0"/>`;
  }
  return body;
}

function interior(kind: string, r: () => number, W: number, H: number) {
  const wall = WALLS[Math.floor(r() * WALLS.length)];
  const acc = ACCENT[Math.floor(r() * ACCENT.length)];
  const floorY = H * 0.68;
  let s = `<rect width="${W}" height="${floorY}" fill="${wall}"/><rect y="${floorY}" width="${W}" height="${H - floorY}" fill="#C9A980"/>`;
  for (let i = 0; i < 14; i++) s += `<path d="M${i * (W / 12) - 40} ${H} L${W / 2 + (i - 7) * 30} ${floorY}" stroke="#B8966B" stroke-width="1.5" opacity=".55"/>`;
  // window with mountain view
  const wx = W * 0.58, wy = H * 0.1, ww = W * 0.32, wh = H * 0.4;
  s += `<rect x="${wx - 8}" y="${wy - 8}" width="${ww + 16}" height="${wh + 16}" fill="#fff"/><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="#CFE3F2"/>`;
  s += `<g transform="translate(${wx} ${wy})" clip-path="url(#wc)"><clipPath id="wc"><rect width="${ww}" height="${wh}"/></clipPath>${mountains(r, ww, wh, wh)}</g>`;
  s += `<path d="M${wx + ww / 2} ${wy} v${wh}" stroke="#fff" stroke-width="5"/>`;
  s += `<path d="M${wx - 22} ${wy - 12} v${wh + 60} M${wx + ww + 22} ${wy - 12} v${wh + 60}" stroke="#E9E4DA" stroke-width="22" opacity=".9"/>`;
  if (kind === "living") {
    s += `<rect x="${W * 0.06}" y="${floorY - 70}" width="${W * 0.42}" height="70" rx="10" fill="${acc}"/><rect x="${W * 0.06}" y="${floorY - 105}" width="${W * 0.42}" height="40" rx="10" fill="${acc}" opacity=".85"/>`;
    s += `<rect x="${W * 0.14}" y="${floorY + 20}" width="${W * 0.3}" height="38" rx="6" fill="#6E5640"/>`;
    s += `<ellipse cx="${W * 0.3}" cy="${floorY + 60}" rx="${W * 0.3}" ry="14" fill="#fff" opacity=".35"/>`;
    s += `<rect x="${W * 0.52}" y="${floorY - 60}" width="16" height="60" fill="#6E5640"/><circle cx="${W * 0.52 + 8}" cy="${floorY - 68}" r="18" fill="#F4D58D"/>`;
  } else if (kind === "bedroom") {
    s += `<rect x="${W * 0.08}" y="${floorY - 140}" width="${W * 0.4}" height="110" rx="6" fill="#6E5640"/><rect x="${W * 0.06}" y="${floorY - 60}" width="${W * 0.44}" height="80" rx="10" fill="#F6F2EA"/><rect x="${W * 0.06}" y="${floorY - 40}" width="${W * 0.44}" height="60" rx="8" fill="${acc}" opacity=".85"/><rect x="${W * 0.1}" y="${floorY - 78}" width="${W * 0.14}" height="28" rx="8" fill="#fff"/><rect x="${W * 0.27}" y="${floorY - 78}" width="${W * 0.14}" height="28" rx="8" fill="#fff"/>`;
  } else if (kind === "kitchen") {
    s += `<rect x="${W * 0.05}" y="${H * 0.1}" width="${W * 0.46}" height="${H * 0.2}" fill="#fff" stroke="#D5CFC3"/>`;
    s += `<rect x="${W * 0.05}" y="${floorY - 90}" width="${W * 0.46}" height="90" fill="${acc}"/><rect x="${W * 0.05}" y="${floorY - 98}" width="${W * 0.46}" height="10" fill="#EDE8DE"/>`;
    s += `<circle cx="${W * 0.18}" cy="${floorY - 106}" r="0" fill="none"/><rect x="${W * 0.28}" y="${floorY - 150}" width="${W * 0.1}" height="52" fill="#B9C2CA"/>`;
    s += `<rect x="${W * 0.3}" y="${floorY + 10}" width="${W * 0.26}" height="42" rx="4" fill="#EDE8DE" stroke="#D5CFC3"/>`;
  } else if (kind === "bath") {
    s += `<rect y="${floorY - 190}" width="${W}" height="190" fill="#DDE6EA" opacity=".6"/>`;
    s += `<rect x="${W * 0.06}" y="${floorY - 60}" width="${W * 0.38}" height="70" rx="30" fill="#fff" stroke="#D5CFC3" stroke-width="2"/>`;
    s += `<rect x="${W * 0.5}" y="${floorY - 90}" width="${W * 0.1}" height="90" rx="6" fill="#fff" stroke="#D5CFC3"/><rect x="${W * 0.46}" y="${H * 0.14}" width="${W * 0.08}" height="${H * 0.18}" fill="#CFE3F2" stroke="#fff" stroke-width="4"/>`;
  } else if (kind === "officeint" || kind === "meeting") {
    s += `<rect x="${W * 0.1}" y="${floorY - 36}" width="${W * 0.55}" height="14" fill="#6E5640"/><path d="M${W * 0.14} ${floorY - 22} v50 M${W * 0.6} ${floorY - 22} v50" stroke="#6E5640" stroke-width="6"/>`;
    for (let i = 0; i < 4; i++) s += `<rect x="${W * 0.14 + i * W * 0.13}" y="${floorY - 78}" width="${W * 0.08}" height="38" rx="8" fill="${acc}"/>`;
  } else if (kind === "retailint") {
    for (let i = 0; i < 3; i++) {
      s += `<rect x="${W * 0.06 + i * W * 0.3}" y="${floorY - 130}" width="${W * 0.24}" height="130" fill="#fff" stroke="#D5CFC3"/>`;
      for (let j = 0; j < 4; j++) s += `<rect x="${W * 0.07 + i * W * 0.3}" y="${floorY - 124 + j * 32}" width="${W * 0.22}" height="6" fill="${acc}" opacity=".7"/>`;
    }
  } else if (kind === "warehouseint") {
    for (let i = 0; i < 5; i++) s += `<rect x="${W * 0.05 + i * W * 0.18}" y="${floorY - 90 - (i % 2) * 40}" width="${W * 0.14}" height="${90 + (i % 2) * 40}" fill="#C79B63" stroke="#8A6A3E"/>`;
  }
  return s;
}

export function generateSvg(kind: string, seed: number, w = 800, h = 560): string {
  const r = rng(seed);
  const sky = SKIES[Math.floor(r() * SKIES.length)];
  const isInterior = ["living", "bedroom", "kitchen", "bath", "officeint", "meeting", "retailint", "warehouseint"].includes(kind);
  let inner: string;
  if (isInterior) inner = interior(kind, r, w, h);
  else if (kind === "view" || kind === "garden") {
    inner = exterior(kind === "garden" ? "house" : "apartment", rng(seed + 9), w, h);
  } else inner = exterior(kind, r, w, h);
  const sun = isInterior ? "" : `<circle cx="${w * (0.15 + r() * 0.7)}" cy="${h * 0.16}" r="34" fill="#FFF3CF" opacity=".9"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>${sun}${inner}</svg>`;
}

const cache = new Map<string, string>();
/** Resolve an image reference ("gen:kind:seed", data URL, or http URL) to a usable src. */
export function resolveImage(ref: string): string {
  if (!ref.startsWith("gen:")) return ref;
  const hit = cache.get(ref);
  if (hit) return hit;
  const [, kind, seed] = ref.split(":");
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generateSvg(kind, Number(seed) || 1))}`;
  cache.set(ref, uri);
  return uri;
}

/** Downscale an uploaded photo in the browser so it fits in demo storage. */
export async function compressImage(file: File, maxSide = 1100, quality = 0.72): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) throw new Error("type");
  if (file.size > 12 * 1024 * 1024) throw new Error("size");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("decode"));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
