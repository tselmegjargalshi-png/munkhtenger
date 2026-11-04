import type { DistrictConfig } from "./types";

/** Ulaanbaatar districts. Khoroo counts are approximate and editable by admins. */
export const DISTRICTS: DistrictConfig[] = [
  { key: "sukhbaatar", name: { mn: "Сүхбаатар", en: "Sukhbaatar" }, khoroos: 20, enabled: true, popular: true, lat: 47.927, lng: 106.925 },
  { key: "khan_uul", name: { mn: "Хан Уул", en: "Khan Uul" }, khoroos: 25, enabled: true, popular: true, lat: 47.882, lng: 106.905 },
  { key: "bayanzurkh", name: { mn: "Баянзүрх", en: "Bayanzurkh" }, khoroos: 43, enabled: true, popular: true, lat: 47.918, lng: 106.985 },
  { key: "bayangol", name: { mn: "Баянгол", en: "Bayangol" }, khoroos: 34, enabled: true, popular: true, lat: 47.912, lng: 106.86 },
  { key: "chingeltei", name: { mn: "Чингэлтэй", en: "Chingeltei" }, khoroos: 24, enabled: true, popular: true, lat: 47.945, lng: 106.9 },
  { key: "songinokhairkhan", name: { mn: "Сонгинохайрхан", en: "Songinokhairkhan" }, khoroos: 43, enabled: true, popular: true, lat: 47.922, lng: 106.79 },
  { key: "nalaikh", name: { mn: "Налайх", en: "Nalaikh" }, khoroos: 8, enabled: true, popular: false, lat: 47.77, lng: 107.26 },
  { key: "baganuur", name: { mn: "Багануур", en: "Baganuur" }, khoroos: 5, enabled: true, popular: false, lat: 47.79, lng: 108.37 },
  { key: "bagakhangai", name: { mn: "Багахангай", en: "Bagakhangai" }, khoroos: 2, enabled: true, popular: false, lat: 47.33, lng: 107.47 },
];

/** Neighbourhood names used for realistic demo addresses. */
export const AREAS: Record<string, { mn: string; en: string }[]> = {
  sukhbaatar: [
    { mn: "Сөүлийн гудамж", en: "Seoul Street" },
    { mn: "Олимпийн гудамж", en: "Olympic Street" },
    { mn: "Их тойруу", en: "Ikh Toiruu" },
    { mn: "Бага тойруу", en: "Baga Toiruu" },
    { mn: "Үндсэн хуулийн гудамж", en: "Constitution Street" },
  ],
  khan_uul: [
    { mn: "Зайсан", en: "Zaisan" },
    { mn: "Яармаг", en: "Yarmag" },
    { mn: "Буянт Ухаа", en: "Buyant Ukhaa" },
    { mn: "Чингисийн өргөн чөлөө", en: "Chinggis Avenue" },
    { mn: "Наадамчдын зам", en: "Naadamchid Road" },
  ],
  bayanzurkh: [
    { mn: "13 дугаар хороолол", en: "13th Microdistrict" },
    { mn: "15 дугаар хороолол", en: "15th Microdistrict" },
    { mn: "Сансар", en: "Sansar" },
    { mn: "Энхтайвны өргөн чөлөө", en: "Peace Avenue East" },
    { mn: "Амгалан", en: "Amgalan" },
  ],
  bayangol: [
    { mn: "10 дугаар хороолол", en: "10th Microdistrict" },
    { mn: "3, 4 дүгээр хороолол", en: "3rd and 4th Microdistrict" },
    { mn: "Баруун 4 зам", en: "West Crossroads" },
    { mn: "Энхтайвны өргөн чөлөө", en: "Peace Avenue West" },
  ],
  chingeltei: [
    { mn: "Дэнжийн мянга", en: "Denjiin Myanga" },
    { mn: "Хүнсний дөрвөн зам", en: "Khunsnii Crossroads" },
    { mn: "Чингэлтэй уулын энгэр", en: "Chingeltei Hillside" },
    { mn: "Сүхбаатарын гудамж", en: "Sukhbaatar Street" },
  ],
  songinokhairkhan: [
    { mn: "Толгойт", en: "Tolgoit" },
    { mn: "Баянхошуу", en: "Bayankhoshuu" },
    { mn: "Драгон төвийн орчим", en: "Dragon Centre Area" },
    { mn: "Сонгино", en: "Songino" },
  ],
  nalaikh: [{ mn: "Налайх төв", en: "Nalaikh Centre" }],
  baganuur: [{ mn: "Багануур төв", en: "Baganuur Centre" }],
  bagakhangai: [{ mn: "Багахангай төв", en: "Bagakhangai Centre" }],
};

/** Bounding box for the schematic city map (central Ulaanbaatar). */
export const MAP_BOUNDS = { minLat: 47.85, maxLat: 47.98, minLng: 106.73, maxLng: 107.05 };
