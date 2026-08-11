# Automec MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first multi-tenant Automec SaaS MVP for workshops: login/onboarding, customers, vehicles, service orders, guided check-in, and check-in photo metadata/storage integration.

**Architecture:** Create a Vite + React + TypeScript SPA deployable to Vercel. Use Supabase Auth, PostgreSQL migrations with RLS for tenant isolation, and Supabase Storage for check-in photos. Keep query paths tenant-scoped and backed by explicit indexes from the first migration.

**Tech Stack:** React, Vite, TypeScript, React Router, Supabase JS, Vitest, Testing Library, PostgreSQL/Supabase SQL migrations, Vercel static deployment.

## Global Constraints

- Source repository: `https://github.com/glauciodrumond/automec.git`.
- Deployment target: Vercel static deployment using Vite production build output.
- Public env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Do not commit local `.env` files.
- Provide `.env.example` with required public Supabase variables.
- Every tenant-owned operational table must include `tenant_id`.
- Enable RLS for all application tables.
- A user can access a tenant-owned row only when a matching row exists in `tenant_members` for `auth.uid()` and the row's `tenant_id`.
- Roles: `owner`, `admin`, `technician`.
- MVP focus: customers, vehicles, service orders, check-in checklist, and check-in photos.
- Non-goals: invoicing, full inventory, accounts receivable, advanced permission matrix, native mobile, offline-first behavior, AI damage detection.
- UI style: operational, dense but organized, no marketing landing page.

---

## File Structure

- `package.json`: project scripts, dependencies, dev dependencies.
- `index.html`: Vite entry document.
- `vite.config.ts`: Vite and Vitest configuration.
- `tsconfig.json`, `tsconfig.node.json`: TypeScript configuration.
- `.gitignore`: exclude dependencies, build output, logs, and local env files.
- `.env.example`: required Supabase variables.
- `src/main.tsx`: React entrypoint.
- `src/App.tsx`: route shell and auth gating.
- `src/styles.css`: global operational UI styling.
- `src/lib/supabase.ts`: Supabase client factory and env validation.
- `src/lib/checkin.ts`: default checklist definitions and helper functions.
- `src/types/database.ts`: application database row/insert/update types used by the UI.
- `src/components/Layout.tsx`: authenticated app layout.
- `src/components/AuthGate.tsx`: login/session/onboarding gate.
- `src/components/ServiceOrderList.tsx`: main OS list and dashboard cards.
- `src/components/NewServiceOrder.tsx`: customer, vehicle, and OS quick-create form.
- `src/components/ServiceOrderDetail.tsx`: OS detail with tabs.
- `src/components/CheckinPanel.tsx`: guided check-in UI and photo upload metadata.
- `src/components/TeamMembers.tsx`: simple owner/admin team view.
- `src/__tests__/checkin.test.ts`: checklist unit tests.
- `src/__tests__/supabase-env.test.ts`: env/client behavior tests.
- `supabase/migrations/202608110001_initial_schema.sql`: tables, indexes, RLS policies, storage bucket/policies, triggers/functions.
- `supabase/tests/schema_indexes.sql`: SQL smoke checks for required indexes and RLS flags.
- `README.md`: setup, Supabase, Vercel, and local development instructions.

---

