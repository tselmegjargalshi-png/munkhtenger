-- Munkhtenger production schema for Supabase (PostgreSQL).
-- STATUS: provided for the production path. It has not been applied to a live Supabase project from this
-- repository, and the web app does not read from it yet (the app ships with a local demo data layer).
-- Mirrors lib/types.ts. Apply with the Supabase CLI: supabase db push

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type user_role as enum ('super_admin','platform_admin','agency_owner','agent','owner','customer');
create type property_category as enum ('apartment','house','land','commercial','office','retail','warehouse','new_development');
create type listing_type as enum ('sale','rent','long_lease','short_rent');
create type listing_status as enum ('draft','pending','published','rejected','unpublished','sold','rented','expired');
create type promotion_tier as enum ('none','featured','premium');
create type lead_stage as enum ('new','contacted','interested','viewing','negotiation','successful','lost');
create type lead_source as enum ('website','phone','walk_in','referral','facebook','other');
create type viewing_status as enum ('requested','confirmed','completed','cancelled');
create type payment_method as enum ('qpay','socialpay','bank','cash');
create type payment_status as enum ('pending','paid','failed','refunded');

-- ---------- reference data ----------
create table districts (
  key text primary key,
  name_mn text not null, name_en text not null,
  khoroos int not null check (khoroos between 1 and 99),
  enabled boolean not null default true, popular boolean not null default false,
  lat double precision, lng double precision
);
create table categories (
  key property_category primary key,
  name_mn text not null, name_en text not null,
  enabled boolean not null default true, sort_order int not null default 0
);

-- ---------- people ----------
create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null, owner_id uuid,
  description_mn text, description_en text,
  phone text, email text, address text, district text references districts(key),
  color text default '#1E3A5F', logo_url text,
  verified boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  name text not null, email text not null unique,
  phone text check (phone ~ '^[5-9][0-9]{7}$'),
  avatar_url text, avatar_color text,
  agency_id uuid references agencies(id) on delete set null,
  title_mn text, title_en text, bio_mn text, bio_en text,
  verified boolean not null default false,
  languages text[] default '{}', experience_years int,
  active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), last_login_at timestamptz
);
alter table agencies add constraint agencies_owner_fk foreign key (owner_id) references profiles(id) on delete set null;

-- ---------- listings ----------
create table properties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title_mn text not null, title_en text,
  description_mn text not null, description_en text,
  category property_category not null, listing_type listing_type not null,
  status listing_status not null default 'draft', promotion promotion_tier not null default 'none', promoted_until timestamptz,
  price numeric(16,0) not null check (price > 0),
  area numeric(12,2) not null check (area > 0), land_area numeric(12,2),
  rooms int default 0, bedrooms int default 0, bathrooms int default 0,
  floor int default 0, building_floors int default 0, year_built int default 0,
  furnished boolean default false, parking boolean default false, balcony boolean default false,
  elevator boolean default false, new_build boolean default false, verified boolean not null default false,
  district text not null references districts(key), khoroo int not null check (khoroo between 1 and 99),
  address text not null, lat double precision, lng double precision,
  images text[] not null default '{}',            -- Supabase Storage object paths in bucket "property-images"
  amenities text[] not null default '{}',
  nearby jsonb not null default '[]',
  agent_id uuid not null references profiles(id), owner_id uuid references profiles(id),
  agency_id uuid references agencies(id),
  views int not null default 0,
  rejection_reason text,
  published_at timestamptz, expires_at timestamptz not null default (now() + interval '60 days'),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on properties (status, district, category, listing_type);
create index on properties (agent_id);
create index on properties (price);
create table property_daily_stats (
  property_id uuid references properties(id) on delete cascade, day date,
  views int not null default 0, inquiries int not null default 0, favorites int not null default 0,
  primary key (property_id, day)
);
create table favorites (
  user_id uuid references profiles(id) on delete cascade, property_id uuid references properties(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (user_id, property_id)
);
create table recently_viewed (
  user_id uuid references profiles(id) on delete cascade, property_id uuid references properties(id) on delete cascade,
  viewed_at timestamptz not null default now(), primary key (user_id, property_id)
);
create table saved_searches (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade,
  name text not null, query text not null, notify boolean not null default true, created_at timestamptz not null default now()
);
create table reports (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references properties(id) on delete cascade,
  reporter_id uuid references profiles(id), reason text not null, details text,
  status text not null default 'open', created_at timestamptz not null default now()
);

-- ---------- CRM ----------
create table leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id), name text not null, phone text, email text,
  agent_id uuid not null references profiles(id), agency_id uuid references agencies(id),
  source lead_source not null default 'website', stage lead_stage not null default 'new',
  property_ids uuid[] not null default '{}', budget numeric(16,0),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on leads (agent_id, stage);
