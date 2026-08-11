-- 1. Add columns to existing tables
alter table public.service_orders
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text;

alter table public.customers
  add column if not exists birth_date date,
  add column if not exists send_reminder_days integer default 180;

alter table public.tenant_members
  add column if not exists commission_pct numeric(5,2) default 0 check (commission_pct >= 0 and commission_pct <= 100),
  add column if not exists commission_type text default 'percentage' check (commission_type in ('percentage', 'fixed'));

alter table public.products
  add column if not exists barcode text,
  add column if not exists supplier_name text;

-- 2. Schedules (Agenda de Serviços)
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  scheduled_at timestamptz not null,
  duration_min integer not null default 60,
  service_description text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'converted', 'cancelled')),
  service_order_id uuid references public.service_orders(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists schedules_tenant_date_idx on public.schedules(tenant_id, scheduled_at);
create index if not exists schedules_tenant_status_idx on public.schedules(tenant_id, status, scheduled_at);

alter table public.schedules enable row level security;

create policy schedules_member_select on public.schedules
for select using (public.is_tenant_member(tenant_id));

create policy schedules_staff_insert on public.schedules
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

create policy schedules_staff_update on public.schedules
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

create policy schedules_admin_delete on public.schedules
for delete using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

-- 3. Commissions (Comissões de Mecânicos)
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  base_amount numeric(12,2) not null,
  commission_pct numeric(5,2) not null,
  commission_amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists commissions_tenant_user_idx on public.commissions(tenant_id, user_id, created_at desc);
create index if not exists commissions_tenant_order_idx on public.commissions(tenant_id, service_order_id);
create index if not exists commissions_tenant_status_idx on public.commissions(tenant_id, status);

alter table public.commissions enable row level security;

create policy commissions_member_select on public.commissions
for select using (public.is_tenant_member(tenant_id));

create policy commissions_admin_insert on public.commissions
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy commissions_admin_update on public.commissions
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

-- 4. Cash Transactions (Fluxo de Caixa)
create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid references public.service_orders(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  kind text not null check (kind in ('income', 'expense')),
  category text not null,
  description text not null,
  amount numeric(12,2) not null,
  transaction_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists cash_transactions_tenant_date_idx on public.cash_transactions(tenant_id, transaction_date desc);
create index if not exists cash_transactions_tenant_kind_idx on public.cash_transactions(tenant_id, kind, transaction_date desc);

alter table public.cash_transactions enable row level security;

create policy cash_transactions_member_select on public.cash_transactions
for select using (public.is_tenant_member(tenant_id));

create policy cash_transactions_staff_insert on public.cash_transactions
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

create policy cash_transactions_admin_update on public.cash_transactions
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

-- 5. Service Order Tracking Tokens (Portal do Cliente Sem Senha)
create table if not exists public.service_order_tokens (
  token uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now()
);

create unique index if not exists service_order_tokens_order_idx on public.service_order_tokens(service_order_id);
create index if not exists service_order_tokens_token_idx on public.service_order_tokens(token);

-- Public access policy for token portal (no auth needed)
alter table public.service_order_tokens enable row level security;

create policy sot_member_select on public.service_order_tokens
for select using (public.is_tenant_member(tenant_id));

create policy sot_staff_insert on public.service_order_tokens
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

-- Public read-only policy for portal (anyone with token)
create policy sot_public_read on public.service_order_tokens
for select using (expires_at > now());

-- 6. Service Order Approvals (Aprovação Item a Item)
create table if not exists public.service_order_approvals (
  id uuid primary key default gen_random_uuid(),
  token uuid not null references public.service_order_tokens(token) on delete cascade,
  service_order_item_id uuid not null references public.service_order_items(id) on delete cascade,
  approved boolean not null default true,
  customer_name text,
  approved_at timestamptz not null default now()
);

create index if not exists soa_token_idx on public.service_order_approvals(token);
create unique index if not exists soa_item_idx on public.service_order_approvals(service_order_item_id);

alter table public.service_order_approvals enable row level security;

-- Anyone can insert approval via token portal
create policy soa_public_insert on public.service_order_approvals
for insert with check (true);

create policy soa_public_select on public.service_order_approvals
for select using (true);

create policy soa_member_all on public.service_order_approvals
for all using (true);

-- 7. Additional Performance Indexes
create index if not exists service_orders_tenant_assigned_idx on public.service_orders(tenant_id, assigned_to) where assigned_to is not null;
create index if not exists service_orders_tenant_completed_at_idx on public.service_orders(tenant_id, exit_at desc) where status = 'completed';
create index if not exists products_tenant_stock_idx on public.products(tenant_id, stock_current) where kind = 'part';
create index if not exists payments_tenant_due_status_idx on public.payments(tenant_id, due_date, status);
create index if not exists customers_tenant_phone_idx on public.customers(tenant_id, phone) where phone is not null;

-- 8. RPC: Generate or get tracking token for a service order
create or replace function public.get_or_create_order_token(p_service_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
  v_tenant_id uuid;
begin
  select tenant_id into v_tenant_id from public.service_orders where id = p_service_order_id;
  if not public.is_tenant_member(v_tenant_id) then
    raise exception 'Access denied';
  end if;
  
  select token into v_token from public.service_order_tokens where service_order_id = p_service_order_id;
  
  if v_token is null then
    insert into public.service_order_tokens (tenant_id, service_order_id)
    values (v_tenant_id, p_service_order_id)
    returning token into v_token;
  end if;
  
  return v_token;
end;
$$;

revoke execute on function public.get_or_create_order_token(uuid) from public;
grant execute on function public.get_or_create_order_token(uuid) to authenticated;
