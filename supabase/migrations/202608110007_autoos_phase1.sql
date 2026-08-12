-- 1. Work Task Timings (Apontamento de Mecânicos por Item/Serviço)
create table if not exists public.work_task_timings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  service_order_item_id uuid not null references public.service_order_items(id) on delete cascade,
  mechanic_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'running' check (status in ('running', 'paused', 'completed')),
  started_at timestamptz not null default now(),
  paused_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists work_task_timings_tenant_mechanic_idx on public.work_task_timings(tenant_id, mechanic_id, status);
create index if not exists work_task_timings_tenant_order_item_idx on public.work_task_timings(tenant_id, service_order_item_id);

alter table public.work_task_timings enable row level security;

create policy wtt_member_select on public.work_task_timings
for select using (public.is_tenant_member(tenant_id));

create policy wtt_staff_insert on public.work_task_timings
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

create policy wtt_staff_update on public.work_task_timings
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

-- 2. Inventory Movements (Kardex de Estoque)
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  service_order_id uuid references public.service_orders(id) on delete set null,
  kind text not null check (kind in ('in', 'out', 'reserved', 'adjustment')),
  quantity numeric(12,2) not null,
  unit_cost numeric(12,2),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists inventory_movements_tenant_product_idx on public.inventory_movements(tenant_id, product_id, created_at desc);

alter table public.inventory_movements enable row level security;

create policy inv_mov_member_select on public.inventory_movements
for select using (public.is_tenant_member(tenant_id));

create policy inv_mov_staff_insert on public.inventory_movements
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