create table lead_notes (id uuid primary key default gen_random_uuid(), lead_id uuid not null references leads(id) on delete cascade, author_id uuid references profiles(id), body text not null, created_at timestamptz not null default now());
create table lead_reminders (id uuid primary key default gen_random_uuid(), lead_id uuid not null references leads(id) on delete cascade, body text not null, due_at timestamptz not null, done boolean not null default false);
create table lead_history (id uuid primary key default gen_random_uuid(), lead_id uuid not null references leads(id) on delete cascade, kind text not null, body text, actor_id uuid references profiles(id), created_at timestamptz not null default now());
create table inquiries (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references properties(id) on delete cascade,
  customer_id uuid references profiles(id), agent_id uuid not null references profiles(id), lead_id uuid references leads(id),
  name text not null, phone text not null, email text not null, status text not null default 'new',
  is_demo boolean not null default false, created_at timestamptz not null default now()
);
create table inquiry_messages (id uuid primary key default gen_random_uuid(), inquiry_id uuid not null references inquiries(id) on delete cascade, sender_id uuid references profiles(id), from_side text not null check (from_side in ('customer','agent')), body text not null, created_at timestamptz not null default now());
create table viewings (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references properties(id) on delete cascade,
  customer_id uuid references profiles(id), agent_id uuid not null references profiles(id), lead_id uuid references leads(id),
  name text not null, phone text, scheduled_at timestamptz not null, status viewing_status not null default 'requested',
  note text, requested_by text not null default 'customer', is_demo boolean not null default false, created_at timestamptz not null default now()
);
create table deals (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references properties(id),
  agent_id uuid not null references profiles(id), customer_id uuid references profiles(id), lead_id uuid references leads(id),
  kind text not null check (kind in ('sale','rent')), amount numeric(16,0) not null, commission numeric(16,0) not null default 0,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  is_demo boolean not null default false, created_at timestamptz not null default now(), closed_at timestamptz
);

-- ---------- monetisation ----------
create table plans (
  id text primary key, audience text not null check (audience in ('agent','agency','listing')),
  name_mn text not null, name_en text not null, price numeric(14,0) not null default 0, period_days int not null,
  listing_limit int not null default 3, featured_slots int not null default 0, promotion promotion_tier,
  perks_mn text[] default '{}', perks_en text[] default '{}', highlight boolean default false
);
create table payments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id), plan_id text not null references plans(id),
  property_id uuid references properties(id), amount numeric(14,0) not null, method payment_method not null,
  status payment_status not null default 'pending', purpose text not null, reference text not null,
  provider_payload jsonb,  -- store the QPay / SocialPay callback here once a real gateway is integrated
  is_demo boolean not null default false, created_at timestamptz not null default now(), paid_at timestamptz
);
create table subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id), agency_id uuid references agencies(id),
  plan_id text not null references plans(id), payment_id uuid references payments(id),
  status text not null default 'active', start_at timestamptz not null default now(), end_at timestamptz not null, is_demo boolean not null default false
);

-- ---------- platform ----------
create table notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade,
  type text not null, params jsonb not null default '{}', link text, read boolean not null default false, created_at timestamptz not null default now()
);
create index on notifications (user_id, read, created_at desc);
create table audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid references profiles(id), action text not null, target_type text, target_id text, details text, created_at timestamptz not null default now());
create table site_content (key text primary key, value_mn text, value_en text);

-- ---------- helpers for row level security ----------
create or replace function public.current_role_name() returns user_role language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(current_role_name() in ('super_admin','platform_admin'), false) $$;
create or replace function public.my_agency() returns uuid language sql stable security definer set search_path = public as
$$ select agency_id from profiles where id = auth.uid() $$;

-- ---------- row level security ----------
alter table profiles enable row level security;
alter table agencies enable row level security;
alter table properties enable row level security;
alter table favorites enable row level security;
alter table recently_viewed enable row level security;
alter table saved_searches enable row level security;
alter table reports enable row level security;
alter table leads enable row level security;
alter table lead_notes enable row level security;
alter table lead_reminders enable row level security;
alter table lead_history enable row level security;
alter table inquiries enable row level security;
alter table inquiry_messages enable row level security;
alter table viewings enable row level security;
alter table deals enable row level security;
alter table payments enable row level security;
alter table subscriptions enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table property_daily_stats enable row level security;
alter table districts enable row level security;
alter table categories enable row level security;
alter table plans enable row level security;
alter table site_content enable row level security;

-- public reference data
create policy "public read districts" on districts for select using (true);
create policy "public read categories" on categories for select using (true);
create policy "public read plans" on plans for select using (true);
create policy "public read content" on site_content for select using (true);
create policy "admin write districts" on districts for all using (is_admin()) with check (is_admin());
create policy "admin write categories" on categories for all using (is_admin()) with check (is_admin());
create policy "admin write plans" on plans for all using (is_admin()) with check (is_admin());
create policy "admin write content" on site_content for all using (is_admin()) with check (is_admin());

-- profiles: agents are public (only safe columns should be exposed through a view in production), self can edit
create policy "profiles readable" on profiles for select using (true);
create policy "profile self update" on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
create policy "admin manage profiles" on profiles for all using (is_admin()) with check (is_admin());
create policy "agencies readable" on agencies for select using (true);
create policy "agency owner manages" on agencies for all using (owner_id = auth.uid() or is_admin()) with check (owner_id = auth.uid() or is_admin());

