import { z } from "zod";
import { hashPassword, randomSalt } from "./crypto";
import { dayKey, isValidMnPhone, normalizePhone } from "./format";
import { canManageProperty, isAdmin, scopeUserIds } from "./perms";
import { AppError, currentUser, mutate, nextId, setSession } from "./store";
import { matchesFilters, parseFilters } from "./search";
import type {
  Db,
  Deal,
  Lead,
  LeadSource,
  LeadStage,
  Notification,
  NotificationType,
  PaymentMethod,
  Property,
  Role,
  User,
  Viewing,
  ViewingStatus,
} from "./types";

const nowIso = () => new Date().toISOString();
const avatarColors = ["#1E3A5F", "#2F6B4F", "#A9814A", "#6B4F7A", "#7A4F4F", "#3F6B7A"];

// ---------- helpers ----------
export function requireUser(): User {
  const u = currentUser();
  if (!u) throw new AppError("Нэвтэрнэ үү", "Please sign in first");
  return u;
}
function requireAdmin(): User {
  const u = requireUser();
  if (!isAdmin(u)) throw new AppError("Админы эрх шаардлагатай", "Admin permission required");
  return u;
}
function forbidden(): never {
  throw new AppError("Танд энэ үйлдлийг хийх эрх байхгүй", "You do not have permission to do this");
}
export function notify(db: Db, userId: string, type: NotificationType, params: Record<string, string>, link: string) {
  const n: Notification = { id: nextId(db, "ntf"), userId, type, params, link, read: false, createdAt: nowIso() };
  db.notifications.unshift(n);
}
export function audit(db: Db, actorId: string, action: string, targetType: string, targetId: string, details: string) {
  db.audit.unshift({ id: nextId(db, "aud"), actorId, action, targetType, targetId, details, at: nowIso() });
}
function adminIds(db: Db) {
  return db.users.filter((u) => (u.role === "platform_admin" || u.role === "super_admin") && u.active).map((u) => u.id);
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const first = r.error.issues[0];
    const msg = first?.message ?? "Invalid";
    const [mn, en] = msg.includes("|") ? msg.split("|") : [msg, msg];
    throw new AppError(mn, en);
  }
  return r.data;
}

// ---------- auth ----------
const registerSchema = z.object({
  name: z.string().trim().min(2, "Нэрээ оруулна уу|Please enter your name"),
  email: z.string().trim().toLowerCase().email("Имэйл буруу байна|Invalid email address"),
  phone: z.string().refine(isValidMnPhone, "Утасны дугаар 8 оронтой байх ёстой|Phone number must be 8 digits"),
  password: z.string().min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт|Password needs at least 8 characters"),
  role: z.enum(["customer", "owner", "agent"]),
});

export function register(input: { name: string; email: string; phone: string; password: string; role: "customer" | "owner" | "agent" }) {
  const v = parse(registerSchema, input);
  const created = mutate((db) => {
    if (db.users.some((u) => u.email.toLowerCase() === v.email)) throw new AppError("Энэ имэйл бүртгэлтэй байна", "This email is already registered");
    const salt = randomSalt();
    const user: User = {
      id: nextId(db, "usr"),
      role: v.role as Role,
      name: v.name,
      email: v.email,
      phone: normalizePhone(v.phone),
      passwordHash: hashPassword(v.password, salt),
      salt,
      avatarColor: avatarColors[db.users.length % avatarColors.length],
      createdAt: nowIso(),
      lastLoginAt: nowIso(),
      active: true,
      favorites: [],
      recentlyViewed: [],
      verified: false,
      demo: false,
    };
    db.users.push(user);
    if (v.role === "agent") adminIds(db).forEach((a) => notify(db, a, "listing_submitted", { title: `${user.name} (agent)` }, "/dashboard/admin/people"));
    return user;
  });
  setSession(created.id);
  return created;
}

export function login(email: string, password: string): User {
  const e = email.trim().toLowerCase();
  const res = mutate((db) => {
    const u = db.users.find((x) => x.email.toLowerCase() === e);
    if (!u || u.passwordHash !== hashPassword(password, u.salt)) throw new AppError("Имэйл эсвэл нууц үг буруу", "Incorrect email or password");
    if (!u.active) throw new AppError("Таны эрх түр хаагдсан байна", "This account has been suspended");
    u.lastLoginAt = nowIso();
    return u;
  });
  setSession(res.id);
  return res;
}

export function logout() {
  setSession(null);
}

export function updateProfile(patch: Partial<Pick<User, "name" | "phone" | "email" | "avatar">> & { bio?: { mn: string; en: string }; title?: { mn: string; en: string } }) {
  const me = requireUser();
  const schema = z.object({
    name: z.string().trim().min(2, "Нэрээ оруулна уу|Please enter your name").optional(),
    phone: z.string().refine(isValidMnPhone, "Утасны дугаар 8 оронтой байх ёстой|Phone number must be 8 digits").optional(),
    email: z.string().trim().toLowerCase().email("Имэйл буруу байна|Invalid email address").optional(),
  });
  parse(schema, patch);
  mutate((db) => {
    const u = db.users.find((x) => x.id === me.id)!;
    if (patch.email && patch.email.toLowerCase() !== u.email && db.users.some((x) => x.email.toLowerCase() === patch.email!.toLowerCase()))
      throw new AppError("Энэ имэйл бүртгэлтэй байна", "This email is already registered");
    if (patch.name) u.name = patch.name.trim();
    if (patch.phone) u.phone = normalizePhone(patch.phone);
    if (patch.email) u.email = patch.email.trim().toLowerCase();
    if (patch.avatar !== undefined) u.avatar = patch.avatar || undefined;
    if (patch.bio) u.bio = patch.bio;
    if (patch.title) u.title = patch.title;
  });
}

export function changePassword(oldPw: string, newPw: string) {
  const me = requireUser();
  if (newPw.length < 8) throw new AppError("Нууц үг хамгийн багадаа 8 тэмдэгт", "Password needs at least 8 characters");
  mutate((db) => {
    const u = db.users.find((x) => x.id === me.id)!;
    if (u.passwordHash !== hashPassword(oldPw, u.salt)) throw new AppError("Одоогийн нууц үг буруу", "Current password is incorrect");
    u.salt = randomSalt();
    u.passwordHash = hashPassword(newPw, u.salt);
  });
}

// ---------- favorites / recently viewed / views ----------
export function toggleFavorite(propertyId: string): boolean {
  const me = requireUser();
  return mutate((db) => {
    const u = db.users.find((x) => x.id === me.id)!;
    const p = db.properties.find((x) => x.id === propertyId);
    const day = dayKey(new Date());
    const on = !u.favorites.includes(propertyId);
    u.favorites = on ? [propertyId, ...u.favorites] : u.favorites.filter((x) => x !== propertyId);
    if (p && on) {
      p.daily[day] = p.daily[day] ?? [0, 0, 0];
      p.daily[day][2] += 1;
    }
    return on;
  });
}

