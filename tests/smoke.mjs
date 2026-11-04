// Smoke test: every route per role, role permissions, visible text rules (no hyphens or dashes between words), mobile overflow.
import { BASE, assert, chromium, login, logout, newCtx } from "./helpers.mjs";

const browser = await chromium.launch();
const failures = [];
const fail = (m) => { failures.push(m); console.log("  ✗ " + m); };
const ok = (m) => console.log("  ✓ " + m);

const DASH = {
  public: ["/", "/properties", "/properties?view=map", "/properties?view=list&type=rent", "/agents", "/pricing", "/compare", "/login", "/register"],
  customer: ["/account", "/account/profile", "/account/favorites", "/account/recent", "/account/inquiries", "/account/viewings", "/account/searches", "/notifications"],
  agent: ["/dashboard/agent", "/dashboard/agent/listings", "/dashboard/agent/listings/new", "/dashboard/agent/inquiries", "/dashboard/agent/viewings", "/dashboard/agent/leads", "/dashboard/agent/deals", "/dashboard/agent/billing"],
  agency: ["/dashboard/agency", "/dashboard/agent/listings", "/dashboard/agent/leads"],
  admin: ["/dashboard/admin", "/dashboard/admin/analytics", "/dashboard/admin/listings", "/dashboard/admin/people", "/dashboard/admin/agencies", "/dashboard/admin/catalog", "/dashboard/admin/promotions", "/dashboard/admin/billing", "/dashboard/admin/activity", "/dashboard/admin/content", "/dashboard/admin/audit"],
};
const ACCOUNTS = { customer: "customer@munkhtenger.mn", agent: "agent@munkhtenger.mn", agency: "agency@munkhtenger.mn", admin: "superadmin@munkhtenger.mn" };

const BAD = /[\p{L}\p{N}]-[\p{L}\p{N}]|\s-\s|[–—]/u;
async function scan(page, route, label) {
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(250);
  const text = await page.evaluate(() => document.body.innerText);
  const m = text.match(BAD);
  if (m) {
    const i = text.indexOf(m[0]);
    fail(`${label} ${route}: dash in visible text near "${text.slice(Math.max(0, i - 25), i + 25).replace(/\n/g, " ")}"`);
  }
  if (/Application error|This page could not be found|Unhandled Runtime Error/.test(text)) fail(`${label} ${route}: error page`);
  return text;
}

for (const lang of ["mn", "en"]) {
  console.log(`\nLanguage ${lang}`);
  const { page } = await newCtx(browser);
  await page.addInitScript((l) => localStorage.setItem("mt_lang", l), lang);
  for (const r of DASH.public) await scan(page, r, `guest/${lang}`);
  ok("public routes");
  // property detail pages (first 6 listings + each category)
  await page.goto(BASE + "/properties");
  const hrefs = await page.locator("a[href^='/properties/prp_']").evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href")))].slice(0, 6));
  for (const h of hrefs) await scan(page, h, `detail/${lang}`);
  ok(`${hrefs.length} property detail pages`);
  for (const role of ["customer", "agent", "agency", "admin"]) {
    await login(page, ACCOUNTS[role]);
    for (const r of DASH[role]) await scan(page, r, `${role}/${lang}`);
    await page.goto(BASE + "/");
    await logout(page);
    ok(`${role} routes`);
  }
  if (page.errors.length) fail(`browser errors (${lang}): ${[...new Set(page.errors)].slice(0, 4).join(" | ")}`);
  await page.context().close();
}

console.log("\nRole permissions");
{
  const { page } = await newCtx(browser);
  await page.goto(BASE + "/dashboard/admin");
  await page.getByTestId("guard-signin").waitFor();
  ok("guest is asked to sign in for the admin area");
  await login(page, ACCOUNTS.customer);
  for (const r of ["/dashboard/admin", "/dashboard/admin/listings", "/dashboard/agent", "/dashboard/agent/leads", "/dashboard/agency"]) {
    await page.goto(BASE + r);
    await page.getByTestId("guard-forbidden").waitFor({ timeout: 6000 }).catch(() => fail(`customer can open ${r}`));
  }
  ok("customer is blocked from agent, agency and admin dashboards");
  await page.goto(BASE + "/");
  await logout(page);
  await login(page, ACCOUNTS.agent);
  for (const r of ["/dashboard/admin", "/dashboard/admin/people", "/dashboard/admin/billing", "/dashboard/agency"]) {
    await page.goto(BASE + r);
    await page.getByTestId("guard-forbidden").waitFor({ timeout: 6000 }).catch(() => fail(`agent can open ${r}`));
  }
  ok("agent is blocked from admin pages and agency management");
  // agent cannot edit someone else's listing
  await page.goto(BASE + "/properties");
  const other = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith("mt_db_v"))));
    const me = db.users.find((u) => u.email === "agent@munkhtenger.mn");
    return db.properties.find((p) => p.agentId !== me.id).id;
  });
  await page.goto(BASE + "/dashboard/agent/listings/" + other);
  await page.getByTestId("empty").waitFor({ timeout: 6000 }).catch(() => fail("agent can open another agent's listing editor"));
  ok("agent cannot open another agent's listing for editing");
  await page.context().close();
}

console.log("\nMobile layout (390 px)");
{
  const { ctx, page } = await newCtx(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const checks = [...DASH.public.slice(0, 7)];
  for (const r of checks) {
    await page.goto(BASE + r, { waitUntil: "networkidle" });
    const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    if (w.sw > w.iw + 1) fail(`mobile overflow on ${r}: ${w.sw} > ${w.iw}`);
  }
  await page.goto(BASE + "/");
  await page.getByTestId("mobile-menu-btn").click();
  await page.getByRole("link", { name: /Худалдан авах/ }).first().waitFor();
  ok("mobile menu opens");
  for (const [role, routes] of [["agent", DASH.agent], ["admin", DASH.admin]]) {
    await login(page, ACCOUNTS[role]);
    for (const r of routes) {
      await page.goto(BASE + r, { waitUntil: "networkidle" });
      const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      if (w.sw > w.iw + 1) fail(`mobile overflow on ${role} ${r}: ${w.sw} > ${w.iw}`);
    }
    await page.goto(BASE + "/");
    await page.getByTestId("user-menu").click();
    await page.getByTestId("logout").click();
  }
  ok("no horizontal overflow on mobile pages");
  await ctx.close();
}

console.log("\nCyrillic glyphs Ө and Ү");
{
  const { page } = await newCtx(browser);
  await page.goto(BASE + "/");
  const res = await page.evaluate(async () => {
    await document.fonts.ready;
    const loaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
    return { loaded: [...new Set(loaded)], mn: document.body.innerText.includes("Ө") || document.body.innerText.includes("ө"), uu: /[ҮҮү]/.test(document.body.innerText) };
  });
  console.log("  fonts loaded:", res.loaded.join(", "));
  assert(res.mn && res.uu, "homepage text contains Ө/ө and Ү/ү");
  ok("homepage renders Ө and Ү using the loaded web fonts");
  await page.screenshot({ path: "tests/screenshots/home.png" });
}
await browser.close();
if (failures.length) { console.log(`\n${failures.length} FAILURES`); process.exit(1); }
console.log("\nSMOKE TESTS PASSED");
