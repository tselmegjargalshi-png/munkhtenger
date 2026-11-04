"use client";
import { BadgeCheck } from "lucide-react";
import { useState } from "react";
import { PageHead } from "@/components/dash";
import { Avatar } from "@/components/shell";
import { Badge, Confirm, Empty, Pagination, Tabs, useRun } from "@/components/ui";
import { adminDeleteUser, setUserActive, setUserRole, verifyUser } from "@/lib/actions";
import { formatDate, formatPhone } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { ROLE_LABELS } from "@/lib/labels";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";

const PAGE = 12;
const GROUPS: Record<string, Role[]> = { agents: ["agent", "agency_owner"], customers: ["customer"], owners: ["owner"], staff: ["platform_admin", "super_admin"] };

export default function Page() {
  const { db, user } = useApp();
  const { tr, lang } = useLang();
  const run = useRun();
  const [tab, setTab] = useState<"agents" | "customers" | "owners" | "staff">("agents");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [del, setDel] = useState<string | null>(null);
  if (!db || !user) return null;
  const list = db.users.filter((u) => GROUPS[tab].includes(u.role) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())));
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const view = list.slice((Math.min(page, pages) - 1) * PAGE, Math.min(page, pages) * PAGE);
  const cnt = (k: string) => db.users.filter((u) => GROUPS[k].includes(u.role)).length;
  return (
    <>
      <PageHead title={tr("Хэрэглэгчид", "People")} sub={tr("Агент баталгаажуулах, хэрэглэгчийг түр хаах", "Verify agents and suspend accounts")} />
      <div className="mb-3"><input className="input !w-64" placeholder={tr("Нэр, имэйл", "Name or email")} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} data-testid="people-search" /></div>
      <Tabs value={tab} onChange={(t) => { setTab(t); setPage(1); }} items={[{ key: "agents", label: tr("Агентууд", "Agents"), count: cnt("agents") }, { key: "customers", label: tr("Хэрэглэгчид", "Customers"), count: cnt("customers") }, { key: "owners", label: tr("Өмчлөгчид", "Owners"), count: cnt("owners") }, { key: "staff", label: tr("Админууд", "Staff"), count: cnt("staff") }]} />
      <div className="mt-4">
        {view.length === 0 ? <Empty title={tr("Хэрэглэгч олдсонгүй", "No users found")} /> : (
          <div className="card overflow-x-auto"><table className="table-x min-w-[860px]" data-testid="people-table"><thead><tr><th>{tr("Нэр", "Name")}</th><th>{tr("Эрх", "Role")}</th><th>{tr("Холбоо барих", "Contact")}</th><th>{tr("Бүртгүүлсэн", "Joined")}</th><th>{tr("Төлөв", "Status")}</th><th /></tr></thead><tbody>
            {view.map((u) => (
              <tr key={u.id} data-testid="people-row">
                <td><div className="flex items-center gap-2.5"><Avatar name={u.name} color={u.avatarColor} src={u.avatar} size={34} /><div><div className="flex items-center gap-1 font-semibold">{u.name}{u.verified && <BadgeCheck size={13} className="text-sky" />}</div><div className="text-xs text-ink-3">{u.email}</div></div></div></td>
                <td>{user.role === "super_admin" && u.id !== user.id ? <select className="input !w-auto !py-1.5 text-xs" value={u.role} onChange={(e) => run(() => setUserRole(u.id, e.target.value as Role), tr("Эрх өөрчлөгдлөө", "Role changed"))} aria-label="role">{(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r][lang]}</option>)}</select> : <span className="text-sm">{ROLE_LABELS[u.role][lang]}</span>}</td>
                <td className="text-xs text-ink-3">{formatPhone(u.phone)}</td><td className="text-xs text-ink-3">{formatDate(u.createdAt, lang)}</td>
                <td><div className="flex flex-col items-start gap-1"><Badge tone={u.active ? "moss" : "rust"}>{u.active ? tr("Идэвхтэй", "Active") : tr("Түр хаагдсан", "Suspended")}</Badge>{u.demo && <span className="text-[10px] uppercase text-ink-4">{tr("демо", "demo")}</span>}</div></td>
                <td><div className="flex flex-wrap justify-end gap-1.5">
                  {(u.role === "agent" || u.role === "agency_owner") && <button className={u.verified ? "btn-ghost btn-sm" : "btn-primary btn-sm"} data-testid="verify-agent" onClick={() => run(() => verifyUser(u.id, !u.verified), u.verified ? tr("Баталгаа хасагдлаа", "Verification removed") : tr("Агент баталгаажлаа", "Agent verified"))}>{u.verified ? tr("Баталгаа хасах", "Unverify") : tr("Баталгаажуулах", "Verify")}</button>}
                  {u.id !== user.id && <button className="btn-ghost btn-sm" data-testid="toggle-active" onClick={() => run(() => setUserActive(u.id, !u.active), u.active ? tr("Түр хаалаа", "Suspended") : tr("Идэвхжүүллээ", "Reactivated"))}>{u.active ? tr("Түр хаах", "Suspend") : tr("Идэвхжүүлэх", "Reactivate")}</button>}
                  {u.id !== user.id && u.role !== "super_admin" && <button className="btn-danger btn-sm" onClick={() => setDel(u.id)}>{tr("Устгах", "Delete")}</button>}
                </div></td>
              </tr>))}
          </tbody></table></div>
        )}
        <Pagination page={Math.min(page, pages)} pages={pages} onPage={setPage} />
      </div>
      <Confirm open={!!del} onClose={() => setDel(null)} danger title={tr("Хэрэглэгч устгах уу?", "Delete this user?")} text={tr("Энэ үйлдлийг буцаах боломжгүй.", "This cannot be undone.")} onConfirm={() => del && run(() => adminDeleteUser(del), tr("Устгалаа", "Deleted"))} />
    </>
  );
}
