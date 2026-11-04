"use client";
import { BadgeCheck, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart } from "@/components/charts";
import { PageHead } from "@/components/dash";
import { Avatar } from "@/components/shell";
import { Badge, Confirm, Empty, Field, Modal, Stat, Tabs, useRun } from "@/components/ui";
import { addAgentToAgency, createAgency, removeAgentFromAgency, updateAgency } from "@/lib/actions";
import { formatMNT, timeAgo } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db, user } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  const [tab, setTab] = useState<"overview" | "team" | "profile">("overview");
  const [add, setAdd] = useState(false);
  const [rm, setRm] = useState<string | null>(null);
  const [ag, setAg] = useState({ name: "", phone: "", email: "", address: "", district: "sukhbaatar", mn: "", en: "" });
  const [na, setNa] = useState({ email: "", name: "", phone: "", password: "" });
  const agency = db && user ? db.agencies.find((a) => a.id === user.agencyId) : undefined;
  useEffect(() => {
    if (agency) setAg({ name: agency.name, phone: agency.phone, email: agency.email, address: agency.address, district: agency.district, mn: agency.description.mn, en: agency.description.en });
  }, [agency?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!db || !user) return null;

  if (!agency)
    return (
      <>
        <PageHead title={tr("Агентлагийн профайл үүсгэх", "Create your agency profile")} />
        <form className="card max-w-xl space-y-4 p-6" data-testid="agency-create" onSubmit={(e) => { e.preventDefault(); run(() => { createAgency({ name: ag.name, phone: ag.phone, email: ag.email, address: ag.address, district: ag.district, description: { mn: ag.mn, en: ag.en || ag.mn } }); }, tr("Агентлаг үүслээ", "Agency created")); }}>
          <Field label={tr("Агентлагийн нэр", "Agency name")}><input className="input" value={ag.name} onChange={(e) => setAg({ ...ag, name: e.target.value })} data-testid="ac-name" /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label={tr("Утас", "Phone")}><input className="input" value={ag.phone} onChange={(e) => setAg({ ...ag, phone: e.target.value })} data-testid="ac-phone" /></Field><Field label={tr("Имэйл", "Email")}><input className="input" type="email" value={ag.email} onChange={(e) => setAg({ ...ag, email: e.target.value })} data-testid="ac-email" /></Field></div>
          <Field label={tr("Хаяг", "Address")}><input className="input" value={ag.address} onChange={(e) => setAg({ ...ag, address: e.target.value })} /></Field>
          <Field label={tr("Танилцуулга", "Description")}><textarea className="input" value={ag.mn} onChange={(e) => setAg({ ...ag, mn: e.target.value })} /></Field>
          <button className="btn-primary" data-testid="ac-submit">{tr("Үүсгэх", "Create agency")}</button>
        </form>
      </>
    );

  const team = db.users.filter((u) => u.agencyId === agency.id && (u.role === "agent" || u.role === "agency_owner"));
  const rows = team.map((u) => {
    const props = db.properties.filter((p) => p.agentId === u.id);
    const leads = db.leads.filter((x) => x.agentId === u.id);
    const deals = db.deals.filter((d) => d.agentId === u.id && d.status === "completed");
    return { u, active: props.filter((p) => p.status === "published").length, total: props.length, views: props.reduce((a, p) => a + p.views, 0), leads: leads.length, won: leads.filter((x) => x.stage === "successful").length, deals: deals.length, revenue: deals.reduce((a, d) => a + d.amount, 0), commission: deals.reduce((a, d) => a + d.commission, 0), lastSeen: u.lastLoginAt };
  });
  const sum = (k: "active" | "leads" | "deals" | "revenue" | "views") => rows.reduce((a, r) => a + r[k], 0);
  return (
    <>
      <PageHead title={agency.name} sub={tr("Агентлагийн удирдлага", "Agency management")} actions={<><Link href={`/agencies/${agency.id}`} className="btn-ghost btn-sm">{tr("Нийтийн хуудас", "Public page")}</Link><button className="btn-primary btn-sm" onClick={() => setAdd(true)} data-testid="add-agent"><Plus size={14} />{tr("Агент нэмэх", "Add agent")}</button></>} />
      <Tabs value={tab} onChange={setTab} items={[{ key: "overview", label: tr("Статистик", "Statistics") }, { key: "team", label: tr("Баг", "Team"), count: team.length }, { key: "profile", label: tr("Агентлагийн профайл", "Agency profile") }]} />
      <div className="mt-5">
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="agency-stats"><Stat label={tr("Агент", "Agents")} value={team.length} /><Stat label={tr("Идэвхтэй зар", "Active listings")} value={sum("active")} /><Stat label={tr("Харилцагч", "Leads")} value={sum("leads")} /><Stat label={tr("Хаагдсан гүйлгээний дүн", "Closed deal volume")} value={formatMNT(sum("revenue"))} tone="brass" /></div>
            <div className="card mt-5 p-5"><h2 className="mb-3 font-semibold">{tr("Агент тус бүрийн идэвхтэй зар", "Active listings per agent")}</h2><BarChart data={rows.map((r) => ({ label: r.u.name.split(" ")[1]?.slice(0, 8) ?? r.u.name, value: r.active }))} /></div>
          </>
        )}
        {tab === "team" && (
          <div className="card overflow-x-auto"><table className="table-x min-w-[900px]" data-testid="team-table"><thead><tr><th>{tr("Агент", "Agent")}</th><th>{tr("Идэвхтэй зар", "Active")}</th><th>{tr("Үзсэн", "Views")}</th><th>{tr("Харилцагч", "Leads")}</th><th>{tr("Амжилттай", "Won")}</th><th>{tr("Гүйлгээ", "Deals")}</th><th>{tr("Комисс", "Commission")}</th><th>{tr("Сүүлд нэвтэрсэн", "Last active")}</th><th /></tr></thead><tbody>
            {rows.map((r) => <tr key={r.u.id}><td><div className="flex items-center gap-2.5"><Avatar name={r.u.name} color={r.u.avatarColor} src={r.u.avatar} size={34} /><div><div className="flex items-center gap-1 font-semibold">{r.u.name}{r.u.verified && <BadgeCheck size={13} className="text-sky" />}</div><div className="text-xs text-ink-3">{r.u.role === "agency_owner" ? tr("Эзэн", "Owner") : l(r.u.title)}</div></div></div></td><td>{r.active}/{r.total}</td><td>{r.views.toLocaleString("en-US")}</td><td>{r.leads}</td><td>{r.won}</td><td>{r.deals}</td><td className="whitespace-nowrap">{formatMNT(r.commission)}</td><td className="text-xs text-ink-3">{r.lastSeen ? timeAgo(r.lastSeen, lang) : tr("Нэвтрээгүй", "Never")}</td><td>{r.u.role === "agent" && <button className="btn-danger btn-sm" onClick={() => setRm(r.u.id)}>{tr("Хасах", "Remove")}</button>}</td></tr>)}
          </tbody></table></div>
        )}
        {tab === "profile" && (
          <form className="card max-w-xl space-y-4 p-6" data-testid="agency-profile" onSubmit={(e) => { e.preventDefault(); run(() => updateAgency(agency.id, { name: ag.name, phone: ag.phone, email: ag.email, address: ag.address, description: { mn: ag.mn, en: ag.en || ag.mn } }), tr("Хадгалагдлаа", "Saved")); }}>
            <Field label={tr("Нэр", "Name")}><input className="input" value={ag.name} onChange={(e) => setAg({ ...ag, name: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2"><Field label={tr("Утас", "Phone")}><input className="input" value={ag.phone} onChange={(e) => setAg({ ...ag, phone: e.target.value })} /></Field><Field label={tr("Имэйл", "Email")}><input className="input" value={ag.email} onChange={(e) => setAg({ ...ag, email: e.target.value })} /></Field></div>
            <Field label={tr("Хаяг", "Address")}><input className="input" value={ag.address} onChange={(e) => setAg({ ...ag, address: e.target.value })} /></Field>
            <Field label={tr("Танилцуулга (монгол)", "Description (Mongolian)")}><textarea className="input" value={ag.mn} onChange={(e) => setAg({ ...ag, mn: e.target.value })} /></Field>
            <Field label={tr("Танилцуулга (англи)", "Description (English)")}><textarea className="input" value={ag.en} onChange={(e) => setAg({ ...ag, en: e.target.value })} /></Field>
            <div className="flex items-center gap-3"><button className="btn-primary">{tr("Хадгалах", "Save")}</button>{agency.verified ? <Badge tone="sky">{tr("Баталгаажсан агентлаг", "Verified agency")}</Badge> : <Badge tone="brass">{tr("Баталгаажуулалт хүлээгдэж байна", "Verification pending")}</Badge>}</div>
          </form>
        )}
      </div>
      {team.length === 0 && <Empty title={tr("Агент алга", "No agents yet")} />}
      <Modal open={add} onClose={() => setAdd(false)} title={tr("Агент нэмэх", "Add an agent")}>
        <form className="space-y-4" data-testid="add-agent-form" onSubmit={(e) => { e.preventDefault(); run(() => { addAgentToAgency(na.email, agency.id, na.name ? { name: na.name, phone: na.phone, password: na.password } : undefined); setAdd(false); setNa({ email: "", name: "", phone: "", password: "" }); }, tr("Агент нэмэгдлээ", "Agent added")); }}>
          <p className="text-xs text-ink-3">{tr("Бүртгэлтэй хэрэглэгчийн имэйлийг оруулж нэмэх, эсвэл шинэ агентын мэдээллийг доор бөглөнө.", "Enter an existing user's email, or fill in the details below to create a new agent account.")}</p>
          <Field label={tr("Имэйл", "Email")}><input className="input" type="email" value={na.email} onChange={(e) => setNa({ ...na, email: e.target.value })} data-testid="aa-email" /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label={tr("Нэр (шинэ агент)", "Name (new agent)")}><input className="input" value={na.name} onChange={(e) => setNa({ ...na, name: e.target.value })} data-testid="aa-name" /></Field><Field label={tr("Утас", "Phone")}><input className="input" value={na.phone} onChange={(e) => setNa({ ...na, phone: e.target.value })} data-testid="aa-phone" /></Field></div>
          <Field label={tr("Түр нууц үг", "Temporary password")}><input className="input" type="text" value={na.password} onChange={(e) => setNa({ ...na, password: e.target.value })} data-testid="aa-password" /></Field>
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setAdd(false)}>{tr("Болих", "Cancel")}</button><button className="btn-primary" data-testid="aa-submit">{tr("Нэмэх", "Add")}</button></div>
        </form>
      </Modal>
      <Confirm open={!!rm} onClose={() => setRm(null)} danger title={tr("Агентыг хасах уу?", "Remove this agent?")} text={tr("Түүний зар, харилцагч агентлагийн эзэнд шилжинэ.", "Their listings and leads move to the agency owner.")} onConfirm={() => rm && run(() => removeAgentFromAgency(rm), tr("Хаслаа", "Removed"))} />
    </>
  );
}