### Task 1: Bootstrap React/Vite Project

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/lib/supabase.ts`
- Test: `src/__tests__/supabase-env.test.ts`

**Interfaces:**
- Produces: `getSupabaseConfig(): { url: string; anonKey: string; configured: boolean }`
- Produces: `supabase` client exported from `src/lib/supabase.ts`
- Consumes: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

- [ ] **Step 1: Initialize Git and remote**

Run:

```bash
git init
git remote add origin https://github.com/glauciodrumond/automec.git
```

Expected: local repository exists and `origin` points to the GitHub URL.

- [ ] **Step 2: Create project files**

Create a Vite React TypeScript project manually with these scripts:

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Required runtime dependencies:

```json
{
  "@supabase/supabase-js": "^2.45.0",
  "@vitejs/plugin-react": "^4.3.1",
  "vite": "^5.4.0",
  "typescript": "^5.5.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.0",
  "lucide-react": "^0.468.0"
}
```

Required dev dependencies:

```json
{
  "@testing-library/jest-dom": "^6.4.8",
  "@testing-library/react": "^16.0.1",
  "@types/react": "^18.3.3",
  "@types/react-dom": "^18.3.0",
  "jsdom": "^24.1.1",
  "vitest": "^2.0.5"
}
```

- [ ] **Step 3: Implement Supabase env helper**

Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL ?? ''
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

  return {
    url,
    anonKey,
    configured: Boolean(url && anonKey),
  }
}

const config = getSupabaseConfig()

export const supabase = createClient(
  config.url || 'https://example.supabase.co',
  config.anonKey || 'public-anon-key-for-unconfigured-client',
)
```

- [ ] **Step 4: Write env tests**

Create `src/__tests__/supabase-env.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getSupabaseConfig } from '../lib/supabase'

describe('getSupabaseConfig', () => {
  it('returns a stable configuration object', () => {
    const config = getSupabaseConfig()

    expect(config).toHaveProperty('url')
    expect(config).toHaveProperty('anonKey')
    expect(config).toHaveProperty('configured')
    expect(typeof config.configured).toBe('boolean')
  })
})
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm install
npm test
```

Expected: tests pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add .
git commit -m "chore: bootstrap automec app"
```

---

### Task 2: Supabase Schema, RLS, Storage, And Indexes

**Files:**
- Create: `supabase/migrations/202608110001_initial_schema.sql`
- Create: `supabase/tests/schema_indexes.sql`
- Modify: `README.md`

**Interfaces:**
- Produces: database tables `tenants`, `tenant_members`, `customers`, `vehicles`, `service_orders`, `service_order_items`, `checkins`, `checkin_items`, `checkin_photos`, `audit_events`
- Produces: storage bucket `checkin-photos`
- Produces: function `public.is_tenant_member(target_tenant_id uuid)`
- Produces: function `public.has_tenant_role(target_tenant_id uuid, allowed_roles text[])`
- Consumes: Supabase Auth `auth.uid()`

- [ ] **Step 1: Create migration**

Create SQL migration with:

```sql
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
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  plate text not null,
  type text not null default 'vehicle',
  brand text,
  model text,
  year integer,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
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
  updated_at timestamptz not null default now()
);

create table public.service_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  kind text not null check (kind in ('labor', 'part', 'other')),
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  general_notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checkin_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  category text not null check (category in ('front', 'rear', 'left_side', 'right_side', 'interior', 'dashboard', 'odometer', 'damage', 'documents_objects', 'extra')),
  status text not null check (status in ('ok', 'attention', 'damaged', 'not_applicable')) default 'ok',
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checkin_photos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  checkin_item_id uuid references public.checkin_items(id) on delete set null,
  category text not null check (category in ('front', 'rear', 'left_side', 'right_side', 'interior', 'dashboard', 'odometer', 'damage', 'documents_objects', 'extra')),
  storage_path text not null,
  caption text,
  content_type text not null,
  size_bytes bigint not null,
  sort_order integer not null default 0,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
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
```

- [ ] **Step 2: Add required indexes**

Append:

```sql
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
```

- [ ] **Step 3: Add RLS helper functions and policies**

Append:

```sql
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
```

For each table `customers`, `vehicles`, `service_orders`, `service_order_items`, `checkins`, `checkin_items`, `checkin_photos`, and `audit_events`, add:

```sql
create policy TABLE_member_select on public.TABLE
for select using (public.is_tenant_member(tenant_id));

create policy TABLE_staff_insert on public.TABLE
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

create policy TABLE_staff_update on public.TABLE
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

create policy TABLE_admin_delete on public.TABLE
for delete using (public.has_tenant_role(tenant_id, array['owner', 'admin']));
```

Replace `TABLE` with the exact table name in each policy name and target.

- [ ] **Step 4: Add Storage bucket and policies**

Append:

```sql
insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', false)
on conflict (id) do nothing;

