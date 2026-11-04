import type { Lang, ListingType } from "./types";

export function formatMNT(n: number): string {
  return `${Math.round(n).toLocaleString("en-US")} ₮`;
}

export function formatMNTShort(n: number, lang: Lang): string {
  const abs = Math.abs(n);
  const trim = (v: number) => (v >= 100 ? Math.round(v).toString() : v.toFixed(v >= 10 ? 1 : 2).replace(/\.?0+$/, ""));
  if (abs >= 1e9) return lang === "mn" ? `${trim(n / 1e9)} тэрбум ₮` : `₮${trim(n / 1e9)}B`;
  if (abs >= 1e6) return lang === "mn" ? `${trim(n / 1e6)} сая ₮` : `₮${trim(n / 1e6)}M`;
  if (abs >= 1e3) return lang === "mn" ? `${trim(n / 1e3)} мянга ₮` : `₮${trim(n / 1e3)}K`;
  return formatMNT(n);
}

export function priceSuffix(t: ListingType, lang: Lang): string {
  if (t === "sale") return "";
  if (t === "short_rent") return lang === "mn" ? " / хоног" : " / night";
  return lang === "mn" ? " / сар" : " / month";
}

/** Mongolian mobile/landline numbers are 8 digits; display as +976 9911 2233 */
export function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("976") && d.length === 11) d = d.slice(3);
  return d;
}
export function isValidMnPhone(raw: string): boolean {
  return /^[5-9]\d{7}$/.test(normalizePhone(raw));
}
export function formatPhone(raw: string): string {
  const d = normalizePhone(raw);
  if (d.length !== 8) return raw;
  return `+976 ${d.slice(0, 4)} ${d.slice(4)}`;
}

const MN_MONTHS = ["1 сар", "2 сар", "3 сар", "4 сар", "5 сар", "6 сар", "7 сар", "8 сар", "9 сар", "10 сар", "11 сар", "12 сар"];
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthLabel(m: number, lang: Lang) {
  return lang === "mn" ? MN_MONTHS[m] : EN_MONTHS[m];
}

export function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  if (lang === "mn") return `${d.getFullYear()} оны ${d.getMonth() + 1} сарын ${d.getDate()}`;
  return `${EN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(iso, lang)}, ${hh}:${mm}`;
}

export function timeAgo(iso: string, lang: Lang): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const mn = lang === "mn";
  if (s < 60) return mn ? "Дөнгөж сая" : "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return mn ? `${m} минутын өмнө` : `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return mn ? `${h} цагийн өмнө` : `${h} h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return mn ? `${days} өдрийн өмнө` : `${days} d ago`;
  return formatDate(iso, lang);
}

/** Mongolian ordinal suffix following vowel harmony: 1 дүгээр, 2 дугаар, 13 дугаар, 40 дүгээр */
export function mnOrdinal(n: number): string {
  const front = new Set([1, 4, 9]);
  const frontTens = new Set([4, 9]);
  let isFront: boolean;
  if (n % 10 !== 0) isFront = front.has(n % 10);
  else if (n % 100 !== 0) isFront = frontTens.has((n / 10) % 10);
  else isFront = false; // зуу, мянга
  return `${n} ${isFront ? "дүгээр" : "дугаар"}`;
}

export function khorooLabel(n: number, lang: Lang) {
  return lang === "mn" ? `${mnOrdinal(n)} хороо` : `Khoroo ${n}`;
}

export function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const m2 = (lang: Lang) => (lang === "mn" ? "м²" : "m²");
