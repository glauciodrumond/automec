create extension if not exists pg_trgm;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.tenant_members (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'technician')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  document text,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_tenant_id_id_key unique (tenant_id, id)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null,
  plate text not null,
  type text not null default 'vehicle',
  brand text,
  model text,
  year integer,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_tenant_id_id_key unique (tenant_id, id),
  constraint vehicles_tenant_customer_fkey
    foreign key (tenant_id, customer_id)
    references public.customers(tenant_id, id) on delete cascade
);

create table public.service_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null,
  vehicle_id uuid not null,
  code bigint not null,
  status text not null check (status in ('open', 'in_progress', 'waiting_parts', 'completed', 'cancelled')) default 'open',
  priority text not null check (priority in ('low', 'normal', 'high')) default 'normal',
  entry_at timestamptz not null default now(),
  exit_at timestamptz,
  odometer integer,
  complaint text,
  internal_notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_orders_tenant_id_id_key unique (tenant_id, id),
  constraint service_orders_tenant_customer_fkey
    foreign key (tenant_id, customer_id)
    references public.customers(tenant_id, id) on delete restrict,
  constraint service_orders_tenant_vehicle_fkey
    foreign key (tenant_id, vehicle_id)
    references public.vehicles(tenant_id, id) on delete restrict
);

create table public.service_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null,
  kind text not null check (kind in ('labor', 'part', 'other')),
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  constraint service_order_items_tenant_service_order_fkey
    foreign key (tenant_id, service_order_id)
    references public.service_orders(tenant_id, id) on delete cascade
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null,
  general_notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checkins_tenant_id_id_key unique (tenant_id, id),
  constraint checkins_tenant_service_order_fkey
    foreign key (tenant_id, service_order_id)
    references public.service_orders(tenant_id, id) on delete cascade
);

create table public.checkin_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  checkin_id uuid not null,
  category text not null check (category in ('front', 'rear', 'left_side', 'right_side', 'interior', 'dashboard', 'odometer', 'damage', 'documents_objects', 'extra')),
  status text not null check (status in ('ok', 'attention', 'damaged', 'not_applicable')) default 'ok',
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checkin_items_tenant_id_id_key unique (tenant_id, id),
  constraint checkin_items_tenant_checkin_fkey
    foreign key (tenant_id, checkin_id)
    references public.checkins(tenant_id, id) on delete cascade
);

create table public.checkin_photos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  checkin_id uuid not null,
  checkin_item_id uuid,
  category text not null check (category in ('front', 'rear', 'left_side', 'right_side', 'interior', 'dashboard', 'odometer', 'damage', 'documents_objects', 'extra')),
  storage_path text not null,
  caption text,
  content_type text not null,
  size_bytes bigint not null,
  sort_order integer not null default 0,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint checkin_photos_storage_path_check
    check (storage_path = format('tenant/%s/checkins/%s/%s', tenant_id, checkin_id, id)),
  constraint checkin_photos_tenant_checkin_fkey
    foreign key (tenant_id, checkin_id)
    references public.checkins(tenant_id, id) on delete cascade,
  constraint checkin_photos_tenant_checkin_item_fkey
    foreign key (tenant_id, checkin_item_id)
    references public.checkin_items(tenant_id, id) on delete set null (checkin_item_id)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index tenant_members_user_tenant_idx on public.tenant_members(user_id, tenant_id);
create index customers_tenant_document_idx on public.customers(tenant_id, document) where document is not null;
create index customers_name_trgm_idx on public.customers using gin (name gin_trgm_ops);
create unique index vehicles_tenant_plate_idx on public.vehicles(tenant_id, plate);
create index vehicles_tenant_customer_idx on public.vehicles(tenant_id, customer_id);
create unique index service_orders_tenant_code_idx on public.service_orders(tenant_id, code);
create index service_orders_tenant_status_entry_idx on public.service_orders(tenant_id, status, entry_at desc);
create index service_orders_tenant_vehicle_entry_idx on public.service_orders(tenant_id, vehicle_id, entry_at desc);
create index service_orders_tenant_customer_entry_idx on public.service_orders(tenant_id, customer_id, entry_at desc);
create index service_order_items_tenant_order_idx on public.service_order_items(tenant_id, service_order_id);
create unique index checkins_tenant_service_order_idx on public.checkins(tenant_id, service_order_id);
create index checkin_items_tenant_checkin_sort_idx on public.checkin_items(tenant_id, checkin_id, sort_order);
create index checkin_photos_tenant_checkin_category_sort_idx on public.checkin_photos(tenant_id, checkin_id, category, sort_order);
create index audit_events_tenant_entity_created_idx on public.audit_events(tenant_id, entity_type, entity_id, created_at desc);

create or replace function public.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = target_tenant_id
      and tm.user_id = auth.uid()
  );
$$;

create or replace function public.has_tenant_role(target_tenant_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = target_tenant_id
      and tm.user_id = auth.uid()
      and tm.role = any(allowed_roles)
  );
$$;

