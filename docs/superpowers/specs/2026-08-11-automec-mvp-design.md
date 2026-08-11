# Automec MVP Design

## Summary

Automec is a multi-tenant SaaS for mechanical workshops. The MVP focuses on the daily operational flow that creates immediate value for a workshop: customers, vehicles, service orders, and vehicle check-in with guided photo evidence.

The product will be built from scratch as a web application using React, Vite, TypeScript, and Supabase. Supabase provides authentication, PostgreSQL, row-level security, and storage for check-in photos. The source repository is `https://github.com/glauciodrumond/automec.git`, and the frontend should be deployable to Vercel.

## Goals

- Build a sellable MVP for mechanical workshops.
- Support multiple workshops from the first database schema.
- Prevent cross-tenant data access using PostgreSQL RLS.
- Let a workshop create service orders linked to customers and vehicles.
- Let a workshop perform a vehicle check-in with a suggested checklist and extra photos.
- Store check-in photos in Supabase Storage and metadata in PostgreSQL.
- Add the database indexes needed for the most frequent and critical application queries.
- Avoid redundant or unnecessary indexes in the initial schema.

## Non-Goals

- Invoicing and fiscal note generation.
- Full inventory management.
- Accounts receivable.
- Advanced role permission matrix.
- Native mobile app.
- Offline-first behavior.
- AI damage detection.

## Users And Roles

The MVP supports workshop teams.

- `owner`: owns the workshop tenant and can manage members.
- `admin`: can operate the workshop and manage operational records.
- `technician`: can view and update service orders and check-ins.

Every authenticated user must be linked to at least one tenant through `tenant_members`.

## Architecture

The frontend is a React + Vite + TypeScript single-page application. It uses Supabase client libraries for authentication, database operations, and photo uploads.

The backend is Supabase:

- Supabase Auth handles users and sessions.
- PostgreSQL stores tenant, customer, vehicle, service order, check-in, photo, and audit data.
- Row-level security policies enforce tenant isolation.
- Supabase Storage stores check-in photo files.

All tenant-owned operational tables include `tenant_id`. The client may pass `tenant_id`, but RLS policies are the final authority for access control.

## Repository And Deployment

The local project should be initialized as a Git repository and connected to `https://github.com/glauciodrumond/automec.git`.

The application should be compatible with Vercel static deployment:

- Use Vite's production build output.
- Keep Supabase URL and anon key in Vercel environment variables.
- Do not commit local `.env` files.
- Provide `.env.example` with the required public Supabase variables.
- Keep database migrations in the repository so Supabase schema changes are versioned.

## Data Model

### `tenants`

Represents a workshop.

Fields:

- `id uuid primary key`
- `name text not null`
- `document text null`
- `phone text null`
- `created_at timestamptz not null default now()`

### `tenant_members`

Links Supabase users to workshops.

Fields:

- `tenant_id uuid not null references tenants(id)`
- `user_id uuid not null references auth.users(id)`
- `role text not null check (role in ('owner', 'admin', 'technician'))`
- `created_at timestamptz not null default now()`
- primary key: `(tenant_id, user_id)`

### `customers`

Stores workshop customers.

Fields:

- `id uuid primary key`
- `tenant_id uuid not null references tenants(id)`
- `name text not null`
- `document text null`
- `phone text null`
- `email text null`
- `address text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `vehicles`

Stores vehicles owned by customers.

Fields:

- `id uuid primary key`
- `tenant_id uuid not null references tenants(id)`
- `customer_id uuid not null references customers(id)`
- `plate text not null`
- `type text not null default 'vehicle'`
- `brand text null`
- `model text null`
- `year integer null`
- `color text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

The same plate can exist in different tenants, but not twice inside the same tenant.

### `service_orders`

Stores workshop service orders.

Fields:

