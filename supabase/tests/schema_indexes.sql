select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('tenants', 'tenant_members', 'customers', 'vehicles', 'service_orders', 'service_order_items', 'checkins', 'checkin_items', 'checkin_photos', 'audit_events');

select indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'tenant_members_user_tenant_idx',
    'customers_tenant_document_idx',
    'customers_name_trgm_idx',
    'vehicles_tenant_plate_idx',
    'vehicles_tenant_customer_idx',
    'service_orders_tenant_code_idx',
    'service_orders_tenant_status_entry_idx',
    'service_orders_tenant_active_entry_idx',
    'service_orders_tenant_vehicle_entry_idx',
    'service_orders_tenant_customer_entry_idx',
    'service_order_items_tenant_order_idx',
    'checkins_tenant_service_order_idx',
    'checkin_items_checkin_sort_idx',
    'checkin_photos_checkin_category_sort_idx',
    'audit_events_tenant_entity_created_idx'
  );

select relname, relrowsecurity
from pg_class
where relname in ('tenants', 'tenant_members', 'customers', 'vehicles', 'service_orders', 'service_order_items', 'checkins', 'checkin_items', 'checkin_photos', 'audit_events');
