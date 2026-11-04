export type Lang = "mn" | "en";
export type L10n = { mn: string; en: string };

export type Role = "super_admin" | "platform_admin" | "agency_owner" | "agent" | "owner" | "customer";

export type Category =
  | "apartment"
  | "house"
  | "land"
  | "commercial"
  | "office"
  | "retail"
  | "warehouse"
  | "new_development";

export type ListingType = "sale" | "rent" | "long_lease" | "short_rent";

export type ListingStatus =
  | "draft"
  | "pending"
  | "published"
  | "rejected"
  | "unpublished"
  | "sold"
  | "rented"
  | "expired";

export type Promotion = "none" | "featured" | "premium";

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  salt: string;
  avatarColor: string;
  avatar?: string; // image ref
  createdAt: string;
  lastLoginAt?: string;
  agencyId?: string;
  title?: L10n;
  bio?: L10n;
  verified?: boolean;
  languages?: string[];
  experienceYears?: number;
  active: boolean;
  favorites: string[];
  recentlyViewed: string[];
  demo: boolean;
}

export interface Agency {
  id: string;
  name: string;
  ownerId: string;
  description: L10n;
  phone: string;
  email: string;
  address: string;
  district: string;
  color: string;
  logo?: string;
  verified: boolean;
  createdAt: string;
  demo: boolean;
}

export interface Nearby {
  type: "school" | "hospital" | "shop" | "transport" | "park" | "kindergarten";
  name: L10n;
  distanceM: number;
}

export interface Property {
  id: string;
  code: string;
  title: L10n;
  description: L10n;
  category: Category;
  listingType: ListingType;
  status: ListingStatus;
  promotion: Promotion;
  promotedUntil?: string;
  price: number;
  area: number;
  landArea?: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  buildingFloors: number;
  yearBuilt: number;
  furnished: boolean;
  parking: boolean;
  balcony: boolean;
  elevator: boolean;
  newBuild: boolean;
  verified: boolean;
  district: string;
  khoroo: number;
  address: string;
  lat: number;
  lng: number;
  images: string[];
  amenities: string[];
  nearby: Nearby[];
  agentId: string;
  ownerId?: string;
  agencyId?: string;
  views: number;
  daily: Record<string, [number, number, number]>; // date -> [views, inquiries, favorites]
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt: string;
  rejectionReason?: string;
  demo: boolean;
}

export interface Message {
  id: string;
  from: "customer" | "agent";
  userId?: string;
  text: string;
  at: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  customerId?: string;
  agentId: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: "new" | "replied" | "closed";
  messages: Message[];
  leadId: string;
  createdAt: string;
  demo: boolean;
}

export type ViewingStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface Viewing {
  id: string;
  propertyId: string;
  customerId?: string;
  agentId: string;
  name: string;
  phone: string;
  date: string;
  status: ViewingStatus;
  note: string;
  requestedBy: "customer" | "agent";
  leadId?: string;
  createdAt: string;
  demo: boolean;
}

export type LeadStage =
  | "new"
  | "contacted"
  | "interested"
  | "viewing"
  | "negotiation"
  | "successful"
  | "lost";

export type LeadSource = "website" | "phone" | "walk_in" | "referral" | "facebook" | "other";

export interface Lead {
  id: string;
  customerId?: string;
  name: string;
  phone: string;
  email: string;
  agentId: string;
  agencyId?: string;
  source: LeadSource;
  stage: LeadStage;
  propertyIds: string[];
  notes: { id: string; text: string; at: string; by: string }[];
  reminders: { id: string; text: string; due: string; done: boolean }[];
  history: { at: string; type: "inquiry" | "stage" | "note" | "viewing" | "call" | "message" | "assign" | "deal"; text: string; by?: string }[];
  budget?: number;
  createdAt: string;
  updatedAt: string;
  demo: boolean;
}

export interface Deal {
  id: string;
  propertyId: string;
  agentId: string;
  customerId?: string;
  leadId?: string;
  kind: "sale" | "rent";
  amount: number;
  commission: number;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  closedAt?: string;
  demo: boolean;
}

export type PlanAudience = "agent" | "agency" | "listing";

export interface Plan {
  id: string;
  audience: PlanAudience;
  name: L10n;
  price: number;
  periodDays: number;
  listingLimit: number;
  featuredSlots: number;
  promotion?: Promotion;
  perks: { mn: string[]; en: string[] };
  highlight?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  agencyId?: string;
  planId: string;
  startAt: string;
  endAt: string;
  status: "active" | "expired" | "cancelled" | "pending";
  paymentId: string;
  demo: boolean;
}

export type PaymentMethod = "qpay" | "socialpay" | "bank" | "cash";

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  status: "pending" | "paid" | "failed" | "refunded";
  purpose: "subscription" | "featured" | "premium";
  planId: string;
  propertyId?: string;
  reference: string;
  createdAt: string;
  paidAt?: string;
  demo: boolean;
}

export type NotificationType =
  | "inquiry_new"
  | "viewing_new"
  | "viewing_update"
  | "listing_approved"
  | "listing_rejected"
  | "listing_expiring"
  | "listing_expired"
  | "message_new"
  | "saved_search_match"
  | "subscription_expiring"
  | "subscription_expired"
  | "payment"
  | "lead_assigned"
  | "listing_submitted"
  | "agent_verified"
  | "reminder";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  params: Record<string, string>;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  notify: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  at: string;
}

export interface Report {
  id: string;
  propertyId: string;
  reporterId?: string;
  reason: "incorrect" | "duplicate" | "sold" | "scam" | "other";
  details: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
}

export interface DistrictConfig {
  key: string;
  name: L10n;
  khoroos: number;
  enabled: boolean;
  popular: boolean;
  lat: number;
  lng: number;
}

export interface CategoryConfig {
  key: Category;
  name: L10n;
  enabled: boolean;
  order: number;
}

export interface SiteContent {
  heroTitle: L10n;
  heroSubtitle: L10n;
  announcement: L10n;
  announcementOn: boolean;
  aboutText: L10n;
  contactPhone: string;
  contactEmail: string;
}

export interface Db {
  version: number;
  seededAt: string;
  users: User[];
  agencies: Agency[];
  properties: Property[];
  inquiries: Inquiry[];
  viewings: Viewing[];
  leads: Lead[];
  deals: Deal[];
  plans: Plan[];
  subscriptions: Subscription[];
  payments: Payment[];
  notifications: Notification[];
  savedSearches: SavedSearch[];
  audit: AuditLog[];
  reports: Report[];
  districts: DistrictConfig[];
  categories: CategoryConfig[];
  content: SiteContent;
  seq: number;
}
