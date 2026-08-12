-- 1. Quality Checks (Controle de Qualidade Pré-Entrega)
create table if not exists public.quality_checks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  inspected_by uuid not null references auth.users(id) on delete cascade,
  test_drive_ok boolean not null default true,
  wheel_torque_ok boolean not null default true,
  fluids_checked boolean not null default true,
  dashboard_lights_clear boolean not null default true,
  wash_cleaned boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  constraint quality_checks_order_unique unique (tenant_id, service_order_id)
);

create index if not exists quality_checks_tenant_order_idx on public.quality_checks(tenant_id, service_order_id);

alter table public.quality_checks enable row level security;

create policy qc_member_select on public.quality_checks
for select using (public.is_tenant_member(tenant_id));

create policy qc_staff_insert on public.quality_checks
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