export function trackView(propertyId: string) {
  const me = currentUser();
  const key = "mt_viewed_session";
  try {
    const seen: string[] = JSON.parse(sessionStorage.getItem(key) || "[]");
    if (!seen.includes(propertyId)) {
      seen.push(propertyId);
      sessionStorage.setItem(key, JSON.stringify(seen));
      mutate((db) => {
        const p = db.properties.find((x) => x.id === propertyId);
        if (!p) return;
        p.views += 1;
        const day = dayKey(new Date());
        p.daily[day] = p.daily[day] ?? [0, 0, 0];
        p.daily[day][0] += 1;
      });
    }
  } catch {}
  if (me) {
    mutate((db) => {
      const u = db.users.find((x) => x.id === me.id);
      if (u) u.recentlyViewed = [propertyId, ...u.recentlyViewed.filter((x) => x !== propertyId)].slice(0, 12);
    });
  } else {
    try {
      const list: string[] = JSON.parse(localStorage.getItem("mt_recent_guest") || "[]");
      localStorage.setItem("mt_recent_guest", JSON.stringify([propertyId, ...list.filter((x) => x !== propertyId)].slice(0, 12)));
    } catch {}
  }
}

// ---------- properties ----------
const propertySchema = z.object({
  title: z.object({ mn: z.string().trim().min(3, "Гарчиг оруулна уу|Please enter a title"), en: z.string().trim() }),
  description: z.object({ mn: z.string().trim().min(10, "Тайлбар дор хаяж 10 тэмдэгт|Description needs at least 10 characters"), en: z.string().trim() }),
  category: z.string(),
  listingType: z.string(),
  price: z.number().positive("Үнэ 0 ээс их байх ёстой|Price must be above 0").max(1e13, "Үнэ хэт өндөр байна|Price is too high"),
  area: z.number().positive("Талбай 0 ээс их байх ёстой|Area must be above 0").max(1e7),
  rooms: z.number().min(0).max(99),
  bedrooms: z.number().min(0).max(99),
  bathrooms: z.number().min(0).max(99),
  floor: z.number().min(0).max(200),
  buildingFloors: z.number().min(0).max(200),
  yearBuilt: z.number().min(0).max(2100),
  district: z.string().min(1, "Дүүрэг сонгоно уу|Choose a district"),
  khoroo: z.number().min(1, "Хороо сонгоно уу|Choose a khoroo").max(99),
  address: z.string().trim().min(3, "Хаяг оруулна уу|Please enter an address"),
  images: z.array(z.string()).min(1, "Дор хаяж нэг зураг оруулна уу|Add at least one photo").max(20),
});

export type PropertyInput = Omit<Property, "id" | "code" | "status" | "promotion" | "views" | "daily" | "createdAt" | "updatedAt" | "demo" | "agentId" | "agencyId" | "verified" | "expiresAt" | "promotedUntil" | "publishedAt" | "rejectionReason" | "ownerId"> & { agentId?: string };

export function activePlanFor(db: Db, userId: string) {
  const u = db.users.find((x) => x.id === userId);
  const now = Date.now();
  const subs = db.subscriptions.filter((s) => s.status === "active" && new Date(s.endAt).getTime() > now && (s.userId === userId || (u?.agencyId && s.agencyId === u.agencyId)));
  const plans = subs.map((s) => db.plans.find((p) => p.id === s.planId)!).filter(Boolean);
  return plans.sort((a, b) => b.listingLimit - a.listingLimit)[0] ?? db.plans.find((p) => p.id === "plan_free")!;
}

export function createProperty(input: PropertyInput, submit: boolean): Property {
  const me = requireUser();
  if (!["agent", "agency_owner", "owner", "platform_admin", "super_admin"].includes(me.role)) forbidden();
  parse(propertySchema, input);
  return mutate((db) => {
    const owner = me;
    const agentId = isAdmin(me) && input.agentId ? input.agentId : me.id;
    const agentUser = db.users.find((u) => u.id === agentId)!;
    const plan = activePlanFor(db, agentId);
    const used = db.properties.filter((p) => p.agentId === agentId && ["pending", "published", "unpublished"].includes(p.status)).length;
    if (submit && !isAdmin(me) && used >= plan.listingLimit)
      throw new AppError(`Таны багц ${plan.listingLimit} зар нийтлэх эрхтэй. Багцаа ахиулна уу.`, `Your plan allows ${plan.listingLimit} listings. Please upgrade.`);
    db.seq += 1;
    const code = `MT${10230 + db.properties.length * 7 + db.seq % 7}`;
    const p: Property = {
      ...input,
      id: nextId(db, "prp"),
      code: db.properties.some((x) => x.code === code) ? `MT${20000 + db.seq}` : code,
      status: submit ? (isAdmin(me) ? "published" : "pending") : "draft",
      promotion: "none",
      views: 0,
      daily: {},
      agentId,
      ownerId: me.role === "owner" ? me.id : undefined,
      agencyId: agentUser.agencyId,
      verified: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      publishedAt: submit && isAdmin(me) ? nowIso() : undefined,
      expiresAt: new Date(Date.now() + 60 * 864e5).toISOString(),
      demo: false,
    };
    db.properties.unshift(p);
    if (submit && !isAdmin(me)) adminIds(db).forEach((a) => notify(db, a, "listing_submitted", { title: p.title.mn || p.title.en, titleEn: p.title.en || p.title.mn }, "/dashboard/admin/listings?status=pending"));
    void owner;
    return p;
  });
}

export function updateProperty(id: string, patch: Partial<Property>, submit?: boolean) {
  const me = requireUser();
  mutate((db) => {
    const p = db.properties.find((x) => x.id === id);
    if (!p) throw new AppError("Зар олдсонгүй", "Listing not found");
    if (!canManageProperty(me, p)) forbidden();
    const EDITABLE = ["title", "description", "category", "listingType", "price", "area", "landArea", "rooms", "bedrooms", "bathrooms", "floor", "buildingFloors", "yearBuilt", "furnished", "parking", "balcony", "elevator", "newBuild", "district", "khoroo", "address", "lat", "lng", "images", "amenities", "nearby"] as const;
    const clean = patch as Record<string, unknown>;
    parse(propertySchema.partial(), Object.fromEntries(EDITABLE.filter((k) => k in clean).map((k) => [k, clean[k]])));
    for (const k of EDITABLE) if (k in clean) (p as unknown as Record<string, unknown>)[k] = clean[k];
    if (patch.agentId && isAdmin(me)) p.agentId = patch.agentId;
    p.updatedAt = nowIso();
    if (submit && (p.status === "draft" || p.status === "rejected")) {
      p.status = isAdmin(me) ? "published" : "pending";
      p.rejectionReason = undefined;
      if (p.status === "pending") adminIds(db).forEach((a) => notify(db, a, "listing_submitted", { title: p.title.mn, titleEn: p.title.en || p.title.mn }, "/dashboard/admin/listings?status=pending"));
    } else if (p.status === "published" && !isAdmin(me)) {
      // material edits on live listings go back to review
      p.status = "pending";
      p.verified = false;
      adminIds(db).forEach((a) => notify(db, a, "listing_submitted", { title: p.title.mn, titleEn: p.title.en || p.title.mn }, "/dashboard/admin/listings?status=pending"));
    }
  });
}

