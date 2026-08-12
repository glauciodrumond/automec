-- 1. Suppliers (Fornecedores de Peças e Insumos)
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  cnpj text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists suppliers_tenant_name_idx on public.suppliers(tenant_id, name);

alter table public.suppliers enable row level security;

create policy sup_member_select on public.suppliers
for select using (public.is_tenant_member(tenant_id));

create policy sup_staff_all on public.suppliers
for all using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

-- 2. Purchase Orders (Pedidos de Compra de Peças)
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'ordered', 'received', 'cancelled')),
  total_cost numeric(12,2) not null default 0,
  notes text,
  received_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists purchase_orders_tenant_status_idx on public.purchase_orders(tenant_id, status);

alter table public.purchase_orders enable row level security;

create policy po_member_select on public.purchase_orders
for select using (public.is_tenant_member(tenant_id));

create policy po_staff_all on public.purchase_orders
for all using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

-- 3. Purchase Order Items
create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity numeric(12,2) not null,
  unit_cost numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists poi_tenant_po_idx on public.purchase_order_items(tenant_id, purchase_order_id);

alter table public.purchase_order_items enable row level security;

create policy poi_member_select on public.purchase_order_items
for select using (public.is_tenant_member(tenant_id));

create policy poi_staff_all on public.purchase_order_items
for all using (public.has_tenant_role(tenant_id, array['owner', 'admin']));
