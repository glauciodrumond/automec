create or replace function public.create_service_order_with_customer_vehicle(
  p_tenant_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_document text,
  p_vehicle_plate text,
  p_vehicle_brand text,
  p_vehicle_model text,
  p_vehicle_year integer,
  p_vehicle_color text,
  p_complaint text,
  p_odometer integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_customer_id uuid;
  new_vehicle_id uuid;
  new_service_order_id uuid;
  next_code bigint;
begin
  if current_user_id is null then
    raise exception 'Authentication is required to create a service order';
  end if;

  if not public.has_tenant_role(p_tenant_id, array['owner', 'admin', 'technician']) then
    raise exception 'You do not have permission to create service orders for this tenant';
  end if;

  if nullif(btrim(p_customer_name), '') is null then
    raise exception 'Customer name is required';
  end if;

  if nullif(btrim(p_vehicle_plate), '') is null then
    raise exception 'Vehicle plate is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text, 0));

  insert into public.customers (tenant_id, name, phone, document)
  values (p_tenant_id, btrim(p_customer_name), nullif(btrim(p_customer_phone), ''), nullif(btrim(p_customer_document), ''))
  returning id into new_customer_id;

  insert into public.vehicles (tenant_id, customer_id, plate, brand, model, year, color)
  values (
    p_tenant_id,
    new_customer_id,
    upper(btrim(p_vehicle_plate)),
    nullif(btrim(p_vehicle_brand), ''),
    nullif(btrim(p_vehicle_model), ''),
    p_vehicle_year,
    nullif(btrim(p_vehicle_color), '')
  )
  returning id into new_vehicle_id;

  select coalesce(max(code), 0) + 1
  into next_code
  from public.service_orders
  where tenant_id = p_tenant_id;

  insert into public.service_orders (
    tenant_id,
    customer_id,
    vehicle_id,
    code,
    status,
    priority,
    complaint,
    odometer,
    created_by
  )
  values (
    p_tenant_id,
    new_customer_id,
    new_vehicle_id,
    next_code,
    'open',
    'normal',
    nullif(btrim(p_complaint), ''),
    p_odometer,
    current_user_id
  )
  returning id into new_service_order_id;

  return new_service_order_id;
end;
$$;

revoke execute on function public.create_service_order_with_customer_vehicle(uuid, text, text, text, text, text, text, integer, text, text, integer) from public;
grant execute on function public.create_service_order_with_customer_vehicle(uuid, text, text, text, text, text, text, integer, text, text, integer) to authenticated;