export function deleteProperty(id: string) {
  const me = requireUser();
  mutate((db) => {
    const p = db.properties.find((x) => x.id === id);
    if (!p) return;
    if (!canManageProperty(me, p)) forbidden();
    db.properties = db.properties.filter((x) => x.id !== id);
    db.users.forEach((u) => {
      u.favorites = u.favorites.filter((f) => f !== id);
      u.recentlyViewed = u.recentlyViewed.filter((f) => f !== id);
    });
    if (isAdmin(me)) audit(db, me.id, "listing.delete", "property", id, p.code);
  });
}

export function setPublished(id: string, publish: boolean) {
  const me = requireUser();
  mutate((db) => {
    const p = db.properties.find((x) => x.id === id);
    if (!p) throw new AppError("Зар олдсонгүй", "Listing not found");
    if (!canManageProperty(me, p)) forbidden();
    if (!publish) {
      if (p.status === "published") p.status = "unpublished";
      return;
    }
    if (p.status === "unpublished") {
      if (new Date(p.expiresAt).getTime() < Date.now()) throw new AppError("Зарын хугацаа дууссан. Сунгана уу.", "This listing has expired. Please renew it.");
      p.status = p.publishedAt || isAdmin(me) ? "published" : "pending";
    } else if (p.status === "draft" || p.status === "rejected") {
      p.status = isAdmin(me) ? "published" : "pending";
      if (p.status === "pending") adminIds(db).forEach((a) => notify(db, a, "listing_submitted", { title: p.title.mn, titleEn: p.title.en || p.title.mn }, "/dashboard/admin/listings?status=pending"));
    } else if (p.status === "expired") {
      throw new AppError("Эхлээд зарыг сунгана уу", "Renew the listing first");
    }
    if (p.status === "published" && !p.publishedAt) p.publishedAt = nowIso();
    p.updatedAt = nowIso();
  });
}

export function renewProperty(id: string, days = 30) {
  const me = requireUser();
  mutate((db) => {
    const p = db.properties.find((x) => x.id === id);
    if (!p) return;
    if (!canManageProperty(me, p)) forbidden();
    const base = Math.max(Date.now(), new Date(p.expiresAt).getTime());
    p.expiresAt = new Date(base + days * 864e5).toISOString();
    if (p.status === "expired") p.status = "published";
    p.updatedAt = nowIso();
  });
}

export function approveProperty(id: string) {
  const me = requireAdmin();
  mutate((db) => {
    const p = db.properties.find((x) => x.id === id);
    if (!p) throw new AppError("Зар олдсонгүй", "Listing not found");
    p.status = "published";
    p.publishedAt = p.publishedAt ?? nowIso();
    p.rejectionReason = undefined;
    p.updatedAt = nowIso();
    notify(db, p.agentId, "listing_approved", { title: p.title.mn, titleEn: p.title.en || p.title.mn }, `/properties/${p.id}`);
    audit(db, me.id, "listing.approve", "property", p.id, p.code);
    // saved search matches
    for (const s of db.savedSearches) {
      if (!s.notify || s.userId === p.agentId) continue;
      const f = parseFilters(new URLSearchParams(s.query));
      if (matchesFilters(p, f, db)) notify(db, s.userId, "saved_search_match", { search: s.name, title: p.title.mn, titleEn: p.title.en || p.title.mn }, `/properties/${p.id}`);
    }
  });
}

export function rejectProperty(id: string, reason: string) {
  const me = requireAdmin();
  if (reason.trim().length < 3) throw new AppError("Татгалзсан шалтгаанаа бичнэ үү", "Please give a reason for rejection");
  mutate((db) => {
    const p = db.properties.find((x) => x.id === id);
    if (!p) throw new AppError("Зар олдсонгүй", "Listing not found");
    p.status = "rejected";
    p.rejectionReason = reason.trim();
    notify(db, p.agentId, "listing_rejected", { title: p.title.mn, titleEn: p.title.en || p.title.mn, reason: reason.trim() }, `/dashboard/agent/listings/${p.id}`);
    audit(db, me.id, "listing.reject", "property", p.id, `${p.code}: ${reason.trim()}`);
  });
}

export function adminSetPropertyFlags(id: string, patch: { verified?: boolean; promotion?: Property["promotion"]; promotedDays?: number }) {
  const me = requireAdmin();
  mutate((db) => {
    const p = db.properties.find((x) => x.id === id);
    if (!p) return;
    if (patch.verified !== undefined) p.verified = patch.verified;
    if (patch.promotion) {
      p.promotion = patch.promotion;
      p.promotedUntil = patch.promotion === "none" ? undefined : new Date(Date.now() + (patch.promotedDays ?? 14) * 864e5).toISOString();
    }
    audit(db, me.id, "listing.flags", "property", p.id, `${p.code} ${JSON.stringify(patch)}`);
  });
}

export function markPropertyClosed(id: string, status: "sold" | "rented" | "published") {
  const me = requireUser();
  mutate((db) => {
    const p = db.properties.find((x) => x.id === id);
    if (!p) return;
    if (!canManageProperty(me, p)) forbidden();
    p.status = status;
    p.updatedAt = nowIso();
  });
}

// ---------- reports ----------
export function submitReport(propertyId: string, reason: "incorrect" | "duplicate" | "sold" | "scam" | "other", details: string) {
  const me = currentUser();
  mutate((db) => {
    db.reports.unshift({ id: nextId(db, "rpt"), propertyId, reporterId: me?.id, reason, details: details.trim(), status: "open", createdAt: nowIso() });
  });
}
export function resolveReport(id: string, status: "resolved" | "dismissed") {
  const me = requireAdmin();
  mutate((db) => {
    const r = db.reports.find((x) => x.id === id);
    if (!r) return;
    r.status = status;
    audit(db, me.id, `report.${status}`, "report", id, r.reason);
  });
}

