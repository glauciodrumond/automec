-- OS stage and payment tracking
alter table public.service_orders
  add column if not exists stage text not null default 'entry' check (stage in ('entry', 'diagnosis', 'waiting_parts', 'in_execution', 'ready', 'delivered')),
  add column if not exists payment_method text check (payment_method in ('pix', 'credit_card', 'debit_card', 'cash', 'ticket', 'billed')),
  add column if not exists payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'partial'));

-- Payments / Accounts Receivable table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  amount numeric(12,2) not null,
  payment_method text not null check (payment_method in ('pix', 'credit_card', 'debit_card', 'cash', 'ticket', 'billed')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  due_date date not null default current_date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists payments_tenant_order_idx on public.payments(tenant_id, service_order_id);
create index if not exists payments_tenant_status_due_idx on public.payments(tenant_id, status, due_date);

alter table public.payments enable row level security;

create policy payments_member_select on public.payments
for select using (public.is_tenant_member(tenant_id));

create policy payments_staff_insert on public.payments
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

create policy payments_staff_update on public.payments
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

create policy payments_admin_delete on public.payments
for delete using (public.has_tenant_role(tenant_id, array['owner', 'admin']));
