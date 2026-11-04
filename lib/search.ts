import type { Db, Property } from "./types";

export interface Filters {
  q: string;
  district: string;
  khoroo: number;
  category: string;
  type: string;
  min: number;
  max: number;
  beds: number;
  baths: number;
  amin: number;
  amax: number;
  floor: number; // exact floor number, 0 = any
  floors: number; // minimum building floors
  age: number; // maximum building age in years, 0 = any
  furnished: "" | "yes" | "no";
  parking: boolean;
  balcony: boolean;
  elevator: boolean;
  newbuild: boolean;
  verified: boolean;
  sort: "recommended" | "price_asc" | "price_desc" | "newest" | "popular";
  bbox: [number, number, number, number] | null; // minLat, minLng, maxLat, maxLng
}

const num = (v: string | null) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n >= 0 ? n : 0;
};

export function parseFilters(sp: URLSearchParams): Filters {
  const sort = sp.get("sort") as Filters["sort"] | null;
  const bb = sp.get("bbox")?.split(",").map(Number);
  return {
    q: (sp.get("q") ?? "").trim(),
    district: sp.get("district") ?? "",
    khoroo: num(sp.get("khoroo")),
    category: sp.get("category") ?? "",
    type: sp.get("type") ?? "",
    min: num(sp.get("min")),
    max: num(sp.get("max")),
    beds: num(sp.get("beds")),
    baths: num(sp.get("baths")),
    amin: num(sp.get("amin")),
    amax: num(sp.get("amax")),
    floor: num(sp.get("floor")),
    floors: num(sp.get("floors")),
    age: num(sp.get("age")),
    furnished: sp.get("furnished") === "yes" ? "yes" : sp.get("furnished") === "no" ? "no" : "",
    parking: sp.get("parking") === "1",
    balcony: sp.get("balcony") === "1",
    elevator: sp.get("elevator") === "1",
    newbuild: sp.get("newbuild") === "1",
    verified: sp.get("verified") === "1",
    sort: sort && ["price_asc", "price_desc", "newest", "popular"].includes(sort) ? sort : "recommended",
    bbox: bb && bb.length === 4 && bb.every(Number.isFinite) ? (bb as [number, number, number, number]) : null,
  };
}

/** Keys that are not filters (view, page) never make it into saved searches. */
export const NON_FILTER_KEYS = ["page", "view"];

export function matchesFilters(p: Property, f: Filters, db: Db): boolean {
  if (p.status !== "published") return false;
  if (new Date(p.expiresAt).getTime() < Date.now()) return false;
  const cat = db.categories.find((c) => c.key === p.category);
  if (cat && !cat.enabled) return false;
  const dist = db.districts.find((d) => d.key === p.district);
  if (dist && !dist.enabled) return false;
  if (f.district && p.district !== f.district) return false;
  if (f.khoroo && p.khoroo !== f.khoroo) return false;
  if (f.category && p.category !== f.category) return false;
  if (f.type && p.listingType !== f.type) return false;
  if (f.min && p.price < f.min) return false;
  if (f.max && p.price > f.max) return false;
  if (f.beds && p.bedrooms < f.beds) return false;
  if (f.baths && p.bathrooms < f.baths) return false;
  if (f.amin && p.area < f.amin) return false;
  if (f.amax && p.area > f.amax) return false;
  if (f.floor && p.floor !== f.floor) return false;
  if (f.floors && p.buildingFloors < f.floors) return false;
  if (f.age && (!p.yearBuilt || new Date().getFullYear() - p.yearBuilt > f.age)) return false;
  if (f.furnished === "yes" && !p.furnished) return false;
  if (f.furnished === "no" && p.furnished) return false;
  if (f.parking && !p.parking) return false;
  if (f.balcony && !p.balcony) return false;
  if (f.elevator && !p.elevator) return false;
  if (f.newbuild && !p.newBuild) return false;
  if (f.verified && !p.verified) return false;
  if (f.bbox) {
    const [a, b, c, d] = f.bbox;
    if (p.lat < a || p.lat > c || p.lng < b || p.lng > d) return false;
  }
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = `${p.code} ${p.title.mn} ${p.title.en} ${p.address} ${p.description.mn}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

const promoRank = (p: Property) => (p.promotion === "premium" ? 2 : p.promotion === "featured" ? 1 : 0);

export function searchProperties(db: Db, f: Filters): Property[] {
  const list = db.properties.filter((p) => matchesFilters(p, f, db));
  const byDate = (a: Property, b: Property) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime();
  switch (f.sort) {
    case "price_asc":
      return list.sort((a, b) => a.price - b.price);
    case "price_desc":
      return list.sort((a, b) => b.price - a.price);
    case "newest":
      return list.sort(byDate);
    case "popular":
      return list.sort((a, b) => b.views - a.views);
    default:
      return list.sort((a, b) => promoRank(b) - promoRank(a) || byDate(a, b));
  }
}

export function activeFilterCount(f: Filters): number {
  let n = 0;
  for (const k of ["district", "khoroo", "category", "type", "min", "max", "beds", "baths", "amin", "amax", "floor", "floors", "age", "furnished", "q"] as const) if (f[k]) n++;
  for (const k of ["parking", "balcony", "elevator", "newbuild", "verified"] as const) if (f[k]) n++;
  if (f.bbox) n++;
  return n;
}

export function publicProperties(db: Db): Property[] {
  return db.properties.filter((p) => p.status === "published" && new Date(p.expiresAt).getTime() > Date.now());
}

export function similarProperties(db: Db, p: Property, n = 4): Property[] {
  return publicProperties(db)
    .filter((x) => x.id !== p.id)
    .map((x) => {
      let score = 0;
      if (x.category === p.category) score += 4;
      if (x.listingType === p.listingType) score += 3;
      if (x.district === p.district) score += 2;
      const ratio = Math.abs(x.price - p.price) / p.price;
      score += Math.max(0, 2 - ratio * 2);
      return { x, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((r) => r.x);
}