create policy checkin_photos_storage_select on storage.objects
for select using (
  bucket_id = 'checkin-photos'
  and public.is_tenant_member((storage.foldername(name))[2]::uuid)
);

create policy checkin_photos_storage_insert on storage.objects
for insert with check (
  bucket_id = 'checkin-photos'
  and (storage.foldername(name))[1] = 'tenant'
  and public.has_tenant_role((storage.foldername(name))[2]::uuid, array['owner', 'admin', 'technician'])
);

create policy checkin_photos_storage_delete on storage.objects
for delete using (
  bucket_id = 'checkin-photos'
  and public.has_tenant_role((storage.foldername(name))[2]::uuid, array['owner', 'admin'])
);
```

- [ ] **Step 5: Add SQL smoke tests**

Create `supabase/tests/schema_indexes.sql`:

```sql
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
    'service_orders_tenant_vehicle_entry_idx',
    'service_orders_tenant_customer_entry_idx',
    'service_order_items_tenant_order_idx',
    'checkins_tenant_service_order_idx',
    'checkin_items_tenant_checkin_sort_idx',
    'checkin_photos_tenant_checkin_category_sort_idx',
    'audit_events_tenant_entity_created_idx'
  );

select relname, relrowsecurity
from pg_class
where relname in ('tenants', 'tenant_members', 'customers', 'vehicles', 'service_orders', 'service_order_items', 'checkins', 'checkin_items', 'checkin_photos', 'audit_events');
```

- [ ] **Step 6: Commit**

Run:

```bash
git add supabase README.md
git commit -m "feat: add multi-tenant supabase schema"
```

---

### Task 3: Core Types And Check-In Helpers

**Files:**
- Create: `src/types/database.ts`
- Create: `src/lib/checkin.ts`
- Test: `src/__tests__/checkin.test.ts`

**Interfaces:**
- Produces: `CheckinCategory` union
- Produces: `CheckinStatus` union
- Produces: `DEFAULT_CHECKIN_ITEMS: DefaultCheckinItem[]`
- Produces: `buildInitialCheckinItems(checkinId: string, tenantId: string): CheckinItemInsert[]`

- [ ] **Step 1: Write failing check-in tests**

Create `src/__tests__/checkin.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_CHECKIN_ITEMS, buildInitialCheckinItems } from '../lib/checkin'

describe('DEFAULT_CHECKIN_ITEMS', () => {
  it('contains the expected workshop check-in categories in display order', () => {
    expect(DEFAULT_CHECKIN_ITEMS.map((item) => item.category)).toEqual([
      'front',
      'rear',
      'left_side',
      'right_side',
      'interior',
      'dashboard',
      'odometer',
      'damage',
      'documents_objects',
      'extra',
    ])
  })
})

describe('buildInitialCheckinItems', () => {
  it('creates tenant-scoped check-in item inserts with default ok status', () => {
    const items = buildInitialCheckinItems('checkin-1', 'tenant-1')

    expect(items).toHaveLength(10)
    expect(items[0]).toMatchObject({
      tenant_id: 'tenant-1',
      checkin_id: 'checkin-1',
      category: 'front',
      status: 'ok',
      sort_order: 0,
    })
    expect(items[9]).toMatchObject({
      category: 'extra',
      sort_order: 9,
    })
  })
})
```

- [ ] **Step 2: Implement types**

Create `src/types/database.ts` with exported row and insert types for all MVP tables. Include exact unions:

```ts
export type TenantRole = 'owner' | 'admin' | 'technician'
export type ServiceOrderStatus = 'open' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled'
export type ServiceOrderPriority = 'low' | 'normal' | 'high'
export type ServiceOrderItemKind = 'labor' | 'part' | 'other'
export type CheckinCategory = 'front' | 'rear' | 'left_side' | 'right_side' | 'interior' | 'dashboard' | 'odometer' | 'damage' | 'documents_objects' | 'extra'
export type CheckinStatus = 'ok' | 'attention' | 'damaged' | 'not_applicable'
```

- [ ] **Step 3: Implement check-in helpers**

Create `src/lib/checkin.ts`:

```ts
import type { CheckinCategory, CheckinItemInsert } from '../types/database'