// ---------- leads, inquiries, viewings ----------
function findOrCreateLead(db: Db, args: { agentId: string; name: string; phone: string; email: string; customerId?: string; propertyId?: string; source: LeadSource; budget?: number }): Lead {
  const phone = normalizePhone(args.phone);
  let lead = db.leads.find((l) => l.agentId === args.agentId && ((args.customerId && l.customerId === args.customerId) || (phone && normalizePhone(l.phone) === phone)));
  const agent = db.users.find((u) => u.id === args.agentId);
  if (!lead) {
    lead = {
      id: nextId(db, "led"),
      customerId: args.customerId,
      name: args.name,
      phone,
      email: args.email,
      agentId: args.agentId,
      agencyId: agent?.agencyId,
      source: args.source,
      stage: "new",
      propertyIds: [],
      notes: [],
      reminders: [],
      history: [],
      budget: args.budget,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      demo: false,
    };
    db.leads.unshift(lead);
  }
  if (args.propertyId && !lead.propertyIds.includes(args.propertyId)) lead.propertyIds.push(args.propertyId);
  return lead;
}

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Нэрээ оруулна уу|Please enter your name"),
  phone: z.string().refine(isValidMnPhone, "Утасны дугаар 8 оронтой байх ёстой|Phone number must be 8 digits"),
  email: z.string().trim().email("Имэйл буруу байна|Invalid email address"),
  message: z.string().trim().min(5, "Зурвас дор хаяж 5 тэмдэгт|Message needs at least 5 characters").max(1500),
});

export function submitInquiry(propertyId: string, input: { name: string; phone: string; email: string; message: string }) {
  const v = parse(inquirySchema, input);
  const me = currentUser();
  return mutate((db) => {
    const p = db.properties.find((x) => x.id === propertyId);
    if (!p) throw new AppError("Зар олдсонгүй", "Listing not found");
    const lead = findOrCreateLead(db, { agentId: p.agentId, name: v.name, phone: v.phone, email: v.email, customerId: me?.role === "customer" ? me.id : me?.id, propertyId, source: "website", budget: p.price });
    lead.history.push({ at: nowIso(), type: "inquiry", text: `${p.code}: ${v.message.slice(0, 120)}` });
    lead.updatedAt = nowIso();
    const inq = {
      id: nextId(db, "inq"),
      propertyId,
      customerId: me?.id,
      agentId: p.agentId,
      name: v.name,
      phone: normalizePhone(v.phone),
      email: v.email,
      message: v.message,
      status: "new" as const,
      messages: [{ id: nextId(db, "msg"), from: "customer" as const, userId: me?.id, text: v.message, at: nowIso() }],
      leadId: lead.id,
      createdAt: nowIso(),
      demo: false,
    };
    db.inquiries.unshift(inq);
    const day = dayKey(new Date());
    p.daily[day] = p.daily[day] ?? [0, 0, 0];
    p.daily[day][1] += 1;
    notify(db, p.agentId, "inquiry_new", { name: v.name, title: p.title.mn, titleEn: p.title.en || p.title.mn }, "/dashboard/agent/inquiries");
    return inq;
  });
}

export function replyInquiry(inquiryId: string, text: string) {
  const me = requireUser();
  if (text.trim().length < 1) throw new AppError("Зурвас хоосон байна", "Message is empty");
  mutate((db) => {
    const q = db.inquiries.find((x) => x.id === inquiryId);
    if (!q) throw new AppError("Лавлагаа олдсонгүй", "Inquiry not found");
    const isCustomerSide = q.customerId === me.id;
    const isAgentSide = scopeUserIds(db, me).includes(q.agentId) || isAdmin(me);
    if (!isCustomerSide && !isAgentSide) forbidden();
    q.messages.push({ id: nextId(db, "msg"), from: isAgentSide && !isCustomerSide ? "agent" : "customer", userId: me.id, text: text.trim(), at: nowIso() });
    if (isAgentSide && !isCustomerSide) {
      q.status = "replied";
      if (q.customerId) notify(db, q.customerId, "message_new", { name: me.name }, "/account/inquiries");
      const lead = db.leads.find((l) => l.id === q.leadId);
      if (lead) {
        lead.history.push({ at: nowIso(), type: "message", text: text.trim().slice(0, 100), by: me.id });
        if (lead.stage === "new") lead.stage = "contacted";
        lead.updatedAt = nowIso();
      }
    } else {
      q.status = "new";
      notify(db, q.agentId, "message_new", { name: me.name }, "/dashboard/agent/inquiries");
    }
  });
}

export function closeInquiry(id: string) {
  const me = requireUser();
  mutate((db) => {
    const q = db.inquiries.find((x) => x.id === id);
    if (!q) return;
    if (!scopeUserIds(db, me).includes(q.agentId) && !isAdmin(me)) forbidden();
    q.status = "closed";
  });
}

const viewingSchema = z.object({
  date: z.string().refine((d) => !isNaN(new Date(d).getTime()), "Огноо сонгоно уу|Choose a date and time"),
});

export function requestViewing(propertyId: string, input: { name: string; phone: string; date: string; note: string }) {
  parse(viewingSchema, input);
  parse(z.object({ name: z.string().trim().min(2, "Нэрээ оруулна уу|Please enter your name"), phone: z.string().refine(isValidMnPhone, "Утасны дугаар 8 оронтой байх ёстой|Phone number must be 8 digits") }), input);
  if (new Date(input.date).getTime() < Date.now() - 6e4) throw new AppError("Өнгөрсөн цаг сонгох боломжгүй", "Choose a time in the future");
  const me = currentUser();
  return mutate((db) => {
    const p = db.properties.find((x) => x.id === propertyId);
    if (!p) throw new AppError("Зар олдсонгүй", "Listing not found");
    const lead = findOrCreateLead(db, { agentId: p.agentId, name: input.name, phone: input.phone, email: me?.email ?? "", customerId: me?.id, propertyId, source: "website" });
    const v: Viewing = {
      id: nextId(db, "vwg"),
      propertyId,
      customerId: me?.id,
      agentId: p.agentId,
      name: input.name.trim(),
      phone: normalizePhone(input.phone),
      date: new Date(input.date).toISOString(),
      status: "requested",
      note: input.note.trim(),
      requestedBy: "customer",
      leadId: lead.id,
      createdAt: nowIso(),
      demo: false,
    };
    db.viewings.unshift(v);
    lead.history.push({ at: nowIso(), type: "viewing", text: `Үзлэгийн хүсэлт: ${fmtDate(v.date)}` });
    lead.updatedAt = nowIso();
    notify(db, p.agentId, "viewing_new", { title: p.title.mn, titleEn: p.title.en || p.title.mn, date: fmtDate(v.date) }, "/dashboard/agent/viewings");
    return v;
  });
}

