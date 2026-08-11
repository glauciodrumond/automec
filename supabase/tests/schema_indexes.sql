with expected(tablename) as (
  values ('tenants'), ('tenant_members'), ('customers'), ('vehicles'), ('service_orders'),
    ('service_order_items'), ('checkins'), ('checkin_items'), ('checkin_photos'), ('audit_events')
), actual as (
  select tablename
  from pg_tables
  where schemaname = 'public'
)
select count(*) = 10 and count(actual.tablename) = count(expected.tablename) as required_tables_exist
from expected left join actual using (tablename);

with expected(indexname) as (
  values
    ('tenant_members_user_tenant_idx'),
    ('customers_tenant_document_idx'), ('customers_name_trgm_idx'), ('customers_tenant_id_id_key'),
    ('vehicles_tenant_plate_idx'), ('vehicles_tenant_customer_idx'), ('vehicles_tenant_id_id_key'),
    ('service_orders_tenant_code_idx'), ('service_orders_tenant_status_entry_idx'),
    ('service_orders_tenant_vehicle_entry_idx'), ('service_orders_tenant_customer_entry_idx'),
    ('service_orders_tenant_id_id_key'), ('service_order_items_tenant_order_idx'),
    ('checkins_tenant_service_order_idx'), ('checkins_tenant_id_id_key'),
    ('checkin_items_tenant_checkin_sort_idx'), ('checkin_items_tenant_id_id_key'),
    ('checkin_photos_tenant_checkin_category_sort_idx'), ('audit_events_tenant_entity_created_idx')
), actual as (
  select indexname from pg_indexes where schemaname = 'public'
)
select count(*) = 19 and count(actual.indexname) = count(expected.indexname) as required_indexes_exist
from expected left join actual using (indexname);

with expected(conname) as (
  values
    ('vehicles_tenant_customer_fkey'), ('service_orders_tenant_customer_fkey'),
    ('service_orders_tenant_vehicle_fkey'), ('service_order_items_tenant_service_order_fkey'),
    ('checkins_tenant_service_order_fkey'), ('checkin_items_tenant_checkin_fkey'),
    ('checkin_photos_tenant_checkin_fkey'), ('checkin_photos_tenant_checkin_item_fkey')
), actual as (
  select conname, pg_get_constraintdef(oid) as definition
  from pg_constraint
  where contype = 'f' and connamespace = 'public'::regnamespace
)
select count(*) = 8
  and count(actual.conname) = count(expected.conname)
  and bool_and(actual.definition like 'FOREIGN KEY (tenant_id, %') as tenant_scoped_foreign_keys_exist
from expected left join actual using (conname);

select confdeltype = 'n'
  and pg_get_constraintdef(oid) like '%ON DELETE SET NULL (checkin_item_id)%'
  as checkin_photo_item_delete_preserves_tenant
from pg_constraint
where connamespace = 'public'::regnamespace
  and conname = 'checkin_photos_tenant_checkin_item_fkey';

with expected(relname) as (
  values ('tenants'), ('tenant_members'), ('customers'), ('vehicles'), ('service_orders'),
    ('service_order_items'), ('checkins'), ('checkin_items'), ('checkin_photos'), ('audit_events')
), actual as (
  select relname, relrowsecurity
  from pg_class
  where relnamespace = 'public'::regnamespace
)
select count(*) = 10 and bool_and(coalesce(actual.relrowsecurity, false)) as rls_enabled_for_all_tables
from expected left join actual using (relname);

with expected(routine_name) as (
  values ('is_tenant_member'), ('has_tenant_role'), ('create_tenant_with_owner'),
    ('create_service_order_with_customer_vehicle'), ('prevent_actor_field_update')
), actual as (
  select routine_name
  from information_schema.routines
  where routine_schema = 'public'
)
select count(*) = 5 and count(actual.routine_name) = count(expected.routine_name) as required_routines_exist
from expected left join actual using (routine_name);