export interface DefaultCheckinItem {
  category: CheckinCategory
  label: string
  sortOrder: number
}

export const DEFAULT_CHECKIN_ITEMS: DefaultCheckinItem[] = [
  { category: 'front', label: 'Frente', sortOrder: 0 },
  { category: 'rear', label: 'Traseira', sortOrder: 1 },
  { category: 'left_side', label: 'Lateral esquerda', sortOrder: 2 },
  { category: 'right_side', label: 'Lateral direita', sortOrder: 3 },
  { category: 'interior', label: 'Interior', sortOrder: 4 },
  { category: 'dashboard', label: 'Painel', sortOrder: 5 },
  { category: 'odometer', label: 'Hodometro', sortOrder: 6 },
  { category: 'damage', label: 'Avarias', sortOrder: 7 },
  { category: 'documents_objects', label: 'Documentos/objetos', sortOrder: 8 },
  { category: 'extra', label: 'Extras', sortOrder: 9 },
]

export function buildInitialCheckinItems(checkinId: string, tenantId: string): CheckinItemInsert[] {
  return DEFAULT_CHECKIN_ITEMS.map((item) => ({
    tenant_id: tenantId,
    checkin_id: checkinId,
    category: item.category,
    status: 'ok',
    notes: null,
    sort_order: item.sortOrder,
  }))
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test
```

Expected: check-in helper tests pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/types src/lib src/__tests__
git commit -m "feat: add check-in domain helpers"
```

---

### Task 4: Auth, Tenant Onboarding, And Layout

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/AuthGate.tsx`
- Create: `src/components/Layout.tsx`
- Create: `src/components/TeamMembers.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts`
- Produces: `ActiveTenantContext` shape inside `AuthGate`: `{ userId: string; tenantId: string; tenantName: string; role: TenantRole }`
- Produces: authenticated app shell with navigation

- [ ] **Step 1: Implement authentication gate**

Create `AuthGate.tsx` that:

- shows Supabase email/password login and signup when unauthenticated;
- when authenticated, queries `tenant_members` joined to `tenants`;
- if no membership exists, shows a workshop creation form;
- on workshop creation, inserts `tenants` and `tenant_members` with role `owner`;
- passes active tenant context to children.

- [ ] **Step 2: Implement layout**

Create `Layout.tsx` with:

- compact top bar;
- workshop name;
- role badge;
- navigation buttons for `Ordens`, `Equipe`;
- sign out button.

- [ ] **Step 3: Implement team screen**

Create `TeamMembers.tsx` to list current tenant members by `tenant_id`.

It should show a clear empty/error state if RLS or data is not configured.

- [ ] **Step 4: Wire routes**

Update `App.tsx` with React Router routes:

- `/` for service order list
- `/orders/new` for new service order
- `/orders/:id` for order detail
- `/team` for team members

At this task, order routes may render temporary operational panels with real navigation.

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add src
git commit -m "feat: add auth and tenant shell"
```

---

### Task 5: Service Order Flow

**Files:**
- Create: `src/components/ServiceOrderList.tsx`
- Create: `src/components/NewServiceOrder.tsx`
- Create: `src/components/ServiceOrderDetail.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: active tenant context from `AuthGate`
- Consumes: `supabase`
- Produces: create customer, vehicle, and service order flow
- Produces: service order detail tabs: `Resumo`, `Check-in`, `Itens`, `Fotos`

- [ ] **Step 1: Implement service order list**

Create `ServiceOrderList.tsx` that:

- fetches `service_orders` for active tenant;
- joins display data from `customers` and `vehicles`;
- filters by `status in ('open', 'in_progress', 'waiting_parts')`;
- orders by `entry_at desc`;
- shows dashboard cards for open, in-progress, and completed recent counts;
- links each row to `/orders/:id`.

- [ ] **Step 2: Implement new service order form**

Create `NewServiceOrder.tsx` that:

- collects customer name, phone, document;
- collects vehicle plate, brand, model, year, color;
- collects complaint and odometer;
- inserts customer;
- inserts vehicle under that customer;
- computes next `code` by selecting highest existing `code` for tenant and adding 1;
- inserts `service_orders` with status `open`, priority `normal`, `created_by` current user id;
- navigates to created order detail.

- [ ] **Step 3: Implement service order detail**

Create `ServiceOrderDetail.tsx` that:

- loads one service order by `id` and `tenant_id`;
- loads linked customer and vehicle;
- displays compact OS header with code, status, priority, plate, customer, entry date, odometer;
- renders tabs `Resumo`, `Check-in`, `Itens`, and `Fotos`;
- shows service order items in the `Itens` tab.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 5: Commit**

Run:

```bash
git add src
git commit -m "feat: add service order workflow"
```

---

### Task 6: Guided Check-In And Photo Metadata Flow

**Files:**
- Create: `src/components/CheckinPanel.tsx`
- Modify: `src/components/ServiceOrderDetail.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `DEFAULT_CHECKIN_ITEMS` and `buildInitialCheckinItems`
- Consumes: `supabase`
- Produces: check-in creation for an OS
- Produces: checklist editing
- Produces: photo upload to bucket `checkin-photos` and metadata insert into `checkin_photos`

- [ ] **Step 1: Implement check-in panel**

Create `CheckinPanel.tsx` that:

- loads existing check-in for the service order;
- if none exists, shows `Criar check-in`;
- on creation, inserts `checkins`, then inserts default `checkin_items`;
- lists checklist items in sort order;
- lets the user change status and notes for each item;
- saves each item update through Supabase;
- shows photo thumbnails from signed URLs when photo metadata exists.

- [ ] **Step 2: Implement photo upload**

In `CheckinPanel.tsx`, add an image file input per checklist item:

- accept `image/*`;
- upload to `checkin-photos`;
- use storage path `tenant/{tenantId}/checkins/{checkinId}/{photoId}`;
- after upload succeeds, insert `checkin_photos` row with `tenant_id`, `checkin_id`, `checkin_item_id`, `category`, `storage_path`, `caption`, `content_type`, `size_bytes`, `sort_order`, `uploaded_by`;
- if metadata insert fails after upload succeeds, attempt to remove the uploaded file and show retry message.

- [ ] **Step 3: Add free gallery**

Add an `Extras` area that uses category `extra`, permits uploads without a specific checklist item, and shows uploaded photos ordered by `sort_order`.

- [ ] **Step 4: Wire detail tabs**

Update `ServiceOrderDetail.tsx` so:

- `Check-in` tab renders `CheckinPanel`;
- `Fotos` tab renders the same photos grouped by category.

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 6: Commit**

Run:

```bash
git add src
git commit -m "feat: add guided check-in photos"
```

---

### Task 7: README, Vercel Notes, And Final Verification

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: final app scripts
- Produces: setup instructions for local dev, Supabase migrations, Vercel env vars, and deployment

- [ ] **Step 1: Document local setup**

README must include:

```md
npm install
cp .env.example .env
npm run dev
```

It must state that `.env` needs:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 2: Document Supabase setup**

README must say:

- create a Supabase project;
- apply migrations in `supabase/migrations`;
- confirm bucket `checkin-photos` exists;
- keep RLS enabled;
- use the SQL smoke checks in `supabase/tests/schema_indexes.sql`.

- [ ] **Step 3: Document Vercel setup**

README must say:

- import `glauciodrumond/automec` into Vercel;
- framework preset: Vite;
- build command: `npm run build`;
- output directory: `dist`;
- configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project settings.

- [ ] **Step 4: Final verification**

Run:

```bash
npm test
npm run build
git status --short
```

Expected:

- tests pass;
- build passes;
- git status only shows intentional uncommitted changes before final commit.

- [ ] **Step 5: Commit**

Run:

```bash
git add README.md .env.example
git commit -m "docs: add deployment setup"
```
