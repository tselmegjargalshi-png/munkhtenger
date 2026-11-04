import { hashPassword } from "./crypto";
import { AREAS, DISTRICTS } from "./geo";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "./labels";
import { dayKey, mnOrdinal } from "./format";
import type {
  Agency,
  AuditLog,
  Category,
  Db,
  Deal,
  Inquiry,
  L10n,
  Lead,
  LeadSource,
  LeadStage,
  ListingStatus,
  ListingType,
  Nearby,
  Notification,
  Payment,
  PaymentMethod,
  Plan,
  Property,
  Report,
  SavedSearch,
  Subscription,
  User,
  Viewing,
} from "./types";

export const DB_VERSION = 3;
export const DEMO_PASSWORD = "demo1234";

/** Deterministic PRNG so every fresh demo looks the same. */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GIVEN = [
  "Энхжин", "Тэмүүлэн", "Номин", "Билгүүн", "Сарнай", "Өнөболд", "Мөнхзул", "Үүрцайх", "Ариунаа", "Төгөлдөр",
  "Хулан", "Батмөнх", "Гэрэлмаа", "Эрдэнэбат", "Оюунчимэг", "Дөлгөөн", "Анужин", "Тэлмэн", "Солонго", "Ганбаатар",
  "Мишээл", "Хонгор", "Цэцэгмаа", "Өлзий", "Золзаяа", "Наранцэцэг", "Түвшин", "Ирмүүн", "Сэлэнгэ", "Уянга",
  "Отгонбаяр", "Пүрэвдорж", "Даваасүрэн", "Ганзориг", "Энхтуяа", "Мягмар", "Бямбаа", "Жаргал", "Өсөхбаяр", "Үнэнбат",
  "Чинзориг", "Нандин", "Шинэбаяр", "Хүслэн", "Мөнгөнцэцэг", "Үйлстөгс", "Төмөрбаатар", "Өгөөмөр", "Сүхээ", "Ононгоо",
  "Баярмаа", "Тэнүүн", "Гүнжээ", "Эрхэс", "Ууганбаяр",
];
const INITIALS = ["Б", "Г", "Д", "Э", "Ж", "Л", "М", "Н", "О", "П", "С", "Т", "Ц", "Ч", "Ө", "Ү", "Х", "Я"];
const LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m",
  н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "sh", ъ: "", ы: "y", ь: "i", э: "e", ю: "yu", я: "ya",
};
export function translit(s: string) {
  return s
    .toLowerCase()
    .split("")
    .map((c) => (c in LATIN ? LATIN[c] : /[a-z0-9]/.test(c) ? c : ""))
    .join("");
}

const AVATAR_COLORS = ["#1E3A5F", "#2F6B4F", "#A9814A", "#6B4F7A", "#7A4F4F", "#3F6B7A", "#5F5A3E", "#2C5282"];

