create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code bigint not null,
  name text not null,
  group_name text,
  kind text not null check (kind in ('part', 'labor', 'service')) default 'part',
  unit text not null default 'UN',
  cost_price numeric(12,2) not null default 0,
  sell_price numeric(12,2) not null default 0,
  stock_current numeric(12,2) not null default 0,
  stock_min numeric(12,2) not null default 0,
  ncm text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index products_tenant_code_idx on public.products(tenant_id, code);
create index products_tenant_name_idx on public.products(tenant_id, name);

alter table public.products enable row level security;

create policy products_member_select on public.products
for select using (public.is_tenant_member(tenant_id));

create policy products_staff_insert on public.products
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

create policy products_staff_update on public.products
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

create policy products_admin_delete on public.products
for delete using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

-- Customer extensions
alter table public.customers 
  add column if not exists fantasy_name text,
  add column if not exists person_type text not null default 'physical' check (person_type in ('physical', 'legal')),
  add column if not exists cep text,
  add column if not exists number text,
  add column if not exists complement text,
  add column if not exists neighborhood text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists ie text;

-- Service Order extensions
alter table public.service_orders
  add column if not exists order_type text not null default 'normal' check (order_type in ('normal', 'warranty', 'budget')),
  add column if not exists found_defect text,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists labor_total numeric(12,2) not null default 0,
  add column if not exists parts_total numeric(12,2) not null default 0,
  add column if not exists total_amount numeric(12,2) not null default 0;

-- Service Order Items extension
alter table public.service_order_items
  add column if not exists product_id uuid references public.products(id) on delete set null;