- `id uuid primary key`
- `tenant_id uuid not null references tenants(id)`
- `customer_id uuid not null references customers(id)`
- `vehicle_id uuid not null references vehicles(id)`
- `code bigint not null`
- `status text not null check (status in ('open', 'in_progress', 'waiting_parts', 'completed', 'cancelled'))`
- `priority text not null check (priority in ('low', 'normal', 'high')) default 'normal'`
- `entry_at timestamptz not null default now()`
- `exit_at timestamptz null`
- `odometer integer null`
- `complaint text null`
- `internal_notes text null`
- `created_by uuid not null references auth.users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`code` is unique per tenant and provides the human-facing OS number.

### `service_order_items`

Stores labor and product lines for a service order.

Fields:

- `id uuid primary key`
- `tenant_id uuid not null references tenants(id)`
- `service_order_id uuid not null references service_orders(id)`
- `kind text not null check (kind in ('labor', 'part', 'other'))`
- `description text not null`
- `quantity numeric(12,2) not null default 1`
- `unit_price numeric(12,2) not null default 0`
- `created_at timestamptz not null default now()`

### `checkins`

Stores the vehicle entry inspection for a service order.

Fields:

- `id uuid primary key`
- `tenant_id uuid not null references tenants(id)`
- `service_order_id uuid not null references service_orders(id)`
- `general_notes text null`
- `created_by uuid not null references auth.users(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Each service order has at most one check-in.

### `checkin_items`

Stores checklist answers by vehicle area.

Fields:

- `id uuid primary key`
- `tenant_id uuid not null references tenants(id)`
- `checkin_id uuid not null references checkins(id)`
- `category text not null check (category in ('front', 'rear', 'left_side', 'right_side', 'interior', 'dashboard', 'odometer', 'damage', 'documents_objects', 'extra'))`
- `status text not null check (status in ('ok', 'attention', 'damaged', 'not_applicable')) default 'ok'`
- `notes text null`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `checkin_photos`

Stores metadata for uploaded check-in photos.

Fields:

- `id uuid primary key`
- `tenant_id uuid not null references tenants(id)`
- `checkin_id uuid not null references checkins(id)`
- `checkin_item_id uuid null references checkin_items(id)`
- `category text not null check (category in ('front', 'rear', 'left_side', 'right_side', 'interior', 'dashboard', 'odometer', 'damage', 'documents_objects', 'extra'))`
- `storage_path text not null`
- `caption text null`
- `content_type text not null`
- `size_bytes bigint not null`
- `sort_order integer not null default 0`
- `uploaded_by uuid not null references auth.users(id)`
- `created_at timestamptz not null default now()`

Storage paths include the tenant id and check-in id: `tenant/{tenant_id}/checkins/{checkin_id}/{photo_id}`.

### `audit_events`

Stores lightweight operational history.

Fields:

- `id uuid primary key`
- `tenant_id uuid not null references tenants(id)`
- `actor_id uuid null references auth.users(id)`
- `entity_type text not null`
- `entity_id uuid not null`
- `event_type text not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

## Row-Level Security

RLS is enabled for all application tables.

General policy rule:

- A user can access a tenant-owned row only when a matching row exists in `tenant_members` for `auth.uid()` and the row's `tenant_id`.

Role rule:

- `owner` and `admin` can create, update, and delete operational records.
- `technician` can read customers, vehicles, service orders, check-ins, checkin items, and photos.
- `technician` can update service orders and check-ins, but cannot manage tenant members.

Storage rule:

- A user can upload/read/delete files only under a tenant path for a tenant they belong to.

## Critical Queries

The initial schema is optimized for these frequent and critical queries:

- List open service orders by tenant, ordered by newest entry.
- Filter service orders by status, period, customer, and vehicle.
- Search service order by human-facing OS code.
- Open vehicle history ordered by latest OS.
- Load a service order with customer and vehicle.
- Load a check-in with all checklist items and photos.
- Search customers by name or document.
- Search vehicles by plate.
- Count dashboard cards for open, in-progress, and recently completed service orders.
- List photos for a check-in by category and sort order.

## Index Strategy

Indexes must match tenant-scoped access patterns. Every index on operational data starts with `tenant_id` when the query is tenant-scoped.

Required indexes:

- `tenant_members(user_id, tenant_id)`
- `customers(tenant_id, document)` where `document is not null`
- `vehicles(tenant_id, plate)` unique
- `vehicles(tenant_id, customer_id)`
- `service_orders(tenant_id, code)` unique
- `service_orders(tenant_id, status, entry_at desc)`
- `service_orders(tenant_id, vehicle_id, entry_at desc)`
- `service_orders(tenant_id, customer_id, entry_at desc)`
- `service_order_items(tenant_id, service_order_id)`
- `checkins(tenant_id, service_order_id)` unique
- `checkin_items(tenant_id, checkin_id, sort_order)`
- `checkin_photos(tenant_id, checkin_id, category, sort_order)`
- `audit_events(tenant_id, entity_type, entity_id, created_at desc)`

Conditional search index:

- Enable `pg_trgm`.
- Add `customers_name_trgm_idx` on `customers using gin (name gin_trgm_ops)` only if the UI implements partial customer-name search.

Redundancy rules:

- Do not add a separate non-unique index when a unique composite index already covers the same leading columns.
- Do not add single-column indexes for `tenant_id` alone unless a measured query requires it.
- Do not index low-cardinality fields such as `status` without `tenant_id` and a useful ordering/filter companion.

## User Experience

After login, the user lands directly in the operational app.

Primary screens:

- Service order list.
- New service order form.
- Service order detail.
- Check-in tab.
- Photo gallery.
- Customer and vehicle quick-create forms.
- Team members screen for owner/admin.

Service order detail uses tabs:

- `Resumo`
- `Check-in`
- `Itens`
- `Fotos`

The check-in tab shows a suggested checklist:

- Frente
- Traseira
- Lateral esquerda
- Lateral direita
- Interior
- Painel
- Hodometro
- Avarias
- Documentos/objetos
- Extras

Each checklist item supports:

- status
- notes
- one or more photos

There is also a free gallery for extra photos.

## Visual Direction

The app should feel operational and workshop-ready:

- Dense but organized layout.
- Clear tables and forms.
- Compact top navigation.
- Direct actions for creating OS and adding photos.
- No marketing landing page in the MVP.
- Responsive behavior for tablet and desktop first, mobile acceptable.

The legacy system screenshots show the local market tolerates dense back-office interfaces. Automec should preserve the speed and information density while making the UI cleaner, safer, and easier to use.

## Error Handling

Required states:

- User has no tenant membership.
- User does not have permission for an action.
- No open service orders.
- Customer or vehicle not found during OS creation.
- Upload in progress.
- Upload failed.
- Photo metadata insert failed after storage upload.
- Storage upload succeeded but database insert failed; the client should attempt to delete the orphaned file and show a retry action.
- Network or Supabase session error.

## Testing Requirements

The MVP needs focused verification for:

- RLS policies blocking cross-tenant reads and writes.
- Tenant member role rules.
- Service order creation.
- Vehicle plate uniqueness scoped by tenant.
- Check-in creation with default checklist items.
- Photo metadata creation.
- Critical indexes existing in migrations.
- UI flows for creating customer, vehicle, service order, check-in item, and photo metadata.

## Implementation Notes

The workspace was empty and was not a Git repository when this design was written. The implementation should initialize the project structure, connect the GitHub remote, and commit this spec before application work starts.