with expected(policyname, tablename) as (
  values
    ('tenants_member_select', 'tenants'),
    ('tenant_members_select', 'tenant_members'), ('tenant_members_owner_manage', 'tenant_members'),
    ('customers_member_select', 'customers'), ('customers_staff_insert', 'customers'), ('customers_staff_update', 'customers'), ('customers_admin_delete', 'customers'),
    ('vehicles_member_select', 'vehicles'), ('vehicles_staff_insert', 'vehicles'), ('vehicles_staff_update', 'vehicles'), ('vehicles_admin_delete', 'vehicles'),
    ('service_orders_member_select', 'service_orders'), ('service_orders_staff_insert', 'service_orders'), ('service_orders_staff_update', 'service_orders'), ('service_orders_admin_delete', 'service_orders'),
    ('service_order_items_member_select', 'service_order_items'), ('service_order_items_staff_insert', 'service_order_items'), ('service_order_items_staff_update', 'service_order_items'), ('service_order_items_admin_delete', 'service_order_items'),
    ('checkins_member_select', 'checkins'), ('checkins_staff_insert', 'checkins'), ('checkins_staff_update', 'checkins'), ('checkins_admin_delete', 'checkins'),
    ('checkin_items_member_select', 'checkin_items'), ('checkin_items_staff_insert', 'checkin_items'), ('checkin_items_staff_update', 'checkin_items'), ('checkin_items_admin_delete', 'checkin_items'),
    ('checkin_photos_member_select', 'checkin_photos'), ('checkin_photos_staff_insert', 'checkin_photos'), ('checkin_photos_staff_update', 'checkin_photos'), ('checkin_photos_admin_delete', 'checkin_photos'),
    ('audit_events_member_select', 'audit_events'), ('audit_events_staff_insert', 'audit_events')
), actual as (
  select policyname, tablename
  from pg_policies
  where schemaname = 'public'
    and tablename in ('tenants', 'tenant_members', 'customers', 'vehicles', 'service_orders', 'service_order_items', 'checkins', 'checkin_items', 'checkin_photos', 'audit_events')
)
select count(*) = 33
  and count(actual.policyname) = count(expected.policyname)
  and not exists (select policyname, tablename from actual except select policyname, tablename from expected) as public_policies_match_expected
from expected left join actual using (policyname, tablename);

with expected(trigger_name, table_name, actor_field) as (
  values
    ('service_orders_created_by_immutable', 'service_orders', 'created_by'),
    ('checkins_created_by_immutable', 'checkins', 'created_by'),
    ('checkin_photos_uploaded_by_immutable', 'checkin_photos', 'uploaded_by'),
    ('audit_events_actor_id_immutable', 'audit_events', 'actor_id')
), actual as (
  select t.tgname, c.relname, pg_get_triggerdef(t.oid) as definition
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  where c.relnamespace = 'public'::regnamespace
    and not t.tgisinternal
)
select count(*) = 4
  and count(actual.tgname) = count(expected.trigger_name)
  and bool_and(
    actual.definition like '%BEFORE UPDATE%'
    and actual.definition like '%prevent_actor_field_update%'
    and actual.definition like '%' || quote_literal(expected.actor_field) || '%'
  ) as actor_fields_are_immutable
from expected
left join actual on actual.tgname = expected.trigger_name and actual.relname = expected.table_name;

with policies as (
  select policyname, coalesce(qual, '') as qual, coalesce(with_check, '') as with_check
  from pg_policies
  where schemaname = 'public'
    and policyname in (
      'service_orders_staff_insert', 'service_orders_staff_update',
      'checkins_staff_insert', 'checkins_staff_update',
      'checkin_photos_staff_insert', 'checkin_photos_staff_update', 'audit_events_staff_insert'
    )
)
select count(*) = 7
  and bool_and(
    case
      when policyname in ('service_orders_staff_insert', 'checkins_staff_insert') then with_check like '%created_by = auth.uid()%'
      when policyname = 'checkin_photos_staff_insert' then with_check like '%uploaded_by = auth.uid()%'
      when policyname in ('service_orders_staff_update', 'checkins_staff_update') then
        with_check like '%has_tenant_role%'
        and with_check not like '%created_by = auth.uid()%'
      when policyname = 'checkin_photos_staff_update' then
        with_check like '%has_tenant_role%'
        and with_check not like '%uploaded_by = auth.uid()%'
      when policyname = 'audit_events_staff_insert' then lower(with_check) like '%actor_id is null%'
        and lower(with_check) like '%actor_id = auth.uid()%'
      else false
    end
  ) as actor_insert_guards_and_collaborative_updates_exist
from policies;

with policies as (
  select policyname, cmd, coalesce(qual, '') as qual, coalesce(with_check, '') as with_check
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname in ('checkin_photos_storage_select', 'checkin_photos_storage_insert', 'checkin_photos_storage_delete')
)
select count(*) = 3
  and bool_and(
    case
      when policyname = 'checkin_photos_storage_select' then cmd = 'SELECT'
        and qual like '%array_length(storage.foldername(name), 1) = 4%'
        and qual like '%storage.filename(name)%'
        and qual like '%checkin_photos%'
        and qual like '%storage_path = %name%'
      when policyname = 'checkin_photos_storage_insert' then cmd = 'INSERT'
        and with_check like '%array_length(storage.foldername(name), 1) = 4%'
        and with_check like '%storage.filename(name)%'
        and with_check like '%checkins%'
      when policyname = 'checkin_photos_storage_delete' then cmd = 'DELETE'
        and qual like '%array_length(storage.foldername(name), 1) = 4%'
        and qual like '%storage.filename(name)%'
        and qual like '%checkin_photos%'
        and qual like '%storage_path = %name%'
      else false
    end
  ) as storage_policies_enforce_photo_paths
from policies;
