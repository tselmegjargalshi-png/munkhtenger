import { dayKey } from "./format";
import { isAdmin, scopeUserIds } from "./perms";
import type { Db, Property, User } from "./types";

/** Records visible to a professional user: their own, or the whole agency for an agency owner. */
export function scoped(db: Db, user: User) {
  const ids = scopeUserIds(db, user);
  const admin = isAdmin(user);
  const inScope = (agentId: string) => admin || ids.includes(agentId);
  return {
    ids,
    properties: db.properties.filter((p) => inScope(p.agentId) || (user.role === "agency_owner" && p.agencyId === user.agencyId)),
    leads: db.leads.filter((l) => inScope(l.agentId)),
    inquiries: db.inquiries.filter((q) => inScope(q.agentId)),
    viewings: db.viewings.filter((v) => inScope(v.agentId)),
    deals: db.deals.filter((d) => inScope(d.agentId)),
  };
}

export function lastDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(new Date(Date.now() - i * 864e5)));
  return out;
}

export function performance(props: Property[], days = 30) {
  const keys = lastDays(days);
  return keys.map((k) => ({
    day: k,
    views: props.reduce((s, p) => s + (p.daily[k]?.[0] ?? 0), 0),
    inquiries: props.reduce((s, p) => s + (p.daily[k]?.[1] ?? 0), 0),
    favorites: props.reduce((s, p) => s + (p.daily[k]?.[2] ?? 0), 0),
  }));
}

export function monthlyRevenue(db: Db, months = 6) {
  const out: { label: string; month: number; year: number; total: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ label: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`, month: d.getMonth(), year: d.getFullYear(), total: 0 });
  }
  for (const p of db.payments) {
    if (p.status !== "paid") continue;
    const d = new Date(p.paidAt ?? p.createdAt);
    const row = out.find((r) => r.month === d.getMonth() && r.year === d.getFullYear());
    if (row) row.total += p.amount;
  }
  return out;
}

export function platformStats(db: Db) {
  const now = new Date();
  const thisMonth = db.payments.filter((p) => p.status === "paid" && new Date(p.paidAt ?? p.createdAt).getMonth() === now.getMonth() && new Date(p.paidAt ?? p.createdAt).getFullYear() === now.getFullYear());
  return {
    totalProperties: db.properties.length,
    active: db.properties.filter((p) => p.status === "published").length,
    pending: db.properties.filter((p) => p.status === "pending").length,
    agents: db.users.filter((u) => u.role === "agent").length,
    customers: db.users.filter((u) => u.role === "customer").length,
    inquiries: db.inquiries.length,
    viewings: db.viewings.filter((v) => v.status === "requested" || v.status === "confirmed").length,
    sold: db.properties.filter((p) => p.status === "sold").length,
    rented: db.properties.filter((p) => p.status === "rented").length,
    revenue: thisMonth.reduce((s, p) => s + p.amount, 0),
    dealVolume: db.deals.filter((d) => d.status === "completed").reduce((s, d) => s + d.amount, 0),
  };
}