/** Agent schedules a viewing for a lead or an existing request. */
export function scheduleViewing(input: { leadId: string; propertyId: string; date: string; note?: string }) {
  const me = requireUser();
  parse(viewingSchema, input);
  return mutate((db) => {
    const lead = db.leads.find((l) => l.id === input.leadId);
    const p = db.properties.find((x) => x.id === input.propertyId);
    if (!lead || !p) throw new AppError("Мэдээлэл олдсонгүй", "Record not found");
    if (!scopeUserIds(db, me).includes(lead.agentId) && !isAdmin(me)) forbidden();
    const v: Viewing = {
      id: nextId(db, "vwg"),
      propertyId: p.id,
      customerId: lead.customerId,
      agentId: lead.agentId,
      name: lead.name,
      phone: lead.phone,
      date: new Date(input.date).toISOString(),
      status: "confirmed",
      note: input.note?.trim() ?? "",
      requestedBy: "agent",
      leadId: lead.id,
      createdAt: nowIso(),
      demo: false,
    };
    db.viewings.unshift(v);
    if (!lead.propertyIds.includes(p.id)) lead.propertyIds.push(p.id);
    lead.history.push({ at: nowIso(), type: "viewing", text: `Үзлэг товлов: ${fmtDate(v.date)} (${p.code})`, by: me.id });
    if (["new", "contacted", "interested"].includes(lead.stage)) lead.stage = "viewing";
    lead.updatedAt = nowIso();
    if (lead.customerId) notify(db, lead.customerId, "viewing_update", { title: p.title.mn, titleEn: p.title.en || p.title.mn, status: "баталгаажлаа", statusEn: "confirmed", date: fmtDate(v.date) }, "/account/viewings");
    return v;
  });
}

export function updateViewingStatus(id: string, status: ViewingStatus, newDate?: string) {
  const me = requireUser();
  mutate((db) => {
    const v = db.viewings.find((x) => x.id === id);
    if (!v) throw new AppError("Үзлэг олдсонгүй", "Viewing not found");
    const agentSide = scopeUserIds(db, me).includes(v.agentId) || isAdmin(me);
    const customerSide = v.customerId === me.id;
    if (!agentSide && !customerSide) forbidden();
    if (customerSide && !agentSide && status !== "cancelled") forbidden();
    const p = db.properties.find((x) => x.id === v.propertyId);
    v.status = status;
    if (newDate) v.date = new Date(newDate).toISOString();
    const label = { requested: "хүсэлт", confirmed: "баталгаажлаа", completed: "дууслаа", cancelled: "цуцлагдлаа" }[status];
    const lead = v.leadId ? db.leads.find((l) => l.id === v.leadId) : undefined;
    lead?.history.push({ at: nowIso(), type: "viewing", text: `Үзлэг ${label}: ${fmtDate(v.date)}`, by: me.id });
    if (agentSide && v.customerId) notify(db, v.customerId, "viewing_update", { title: p?.title.mn ?? "", titleEn: p?.title.en ?? "", status: label, statusEn: ({ requested: "requested", confirmed: "confirmed", completed: "completed", cancelled: "cancelled" } as Record<string,string>)[status], date: fmtDate(v.date) }, "/account/viewings");
    if (customerSide && !agentSide) notify(db, v.agentId, "viewing_update", { title: p?.title.mn ?? "", titleEn: p?.title.en ?? "", status: label, statusEn: ({ requested: "requested", confirmed: "confirmed", completed: "completed", cancelled: "cancelled" } as Record<string,string>)[status], date: fmtDate(v.date) }, "/dashboard/agent/viewings");
  });
}

// ---------- CRM ----------
export function createLead(input: { name: string; phone: string; email: string; source: LeadSource; propertyId?: string; budget?: number; agentId?: string }) {
  const me = requireUser();
  parse(z.object({ name: z.string().trim().min(2, "Нэрээ оруулна уу|Please enter a name"), phone: z.string().refine(isValidMnPhone, "Утасны дугаар 8 оронтой байх ёстой|Phone number must be 8 digits") }), input);
  return mutate((db) => {
    const agentId = input.agentId && (isAdmin(me) || scopeUserIds(db, me).includes(input.agentId)) ? input.agentId : me.id;
    const lead = findOrCreateLead(db, { agentId, name: input.name.trim(), phone: input.phone, email: input.email, propertyId: input.propertyId, source: input.source, budget: input.budget });
    lead.history.push({ at: nowIso(), type: "call", text: "Харилцагч бүртгэв", by: me.id });
    return lead;
  });
}

function leadAccess(db: Db, me: User, lead: Lead) {
  if (!isAdmin(me) && !scopeUserIds(db, me).includes(lead.agentId)) forbidden();
}

export function setLeadStage(leadId: string, stage: LeadStage, opts: { propertyId?: string } = {}) {
  const me = requireUser();
  mutate((db) => {
    const lead = db.leads.find((l) => l.id === leadId);
    if (!lead) throw new AppError("Харилцагч олдсонгүй", "Lead not found");
    leadAccess(db, me, lead);
    if (lead.stage === stage) return;
    lead.stage = stage;
    lead.updatedAt = nowIso();
    lead.history.push({ at: nowIso(), type: "stage", text: stage, by: me.id });
    const propId = opts.propertyId ?? lead.propertyIds[lead.propertyIds.length - 1];
    const p = propId ? db.properties.find((x) => x.id === propId) : undefined;
    if (p && (stage === "negotiation" || stage === "successful")) {
      const kind = p.listingType === "sale" ? "sale" : "rent";
      let deal = db.deals.find((d) => d.leadId === lead.id && d.propertyId === p.id);
      if (!deal) {
        deal = {
          id: nextId(db, "dl"),
          propertyId: p.id,
          agentId: lead.agentId,
          customerId: lead.customerId,
          leadId: lead.id,
          kind,
          amount: p.price,
          commission: Math.round(kind === "sale" ? p.price * 0.02 : p.price * 0.5),
          status: "active",
          createdAt: nowIso(),
          demo: false,
        } as Deal;
        db.deals.unshift(deal);
        lead.history.push({ at: nowIso(), type: "deal", text: `Гүйлгээ нээв: ${p.code}`, by: me.id });
      }
      if (stage === "successful") {
        deal.status = "completed";
        deal.closedAt = nowIso();
        p.status = kind === "sale" ? "sold" : "rented";
        p.updatedAt = nowIso();
      }
    }
    if (stage === "lost") {
      db.deals.filter((d) => d.leadId === lead.id && d.status === "active").forEach((d) => (d.status = "cancelled"));
    }
    if (lead.customerId && stage === "contacted") notify(db, lead.customerId, "message_new", { name: me.name }, "/account/inquiries");
  });
}

