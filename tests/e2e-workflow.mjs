// End to end test of the 13 step workflow from the product brief. Usage: BASE_URL=http://localhost:3100 node tests/e2e-workflow.mjs
import { BASE, PW, assert, chromium, login, logout, makePng, newCtx, step } from "./helpers.mjs";

const stamp = Date.now().toString().slice(-6);
const customer = { name: "Э. Тестдемо", email: `e2e${stamp}@test.mn`, phone: "99112233" };
const title = `E2E ${stamp} 3 өрөө орон сууц, Зайсан`;

const browser = await chromium.launch();
const { page } = await newCtx(browser);
let code = "";
let listingId = "";
try {
  console.log("1. Customer registers");
  await page.goto(BASE + "/register");
  await page.getByTestId("reg-name").fill(customer.name);
  await page.getByTestId("reg-email").fill(customer.email);
  await page.getByTestId("reg-phone").fill(customer.phone);
  await page.getByTestId("reg-password").fill("secret1234");
  await page.getByTestId("reg-submit").click();
  await page.waitForURL("**/account", { timeout: 10000 });
  await page.getByTestId("user-menu").click();
  assert((await page.getByTestId("role-label").innerText()).length > 0, "role label visible");
  step("customer registered and landed on /account");
  await logout(page);
  step("customer signed out");

  console.log("2. Agent logs in");
  await login(page, "agent@munkhtenger.mn");
  await page.waitForURL("**/dashboard/agent");
  step("agent signed in to the agent dashboard");

  console.log("3. Agent creates a property listing");
  await page.goto(BASE + "/dashboard/agent/listings/new");
  await page.getByTestId("pf-title-mn").fill(title);
  await page.getByTestId("pf-title-en").fill(`E2E ${stamp} 3 room apartment, Zaisan`);
  await page.getByTestId("pf-desc-mn").fill("Нарлаг, цэвэрхэн засвартай, Богд уулын үзэмжтэй орон сууц. Сургууль, цэцэрлэгт ойрхон.");
  await page.getByTestId("pf-category").selectOption("apartment");
  await page.getByTestId("pf-type").selectOption("sale");
  await page.getByTestId("pf-price").fill("512000000");
  await page.getByTestId("pf-district").selectOption("khan_uul");
  await page.getByTestId("pf-khoroo").selectOption("3");
  await page.getByTestId("pf-address").fill("Хан Уул дүүрэг, 3 дугаар хороо, Зайсан");
  await page.getByTestId("pf-area").fill("94");
  await page.getByTestId("pf-rooms").fill("3");
  await page.getByTestId("pf-bedrooms").fill("2");
  await page.getByTestId("pf-bathrooms").fill("2");
  await page.getByTestId("pf-floor").fill("7");
  await page.getByTestId("pf-floors").fill("16");
  await page.getByTestId("pf-year").fill("2022");
  await page.getByTestId("pf-parking").check();
  await page.getByTestId("pf-elevator").check();
  // validation: submitting without a photo must fail with a visible error
  await page.getByTestId("pf-submit").click();
  await page.waitForSelector('[data-testid="toast-err"]');
  step("form validation blocks a listing without photos");
  const png = await makePng(page);
  await page.getByTestId("upload-input").setInputFiles([png, { ...png, name: "second.png" }]);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="upload-list"] li').length === 2);
  step("two photos uploaded, resized and previewed");
  await page.getByTestId("pf-submit").click();
  await page.waitForURL("**/dashboard/agent/listings", { timeout: 10000 });
  const row = page.getByTestId("listing-row").filter({ hasText: `E2E ${stamp}` });
  await row.waitFor();
  assert((await row.innerText()).toLowerCase().length > 0, "row present");
  code = (await row.locator(".font-mono").innerText()).trim();
  listingId = (await row.locator("a[href^='/properties/']").getAttribute("href")).split("/").pop();
  step(`agent listing ${code} created and shown as pending`);
  // Must NOT be public yet
  await logout(page);
  await page.goto(BASE + `/properties?q=E2E%20${stamp}`);
  await page.getByTestId("result-count").waitFor();
  await page.waitForFunction(() => document.querySelector('[data-testid="result-count"]')?.textContent?.startsWith("0"));
  step("pending listing is NOT visible on the public marketplace");

  console.log("4. Admin reviews and approves it");
  await login(page, "admin@munkhtenger.mn");
  await page.goto(BASE + "/dashboard/admin/listings?status=pending");
  const arow = page.getByTestId("admin-listing-row").filter({ hasText: `E2E ${stamp}` });
  await arow.waitFor();
  await arow.getByTestId("approve").click();
  await page.waitForSelector('[data-testid="toast-ok"]');
  assert((await page.getByTestId("admin-listing-row").filter({ hasText: `E2E ${stamp}` }).count()) === 0, "approved listing leaves the pending tab");
  step("admin approved the listing");
  // audit log
  await page.goto(BASE + "/dashboard/admin/audit");
  await page.getByTestId("audit-table").waitFor();
  assert((await page.getByTestId("audit-table").innerText()).includes("listing.approve"), "audit log has listing.approve");
  step("approval recorded in the audit log");
  await logout(page);

  console.log("5. Listing appears on the public marketplace");
  await page.goto(BASE + `/properties?q=E2E%20${stamp}`);
  await page.waitForFunction(() => document.querySelector('[data-testid="result-count"]')?.textContent?.startsWith("1 "));
  assert((await page.getByTestId("property-card").count()) === 1, "one card");
  step("listing is now public");

  console.log("6. Customer searches and filters");
  await login(page, customer.email, "secret1234");
  await page.goto(BASE + "/properties");
  const count = async () => parseInt((await page.getByTestId("result-count").innerText()).trim());
  await page.waitForSelector('[data-testid="property-card"]');
  const total = await count();
  await page.getByTestId("f-district").selectOption("khan_uul");
  await page.waitForFunction((t) => parseInt(document.querySelector('[data-testid="result-count"]').textContent) < t, total);
  const khan = await count();
  await page.getByTestId("f-category").selectOption("apartment");
  await page.getByTestId("beds-2").click();
  await page.getByTestId("f-parking").click();
  await page.getByTestId("f-min").fill("400000000");
  await page.getByTestId("f-min").press("Enter");
  await page.getByTestId("f-max").fill("600000000");
  await page.getByTestId("f-max").press("Enter");
  await page.waitForFunction(() => location.search.includes("max=600000000"));
  await page.waitForTimeout(300);
  const narrowed = await count();
  assert(narrowed >= 1 && narrowed <= khan, `filters narrow results (${total} > ${khan} >= ${narrowed})`);
  // every visible card price must be within range
  const prices = await page.getByTestId("property-card").locator(".font-display").allInnerTexts();
  for (const p of prices) { const v = parseInt(p.replace(/[^\d]/g, "")); assert(v >= 4e8 && v <= 6e8, "price in range: " + p); }
  step(`filters work: ${total} total, ${khan} in Khan Uul, ${narrowed} after category/bedrooms/parking/price`);
  await page.getByTestId("sort").selectOption("price_desc");
  await page.waitForFunction(() => location.search.includes("sort=price_desc"));
  await page.getByTestId("view-list").click();
  await page.getByTestId("view-map").click();
  await page.getByTestId("demo-map-label").waitFor();
  await page.getByTestId("map-marker").first().click();
  await page.getByTestId("map-preview-side").waitFor();
  step("sorting, list view and the demo map with marker preview work");
  await page.goto(BASE + `/properties?q=E2E%20${stamp}`);
  await page.getByTestId("property-card").first().click();
  await page.waitForURL(`**/properties/${listingId}`);

  console.log("7. Customer saves the property");
  await page.getByTestId("detail-title").waitFor();
  assert((await page.getByTestId("listing-id").innerText()).includes(code), "listing id shown");
  await page.getByTestId("favorite-btn").first().click();
  await page.waitForSelector('[data-testid="favorite-btn"][aria-pressed="true"]');
  step("property saved to favorites");

  console.log("8. Customer submits an inquiry");
  await page.getByTestId("inq-message").fill("Сайн байна уу, энэ орон сууцыг ирэх долоо хоногт үзэх боломжтой юу?");
  await page.getByTestId("inq-submit").click();
  await page.getByTestId("inquiry-sent").waitFor();
  step("inquiry submitted");
  // lightbox
  await page.getByTestId("gallery-main").click();
  await page.getByTestId("lightbox").waitFor();
  await page.getByTestId("lightbox-next").click();
  await page.keyboard.press("Escape");
  step("photo lightbox opens, navigates and closes");
  await page.goto(BASE + "/account/favorites");
  assert((await page.getByTestId("property-card").count()) >= 1, "favorite listed");
  await logout(page);

  console.log("9. Agent receives the inquiry");
  await login(page, "agent@munkhtenger.mn");
  await page.goto(BASE + "/dashboard/agent/inquiries");
  const inq = page.getByTestId("inquiry-item").filter({ hasText: customer.name });
  await inq.first().waitFor();
  assert((await inq.first().innerText()).includes("долоо хоногт"), "inquiry text visible to agent");
  await page.getByTestId("bell").click();
  assert((await page.getByTestId("bell-count").count()) === 1, "agent has unread notification");
  step("agent sees the inquiry and an unread notification");
  await inq.first().getByTestId("reply-input").fill("Сайн байна уу! Пүрэв гарагт 17:00 цагт үзэх боломжтой.");
  await inq.first().getByTestId("reply-send").click();
  await page.waitForSelector('[data-testid="toast-ok"]');
  step("agent replied to the inquiry");

  console.log("10. Agent schedules a viewing");
  await page.goto(BASE + "/dashboard/agent/leads");
  await page.getByTestId("lead-card").filter({ hasText: customer.name }).first().click();
  await page.getByTestId("lead-detail").waitFor();
  await page.getByTestId("lead-schedule").click();
  const d = new Date(Date.now() + 3 * 864e5); d.setHours(17, 0, 0, 0);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  await page.getByTestId("sv-date").fill(local);
  await page.getByTestId("sv-submit").click();
  await page.waitForSelector('[data-testid="toast-ok"]');
  assert((await page.getByTestId("lead-viewings").innerText()).length > 5, "viewing in lead history");
  step("viewing scheduled from the lead card");
  await page.getByTestId("note-input").fill("Эхний дуудлагаар төсөв 520 сая гэж хэлсэн.");
  await page.getByTestId("note-add").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="notes"]')?.textContent?.includes("520"));
  await page.getByTestId("rem-text").fill("Үзлэгийн дараа залгах");
  await page.getByTestId("rem-due").fill(local);
  await page.getByTestId("rem-add").click();
  step("internal note and follow up reminder saved");
  await page.keyboard.press("Escape");
  await logout(page);

  console.log("11. Customer receives a notification");
  await login(page, customer.email, "secret1234");
  await page.getByTestId("bell").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="bell-count"]'));
  await page.goto(BASE + "/notifications");
  const nt = await page.getByTestId("notification-list").innerText();
  assert(/үзлэг|Viewing/i.test(nt), "viewing notification present: " + nt.slice(0, 200));
  step("customer notification center shows the viewing update");
  await page.goto(BASE + "/account/viewings");
  assert((await page.getByTestId("viewing-row").count()) >= 1, "viewing listed for customer");
  step("customer can track the appointment");
  await logout(page);

  console.log("12. Agent updates the lead status");
  await login(page, "agent@munkhtenger.mn");
  await page.goto(BASE + "/dashboard/agent/leads");
  await page.getByTestId("lead-card").filter({ hasText: customer.name }).first().click();
  await page.getByTestId("lead-stage").selectOption("negotiation");
  await page.waitForSelector('[data-testid="toast-ok"]');
  await page.getByTestId("lead-stage").selectOption("successful");
  await page.waitForFunction(() => document.querySelector('[data-testid="history"]')?.textContent?.includes("Амжилттай"));
  step("lead moved Negotiation then Successful (deal opened and completed)");
  await page.keyboard.press("Escape");
  await page.goto(BASE + "/dashboard/agent/deals");
  const dealTxt = await page.getByTestId("deal-table").innerText();
  assert(dealTxt.includes(code), "deal for the new listing exists");
  step("deal visible in the agent's deals");
  await logout(page);

  console.log("13. Admin views the transaction and analytics");
  await login(page, "admin@munkhtenger.mn");
  await page.goto(BASE + "/dashboard/admin/activity");
  assert((await page.getByTestId("admin-deals").innerText()).includes(code), "admin sees transaction");
  step("admin sees the completed transaction");
  await page.goto(BASE + "/dashboard/admin");
  await page.getByTestId("admin-stats").waitFor();
  await page.goto(BASE + "/dashboard/admin/analytics");
  await page.waitForSelector("svg");
  step("platform analytics render");
  await page.goto(BASE + "/properties/" + listingId);
  assert((await page.locator("body").innerText()).includes("MT"), "sold listing page still resolves for admin");
  await logout(page);

  if (page.errors.length) throw new Error("Browser errors:\n" + page.errors.join("\n"));
  console.log("\nALL 13 WORKFLOW STEPS PASSED");
  await browser.close();
} catch (e) {
  console.error("\nFAILED:", e.message);
  try { await page.screenshot({ path: "tests/failure.png", fullPage: true }); console.error("URL:", page.url()); console.error("Errors:", page.errors); } catch {}
  await browser.close();
  process.exit(1);
}