create or replace function public.create_tenant_with_owner(
  tenant_name text,
  tenant_document text default null,
  tenant_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required to create a tenant';
  end if;

  if nullif(btrim(tenant_name), '') is null then
    raise exception 'Tenant name is required';
  end if;

  insert into public.tenants (name, document, phone)
  values (btrim(tenant_name), tenant_document, tenant_phone)
  returning id into new_tenant_id;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (new_tenant_id, current_user_id, 'owner');

  return new_tenant_id;
end;
$$;

revoke execute on function public.create_tenant_with_owner(text, text, text) from public;
grant execute on function public.create_tenant_with_owner(text, text, text) to authenticated;

create or replace function public.prevent_actor_field_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if to_jsonb(new) ->> tg_argv[0] is distinct from to_jsonb(old) ->> tg_argv[0] then
    raise exception '% is immutable', tg_argv[0];
  end if;

  return new;
end;
$$;

create trigger service_orders_created_by_immutable
before update on public.service_orders
for each row execute function public.prevent_actor_field_update('created_by');

create trigger checkins_created_by_immutable
before update on public.checkins
for each row execute function public.prevent_actor_field_update('created_by');

create trigger checkin_photos_uploaded_by_immutable
before update on public.checkin_photos
for each row execute function public.prevent_actor_field_update('uploaded_by');

create trigger audit_events_actor_id_immutable
before update on public.audit_events
for each row execute function public.prevent_actor_field_update('actor_id');

alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_order_items enable row level security;
alter table public.checkins enable row level security;
alter table public.checkin_items enable row level security;
alter table public.checkin_photos enable row level security;
alter table public.audit_events enable row level security;

create policy tenants_member_select on public.tenants
for select using (public.is_tenant_member(id));

create policy tenant_members_select on public.tenant_members
for select using (public.is_tenant_member(tenant_id));

create policy tenant_members_owner_manage on public.tenant_members
for all using (public.has_tenant_role(tenant_id, array['owner']))
with check (public.has_tenant_role(tenant_id, array['owner']));

create policy customers_member_select on public.customers
for select using (public.is_tenant_member(tenant_id));
create policy customers_staff_insert on public.customers
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
create policy customers_staff_update on public.customers
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
create policy customers_admin_delete on public.customers
for delete using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy vehicles_member_select on public.vehicles
for select using (public.is_tenant_member(tenant_id));
create policy vehicles_staff_insert on public.vehicles
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
create policy vehicles_staff_update on public.vehicles
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
create policy vehicles_admin_delete on public.vehicles
for delete using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy service_orders_member_select on public.service_orders
for select using (public.is_tenant_member(tenant_id));
create policy service_orders_staff_insert on public.service_orders
for insert with check (
  public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician'])
  and created_by = auth.uid()
);
create policy service_orders_staff_update on public.service_orders
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
create policy service_orders_admin_delete on public.service_orders
for delete using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy service_order_items_member_select on public.service_order_items
for select using (public.is_tenant_member(tenant_id));
create policy service_order_items_staff_insert on public.service_order_items
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
create policy service_order_items_staff_update on public.service_order_items
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
create policy service_order_items_admin_delete on public.service_order_items
for delete using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy checkins_member_select on public.checkins
for select using (public.is_tenant_member(tenant_id));
create policy checkins_staff_insert on public.checkins
for insert with check (
  public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician'])
  and created_by = auth.uid()
);
create policy checkins_staff_update on public.checkins
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
create policy checkins_admin_delete on public.checkins
for delete using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy checkin_items_member_select on public.checkin_items
for select using (public.is_tenant_member(tenant_id));
create policy checkin_items_staff_insert on public.checkin_items
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
create policy checkin_items_staff_update on public.checkin_items
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
create policy checkin_items_admin_delete on public.checkin_items
for delete using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy checkin_photos_member_select on public.checkin_photos
for select using (public.is_tenant_member(tenant_id));
create policy checkin_photos_staff_insert on public.checkin_photos
for insert with check (
  public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician'])
  and uploaded_by = auth.uid()
);
create policy checkin_photos_staff_update on public.checkin_photos
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));
create policy checkin_photos_admin_delete on public.checkin_photos
for delete using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy audit_events_member_select on public.audit_events
for select using (public.is_tenant_member(tenant_id));
create policy audit_events_staff_insert on public.audit_events
for insert with check (
  public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician'])
  and (actor_id is null or actor_id = auth.uid())
);

insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', false)
on conflict (id) do nothing;

create policy checkin_photos_storage_select on storage.objects
for select using (
  bucket_id = 'checkin-photos'
  and array_length(storage.foldername(name), 1) = 4
  and (storage.foldername(name))[1] = 'tenant'
  and (storage.foldername(name))[3] = 'checkins'
  and exists (
    select 1
    from public.checkin_photos cp
    where cp.storage_path = name
      and cp.tenant_id::text = (storage.foldername(name))[2]
      and cp.checkin_id::text = (storage.foldername(name))[4]
      and cp.id::text = storage.filename(name)
      and public.is_tenant_member(cp.tenant_id)
  )
);

create policy checkin_photos_storage_insert on storage.objects
for insert with check (
  bucket_id = 'checkin-photos'
  and array_length(storage.foldername(name), 1) = 4
  and (storage.foldername(name))[1] = 'tenant'
  and (storage.foldername(name))[3] = 'checkins'
  and storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.checkins c
    where c.tenant_id::text = (storage.foldername(name))[2]
      and c.id::text = (storage.foldername(name))[4]
      and public.has_tenant_role(c.tenant_id, array['owner', 'admin', 'technician'])
  )
);

create policy checkin_photos_storage_delete on storage.objects
for delete using (
  bucket_id = 'checkin-photos'
  and array_length(storage.foldername(name), 1) = 4
  and (storage.foldername(name))[1] = 'tenant'
  and (storage.foldername(name))[3] = 'checkins'
  and exists (
    select 1
    from public.checkin_photos cp
    where cp.storage_path = name
      and cp.tenant_id::text = (storage.foldername(name))[2]
      and cp.checkin_id::text = (storage.foldername(name))[4]
      and cp.id::text = storage.filename(name)
      and public.has_tenant_role(cp.tenant_id, array['owner', 'admin'])
  )
);
