-- 1. Workstations (Elevadores, Boxes e Valetas de Atendimento)
create table if not exists public.work_stations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  kind text not null default 'elevator' check (kind in ('elevator', 'box', 'pit')),
  status text not null default 'available' check (status in ('available', 'occupied', 'maintenance')),
  current_service_order_id uuid references public.service_orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists work_stations_tenant_status_idx on public.work_stations(tenant_id, status);

alter table public.work_stations enable row level security;

create policy ws_member_select on public.work_stations
for select using (public.is_tenant_member(tenant_id));

create policy ws_staff_all on public.work_stations
for all using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

-- 2. Service Order reference to Workstation
alter table public.service_orders
  add column if not exists work_station_id uuid references public.work_stations(id) on delete set null;

-- 3. Custom Checklists (Checklists de Inspeção por Categoria)
create table if not exists public.custom_checklists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_name text not null,
  item_label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists custom_checklists_tenant_cat_idx on public.custom_checklists(tenant_id, category_name);

alter table public.custom_checklists enable row level security;

create policy cc_member_select on public.custom_checklists
for select using (public.is_tenant_member(tenant_id));

create policy cc_staff_all on public.custom_checklists
for all using (public.has_tenant_role(tenant_id, array['owner', 'admin']));
