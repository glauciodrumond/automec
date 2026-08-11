# Automec Full Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Automec SaaS with Inventory/Products management, enhanced customer fields (PF/PJ, full address), complete Service Order totals calculation (labor vs parts vs discount), and integrated item creation.

**Architecture:** Create database migration `202608110004_full_features.sql` with `products` table, customer/OS column extensions, and RLS policies. Build `ProductsList.tsx`, `CustomersList.tsx`, and enhance `ServiceOrderDetail.tsx` with item management.

**Tech Stack:** React 18, TypeScript, Supabase JS Client, Lucide React icons, Vitest, Testing Library.

## Global Constraints

- Every table has `tenant_id` with RLS `is_tenant_member` / `has_tenant_role`.
- Product code unique per tenant.
- Currency formatted in BRL (`pt-BR`).
- Non-breaking changes for existing service orders.

---

### Task 1: Database Migration for Full Features

**Files:**
- Create: `supabase/migrations/202608110004_full_features.sql`
- Test: `src/__tests__/full_features_schema.test.ts`

**Interfaces:**
- Produces: `products` table, `customers` extra columns, `service_orders` extra columns, `service_order_items.product_id`.

- [ ] **Step 1: Write SQL migration**

Create `supabase/migrations/202608110004_full_features.sql`:

```sql
create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code bigint not null,
  name text not null,
  group_name text,
  kind text not null check (kind in ('part', 'labor', 'service')) default 'part',
  unit text not null default 'UN',
  cost_price numeric(12,2) not null default 0,
  sell_price numeric(12,2) not null default 0,
  stock_current numeric(12,2) not null default 0,
  stock_min numeric(12,2) not null default 0,
  ncm text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index products_tenant_code_idx on public.products(tenant_id, code);
create index products_tenant_name_idx on public.products(tenant_id, name);

alter table public.products enable row level security;

create policy products_member_select on public.products
for select using (public.is_tenant_member(tenant_id));

create policy products_staff_insert on public.products
for insert with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

create policy products_staff_update on public.products
for update using (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin', 'technician']));

create policy products_admin_delete on public.products
for delete using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

-- Customer extensions
alter table public.customers 
  add column if not exists fantasy_name text,
  add column if not exists person_type text not null default 'physical' check (person_type in ('physical', 'legal')),
  add column if not exists cep text,
  add column if not exists number text,
  add column if not exists complement text,
  add column if not exists neighborhood text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists ie text;

-- Service Order extensions
alter table public.service_orders
  add column if not exists order_type text not null default 'normal' check (order_type in ('normal', 'warranty', 'budget')),
  add column if not exists found_defect text,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists labor_total numeric(12,2) not null default 0,
  add column if not exists parts_total numeric(12,2) not null default 0,
  add column if not exists total_amount numeric(12,2) not null default 0;

-- Service Order Items extension
alter table public.service_order_items
  add column if not exists product_id uuid references public.products(id) on delete set null;
```

- [ ] **Step 2: Add migration test file**

Create `src/__tests__/full_features_schema.test.ts`.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit and Push Migration to Supabase DB**

Run:
```bash
npx -y supabase db push
git add supabase/migrations/202608110004_full_features.sql src/__tests__/full_features_schema.test.ts
git commit -m "feat: add products table and schema extensions migration"
```

---

### Task 2: Inventory & Products Management Module (`ProductsList.tsx`)

**Files:**
- Create: `src/components/ProductsList.tsx`
- Create: `src/__tests__/ProductsList.test.tsx`
- Modify: `src/types/database.ts`
- Modify: `src/components/Layout.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `Product` row & insert types
- Produces: `/products` route and navigation link
- Produces: CRUD for Products (auto code generation, name, kind, prices, stock levels)

- [ ] **Step 1: Update database types**

Modify `src/types/database.ts` to add `Product` interface and update `Customer` / `ServiceOrder` interfaces.

- [ ] **Step 2: Create `ProductsList.tsx` component**

Create `ProductsList.tsx` with:
- Products data table (Code, Name, Kind, Stock, Cost, Sell Price, Actions).
- Stock alert indicator (when `stock_current <= stock_min`).
- New product modal/form with auto code increment.

- [ ] **Step 3: Add test file `ProductsList.test.tsx`**

- [ ] **Step 4: Wire `/products` route in `App.tsx` and link in `Layout.tsx`**

- [ ] **Step 5: Run tests and build**

Run: `npm test` and `npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

Run:
```bash
git add src/
git commit -m "feat: add inventory and products management module"
```

---

### Task 3: Enhanced Customers Management Module (`CustomersList.tsx`)

**Files:**
- Create: `src/components/CustomersList.tsx`
- Create: `src/__tests__/CustomersList.test.tsx`
- Modify: `src/components/Layout.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `/customers` route and navigation link
- Produces: Customers list with search, PF/PJ toggle, CEP address fields.

- [ ] **Step 1: Create `CustomersList.tsx` component**

Create `CustomersList.tsx` supporting:
- Customer search by name, CPF, or CNPJ.
- PF (Física) vs PJ (Jurídica) toggle in form.
- Full address form: CEP, Endereço, Número, Bairro, Cidade, Estado.

- [ ] **Step 2: Add test file `CustomersList.test.tsx`**

- [ ] **Step 3: Wire `/customers` route in `App.tsx` and link in `Layout.tsx`**

- [ ] **Step 4: Run tests and build**

Run: `npm test` and `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/
git commit -m "feat: add enhanced customers management module"
```

---

### Task 4: Complete Service Order Items & Financial Totals in `ServiceOrderDetail.tsx`

**Files:**
- Modify: `src/components/ServiceOrderDetail.tsx`
- Modify: `src/__tests__/service-order-workflow.test.tsx`

**Interfaces:**
- Produces: Add item modal with product picker or manual entry.
- Produces: Total calculation (Serviços R$, Peças R$, Desconto R$, Total R$).
- Produces: `Defeito Encontrado` editing in `Resumo` tab.

- [ ] **Step 1: Enhance `ServiceOrderDetail.tsx`**

Update `ServiceOrderDetail.tsx`:
1. Total financial summary banner: Peças, Serviços, Desconto, Total Geral.
2. `Itens` tab:
   - Button "Adicionar Item" opening modal/form with Product select or custom description.
   - Insert into `service_order_items`.
   - Automatic recalculation of `labor_total`, `parts_total`, `total_amount` on OS record.
   - Item removal button.
3. `Resumo` tab:
   - Editable `Defeito Encontrado` textarea.

- [ ] **Step 2: Run tests and build**

Run: `npm test` and `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

Run:
```bash
git add src/
git commit -m "feat: add OS financial totals, product picker, and found defect fields"
```
