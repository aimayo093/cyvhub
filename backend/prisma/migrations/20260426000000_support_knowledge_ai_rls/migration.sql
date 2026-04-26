-- CYVhub support knowledge, FAQ, policies, AI settings/logging, and payment protection.
-- Apply with Prisma migrate or run in Supabase SQL Editor after the Prisma schema migration.

alter table "User" add column if not exists role text;

create table if not exists "SupportCategory" (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique,
  type text not null,
  description text,
  "order" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "CustomerInquiry" (
  id text primary key default gen_random_uuid()::text,
  "customerName" text not null,
  email text not null,
  phone text,
  "bookingId" text,
  message text not null,
  status text not null default 'NEW',
  "assignedAdminId" text references "User"(id) on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "ResponseTemplate" (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  "categoryId" text references "SupportCategory"(id) on delete set null,
  scenario text not null,
  "responseMessage" text not null,
  "internalNotes" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "InquiryResponse" (
  id text primary key default gen_random_uuid()::text,
  "inquiryId" text not null references "CustomerInquiry"(id) on delete cascade,
  "responderId" text not null references "User"(id),
  "templateId" text references "ResponseTemplate"(id) on delete set null,
  message text not null,
  "sentToEmail" text not null,
  "sentAt" timestamptz not null default now(),
  "aiGenerated" boolean not null default false
);

create table if not exists "FAQ" (
  id text primary key default gen_random_uuid()::text,
  question text not null,
  answer text not null,
  "categoryId" text references "SupportCategory"(id) on delete set null,
  "order" integer not null default 0,
  "publishStatus" text not null default 'DRAFT',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "Policy" (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  "categoryId" text references "SupportCategory"(id) on delete set null,
  description text not null,
  "fullContent" text not null,
  version text not null default '1.0',
  "lastUpdated" timestamptz not null default now(),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "AuditLog" (
  id text primary key default gen_random_uuid()::text,
  "userId" text,
  role text,
  "actionType" text not null,
  "entityType" text,
  "entityId" text,
  "relatedBookingId" text,
  summary text not null,
  "humanApprovalRequired" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create table if not exists "AiSettings" (
  id text primary key default 'default',
  enabled boolean not null default true,
  "supportDraftOnly" boolean not null default true,
  "supportAutoSendEnabled" boolean not null default false,
  "bookingAssistantEnabled" boolean not null default true,
  "trackingAssistantEnabled" boolean not null default true,
  "dispatchAssistantEnabled" boolean not null default true,
  "paymentConfirmationRequired" boolean not null default true,
  "enabledLocations" jsonb not null default '{}'::jsonb,
  "knowledgeSources" jsonb not null default '{}'::jsonb,
  "escalationRules" jsonb not null default '{}'::jsonb,
  "bookingRules" jsonb not null default '{}'::jsonb,
  "updatedBy" text,
  "updatedAt" timestamptz not null default now()
);

create or replace function public.current_app_role()
returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'role', ''),
    nullif(auth.jwt() ->> 'role', '')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select public.current_app_role() in ('admin', 'super_admin');
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable as $$
  select public.current_app_role() = 'super_admin';
$$;

alter table "CustomerInquiry" enable row level security;
alter table "ResponseTemplate" enable row level security;
alter table "InquiryResponse" enable row level security;
alter table "FAQ" enable row level security;
alter table "Policy" enable row level security;
alter table "SupportCategory" enable row level security;
alter table "AuditLog" enable row level security;
alter table "AiSettings" enable row level security;
alter table "PaymentTransaction" enable row level security;
alter table "SettlementBatch" enable row level security;

drop policy if exists "faq public read published" on "FAQ";
create policy "faq public read published" on "FAQ" for select using ("publishStatus" = 'PUBLISHED' or public.is_admin());
drop policy if exists "faq super admin write" on "FAQ";
create policy "faq super admin write" on "FAQ" for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "admin read inquiries" on "CustomerInquiry";
create policy "admin read inquiries" on "CustomerInquiry" for select using (public.is_admin());
drop policy if exists "admin update inquiries" on "CustomerInquiry";
create policy "admin update inquiries" on "CustomerInquiry" for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public create inquiries" on "CustomerInquiry";
create policy "public create inquiries" on "CustomerInquiry" for insert with check (true);

drop policy if exists "admin read templates" on "ResponseTemplate";
create policy "admin read templates" on "ResponseTemplate" for select using (public.is_admin());
drop policy if exists "super admin write templates" on "ResponseTemplate";
create policy "super admin write templates" on "ResponseTemplate" for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "admin inquiry responses" on "InquiryResponse";
create policy "admin inquiry responses" on "InquiryResponse" for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read policies" on "Policy";
create policy "admin read policies" on "Policy" for select using (public.is_admin());
drop policy if exists "super admin write policies" on "Policy";
create policy "super admin write policies" on "Policy" for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "admin read categories" on "SupportCategory";
create policy "admin read categories" on "SupportCategory" for select using (type = 'faq' or public.is_admin());
drop policy if exists "super admin write categories" on "SupportCategory";
create policy "super admin write categories" on "SupportCategory" for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "super admin audit logs" on "AuditLog";
create policy "super admin audit logs" on "AuditLog" for select using (public.is_super_admin());
drop policy if exists "service audit inserts" on "AuditLog";
create policy "service audit inserts" on "AuditLog" for insert with check (public.is_admin() or public.current_app_role() = 'service_role');

drop policy if exists "super admin ai settings" on "AiSettings";
create policy "super admin ai settings" on "AiSettings" for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "admin read payments" on "PaymentTransaction";
create policy "admin read payments" on "PaymentTransaction" for select using (public.is_admin());
drop policy if exists "super admin mutate payments" on "PaymentTransaction";
create policy "super admin mutate payments" on "PaymentTransaction" for insert with check (public.is_super_admin());

drop policy if exists "admin read settlements" on "SettlementBatch";
create policy "admin read settlements" on "SettlementBatch" for select using (public.is_admin());
drop policy if exists "super admin mutate settlements" on "SettlementBatch";
create policy "super admin mutate settlements" on "SettlementBatch" for update using (public.is_super_admin()) with check (public.is_super_admin());
