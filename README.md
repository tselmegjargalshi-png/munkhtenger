# Мөнхтэнгэр (Munkhtenger)

A real estate marketplace and management platform for Mongolia, built as an independent product with Next.js 15, TypeScript and Tailwind CSS. Mongolian is the default language, English is one click away. Prices are in Mongolian tugrik (₮), areas in m², phone numbers follow the Mongolian 8 digit format, and locations use the Ulaanbaatar districts and khoroos.

> **Demo build.** Out of the box the app runs in a fully working **local demo mode**: all data is fictional, stored in your browser, and every payment is simulated. Read [Demo mode and its limitations](#demo-mode-and-its-limitations) before judging what is and is not production ready.

## What is inside

| Area | What works in demo mode |
| --- | --- |
| Public marketplace | Homepage, categories, featured and premium listings, recently added, popular locations, verified agents, recently viewed |
| Search | 17 filters, list, grid and map views, sorting, pagination, URL based filters, saved searches with match notifications |
| Property page | Gallery with lightbox, listing ID, specs, amenities, nearby places, map, agent card, phone reveal, inquiry form, viewing request, similar listings, share, favorite, compare, report |
| Compare | Up to four listings, price per m², differences highlighted, best value marked |
| Accounts | Register, sign in, profile with photo, favorites, recently viewed, inquiries with replies, viewing tracking, notification center |
| Agent workspace | Create, edit, delete, publish or unpublish listings, multi photo upload, per listing performance, inquiries, viewings, CRM, deals, plan and billing |
| CRM | Lead pipeline board and list, drag and drop stages, source tracking, notes, follow up reminders, contact history, viewing history, lead assignment |
| Agency | Agency profile, add and remove agents, team performance, agency wide leads and listings |
| Admin | Dashboard statistics, listing approval with rejection reasons, verification, people and role management, categories and locations, featured and premium management, subscriptions and payments, inquiries, viewings, deals, reports, website content, analytics, audit log |
| Monetization | Free plan, agent plans, agency plans, listing promotion packages, expiry dates, subscription and payment history, simulated QPay, SocialPay, bank transfer and cash |
| Notifications | In app notifications for inquiries, viewing requests and updates, approvals and rejections, listing and subscription expiry, messages, saved search matches, payments, reminders |

Roles: Super Admin, Platform Admin, Agency Owner, Real Estate Agent, Property Owner, Customer. Each role has its own landing area and the guards block everything else.

Demo content: 50 listings, 15 agents, 5 agencies, 30 customers, 40 inquiries (plus extra leads), 20 viewings and 10 premium listings, all labelled as demo data. Property photos are original SVG illustrations generated in code, so there are no image licensing concerns.

## Quick start

Requirements: Node.js 18.18 or newer.

```bash
git clone https://github.com/tselmegjargalshi-png/munkhtenger.git
cd munkhtenger
npm install
cp .env.example .env.local   # optional, demo mode needs no values
npm run dev                  # http://localhost:3000
```

Production build: `npm run build && npm start`.

### Demo accounts

Every demo account uses the password `demo1234`. The sign in page has one click buttons for them.

| Role | Email |
| --- | --- |
| Super Admin | superadmin@munkhtenger.mn |
| Platform Admin | admin@munkhtenger.mn |
| Agency Owner | agency@munkhtenger.mn |
| Agent | agent@munkhtenger.mn |
| Property Owner | owner@munkhtenger.mn |
| Customer | customer@munkhtenger.mn |

The footer has a "Reset demo data" link that restores the original dataset.

## Environment variables

Demo mode needs none. See `.env.example`.

| Variable | Used for | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Absolute URLs for sharing and metadata | No |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client once the Supabase data provider is wired | Production only |
| `SUPABASE_SERVICE_ROLE_KEY` | Server side admin tasks, never expose to the browser | Production only |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | A live map provider, once the map component is swapped | Production only |
| `QPAY_*`, `SOCIALPAY_*` | Real payment gateways, once integrated | Production only |

Nothing in the current code reads the Supabase, map or payment variables yet. They are listed so the production path is clear.

## Demo mode and its limitations

Please read these. They are deliberate trade offs of a credential free demo, not hidden bugs.

1. **Data lives in your browser.** The whole database is kept in `localStorage`. Changes persist across reloads, but each browser profile has its own private copy. Two people on two devices do not see each other's listings or inquiries. The 13 step workflow works by switching between roles in the same browser.
2. **Security is simulated.** Passwords are hashed in the browser and role checks run in client code. This keeps the demo honest about who can see what, but it is not a security boundary. Real authentication and enforcement need Supabase Auth and the row level security policies in `supabase/migrations/0001_init.sql`.
3. **Supabase is prepared, not connected.** The schema, row level security policies, storage bucket and signup trigger are written and mirror `lib/types.ts`. They have not been applied to a live project and the UI does not read from Supabase yet. Connecting it means replacing `lib/store.ts` and `lib/actions.ts` with Supabase backed equivalents.
4. **The map is a labelled demo map.** It is a schematic of central Ulaanbaatar drawn from district coordinates, clearly marked "DEMO MAP". Markers, price pills, previews, district selection and drag to select area filtering all work, but it is not geographically exact and is not a live provider. Listing coordinates are placed near the district centre.
5. **Payments are simulated.** QPay, SocialPay, bank transfer and cash screens create records and activate plans or promotions, but no gateway is called and no money moves. QPay and SocialPay confirm with a button that stands in for the gateway callback. Bank and cash wait for an admin to confirm. Every payment screen says so.
6. **Photos.** Uploads are resized in the browser and stored as data URLs. `localStorage` is limited to roughly 5 MB, so a large number of big photos will fill it. The app shows a red warning when a save fails. In production use Supabase Storage (the bucket is in the migration).
7. **Notifications are in app only.** No email, SMS or push. Expiry and reminder notifications are generated when a page loads, not by a scheduler. Saved search alerts fire when an admin approves a matching listing.
8. **Mongolian copy** was written for this project and should get a native speaker review before launch.
9. **The no hyphen rule.** The interface avoids hyphens and dashes between words in both languages, and an automated test scans every screen for them. Text typed in by users is not rewritten.

## Testing

The app was tested in a real browser (Playwright, Chromium). The tests need Playwright: `npm i -D playwright && npx playwright install chromium`.

```bash
npm run build && npx next start -p 3100 &
npm run test:e2e     # the 13 step workflow from the brief
npm run test:smoke   # every route per role in both languages, permissions, mobile overflow, Ө and Ү fonts
npm run typecheck
```

`test:e2e` drives the UI through: customer registers, agent signs in, agent creates a listing with photo upload, admin approves it, it appears publicly, customer filters and saves it, customer sends an inquiry, agent receives it, agent schedules a viewing, customer gets the notification, agent moves the lead through Negotiation to Successful, admin sees the transaction and analytics.

`test:smoke` visits all public, customer, agent, agency and admin routes in Mongolian and English, checks that customers and agents are blocked from areas they should not reach, checks for horizontal overflow at 390 px width, scans for hyphens and dashes in visible text, and confirms the Ө and Ү glyphs load from the web fonts.

## Language and typography

Mongolian is the default and the choice is remembered. Fonts are self hosted through Fontsource (Manrope for text, Lora for headings). Both include the Cyrillic Extended subset, which contains the Mongolian letters Ө, ө, Ү and ү, so they render correctly with no external font requests.

## Project layout

```
app/                  Next.js App Router pages (public, account, dashboard/agent, dashboard/agency, dashboard/admin)
components/           UI building blocks, property form, demo map, charts, checkout
lib/types.ts          Data model
lib/seed.ts           Fictional demo data generator (deterministic)
lib/store.ts          localStorage database, change subscription, atomic mutate()
lib/actions.ts        Every write: validation (zod), permission checks, notifications, audit log
lib/search.ts         Filter parsing, search, sorting, similar listings
lib/images.ts         Generated SVG photos and in browser image compression
supabase/migrations/  Production schema with row level security
tests/                Playwright end to end and smoke tests
```

## Roles and permissions

| Capability | Customer | Owner | Agent | Agency Owner | Platform Admin | Super Admin |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Browse, favorite, compare, inquire, book viewings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create and manage own listings | | ✓ | ✓ | ✓ (all agency) | ✓ | ✓ |
| CRM, viewings, deals | | ✓ | ✓ | ✓ (whole team) | ✓ | ✓ |
| Manage agents and assign leads | | | | ✓ | ✓ | ✓ |
| Approve or reject listings, verify agents | | | | | ✓ | ✓ |
| Categories, locations, promotions, billing, content | | | | | ✓ | ✓ |
| Change user roles | | | | | | ✓ |

## Deploying

### GitHub

The code lives in `https://github.com/tselmegjargalshi-png/munkhtenger`. A GitHub Actions workflow (`.github/workflows/ci.yml`) runs the type check and production build on every push and pull request.

### Vercel

1. In Vercel choose **Add New, Project** and import the `munkhtenger` GitHub repository.
2. Framework preset: Next.js (detected automatically, `vercel.json` is included). No environment variables are required for the demo.
3. Deploy. Every push to `main` redeploys.
4. Add a custom domain under Project Settings, Domains when you have one.

Because the demo keeps data in the browser, a Vercel deployment is a fully interactive demo for each visitor, with no shared database.

### Going to production with Supabase

1. Create a Supabase project and run `supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`).
2. Set the Supabase variables in Vercel and in `.env.local`.
3. Replace the demo data layer (`lib/store.ts`, `lib/actions.ts`, the auth parts of `lib/seed.ts`) with Supabase queries, Supabase Auth and Supabase Storage. Keep the zod schemas and permission rules, which map one to one onto the policies.
4. Move admin only transitions (approving listings, verification, promotions) into RPC functions or triggers so the database enforces them.
5. Replace the demo checkout with real QPay and SocialPay integrations. Never mark a payment paid without the gateway callback.
6. Replace the demo map with Mapbox, Google Maps or Leaflet and real coordinates.
7. Add scheduled jobs for listing and subscription expiry and for email or SMS notifications.

Live demo: deployed on Vercel from main.
