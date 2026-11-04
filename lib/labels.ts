import type {
  Category,
  L10n,
  LeadSource,
  LeadStage,
  ListingStatus,
  ListingType,
  NotificationType,
  PaymentMethod,
  Promotion,
  Role,
  ViewingStatus,
  Nearby,
} from "./types";

export const CATEGORY_LABELS: Record<Category, L10n> = {
  apartment: { mn: "Орон сууц", en: "Apartments" },
  house: { mn: "Хаус, вилла", en: "Houses and villas" },
  land: { mn: "Газар", en: "Land" },
  commercial: { mn: "Арилжааны үл хөдлөх", en: "Commercial" },
  office: { mn: "Оффисын талбай", en: "Office spaces" },
  retail: { mn: "Худалдааны талбай", en: "Retail spaces" },
  warehouse: { mn: "Агуулах", en: "Warehouses" },
  new_development: { mn: "Шинэ төсөл", en: "New developments" },
};

export const CATEGORY_ORDER: Category[] = [
  "apartment",
  "house",
  "land",
  "commercial",
  "office",
  "retail",
  "warehouse",
  "new_development",
];

export const LISTING_TYPE_LABELS: Record<ListingType, L10n> = {
  sale: { mn: "Худалдана", en: "For sale" },
  rent: { mn: "Түрээслүүлнэ", en: "For rent" },
  long_lease: { mn: "Урт хугацаагаар түрээслүүлнэ", en: "Long term lease" },
  short_rent: { mn: "Богино хугацаагаар түрээслүүлнэ", en: "Short term rent" },
};

export const LISTING_TYPE_SHORT: Record<ListingType, L10n> = {
  sale: { mn: "Худалдах", en: "Sale" },
  rent: { mn: "Түрээс", en: "Rent" },
  long_lease: { mn: "Урт түрээс", en: "Long lease" },
  short_rent: { mn: "Богино түрээс", en: "Short stay" },
};

export const STATUS_LABELS: Record<ListingStatus, L10n> = {
  draft: { mn: "Ноорог", en: "Draft" },
  pending: { mn: "Хянагдаж байна", en: "Pending review" },
  published: { mn: "Нийтлэгдсэн", en: "Published" },
  rejected: { mn: "Татгалзсан", en: "Rejected" },
  unpublished: { mn: "Нийтлэлээс хассан", en: "Unpublished" },
  sold: { mn: "Зарагдсан", en: "Sold" },
  rented: { mn: "Түрээслэгдсэн", en: "Rented" },
  expired: { mn: "Хугацаа дууссан", en: "Expired" },
};

export const PROMOTION_LABELS: Record<Promotion, L10n> = {
  none: { mn: "Энгийн", en: "Standard" },
  featured: { mn: "Онцлох", en: "Featured" },
  premium: { mn: "Премиум", en: "Premium" },
};

export const ROLE_LABELS: Record<Role, L10n> = {
  super_admin: { mn: "Супер админ", en: "Super Admin" },
  platform_admin: { mn: "Платформын админ", en: "Platform Admin" },
  agency_owner: { mn: "Агентлагийн эзэн", en: "Agency Owner" },
  agent: { mn: "Үл хөдлөхийн агент", en: "Real Estate Agent" },
  owner: { mn: "Өмчлөгч", en: "Property Owner" },
  customer: { mn: "Хэрэглэгч", en: "Customer" },
};

export const LEAD_STAGES: LeadStage[] = ["new", "contacted", "interested", "viewing", "negotiation", "successful", "lost"];