export function addLeadNote(leadId: string, text: string) {
  const me = requireUser();
  if (!text.trim()) throw new AppError("Тэмдэглэл хоосон байна", "Note is empty");
  mutate((db) => {
    const lead = db.leads.find((l) => l.id === leadId);
    if (!lead) return;
    leadAccess(db, me, lead);
    lead.notes.unshift({ id: nextId(db, "nt"), text: text.trim(), at: nowIso(), by: me.id });
    lead.history.push({ at: nowIso(), type: "note", text: text.trim().slice(0, 100), by: me.id });
    lead.updatedAt = nowIso();
  });
}

export function addReminder(leadId: string, text: string, due: string) {
  const me = requireUser();
  if (!text.trim() || isNaN(new Date(due).getTime())) throw new AppError("Сануулгын текст, огноо оруулна уу", "Enter reminder text and a date");
  mutate((db) => {
    const lead = db.leads.find((l) => l.id === leadId);
    if (!lead) return;
    leadAccess(db, me, lead);
    lead.reminders.push({ id: nextId(db, "rm"), text: text.trim(), due: new Date(due).toISOString(), done: false });
  });
}

export function toggleReminder(leadId: string, reminderId: string) {
  const me = requireUser();
  mutate((db) => {
    const lead = db.leads.find((l) => l.id === leadId);
    const r = lead?.reminders.find((x) => x.id === reminderId);
    if (!lead || !r) return;
    leadAccess(db, me, lead);
    r.done = !r.done;
  });
}

export function logContact(leadId: string, text: string) {
  const me = requireUser();
  mutate((db) => {
    const lead = db.leads.find((l) => l.id === leadId);
    if (!lead) return;
    leadAccess(db, me, lead);
    lead.history.push({ at: nowIso(), type: "call", text: text.trim() || "Холбогдсон", by: me.id });
    lead.updatedAt = nowIso();
    if (lead.stage === "new") lead.stage = "contacted";
  });
}

export function assignLead(leadId: string, agentId: string) {
  const me = requireUser();
  mutate((db) => {
    const lead = db.leads.find((l) => l.id === leadId);
    const target = db.users.find((u) => u.id === agentId);
    if (!lead || !target) return;
    const ok = isAdmin(me) || (me.role === "agency_owner" && me.agencyId && lead.agencyId === me.agencyId && target.agencyId === me.agencyId);
    if (!ok) forbidden();
    lead.agentId = agentId;
    lead.agencyId = target.agencyId;
    lead.updatedAt = nowIso();
    lead.history.push({ at: nowIso(), type: "assign", text: target.name, by: me.id });
    db.inquiries.filter((q) => q.leadId === lead.id).forEach((q) => (q.agentId = agentId));
    notify(db, agentId, "lead_assigned", { name: lead.name }, "/dashboard/agent/leads");
  });
}

// ---------- notifications / saved searches / compare ----------
export function markNotificationRead(id: string) {
  const me = requireUser();
  mutate((db) => {
    const n = db.notifications.find((x) => x.id === id && x.userId === me.id);
    if (n) n.read = true;
  });
}
export function markAllNotificationsRead() {
  const me = requireUser();
  mutate((db) => {
    db.notifications.filter((n) => n.userId === me.id).forEach((n) => (n.read = true));
  });
}
export function saveSearch(name: string, query: string, notifyMe = true) {
  const me = requireUser();
  if (!name.trim()) throw new AppError("Хайлтын нэр оруулна уу", "Give the search a name");
  mutate((db) => {
    db.savedSearches.unshift({ id: nextId(db, "ss"), userId: me.id, name: name.trim(), query, notify: notifyMe, createdAt: nowIso() });
  });
}
export function deleteSavedSearch(id: string) {
  const me = requireUser();
  mutate((db) => {
    db.savedSearches = db.savedSearches.filter((s) => !(s.id === id && s.userId === me.id));
  });
}
export function toggleSavedSearchNotify(id: string) {
  const me = requireUser();
  mutate((db) => {
    const s = db.savedSearches.find((x) => x.id === id && x.userId === me.id);
    if (s) s.notify = !s.notify;
  });
}

// ---------- billing (simulated) ----------
export function createPayment(input: { planId: string; method: PaymentMethod; propertyId?: string }) {
  const me = requireUser();
  return mutate((db) => {
    const plan = db.plans.find((p) => p.id === input.planId);
    if (!plan) throw new AppError("Багц олдсонгүй", "Plan not found");
    if (plan.audience === "listing") {
      const p = db.properties.find((x) => x.id === input.propertyId);
      if (!p || !canManageProperty(me, p)) throw new AppError("Сурталчлах зараа сонгоно уу", "Choose a listing to promote");
      if (p.status !== "published") throw new AppError("Зөвхөн нийтлэгдсэн зарыг сурталчилна", "Only published listings can be promoted");
    }
    if (plan.audience === "agency" && me.role !== "agency_owner") throw new AppError("Агентлагийн багцыг зөвхөн агентлагийн эзэн авна", "Only agency owners can buy agency plans");
    if (plan.audience === "agent" && me.role === "customer") forbidden();
    const pay = {
      id: nextId(db, "pay"),
      userId: me.id,
      amount: plan.price,
      method: input.method,
      status: "pending" as const,
      purpose: plan.audience === "listing" ? (plan.promotion === "premium" ? ("premium" as const) : ("featured" as const)) : ("subscription" as const),
      planId: plan.id,
      propertyId: input.propertyId,
      reference: `MT${100000 + (db.seq * 7919) % 900000}`,
      createdAt: nowIso(),
      demo: true,
    };
    db.payments.unshift(pay);
    return pay;
  });
}

function applyPaid(db: Db, payId: string) {
  const pay = db.payments.find((x) => x.id === payId);
  if (!pay) return;
  const plan = db.plans.find((p) => p.id === pay.planId)!;
  pay.status = "paid";
  pay.paidAt = nowIso();
  if (plan.audience === "listing") {
    const p = db.properties.find((x) => x.id === pay.propertyId);
    if (p) {
      p.promotion = plan.promotion ?? "featured";
      const base = p.promotedUntil && new Date(p.promotedUntil).getTime() > Date.now() ? new Date(p.promotedUntil).getTime() : Date.now();
      p.promotedUntil = new Date(base + plan.periodDays * 864e5).toISOString();
    }
  } else {
    const user = db.users.find((u) => u.id === pay.userId)!;
    db.subscriptions.filter((s) => s.userId === pay.userId && s.status === "active").forEach((s) => (s.status = "cancelled"));
    db.subscriptions.unshift({
      id: nextId(db, "sub"),
      userId: pay.userId,
      agencyId: plan.audience === "agency" ? user.agencyId : undefined,
      planId: plan.id,
      startAt: nowIso(),
      endAt: new Date(Date.now() + plan.periodDays * 864e5).toISOString(),
      status: "active",
      paymentId: pay.id,
      demo: true,
    });
  }
  notify(db, pay.userId, "payment", { status: "амжилттай", statusEn: "successful", amount: `${pay.amount.toLocaleString("en-US")} ₮` }, "/dashboard/agent/billing");
}

