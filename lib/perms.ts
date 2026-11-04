import type { Db, Property, Role, User } from "./types";

export const isAdminRole = (r?: Role) => r === "super_admin" || r === "platform_admin";
export const isAdmin = (u?: User | null) => !!u && isAdminRole(u.role);
export const isPro = (u?: User | null) => !!u && (u.role === "agent" || u.role === "agency_owner" || u.role === "owner");

export function canManageProperty(u: User | null | undefined, p: Property): boolean {
  if (!u) return false;
  if (isAdmin(u)) return true;
  if (u.role === "agent") return p.agentId === u.id;
  if (u.role === "owner") return p.ownerId === u.id || p.agentId === u.id;
  if (u.role === "agency_owner") return !!u.agencyId && p.agencyId === u.agencyId;
  return false;
}

/** Ids of users whose records the given user may work with. */
export function scopeUserIds(db: Db, u: User): string[] {
  if (u.role === "agency_owner" && u.agencyId) return db.users.filter((x) => x.agencyId === u.agencyId).map((x) => x.id);
  return [u.id];
}

export function dashboardPath(role: Role): string {
  if (isAdminRole(role)) return "/dashboard/admin";
  if (role === "agency_owner") return "/dashboard/agency";
  if (role === "agent" || role === "owner") return "/dashboard/agent";
  return "/account";
}

export const ADMIN_ONLY_FEATURES = ["categories", "locations", "content", "audit", "agents_verify"] as const;

/** Rank used to prevent platform admins from editing super admins. */
export const ROLE_RANK: Record<Role, number> = { customer: 0, owner: 1, agent: 2, agency_owner: 3, platform_admin: 4, super_admin: 5 };
