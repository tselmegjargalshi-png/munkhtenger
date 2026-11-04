import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export const { chromium } = require("playwright");
export const BASE = process.env.BASE_URL || "http://localhost:3100";
export const PW = "demo1234";

let n = 0;
export function step(name) {
  n++;
  console.log(`  ✓ ${String(n).padStart(2, "0")} ${name}`);
}
export function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}
export async function newCtx(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, locale: "mn-MN", ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push("console: " + m.text()));
  page.errors = errors;
  return { ctx, page };
}
export async function login(page, email, password = PW) {
  await page.goto(BASE + "/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 10000 });
}
export async function logout(page) {
  if (!(await page.getByTestId("logout").isVisible())) await page.getByTestId("user-menu").click();
  await page.getByTestId("logout").click();
  await page.waitForSelector('[data-testid="nav-login"], [data-testid="nav-register"]', { timeout: 8000 });
}
export async function makePng(page) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 800; c.height = 600;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 800, 600);
    g.addColorStop(0, "#1E3A5F"); g.addColorStop(1, "#A9814A");
    x.fillStyle = g; x.fillRect(0, 0, 800, 600);
    return c.toDataURL("image/png").split(",")[1];
  });
  return { name: "test-photo.png", mimeType: "image/png", buffer: Buffer.from(b64, "base64") };
}