/** Simulates the gateway callback for QPay and SocialPay after the user confirms on the demo screen. */
export function confirmSimulatedPayment(payId: string) {
  const me = requireUser();
  mutate((db) => {
    const pay = db.payments.find((x) => x.id === payId);
    if (!pay || pay.userId !== me.id) forbidden();
    if (pay.status !== "pending") return;
    if (pay.method !== "qpay" && pay.method !== "socialpay") throw new AppError("Энэ төлбөрийг админ баталгаажуулна", "An admin confirms this payment");
    applyPaid(db, payId);
  });
}

export function adminConfirmPayment(payId: string, ok: boolean) {
  const me = requireAdmin();
  mutate((db) => {
    const pay = db.payments.find((x) => x.id === payId);
    if (!pay || pay.status !== "pending") return;
    if (ok) applyPaid(db, payId);
    else {
      pay.status = "failed";
      notify(db, pay.userId, "payment", { status: "амжилтгүй", statusEn: "failed", amount: `${pay.amount.toLocaleString("en-US")} ₮` }, "/dashboard/agent/billing");
    }
    audit(db, me.id, ok ? "payment.confirm" : "payment.reject", "payment", payId, pay.reference);
  });
}

export function cancelPayment(payId: string) {
  const me = requireUser();
  mutate((db) => {
    const pay = db.payments.find((x) => x.id === payId);
    if (pay && pay.userId === me.id && pay.status === "pending") pay.status = "failed";
  });
}

export function cancelSubscription(subId: string) {
  const me = requireUser();
  mutate((db) => {
    const s = db.subscriptions.find((x) => x.id === subId);
    if (!s) return;
    if (s.userId !== me.id && !isAdmin(me)) forbidden();
    s.status = "cancelled";
    if (isAdmin(me)) audit(db, me.id, "subscription.cancel", "subscription", subId, s.planId);
  });
}

// ---------- admin ----------
export function verifyUser(userId: string, verified: boolean) {
  const me = requireAdmin();
  mutate((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) return;
    u.verified = verified;
    if (verified) notify(db, u.id, "agent_verified", {}, "/dashboard/agent/profile");
    audit(db, me.id, verified ? "agent.verify" : "agent.unverify", "user", u.id, u.name);
  });
}

export function setUserActive(userId: string, active: boolean) {
  const me = requireAdmin();
  mutate((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) return;
    if (u.id === me.id) throw new AppError("Өөрийгөө хаах боломжгүй", "You cannot suspend yourself");
    if (u.role === "super_admin" && me.role !== "super_admin") forbidden();
    u.active = active;
    audit(db, me.id, active ? "user.activate" : "user.suspend", "user", u.id, u.name);
  });
}

export function setUserRole(userId: string, role: Role) {
  const me = requireUser();
  if (me.role !== "super_admin") throw new AppError("Зөвхөн супер админ эрх өөрчилнө", "Only a super admin can change roles");
  mutate((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) return;
    if (u.id === me.id) throw new AppError("Өөрийн эрхийг өөрчлөх боломжгүй", "You cannot change your own role");
    u.role = role;
    audit(db, me.id, "user.role", "user", u.id, `${u.name} -> ${role}`);
  });
}

export function adminUpdateCategory(key: string, patch: { enabled?: boolean; name?: { mn: string; en: string } }) {
  const me = requireAdmin();
  mutate((db) => {
    const c = db.categories.find((x) => x.key === key);
    if (!c) return;
    if (patch.enabled !== undefined) c.enabled = patch.enabled;
    if (patch.name) {
      if (!patch.name.mn.trim() || !patch.name.en.trim()) throw new AppError("Нэрийг хоёр хэлээр оруулна уу", "Enter the name in both languages");
      c.name = patch.name;
    }
    audit(db, me.id, "category.update", "category", key, JSON.stringify(patch));
  });
}

export function adminUpdateDistrict(key: string, patch: { enabled?: boolean; popular?: boolean; khoroos?: number; name?: { mn: string; en: string } }) {
  const me = requireAdmin();
  mutate((db) => {
    const d = db.districts.find((x) => x.key === key);
    if (!d) return;
    if (patch.khoroos !== undefined && (patch.khoroos < 1 || patch.khoroos > 99)) throw new AppError("Хорооны тоо 1 ээс 99", "Khoroo count must be 1 to 99");
    Object.assign(d, patch);
    audit(db, me.id, "district.update", "district", key, JSON.stringify(patch));
  });
}

export function adminAddDistrict(name: { mn: string; en: string }, khoroos: number) {
  const me = requireAdmin();
  if (!name.mn.trim() || !name.en.trim()) throw new AppError("Нэрийг хоёр хэлээр оруулна уу", "Enter the name in both languages");
  mutate((db) => {
    const key = name.en.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (db.districts.some((d) => d.key === key)) throw new AppError("Ийм дүүрэг байна", "District already exists");
    db.districts.push({ key, name, khoroos, enabled: true, popular: false, lat: 47.92, lng: 106.92 });
    audit(db, me.id, "district.create", "district", key, name.en);
  });
}

export function adminUpdateContent(patch: Partial<Db["content"]>) {
  const me = requireAdmin();
  mutate((db) => {
    db.content = { ...db.content, ...patch };
    audit(db, me.id, "content.update", "content", "site", Object.keys(patch).join(","));
  });
}

export function adminVerifyAgency(id: string, verified: boolean) {
  const me = requireAdmin();
  mutate((db) => {
    const a = db.agencies.find((x) => x.id === id);
    if (!a) return;
    a.verified = verified;
    audit(db, me.id, "agency.verify", "agency", id, a.name);
  });
}

// ---------- agencies ----------
export function createAgency(input: { name: string; phone: string; email: string; address: string; district: string; description: { mn: string; en: string } }) {
  const me = requireUser();
  if (me.role !== "agency_owner" && !isAdmin(me)) forbidden();
  parse(z.object({ name: z.string().trim().min(2, "Агентлагийн нэр оруулна уу|Enter the agency name"), phone: z.string().refine(isValidMnPhone, "Утасны дугаар 8 оронтой байх ёстой|Phone number must be 8 digits"), email: z.string().email("Имэйл буруу байна|Invalid email address") }), input);
  return mutate((db) => {
    const u = db.users.find((x) => x.id === me.id)!;
    if (u.agencyId) throw new AppError("Та аль хэдийн агентлагтай байна", "You already have an agency");
    const a = { id: nextId(db, "agc"), ownerId: me.id, color: "#1E3A5F", verified: false, createdAt: nowIso(), demo: false, ...input, phone: normalizePhone(input.phone) };
    db.agencies.push(a);
    u.agencyId = a.id;
    return a;
  });
}