export function seedDatabase(now = new Date()): Db {
  const rnd = mulberry32(20261104);
  const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
  const int = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
  const chance = (p: number) => rnd() < p;
  const base = new Date(now);
  base.setHours(10, 0, 0, 0);
  const daysAgo = (d: number, h = 0) => new Date(base.getTime() - d * 864e5 - h * 36e5).toISOString();
  const daysAhead = (d: number, h = 0) => new Date(base.getTime() + d * 864e5 + h * 36e5).toISOString();

  let seq = 1000;
  const id = (p: string) => `${p}_${(++seq).toString(36)}`;
  const salt = "demo_salt_v1";
  const pwHash = hashPassword(DEMO_PASSWORD, salt);

  let nameIdx = 0;
  const nextName = () => {
    const g = GIVEN[nameIdx % GIVEN.length];
    const ini = INITIALS[(nameIdx * 7) % INITIALS.length];
    nameIdx++;
    return { full: `${ini}. ${g}`, given: g };
  };
  const phone = () => `${pick(["88", "99", "95", "94", "91", "80", "86", "89"])}${int(100000, 999999)}`;

  const users: User[] = [];
  const mkUser = (role: User["role"], email: string, extra: Partial<User> = {}): User => {
    const n = nextName();
    const u: User = {
      id: id("usr"),
      role,
      name: n.full,
      email,
      phone: phone(),
      passwordHash: pwHash,
      salt,
      avatarColor: pick(AVATAR_COLORS),
      createdAt: daysAgo(int(60, 400)),
      active: true,
      favorites: [],
      recentlyViewed: [],
      demo: true,
      ...extra,
    };
    users.push(u);
    return u;
  };

  const superAdmin = mkUser("super_admin", "superadmin@munkhtenger.mn");
  const platformAdmin = mkUser("platform_admin", "admin@munkhtenger.mn");

  // Agencies
  const AGENCY_DEFS = [
    { name: "Алтан Өргөө Риэлти", district: "sukhbaatar", color: "#A9814A", slug: "altanurguu", d: { mn: "Төвийн бүсийн орон сууц, оффисын зуучлалаар 12 жил ажиллаж буй агентлаг.", en: "A twelve year old agency focused on central apartments and offices." } },
    { name: "Туул Хоум", district: "khan_uul", color: "#2F6B4F", slug: "tuulhome", d: { mn: "Зайсан, Яармагийн хаус, вилла, тансаг зэрэглэлийн орон сууцны мэргэжилтнүүд.", en: "Specialists in Zaisan and Yarmag houses, villas and luxury apartments." } },
    { name: "Богд Үл Хөдлөх", district: "bayanzurkh", color: "#1E3A5F", slug: "bogd", d: { mn: "Гэр бүлд зориулсан орон сууц, шинэ төслийн борлуулалт.", en: "Family apartments and new development sales." } },
    { name: "Сэлэнгэ Эстейт", district: "bayangol", color: "#6B4F7A", slug: "selenge", d: { mn: "Арилжааны үл хөдлөх, худалдааны талбай, агуулахын түрээс.", en: "Commercial property, retail space and warehouse leasing." } },
    { name: "Үүрийн Гэгээ Риэлти", district: "chingeltei", color: "#7A4F4F", slug: "uuriin", d: { mn: "Газар, хашаа байшин, хотын захын хөгжлийн төслүүд.", en: "Land, private houses and suburban development projects." } },
  ];
  const agencies: Agency[] = [];
  const agencyOwners: User[] = [];
  AGENCY_DEFS.forEach((a, i) => {
    const owner = mkUser("agency_owner", i === 0 ? "agency@munkhtenger.mn" : `owner.${a.slug}@munkhtenger.mn`, {
      title: { mn: "Гүйцэтгэх захирал", en: "Managing Director" },
      verified: true,
    });
    const ag: Agency = {
      id: id("agc"),
      name: a.name,
      ownerId: owner.id,
      description: a.d,
      phone: phone(),
      email: `info@${a.slug}.mn`,
      address: `${DISTRICTS.find((d) => d.key === a.district)!.name.mn} дүүрэг, ${pick(AREAS[a.district]).mn}`,
      district: a.district,
      color: a.color,
      verified: i !== 4,
      createdAt: daysAgo(int(300, 900)),
      demo: true,
    };
    owner.agencyId = ag.id;
    agencies.push(ag);
    agencyOwners.push(owner);
  });

  // 15 agents, 3 per agency
  const AGENT_TITLES: L10n[] = [
    { mn: "Ахлах агент", en: "Senior Agent" },
    { mn: "Үл хөдлөхийн зөвлөх", en: "Property Consultant" },
    { mn: "Түрээсийн мэргэжилтэн", en: "Leasing Specialist" },
    { mn: "Арилжааны үл хөдлөхийн агент", en: "Commercial Agent" },
  ];
  const agents: User[] = [];
  for (let i = 0; i < 15; i++) {
    const ag = agencies[i % 5];
    const u = mkUser("agent", i === 0 ? "agent@munkhtenger.mn" : `agent${i + 1}@munkhtenger.mn`, {
      agencyId: ag.id,
      title: AGENT_TITLES[i % AGENT_TITLES.length],
      verified: i < 12,
      experienceYears: int(2, 15),
      languages: chance(0.6) ? ["mn", "en"] : chance(0.5) ? ["mn", "en", "ko"] : ["mn"],
      bio: {
        mn: "Үйлчлүүлэгч бүрийн хэрэгцээг нарийн сонсож, найдвартай гэрээ байгуулахад тусалдаг.",
        en: "Listens closely to every client and helps close safe, transparent deals.",
      },
    });
    agents.push(u);
  }
  // Property owners
  const owners: User[] = [];
  for (let i = 0; i < 3; i++) owners.push(mkUser("owner", i === 0 ? "owner@munkhtenger.mn" : `owner${i + 1}@munkhtenger.mn`));
  // 30 customers
  const customers: User[] = [];
  for (let i = 0; i < 30; i++) {
    const u = mkUser("customer", i === 0 ? "customer@munkhtenger.mn" : "", {});
    if (i > 0) u.email = `${translit(u.name.split(" ")[1])}${i + 1}@demo.mn`;
    customers.push(u);
  }

  // Properties
  type Spec = { cat: Category; type: ListingType; district: string };
  const plan: Spec[] = [];
  const dists = ["sukhbaatar", "khan_uul", "bayanzurkh", "bayangol", "chingeltei", "songinokhairkhan"];
  const add = (cat: Category, n: number, types: ListingType[]) => {
    for (let i = 0; i < n; i++) plan.push({ cat, type: types[i % types.length], district: dists[(plan.length * 5 + i) % dists.length] });
  };
  add("apartment", 20, ["sale", "sale", "rent", "sale", "short_rent", "sale", "rent"]);
  add("house", 7, ["sale", "sale", "rent"]);
  add("land", 5, ["sale", "sale", "long_lease"]);
  add("commercial", 3, ["sale", "long_lease"]);
  add("office", 5, ["rent", "sale", "long_lease"]);
  add("retail", 4, ["rent", "sale"]);
  add("warehouse", 3, ["long_lease", "rent"]);
  add("new_development", 3, ["sale"]);

  const PPM: Record<string, number> = { sukhbaatar: 6.4e6, khan_uul: 5.6e6, bayanzurkh: 4.3e6, bayangol: 4.6e6, chingeltei: 3.9e6, songinokhairkhan: 3.2e6 };
  const round = (n: number, step: number) => Math.round(n / step) * step;

  const SCHOOL_NUMS = [1, 5, 11, 14, 23, 31, 45, 52, 67, 84, 97, 113];
  const mkNearby = (district: string): Nearby[] => {
    const s = pick(SCHOOL_NUMS);
    const k = int(30, 190);
    return [
      { type: "school", name: { mn: `${mnOrdinal(s)} сургууль`, en: `School No. ${s}` }, distanceM: int(200, 900) },
      { type: "kindergarten", name: { mn: `${mnOrdinal(k)} цэцэрлэг`, en: `Kindergarten No. ${k}` }, distanceM: int(150, 700) },
      { type: "hospital", name: { mn: `${DISTRICTS.find((d) => d.key === district)!.name.mn} дүүргийн эрүүл мэндийн төв`, en: `${DISTRICTS.find((d) => d.key === district)!.name.en} District Health Centre` }, distanceM: int(500, 2500) },
      { type: "shop", name: pick([{ mn: "Супермаркет", en: "Supermarket" }, { mn: "Худалдааны төв", en: "Shopping centre" }, { mn: "24 цагийн дэлгүүр", en: "24 hour store" }]), distanceM: int(80, 600) },
      { type: "transport", name: { mn: "Автобусны буудал", en: "Bus stop" }, distanceM: int(50, 450) },
      { type: "park", name: pick([{ mn: "Ногоон байгууламж", en: "Green park" }, { mn: "Туул голын эрэг", en: "Tuul riverside" }, { mn: "Хүүхдийн парк", en: "Children's park" }]), distanceM: int(300, 1800) },
    ];
  };

  const AMEN_BY_CAT: Record<Category, string[]> = {
    apartment: ["central_heating", "security", "cctv", "playground", "underground_parking", "storage", "internet", "washer", "dishwasher", "mountain_view", "city_view", "smart_lock", "gym", "heated_floor"],
    new_development: ["central_heating", "security", "cctv", "playground", "underground_parking", "gym", "concierge", "smart_lock", "mountain_view", "heated_floor"],
    house: ["garden", "sauna", "fireplace", "security", "cctv", "internet", "heated_floor", "mountain_view", "water_well", "fenced", "storage"],
    land: ["fenced", "electricity", "water_well", "mountain_view"],
    commercial: ["security", "cctv", "three_phase", "loading_dock", "underground_parking", "showroom", "internet"],
    office: ["security", "cctv", "meeting_rooms", "internet", "air_conditioning", "underground_parking", "concierge", "city_view"],
    retail: ["showroom", "security", "cctv", "three_phase", "internet", "air_conditioning"],
    warehouse: ["loading_dock", "three_phase", "security", "cctv", "fenced"],
  };

  const IMG_SET: Record<Category, string[]> = {
    apartment: ["apartment", "living", "kitchen", "bedroom", "bath", "view"],
    new_development: ["development", "apartment", "living", "kitchen", "bedroom", "view"],
    house: ["house", "living", "kitchen", "bedroom", "bath", "garden"],
    land: ["land", "landplot", "view"],
    commercial: ["commercial", "officeint", "retailint", "view"],
    office: ["office", "officeint", "meeting", "view"],
    retail: ["retail", "retailint", "view"],
    warehouse: ["warehouse", "warehouseint", "landplot"],
  };

  const statusPlan: ListingStatus[] = new Array(50).fill("published");
  // non published statuses spread around
  ([[3, "pending"], [17, "pending"], [41, "pending"], [9, "rejected"], [12, "sold"], [29, "sold"], [6, "rented"], [33, "rented"], [22, "draft"], [37, "unpublished"]] as [number, ListingStatus][]).forEach(([i, s]) => (statusPlan[i] = s));

  const properties: Property[] = [];
  const agentPool = agents;
  plan.forEach((s, i) => {
    const d = DISTRICTS.find((x) => x.key === s.district)!;
    const area0 = pick(AREAS[s.district]);
    const khoroo = int(1, Math.min(d.khoroos, 20));
    let area = 0, landArea: number | undefined, price = 0, bedrooms = 0, bathrooms = 1, floor = 1, buildingFloors = 1, yearBuilt = 2015;
    const t = s.type;
    const isRent = t !== "sale";
    switch (s.cat) {
      case "apartment":
      case "new_development": {
        bedrooms = s.cat === "new_development" ? int(2, 3) : int(1, 4);
        area = round(32 + bedrooms * 24 + rnd() * 25, 1);
        bathrooms = bedrooms >= 3 ? 2 : 1;
        buildingFloors = s.cat === "new_development" ? int(16, 24) : int(9, 22);
        floor = int(2, buildingFloors);
        yearBuilt = s.cat === "new_development" ? int(2026, 2027) : int(2004, 2024);
        const ppm = PPM[s.district] * (area0.en === "Zaisan" ? 1.25 : 1) * (yearBuilt > 2018 ? 1.08 : 0.92);
        if (t === "sale") price = round(area * ppm, 1e6);
        else if (t === "short_rent") price = round(80000 + bedrooms * 45000, 5000);
        else price = round(area * (PPM[s.district] / 230), 1e5);
        break;
      }
      case "house": {
        bedrooms = int(3, 6);
        area = int(160, 420);
        landArea = int(500, 1500);
        bathrooms = int(2, 4);
        buildingFloors = int(2, 3);
        floor = 1;
        yearBuilt = int(2010, 2025);
        price = t === "sale" ? round(area * PPM[s.district] * 1.35, 1e7) : round(area * 38000, 5e5);
        break;
      }
      case "land": {
        landArea = int(600, 4800);
        area = landArea;
        bedrooms = 0; bathrooms = 0; floor = 0; buildingFloors = 0; yearBuilt = 0;
        price = t === "sale" ? round(landArea * int(90000, 320000), 1e6) : round(landArea * 1500, 1e5);
        break;
      }
      case "commercial": {
        area = int(600, 2400);
        bedrooms = 0; bathrooms = int(2, 8);
        buildingFloors = int(3, 9); floor = 1; yearBuilt = int(2008, 2022);
        price = t === "sale" ? round(area * PPM[s.district] * 0.85, 1e7) : round(area * 32000, 1e5);
        break;
      }
      case "office": {
        area = int(70, 620);
        bedrooms = 0; bathrooms = area > 300 ? 3 : 1;
        buildingFloors = int(8, 26); floor = int(3, buildingFloors); yearBuilt = int(2010, 2024);
        price = t === "sale" ? round(area * PPM[s.district] * 1.05, 1e6) : round(area * int(42000, 65000), 1e5);
        break;
      }
      case "retail": {
        area = int(40, 320);
        bedrooms = 0; bathrooms = 1; buildingFloors = int(5, 16); floor = 1; yearBuilt = int(2008, 2023);
        price = t === "sale" ? round(area * PPM[s.district] * 1.2, 1e6) : round(area * int(55000, 85000), 1e5);
        break;
      }
      case "warehouse": {
        area = int(400, 2600);
        landArea = area * 2;
        bedrooms = 0; bathrooms = 1; buildingFloors = 1; floor = 1; yearBuilt = int(2005, 2021);
        price = round(area * int(12000, 19000), 1e5);
        break;
      }
    }
    const rooms = s.cat === "apartment" || s.cat === "new_development" || s.cat === "house" ? bedrooms + 1 : s.cat === "office" ? Math.max(1, Math.round(area / 60)) : 0;
    const amenPool = AMEN_BY_CAT[s.cat];
    const amenities = amenPool.filter(() => chance(0.55));
    if (amenities.length < 3) amenities.push(...amenPool.slice(0, 3).filter((a) => !amenities.includes(a)));
    const status = statusPlan[i];
    const createdDays = i < 8 ? int(0, 4) : int(5, 80);
    const agent = agentPool[(i * 4 + 1) % agentPool.length];
    const ownerUser = i % 11 === 4 ? owners[i % 3] : undefined;
    const views = status === "published" ? int(40, 1600) : int(0, 120);
    const daily: Property["daily"] = {};
    for (let k = 29; k >= 0; k--) {
      const day = dayKey(new Date(base.getTime() - k * 864e5));
      const v = Math.max(0, Math.round((views / 60) * (0.4 + rnd() * 1.4)));
      daily[day] = [v, chance(0.12) ? 1 : 0, chance(0.2) ? 1 : 0];
    }
    const catL = CATEGORY_LABELS[s.cat];
    const roomPartMn = rooms && (s.cat === "apartment" || s.cat === "new_development") ? `${rooms} өрөө ` : "";
    const roomPartEn = rooms && (s.cat === "apartment" || s.cat === "new_development") ? `${rooms} room ` : "";
    const titleMap: Record<Category, L10n> = {
      apartment: { mn: `${roomPartMn}орон сууц, ${area0.mn}`, en: `${roomPartEn}apartment in ${area0.en}` },
      new_development: { mn: `${roomPartMn}шинэ төслийн орон сууц, ${area0.mn}`, en: `${roomPartEn}new build apartment in ${area0.en}` },
      house: { mn: `${bedrooms} унтлагын өрөөтэй хаус, ${area0.mn}`, en: `${bedrooms} bedroom house in ${area0.en}` },
      land: { mn: `${landArea} м² газар, ${area0.mn}`, en: `${landArea} m² land plot in ${area0.en}` },
      commercial: { mn: `Арилжааны барилга, ${area0.mn}`, en: `Commercial building in ${area0.en}` },
      office: { mn: `${area} м² оффис, ${area0.mn}`, en: `${area} m² office in ${area0.en}` },
      retail: { mn: `Худалдааны талбай, ${area0.mn}`, en: `Retail space in ${area0.en}` },
      warehouse: { mn: `${area} м² агуулах, ${area0.mn}`, en: `${area} m² warehouse in ${area0.en}` },
    };
    const descMn = [
      `${d.name.mn} дүүргийн ${mnOrdinal(khoroo)} хороо, ${area0.mn} орчимд байрлах ${catL.mn.toLowerCase()}.`,
      area && s.cat !== "land" ? `Нийт талбай ${area} м²${floor ? `, ${buildingFloors} давхар барилгын ${floor} дугаар давхарт` : ""}.` : `Газрын хэмжээ ${landArea} м², гэрчилгээ бэлэн.`,
      yearBuilt ? `${yearBuilt} онд ашиглалтад орсон.` : "Дэд бүтцэд ойр, зам талбай сайтай.",
      "Сургууль, цэцэрлэг, дэлгүүр, нийтийн тээвэрт ойрхон.",
      isRent ? "Түрээсийн гэрээ уян хатан, барьцаа нэг сар." : "Банкны зээл, ипотекийн зээлд хамрагдах боломжтой.",
    ].join(" ");
    const descEn = [
      `${catL.en} in Khoroo ${khoroo}, ${d.name.en} District, near ${area0.en}.`,
      area && s.cat !== "land" ? `Total area ${area} m²${floor ? `, floor ${floor} of a ${buildingFloors} storey building` : ""}.` : `Plot size ${landArea} m² with ownership certificate ready.`,
      yearBuilt ? `Completed in ${yearBuilt}.` : "Close to utilities with good road access.",
      "Schools, kindergartens, shops and public transport are all within walking distance.",
      isRent ? "Flexible lease terms with one month deposit." : "Eligible for bank and mortgage financing.",
    ].join(" ");
    const createdAt = daysAgo(createdDays, int(0, 8));
    const p: Property = {
      id: id("prp"),
      code: `MT${(10230 + i * 7).toString()}`,
      title: titleMap[s.cat],
      description: { mn: descMn, en: descEn },
      category: s.cat,
      listingType: t,
      status,
      promotion: "none",
      price,
      area,
      landArea,
      rooms,
      bedrooms,
      bathrooms,
      floor,
      buildingFloors,
      yearBuilt,
      furnished: s.cat === "apartment" || s.cat === "house" ? chance(isRent ? 0.8 : 0.4) : false,
      parking: chance(0.6) || s.cat === "house" || s.cat === "warehouse",
      balcony: s.cat === "apartment" || s.cat === "new_development" ? chance(0.75) : false,
      elevator: buildingFloors >= 6,
      newBuild: s.cat === "new_development" || yearBuilt >= 2024,
      verified: status === "published" ? chance(0.7) : false,
      district: s.district,
      khoroo,
      address: `${d.name.mn} дүүрэг, ${mnOrdinal(khoroo)} хороо, ${area0.mn}`,
      lat: d.lat + (rnd() - 0.5) * 0.026,
      lng: d.lng + (rnd() - 0.5) * 0.04,
      images: IMG_SET[s.cat].map((k, j) => `gen:${k}:${i * 13 + j * 7 + 3}`),
      amenities,
      nearby: mkNearby(s.district),
      agentId: agent.id,
      ownerId: ownerUser?.id,
      agencyId: agent.agencyId,
      views,
      daily,
      createdAt,
      updatedAt: createdAt,
      publishedAt: status === "published" || status === "sold" || status === "rented" ? createdAt : undefined,
      expiresAt: daysAhead(i === 14 ? 4 : int(20, 85)),
      rejectionReason: status === "rejected" ? "Зургийн чанар муу, хаяг дутуу байна." : undefined,
      demo: true,
    };
    properties.push(p);
  });

  // Promotions: 10 premium, 8 featured among published
  const published = properties.filter((p) => p.status === "published");
  published.slice(0, 40).forEach((p, i) => {
    if (i % 4 === 0 && properties.filter((x) => x.promotion === "premium").length < 10) {
      p.promotion = "premium";
      p.promotedUntil = daysAhead(int(5, 28));
      p.verified = true;
    } else if (i % 4 === 2 && properties.filter((x) => x.promotion === "featured").length < 8) {
      p.promotion = "featured";
      p.promotedUntil = daysAhead(int(3, 20));
    }
  });
  // top up premium to exactly 10
  for (const p of published) {
    if (properties.filter((x) => x.promotion === "premium").length >= 10) break;
    if (p.promotion === "none") { p.promotion = "premium"; p.promotedUntil = daysAhead(14); }
  }

  // Inquiries, leads, viewings
  const INQ_MSG = [
    { mn: "Сайн байна уу, энэ байр одоо ч зарагдаагүй юу? Үзэх боломжтой юу?", en: "Hello, is this still available? Could I view it?" },
    { mn: "Үнэ дээр тохиролцох боломж байгаа юу?", en: "Is the price negotiable?" },
    { mn: "Ипотекийн зээлээр авах боломжтой юу? Дэлгэрэнгүй мэдээлэл өгнө үү.", en: "Can I buy this with a mortgage? Please share details." },
    { mn: "Түрээсийн хугацаа хамгийн багадаа хэдэн сар вэ?", en: "What is the minimum lease term?" },
    { mn: "Энэ долоо хоногт үзэж болох уу? Орой 18 цагаас хойш чөлөөтэй.", en: "Can I view it this week? I'm free after 6 pm." },
    { mn: "Зогсоолын төлбөр үнэд багтсан уу?", en: "Is parking included in the price?" },
  ];
  const stages: LeadStage[] = ["new", "new", "contacted", "interested", "viewing", "negotiation", "successful", "lost", "contacted", "interested"];
  const inquiries: Inquiry[] = [];
  const leads: Lead[] = [];
  const viewings: Viewing[] = [];
  const pubProps = properties.filter((p) => p.status === "published");
  for (let i = 0; i < 40; i++) {
    const c = customers[i % 30];
    const p = pubProps[(i * 7) % pubProps.length];
    const createdAt = daysAgo(i < 6 ? int(0, 2) : int(3, 45), int(0, 9));
    const msg = pick(INQ_MSG).mn;
    const stage = i === 0 ? "new" : stages[i % stages.length];
    const agentU = users.find((u) => u.id === p.agentId)!;
    const lead: Lead = {
      id: id("led"),
      customerId: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      agentId: p.agentId,
      agencyId: agentU.agencyId,
      source: "website",
      stage,
      propertyIds: [p.id],
      notes: stage !== "new" ? [{ id: id("nt"), text: "Утсаар холбогдож, сонирхлыг тодрууллаа.", at: createdAt, by: p.agentId }] : [],
      reminders: stage === "contacted" || stage === "interested" ? [{ id: id("rm"), text: "Дахин залгаж, үзлэгийн цаг тохирох", due: daysAhead(int(0, 5)), done: false }] : [],
      history: [{ at: createdAt, type: "inquiry", text: `Вэбсайтаар лавлагаа: ${p.code}` }],
      budget: Math.round(p.price * (0.85 + rnd() * 0.2)),
      createdAt,
      updatedAt: createdAt,
      demo: true,
    };
    if (stage !== "new") lead.history.push({ at: createdAt, type: "stage", text: `Шат: ${stage}`, by: p.agentId });
    leads.push(lead);
    const inq: Inquiry = {
      id: id("inq"),
      propertyId: p.id,
      customerId: c.id,
      agentId: p.agentId,
      name: c.name,
      phone: c.phone,
      email: c.email,
      message: msg,
      status: stage === "new" ? "new" : "replied",
      messages: [{ id: id("msg"), from: "customer", userId: c.id, text: msg, at: createdAt }],
      leadId: lead.id,
      createdAt,
      demo: true,
    };
    if (stage !== "new")
      inq.messages.push({ id: id("msg"), from: "agent", userId: p.agentId, text: "Сайн байна уу, тийм боломжтой. Танд тохирох цагийг хэлээрэй.", at: new Date(new Date(createdAt).getTime() + 3 * 36e5).toISOString() });
    inquiries.push(inq);
  }
  // extra non website leads
  const extraSources: LeadSource[] = ["phone", "walk_in", "referral", "facebook", "phone", "referral", "other", "facebook"];
  extraSources.forEach((src, i) => {
    const n = nextName();
    const a = agents[(i * 2) % 15];
    const createdAt = daysAgo(int(2, 30));
    leads.push({
      id: id("led"),
      name: n.full,
      phone: phone(),
      email: `${translit(n.given)}.lead@demo.mn`,
      agentId: a.id,
      agencyId: a.agencyId,
      source: src,
      stage: pick(["new", "contacted", "interested", "negotiation"] as LeadStage[]),
      propertyIds: [],
      notes: [],
      reminders: [],
      history: [{ at: createdAt, type: "call", text: "Шинэ харилцагч бүртгэв" }],
      createdAt,
      updatedAt: createdAt,
      demo: true,
    });
  });
  for (let i = 0; i < 20; i++) {
    const lead = leads[(i * 2 + 1) % 40];
    const inq = inquiries.find((q) => q.leadId === lead.id)!;
    const status = i < 8 ? (i % 2 ? "confirmed" : "requested") : i < 15 ? "completed" : i < 18 ? "confirmed" : "cancelled";
    const date = status === "completed" ? daysAgo(int(1, 20), -int(1, 7)) : daysAhead(int(0, 10), int(0, 8));
    viewings.push({
      id: id("vwg"),
      propertyId: inq.propertyId,
      customerId: lead.customerId,
      agentId: lead.agentId,
      name: lead.name,
      phone: lead.phone,
      date,
      status,
      note: status === "cancelled" ? "Хэрэглэгч цуцалсан" : "",
      requestedBy: i % 3 === 0 ? "agent" : "customer",
      leadId: lead.id,
      createdAt: daysAgo(int(1, 25)),
      demo: true,
    });
    if (lead.stage === "new" || lead.stage === "contacted") lead.stage = "viewing";
  }

  // Deals
  const deals: Deal[] = [];
  properties
    .filter((p) => p.status === "sold" || p.status === "rented")
    .forEach((p, i) => {
      const kind = p.status === "sold" ? "sale" : "rent";
      deals.push({
        id: id("dl"),
        propertyId: p.id,
        agentId: p.agentId,
        customerId: customers[10 + i].id,
        kind,
        amount: p.price,
        commission: Math.round(kind === "sale" ? p.price * 0.02 : p.price * 0.5),
        status: "completed",
        createdAt: daysAgo(int(20, 60)),
        closedAt: daysAgo(int(1, 19)),
        demo: true,
      });
    });
  leads
    .filter((l) => l.stage === "negotiation" || l.stage === "successful")
    .slice(0, 5)
    .forEach((l) => {
      const p = properties.find((x) => x.id === l.propertyIds[0]);
      if (!p) return;
      const kind = p.listingType === "sale" ? "sale" : "rent";
      deals.push({
        id: id("dl"),
        propertyId: p.id,
        agentId: l.agentId,
        customerId: l.customerId,
        leadId: l.id,
        kind,
        amount: Math.round(p.price * 0.97),
        commission: Math.round(kind === "sale" ? p.price * 0.02 : p.price * 0.5),
        status: l.stage === "successful" ? "completed" : "active",
        createdAt: l.createdAt,
        closedAt: l.stage === "successful" ? daysAgo(int(0, 6)) : undefined,
        demo: true,
      });
    });

  // Plans
  const plans: Plan[] = [
    { id: "plan_free", audience: "agent", name: { mn: "Эхлэл", en: "Starter" }, price: 0, periodDays: 30, listingLimit: 3, featuredSlots: 0, perks: { mn: ["3 хүртэл үнэгүй зар", "Үндсэн статистик", "Лавлагаа хүлээн авах"], en: ["Up to 3 free listings", "Basic statistics", "Receive inquiries"] } },
    { id: "plan_agent_pro", audience: "agent", name: { mn: "Агент Про", en: "Agent Pro" }, price: 59000, periodDays: 30, listingLimit: 25, featuredSlots: 2, highlight: true, perks: { mn: ["25 хүртэл зар", "Сард 2 онцлох зар", "CRM ба сануулга", "Баталгаажсан тэмдэг"], en: ["Up to 25 listings", "2 featured listings per month", "CRM and reminders", "Verified badge"] } },
    { id: "plan_agent_elite", audience: "agent", name: { mn: "Агент Элит", en: "Agent Elite" }, price: 129000, periodDays: 30, listingLimit: 999, featuredSlots: 6, perks: { mn: ["Хязгааргүй зар", "Сард 6 онцлох зар", "Дэлгэрэнгүй аналитик", "Нүүр хуудсанд профайл"], en: ["Unlimited listings", "6 featured listings per month", "Advanced analytics", "Homepage profile spot"] } },
    { id: "plan_agency_team", audience: "agency", name: { mn: "Баг", en: "Team" }, price: 290000, periodDays: 30, listingLimit: 100, featuredSlots: 8, perks: { mn: ["5 хүртэл агент", "100 зар", "Харилцагч хуваарилах", "Багийн тайлан"], en: ["Up to 5 agents", "100 listings", "Lead assignment", "Team reports"] } },
    { id: "plan_agency_business", audience: "agency", name: { mn: "Бизнес", en: "Business" }, price: 590000, periodDays: 30, listingLimit: 300, featuredSlots: 20, highlight: true, perks: { mn: ["15 хүртэл агент", "300 зар", "Агентын идэвхийн хяналт", "Брэндтэй агентлагийн хуудас"], en: ["Up to 15 agents", "300 listings", "Agent activity tracking", "Branded agency page"] } },
    { id: "plan_agency_enterprise", audience: "agency", name: { mn: "Корпорац", en: "Enterprise" }, price: 990000, periodDays: 30, listingLimit: 9999, featuredSlots: 50, perks: { mn: ["Хязгааргүй агент", "Хязгааргүй зар", "Тусгай менежер", "API холболт (удахгүй)"], en: ["Unlimited agents", "Unlimited listings", "Dedicated manager", "API access (coming soon)"] } },
    { id: "promo_featured_7", audience: "listing", name: { mn: "Онцлох, 7 хоног", en: "Featured, 7 days" }, price: 25000, periodDays: 7, listingLimit: 1, featuredSlots: 0, promotion: "featured", perks: { mn: ["Хайлтын дээд хэсэгт", "Онцлох тэмдэг"], en: ["Top of search results", "Featured badge"] } },
    { id: "promo_featured_30", audience: "listing", name: { mn: "Онцлох, 30 хоног", en: "Featured, 30 days" }, price: 79000, periodDays: 30, listingLimit: 1, featuredSlots: 0, promotion: "featured", perks: { mn: ["Хайлтын дээд хэсэгт", "Онцлох тэмдэг", "Нүүр хуудсанд"], en: ["Top of search results", "Featured badge", "Homepage placement"] } },
    { id: "promo_premium_14", audience: "listing", name: { mn: "Премиум, 14 хоног", en: "Premium, 14 days" }, price: 99000, periodDays: 14, listingLimit: 1, featuredSlots: 0, promotion: "premium", highlight: true, perks: { mn: ["Премиум хэсэгт байрлана", "Том зурагтай карт", "Хайлтын эхэнд"], en: ["Premium section placement", "Large photo card", "First in search"] } },
    { id: "promo_premium_30", audience: "listing", name: { mn: "Премиум, 30 хоног", en: "Premium, 30 days" }, price: 179000, periodDays: 30, listingLimit: 1, featuredSlots: 0, promotion: "premium", perks: { mn: ["Премиум хэсэгт байрлана", "Том зурагтай карт", "Хайлтын эхэнд", "Сошиал сурталчилгаа"], en: ["Premium section placement", "Large photo card", "First in search", "Social promotion"] } },
  ];

  // Payments & subscriptions spread over 6 months
  const payments: Payment[] = [];
  const subscriptions: Subscription[] = [];
  const methods: PaymentMethod[] = ["qpay", "socialpay", "bank", "cash", "qpay", "qpay"];
  const ref = () => `MT${int(100000, 999999)}`;
  agents.forEach((a, i) => {
    const pl = plans[i % 3 === 0 ? 2 : 1];
    for (let m = 5; m >= 0; m--) {
      if (m > 3 && i % 2) continue;
      const created = daysAgo(m * 30 + int(0, 5));
      const pay: Payment = { id: id("pay"), userId: a.id, amount: pl.price, method: pick(methods), status: "paid", purpose: "subscription", planId: pl.id, reference: ref(), createdAt: created, paidAt: created, demo: true };
      payments.push(pay);
      if (m === 0) subscriptions.push({ id: id("sub"), userId: a.id, planId: pl.id, startAt: created, endAt: i === 0 ? daysAhead(5) : new Date(new Date(created).getTime() + 30 * 864e5).toISOString(), status: "active", paymentId: pay.id, demo: true });
    }
  });
  agencyOwners.forEach((o, i) => {
    const pl = plans[3 + (i % 3)];
    for (let m = 5; m >= 0; m--) {
      const created = daysAgo(m * 30 + int(0, 4));
      const pay: Payment = { id: id("pay"), userId: o.id, amount: pl.price, method: pick(["bank", "qpay"] as PaymentMethod[]), status: "paid", purpose: "subscription", planId: pl.id, reference: ref(), createdAt: created, paidAt: created, demo: true };
      payments.push(pay);
      if (m === 0) subscriptions.push({ id: id("sub"), userId: o.id, agencyId: o.agencyId, planId: pl.id, startAt: created, endAt: new Date(new Date(created).getTime() + 30 * 864e5).toISOString(), status: "active", paymentId: pay.id, demo: true });
    }
  });
  properties.filter((p) => p.promotion !== "none").forEach((p) => {
    const pl = plans.find((x) => x.id === (p.promotion === "premium" ? "promo_premium_14" : "promo_featured_7"))!;
    const created = daysAgo(int(1, 12));
    payments.push({ id: id("pay"), userId: p.agentId, amount: pl.price, method: pick(methods), status: "paid", purpose: p.promotion === "premium" ? "premium" : "featured", planId: pl.id, propertyId: p.id, reference: ref(), createdAt: created, paidAt: created, demo: true });
  });
  // a pending bank transfer and cash for admin to confirm
  payments.push({ id: id("pay"), userId: agents[3].id, amount: 79000, method: "bank", status: "pending", purpose: "featured", planId: "promo_featured_30", propertyId: pubProps[5].id, reference: ref(), createdAt: daysAgo(0, 2), demo: true });
  payments.push({ id: id("pay"), userId: agents[6].id, amount: 59000, method: "cash", status: "pending", purpose: "subscription", planId: "plan_agent_pro", reference: ref(), createdAt: daysAgo(1), demo: true });

  // Favorites, recently viewed for demo customer
  const cust = customers[0];
  cust.favorites = [pubProps[1].id, pubProps[4].id, pubProps[9].id];
  cust.recentlyViewed = [pubProps[2].id, pubProps[4].id, pubProps[11].id, pubProps[1].id];

  const savedSearches: SavedSearch[] = [
    { id: id("ss"), userId: cust.id, name: "Хан Уул, 3 өрөө, худалдах", query: "district=khan_uul&type=sale&category=apartment&beds=2", notify: true, createdAt: daysAgo(10) },
    { id: id("ss"), userId: cust.id, name: "Сүхбаатар түрээс", query: "district=sukhbaatar&type=rent", notify: true, createdAt: daysAgo(4) },
  ];

  const notifications: Notification[] = [];
  const note = (userId: string, type: Notification["type"], params: Record<string, string>, link: string, d: number, read = false) =>
    notifications.push({ id: id("ntf"), userId, type, params, link, read, createdAt: daysAgo(d, int(0, 6)) });
  inquiries.slice(0, 6).forEach((q, i) => {
    const p = properties.find((x) => x.id === q.propertyId)!;
    note(q.agentId, "inquiry_new", { name: q.name, title: p.title.mn }, "/dashboard/agent/inquiries", i % 3, i > 2);
  });
  properties.filter((p) => p.status === "pending").forEach((p) => {
    note(platformAdmin.id, "listing_submitted", { title: p.title.mn }, "/dashboard/admin/listings?status=pending", 1);
    note(superAdmin.id, "listing_submitted", { title: p.title.mn }, "/dashboard/admin/listings?status=pending", 1);
  });
  note(cust.id, "saved_search_match", { search: savedSearches[0].name, title: pubProps[3].title.mn }, `/properties/${pubProps[3].id}`, 1);
  note(cust.id, "message_new", { name: users.find((u) => u.id === inquiries[0].agentId)!.name }, "/account/inquiries", 2, true);
  note(agents[0].id, "subscription_expiring", { plan: "Agent Elite", days: "5" }, "/pricing", 0);

  const audit: AuditLog[] = [
    { id: id("aud"), actorId: platformAdmin.id, action: "listing.approve", targetType: "property", targetId: pubProps[0].id, details: pubProps[0].code, at: daysAgo(3) },
    { id: id("aud"), actorId: platformAdmin.id, action: "listing.reject", targetType: "property", targetId: properties[9].id, details: properties[9].code, at: daysAgo(2) },
    { id: id("aud"), actorId: superAdmin.id, action: "agent.verify", targetType: "user", targetId: agents[1].id, details: agents[1].name, at: daysAgo(6) },
  ];

  const reports: Report[] = [
    { id: id("rpt"), propertyId: pubProps[7].id, reporterId: customers[4].id, reason: "sold", details: "Утсаар асуухад аль хэдийн зарагдсан гэсэн.", status: "open", createdAt: daysAgo(1) },
    { id: id("rpt"), propertyId: pubProps[15].id, reporterId: customers[8].id, reason: "incorrect", details: "Талбайн хэмжээ буруу бичигдсэн байж магадгүй.", status: "open", createdAt: daysAgo(3) },
    { id: id("rpt"), propertyId: pubProps[20].id, reason: "duplicate", details: "Ижил зар хоёр удаа орсон.", status: "resolved", createdAt: daysAgo(9) },
  ];

  return {
    version: DB_VERSION,
    seededAt: now.toISOString(),
    users,
    agencies,
    properties,
    inquiries,
    viewings,
    leads,
    deals,
    plans,
    subscriptions,
    payments,
    notifications,
    savedSearches,
    audit,
    reports,
    districts: DISTRICTS.map((d) => ({ ...d })),
    categories: CATEGORY_ORDER.map((k, i) => ({ key: k, name: { ...CATEGORY_LABELS[k] }, enabled: true, order: i })),
    content: {
      heroTitle: { mn: "Улаанбаатарт гэрээ олох хамгийн найдвартай зам", en: "The most trusted way to find your place in Ulaanbaatar" },
      heroSubtitle: { mn: "Баталгаажсан агентууд, шалгагдсан зарууд, ил тод үнэ.", en: "Verified agents, reviewed listings and transparent prices." },
      announcement: { mn: "Энэ бол демо хувилбар. Бүх зар, хэрэглэгч, төлбөр зохиомол.", en: "This is a demo. All listings, users and payments are fictional." },
      announcementOn: true,
      aboutText: {
        mn: "Мөнхтэнгэр бол Монголын үл хөдлөх хөрөнгийн зах зээлд итгэлцэл, ил тод байдлыг бий болгох зорилготой платформ.",
        en: "Munkhtenger is a platform built to bring trust and transparency to the Mongolian property market.",
      },
      contactPhone: "77001234",
      contactEmail: "hello@munkhtenger.mn",
    },
    seq,
  };
}

export const DEMO_ACCOUNTS: { email: string; role: User["role"] }[] = [
  { email: "superadmin@munkhtenger.mn", role: "super_admin" },
  { email: "admin@munkhtenger.mn", role: "platform_admin" },
  { email: "agency@munkhtenger.mn", role: "agency_owner" },
  { email: "agent@munkhtenger.mn", role: "agent" },
  { email: "owner@munkhtenger.mn", role: "owner" },
  { email: "customer@munkhtenger.mn", role: "customer" },
];
