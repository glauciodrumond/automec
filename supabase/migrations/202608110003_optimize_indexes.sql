-- Optimize service orders partial index for active orders (open, in_progress, waiting_parts)
create index if not exists service_orders_tenant_active_entry_idx 
  on public.service_orders(tenant_id, entry_at desc) 
  where status in ('open', 'in_progress', 'waiting_parts');

-- Optimize checkin items lookup by checkin_id
create index if not exists checkin_items_checkin_sort_idx 
  on public.checkin_items(checkin_id, sort_order);

-- Optimize checkin photos lookup by checkin_id and category
create index if not exists checkin_photos_checkin_category_sort_idx 
  on public.checkin_photos(checkin_id, category, sort_order);

-- Remove redundant non-tenant prefixed indexes if replaced by composite covered indexes
drop index if exists public.checkin_items_tenant_checkin_sort_idx;
drop index if exists public.checkin_photos_tenant_checkin_category_sort_idx;