export function updateAgency(id: string, patch: Partial<Pick<Db["agencies"][number], "name" | "phone" | "email" | "address" | "district" | "description" | "logo">>) {
  const me = requireUser();
  mutate((db) => {
    const a = db.agencies.find((x) => x.id === id);
    if (!a) return;
    if (a.ownerId !== me.id && !isAdmin(me)) forbidden();
    Object.assign(a, patch);
  });
}

export function addAgentToAgency(email: string, agencyId: string, create?: { name: string; phone: string; password: string }) {
  const me = requireUser();
  return mutate((db) => {
    const ag = db.agencies.find((a) => a.id === agencyId);
    if (!ag) throw new AppError("Агентлаг олдсонгүй", "Agency not found");
    if (ag.ownerId !== me.id && !isAdmin(me)) forbidden();
    const e = email.trim().toLowerCase();
    let u = db.users.find((x) => x.email.toLowerCase() === e);
    if (u) {
      if (u.role !== "agent" && u.role !== "customer") throw new AppError("Энэ хэрэглэгчийг нэмэх боломжгүй", "This user cannot be added as an agent");
      if (u.agencyId && u.agencyId !== agencyId) throw new AppError("Өөр агентлагт харьяалагддаг", "Already belongs to another agency");
      u.role = "agent";
      u.agencyId = agencyId;
    } else {
      if (!create) throw new AppError("Ийм имэйлтэй хэрэглэгч олдсонгүй. Шинээр үүсгэнэ үү.", "No user with this email. Create a new agent account.");
      parse(registerSchema, { ...create, email: e, role: "agent" });
      const salt = randomSalt();
      u = {
        id: nextId(db, "usr"), role: "agent", name: create.name.trim(), email: e, phone: normalizePhone(create.phone), passwordHash: hashPassword(create.password, salt), salt,
        avatarColor: avatarColors[db.users.length % avatarColors.length], createdAt: nowIso(), active: true, favorites: [], recentlyViewed: [], agencyId, verified: false, demo: false,
      };
      db.users.push(u);
    }
    notify(db, u.id, "lead_assigned", { name: ag.name }, "/dashboard/agent");
    return u;
  });
}

export function removeAgentFromAgency(userId: string) {
  const me = requireUser();
  mutate((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u || !u.agencyId) return;
    const ag = db.agencies.find((a) => a.id === u.agencyId);
    if (!ag || (ag.ownerId !== me.id && !isAdmin(me))) forbidden();
    if (u.id === ag.ownerId) throw new AppError("Эзэмшигчийг хасах боломжгүй", "The owner cannot be removed");
    db.leads.filter((l) => l.agentId === u.id).forEach((l) => {
      l.agentId = ag.ownerId;
    });
    db.properties.filter((p) => p.agentId === u.id).forEach((p) => {
      p.agentId = ag.ownerId;
    });
    u.agencyId = undefined;
  });
}

// ---------- maintenance ----------
/** Expires listings and subscriptions and raises expiry warnings (idempotent). Runs after boot. */
export function runMaintenance() {
  mutate((db) => {
    const now = Date.now();
    const have = (type: string, userId: string, key: string) => db.notifications.some((n) => n.type === type && n.userId === userId && n.params.key === key);
    for (const p of db.properties) {
      if (p.promotedUntil && new Date(p.promotedUntil).getTime() < now) {
        p.promotion = "none";
        p.promotedUntil = undefined;
      }
      const left = (new Date(p.expiresAt).getTime() - now) / 864e5;
      if (p.status === "published" && left <= 0) {
        p.status = "expired";
        if (!have("listing_expired", p.agentId, p.id)) notify(db, p.agentId, "listing_expired", { title: p.title.mn, titleEn: p.title.en || p.title.mn, key: p.id }, `/dashboard/agent/listings/${p.id}`);
      } else if (p.status === "published" && left <= 7 && !have("listing_expiring", p.agentId, p.id)) {
        notify(db, p.agentId, "listing_expiring", { title: p.title.mn, titleEn: p.title.en || p.title.mn, days: String(Math.max(1, Math.ceil(left))), key: p.id }, `/dashboard/agent/listings/${p.id}`);
      }
    }
    for (const s of db.subscriptions) {
      if (s.status !== "active") continue;
      const left = (new Date(s.endAt).getTime() - now) / 864e5;
      const plan = db.plans.find((p) => p.id === s.planId);
      const pn = plan?.name.mn ?? "";
      if (left <= 0) {
        s.status = "expired";
        if (!have("subscription_expired", s.userId, s.id)) notify(db, s.userId, "subscription_expired", { plan: pn, key: s.id }, "/pricing");
      } else if (left <= 7 && !have("subscription_expiring", s.userId, s.id)) {
        notify(db, s.userId, "subscription_expiring", { plan: pn, days: String(Math.ceil(left)), key: s.id }, "/pricing");
      }
    }
    // reminders due
    for (const l of db.leads) {
      for (const r of l.reminders) {
        if (!r.done && new Date(r.due).getTime() <= now && !have("reminder", l.agentId, r.id)) notify(db, l.agentId, "reminder", { text: `${l.name}: ${r.text}`, key: r.id }, "/dashboard/agent/leads");
      }
    }
  });
}

export function adminUpdatePlan(id: string, patch: { price?: number; listingLimit?: number; periodDays?: number }) {
  const me = requireAdmin();
  mutate((db) => {
    const p = db.plans.find((x) => x.id === id);
    if (!p) return;
    if ((patch.price !== undefined && patch.price < 0) || (patch.listingLimit !== undefined && patch.listingLimit < 1)) throw new AppError("Утга буруу байна", "Invalid value");
    Object.assign(p, patch);
    audit(db, me.id, "plan.update", "plan", id, JSON.stringify(patch));
  });
}

export function adminDeleteUser(userId: string) {
  const me = requireAdmin();
  mutate((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) return;
    if (u.id === me.id) throw new AppError("Өөрийгөө устгах боломжгүй", "You cannot delete yourself");
    if (u.role === "super_admin" || (u.role === "platform_admin" && me.role !== "super_admin")) forbidden();
    if (db.properties.some((p) => p.agentId === u.id)) throw new AppError("Зартай хэрэглэгчийг устгах боломжгүй. Түр хаана уу.", "This user has listings. Suspend instead of deleting.");
    db.users = db.users.filter((x) => x.id !== userId);
    audit(db, me.id, "user.delete", "user", userId, u.name);
  });
}