-- properties: published listings are public, owners/agents/agency owners manage theirs, admins manage all
create policy "public published" on properties for select using (status = 'published' and expires_at > now());
create policy "pros see theirs" on properties for select using (agent_id = auth.uid() or owner_id = auth.uid() or (agency_id is not null and agency_id = my_agency() and current_role_name() = 'agency_owner') or is_admin());
create policy "pros insert" on properties for insert with check ((agent_id = auth.uid() and current_role_name() in ('agent','agency_owner','owner')) or is_admin());
create policy "pros update" on properties for update using (agent_id = auth.uid() or owner_id = auth.uid() or (agency_id = my_agency() and current_role_name() = 'agency_owner') or is_admin());
create policy "pros delete" on properties for delete using (agent_id = auth.uid() or owner_id = auth.uid() or is_admin());
-- NOTE: status transitions to 'published' and the verified / promotion columns must only be set by admins.
-- Enforce with a BEFORE UPDATE trigger or an RPC (approve_listing) in production.

create policy "own favorites" on favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own recently viewed" on recently_viewed for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own saved searches" on saved_searches for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "anyone reports" on reports for insert with check (true);
create policy "admin reads reports" on reports for select using (is_admin());
create policy "admin updates reports" on reports for update using (is_admin());
create policy "stats visible to managers" on property_daily_stats for select using (exists (select 1 from properties p where p.id = property_id and (p.agent_id = auth.uid() or is_admin())));

-- CRM and inquiries: visible to the customer, the assigned agent, their agency owner and admins
create policy "leads access" on leads for all using (agent_id = auth.uid() or (agency_id = my_agency() and current_role_name() = 'agency_owner') or is_admin()) with check (agent_id = auth.uid() or (agency_id = my_agency() and current_role_name() = 'agency_owner') or is_admin());
create policy "lead notes access" on lead_notes for all using (exists (select 1 from leads l where l.id = lead_id and (l.agent_id = auth.uid() or (l.agency_id = my_agency() and current_role_name() = 'agency_owner') or is_admin())));
create policy "lead reminders access" on lead_reminders for all using (exists (select 1 from leads l where l.id = lead_id and (l.agent_id = auth.uid() or (l.agency_id = my_agency() and current_role_name() = 'agency_owner') or is_admin())));
create policy "lead history access" on lead_history for all using (exists (select 1 from leads l where l.id = lead_id and (l.agent_id = auth.uid() or (l.agency_id = my_agency() and current_role_name() = 'agency_owner') or is_admin())));
create policy "inquiry access" on inquiries for select using (customer_id = auth.uid() or agent_id = auth.uid() or is_admin() or (current_role_name() = 'agency_owner' and exists (select 1 from profiles a where a.id = agent_id and a.agency_id = my_agency())));
create policy "anyone inquires" on inquiries for insert with check (true);
create policy "inquiry update by agent" on inquiries for update using (agent_id = auth.uid() or is_admin());
create policy "inquiry message access" on inquiry_messages for all using (exists (select 1 from inquiries i where i.id = inquiry_id and (i.customer_id = auth.uid() or i.agent_id = auth.uid() or is_admin())));
create policy "viewing access" on viewings for select using (customer_id = auth.uid() or agent_id = auth.uid() or is_admin());
create policy "anyone requests viewing" on viewings for insert with check (true);
create policy "viewing update" on viewings for update using (customer_id = auth.uid() or agent_id = auth.uid() or is_admin());
create policy "deal access" on deals for select using (agent_id = auth.uid() or is_admin() or (current_role_name() = 'agency_owner' and exists (select 1 from profiles a where a.id = agent_id and a.agency_id = my_agency())));
create policy "deal write" on deals for all using (agent_id = auth.uid() or is_admin());

-- money
create policy "own payments" on payments for select using (user_id = auth.uid() or is_admin());
create policy "create own payment" on payments for insert with check (user_id = auth.uid());
create policy "admin confirms payments" on payments for update using (is_admin());
create policy "own subscriptions" on subscriptions for select using (user_id = auth.uid() or (agency_id = my_agency() and current_role_name() = 'agency_owner') or is_admin());
create policy "admin writes subscriptions" on subscriptions for all using (is_admin());

create policy "own notifications" on notifications for select using (user_id = auth.uid());
create policy "mark own notifications read" on notifications for update using (user_id = auth.uid());
create policy "admin reads audit" on audit_logs for select using (is_admin());
create policy "admin writes audit" on audit_logs for insert with check (is_admin());

-- ---------- auth hook: create a profile for each new auth user ----------
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name, phone, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'phone',
          case when new.raw_user_meta_data->>'role' in ('customer','owner','agent') then (new.raw_user_meta_data->>'role')::user_role else 'customer' end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values ('property-images', 'property-images', true) on conflict do nothing;
create policy "public read property images" on storage.objects for select using (bucket_id = 'property-images');
create policy "pros upload property images" on storage.objects for insert with check (bucket_id = 'property-images' and auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pros delete own images" on storage.objects for delete using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