export const LEAD_STAGE_LABELS: Record<LeadStage, L10n> = {
  new: { mn: "Шинэ", en: "New" },
  contacted: { mn: "Холбогдсон", en: "Contacted" },
  interested: { mn: "Сонирхсон", en: "Interested" },
  viewing: { mn: "Үзлэг товлосон", en: "Viewing Scheduled" },
  negotiation: { mn: "Хэлэлцээр", en: "Negotiation" },
  successful: { mn: "Амжилттай", en: "Successful" },
  lost: { mn: "Алдсан", en: "Lost" },
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, L10n> = {
  website: { mn: "Вэбсайт", en: "Website" },
  phone: { mn: "Утсаар", en: "Phone call" },
  walk_in: { mn: "Биечлэн ирсэн", en: "Walk in" },
  referral: { mn: "Санал болголт", en: "Referral" },
  facebook: { mn: "Фэйсбүүк", en: "Facebook" },
  other: { mn: "Бусад", en: "Other" },
};

export const VIEWING_STATUS_LABELS: Record<ViewingStatus, L10n> = {
  requested: { mn: "Хүсэлт ирсэн", en: "Requested" },
  confirmed: { mn: "Баталгаажсан", en: "Confirmed" },
  completed: { mn: "Үзсэн", en: "Completed" },
  cancelled: { mn: "Цуцалсан", en: "Cancelled" },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, L10n> = {
  qpay: { mn: "QPay", en: "QPay" },
  socialpay: { mn: "SocialPay", en: "SocialPay" },
  bank: { mn: "Банкны шилжүүлэг", en: "Bank transfer" },
  cash: { mn: "Бэлэн мөнгө", en: "Cash" },
};

export const NEARBY_LABELS: Record<Nearby["type"], L10n> = {
  school: { mn: "Сургууль", en: "School" },
  hospital: { mn: "Эмнэлэг", en: "Hospital" },
  shop: { mn: "Дэлгүүр", en: "Shopping" },
  transport: { mn: "Нийтийн тээвэр", en: "Transport" },
  park: { mn: "Цэцэрлэгт хүрээлэн", en: "Park" },
  kindergarten: { mn: "Цэцэрлэг", en: "Kindergarten" },
};

export const AMENITIES: Record<string, L10n> = {
  central_heating: { mn: "Төвийн халаалт", en: "Central heating" },
  security: { mn: "24 цагийн харуул", en: "24 hour security" },
  cctv: { mn: "Камерын хяналт", en: "CCTV" },
  playground: { mn: "Хүүхдийн тоглоомын талбай", en: "Playground" },
  gym: { mn: "Фитнес төв", en: "Fitness centre" },
  underground_parking: { mn: "Газар доорх зогсоол", en: "Underground parking" },
  storage: { mn: "Агуулах өрөө", en: "Storage room" },
  internet: { mn: "Өндөр хурдны интернэт", en: "High speed internet" },
  air_conditioning: { mn: "Агааржуулагч", en: "Air conditioning" },
  dishwasher: { mn: "Аяга угаагч", en: "Dishwasher" },
  washer: { mn: "Угаалгын машин", en: "Washing machine" },
  mountain_view: { mn: "Богд уулын үзэмж", en: "Bogd Khan mountain view" },
  city_view: { mn: "Хотын үзэмж", en: "City view" },
  smart_lock: { mn: "Ухаалаг цоож", en: "Smart lock" },
  garden: { mn: "Хашаа, цэцэрлэг", en: "Private garden" },
  sauna: { mn: "Саун", en: "Sauna" },
  fireplace: { mn: "Задгай зуух", en: "Fireplace" },
  concierge: { mn: "Ресепшн үйлчилгээ", en: "Concierge" },
  loading_dock: { mn: "Ачаа буулгах тавцан", en: "Loading dock" },
  three_phase: { mn: "Гурван фазын цахилгаан", en: "Three phase power" },
  water_well: { mn: "Худаг", en: "Water well" },
  fenced: { mn: "Хашаажсан", en: "Fenced" },
  electricity: { mn: "Цахилгаан холбогдсон", en: "Electricity connected" },
  meeting_rooms: { mn: "Хурлын өрөө", en: "Meeting rooms" },
  showroom: { mn: "Гудамж руу харсан витрин", en: "Street facing showroom" },
  heated_floor: { mn: "Халаалттай шал", en: "Heated floors" },
};

export const NOTIFICATION_TEXT: Record<NotificationType, (p: Record<string, string>) => L10n> = {
  inquiry_new: (p) => ({ mn: `${p.name} таны "${p.title}" зарын талаар лавлагаа илгээлээ`, en: `${p.name} sent an inquiry about "${p.titleEn ?? p.title}"` }),
  viewing_new: (p) => ({ mn: `"${p.title}" зарыг үзэх хүсэлт: ${p.date}`, en: `New viewing request for "${p.titleEn ?? p.title}": ${p.date}` }),
  viewing_update: (p) => ({ mn: `"${p.title}" үзлэг ${p.status}: ${p.date}`, en: `Viewing for "${p.titleEn ?? p.title}" is ${p.status}: ${p.date}` }),
  listing_approved: (p) => ({ mn: `Таны "${p.title}" зарыг баталгаажуулж нийтэллээ`, en: `Your listing "${p.titleEn ?? p.title}" was approved and published` }),
  listing_rejected: (p) => ({ mn: `Таны "${p.title}" зарыг татгалзлаа. Шалтгаан: ${p.reason}`, en: `Your listing "${p.titleEn ?? p.title}" was rejected. Reason: ${p.reason}` }),
  listing_expiring: (p) => ({ mn: `"${p.title}" зарын хугацаа ${p.days} хоногийн дараа дуусна`, en: `"${p.titleEn ?? p.title}" expires in ${p.days} days` }),
  listing_expired: (p) => ({ mn: `"${p.title}" зарын хугацаа дууслаа`, en: `"${p.titleEn ?? p.title}" has expired` }),
  message_new: (p) => ({ mn: `${p.name} танд шинэ мессеж илгээлээ`, en: `New message from ${p.name}` }),
  saved_search_match: (p) => ({ mn: `"${p.search}" хайлтад тохирох шинэ зар: ${p.title}`, en: `New match for "${p.search}": ${p.titleEn ?? p.title}` }),
  subscription_expiring: (p) => ({ mn: `${p.plan} багцын хугацаа ${p.days} хоногийн дараа дуусна`, en: `Your ${p.plan} plan expires in ${p.days} days` }),
  subscription_expired: (p) => ({ mn: `${p.plan} багцын хугацаа дууслаа`, en: `Your ${p.plan} plan has expired` }),
  payment: (p) => ({ mn: `Төлбөр ${p.status}: ${p.amount}`, en: `Payment ${p.statusEn ?? p.status}: ${p.amount}` }),
  lead_assigned: (p) => ({ mn: `Танд шинэ харилцагч хуваарилагдлаа: ${p.name}`, en: `A new lead was assigned to you: ${p.name}` }),
  listing_submitted: (p) => ({ mn: `Шинэ зар хянуулахаар ирлээ: "${p.title}"`, en: `New listing awaiting review: "${p.titleEn ?? p.title}"` }),
  agent_verified: () => ({ mn: "Таны агентын бүртгэл баталгаажлаа", en: "Your agent profile has been verified" }),
  reminder: (p) => ({ mn: `Сануулга: ${p.text}`, en: `Reminder: ${p.text}` }),
};
