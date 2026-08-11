# Automec Enterprise ERP SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Automec into a top-tier mechanical workshop SaaS with modern full-screen sidebar layout, ViaCEP automatic address lookup, input masks (Phone, CPF/CNPJ, CEP, Plate), Executive Dashboard, Customer CRM & WhatsApp integration, Financials/Accounts Receivable, and Printable OS receipt layout.

**Architecture:** Create database migration `202608110005_enterprise_features.sql` with payments table and OS stage/payment fields. Build `masks.ts` and `cep.ts` helpers. Re-style UI to high-contrast modern light theme with full-bleed sidebar navigation. Build `Dashboard.tsx`, `CustomerCRM.tsx`, `FinancialPanel.tsx`, and `PrintableServiceOrder.tsx`.

**Tech Stack:** React 18, TypeScript, Supabase JS Client, Lucide React, Vitest, Testing Library.

## Global Constraints

- Modern Light Theme only (high contrast, slate/blue/emerald theme).
- Input masks on all phone, CPF/CNPJ, CEP, and vehicle plate inputs.
- ViaCEP API integration (`https://viacep.com.br/ws/{cep}/json/`) auto-populates address fields.
- 1-click WhatsApp messaging (`https://wa.me/...`).
- Every new database table and query must be tenant-scoped and covered by RLS.

---

### Task 1: Masks & ViaCEP Address Auto-Fill Helpers

**Files:**
- Create: `src/lib/masks.ts`
- Create: `src/lib/cep.ts`
- Test: `src/__tests__/masks_and_cep.test.ts`

**Interfaces:**
- Produces: `maskPhone(val: string): string`
- Produces: `maskCpfCnpj(val: string): string`
- Produces: `maskCep(val: string): string`
- Produces: `maskPlate(val: string): string`
- Produces: `fetchAddressByCep(cep: string): Promise<{ logradouro: string; bairro: string; localidade: string; uf: string } | null>`

- [ ] **Step 1: Write failing tests for masks and CEP**

Create `src/__tests__/masks_and_cep.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { maskPhone, maskCpfCnpj, maskCep, maskPlate } from '../lib/masks'

describe('Input Masks', () => {
  it('formats telephone correctly', () => {
    expect(maskPhone('31999998888')).toBe('(31) 99999-8888')
    expect(maskPhone('3138260476')).toBe('(31) 3826-0476')
  })

  it('formats CPF and CNPJ correctly', () => {
    expect(maskCpfCnpj('06281444663')).toBe('062.814.446-63')
    expect(maskCpfCnpj('12345678000195')).toBe('12.345.678/0001-95')
  })

  it('formats CEP correctly', () => {
    expect(maskCep('35164031')).toBe('35164-031')
  })

  it('formats Mercosul and classic plates', () => {
    expect(maskPlate('gxs1693')).toBe('GXS-1693')
    expect(maskPlate('abc1d23')).toBe('ABC1D23')
  })
})
```

- [ ] **Step 2: Implement `masks.ts` and `cep.ts`**

Create `src/lib/masks.ts` and `src/lib/cep.ts`.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

Run:
```bash
git add src/lib/masks.ts src/lib/cep.ts src/__tests__/masks_and_cep.test.ts
git commit -m "feat: add input masks and viacep address lookup helper"
```

---

### Task 2: Enterprise Database Migration & DB Push

**Files:**
- Create: `supabase/migrations/202608110005_enterprise_features.sql`
- Test: `src/__tests__/enterprise_schema.test.ts`
- Modify: `src/types/database.ts`

**Interfaces:**
- Produces: `payments` table + RLS policies
- Produces: OS columns `stage`, `payment_method`, `payment_status`

- [ ] **Step 1: Write SQL migration**

Create `supabase/migrations/202608110005_enterprise_features.sql`:

```sql
-- OS stage and payment tracking
alter table public.service_orders
  add column if not exists stage text not null default 'entry' check (stage in ('entry', 'diagnosis', 'waiting_parts', 'in_execution', 'ready', 'delivered')),
  add column if not exists payment_method text check (payment_method in ('pix', 'credit_card', 'debit_card', 'cash', 'ticket', 'billed')),
  add column if not exists payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'partial'));

-- Payments / Accounts Receivable table
create table public.payments (
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

create index payments_tenant_order_idx on public.payments(tenant_id, service_order_id);
create index payments_tenant_status_due_idx on public.payments(tenant_id, status, due_date);

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
```

- [ ] **Step 2: Update `database.ts` types**

- [ ] **Step 3: Run tests and push migration to remote Supabase**

Run:
```bash
npm test
npx -y supabase db push
```

- [ ] **Step 4: Commit**

Run:
```bash
git add supabase/migrations/202608110005_enterprise_features.sql src/types/database.ts src/__tests__/enterprise_schema.test.ts
git commit -m "feat: add enterprise payments schema and OS stages"
```

---

### Task 3: Full-Bleed Sidebar Navigation & High-Contrast Light Design System

**Files:**
- Modify: `src/components/Layout.tsx`
- Modify: `src/styles.css`
- Test: `src/__tests__/Layout.test.tsx`

**Interfaces:**
- Produces: Collapsible full-height sidebar with navigation icons (`Dashboard`, `Ordens`, `Estoque`, `Clientes & CRM`, `Financeiro`, `Equipe`).
- Produces: Google Fonts `Outfit` + `Inter` integration and widescreen container layout.

- [ ] **Step 1: Update `Layout.tsx`**

Implement sidebar navigation with active highlight, tenant switcher/header, user avatar & role badge, and full-screen content area.

- [ ] **Step 2: Redesign `styles.css`**

Add high-contrast light design tokens (`#0f172a` headers, `#2563eb` primary buttons, `#f8fafc` background, slate card borders, shadow elevations).

- [ ] **Step 3: Run build & tests**

Run: `npm test` and `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

Run:
```bash
git add src/components/Layout.tsx src/styles.css
git commit -m "feat: implement full-bleed sidebar navigation and modern light theme"
```

---

### Task 4: Executive Dashboard Component (`Dashboard.tsx`)

**Files:**
- Create: `src/components/Dashboard.tsx`
- Modify: `src/App.tsx`
- Test: `src/__tests__/Dashboard.test.tsx`

**Interfaces:**
- Produces: `/` Dashboard view with Faturamento Mês, OS Abertas, Ticket Médio, Peças vs Serviços breakdown, Recent OS table, and Stock Alerts.

- [ ] **Step 1: Implement `Dashboard.tsx`**

- [ ] **Step 2: Add test `Dashboard.test.tsx`**

- [ ] **Step 3: Update `App.tsx` routes**

- [ ] **Step 4: Run tests & build**

Run: `npm test` and `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/Dashboard.tsx src/App.tsx src/__tests__/Dashboard.test.tsx
git commit -m "feat: add executive dashboard module"
```

---

### Task 5: Customer CRM & WhatsApp Hub (`CustomerCRM.tsx`)

**Files:**
- Create: `src/components/CustomerCRM.tsx`
- Modify: `src/components/CustomersList.tsx`
- Modify: `src/App.tsx`
- Test: `src/__tests__/CustomerCRM.test.tsx`

**Interfaces:**
- Produces: `/crm` Customer relationship view with LTV, visit history, preventive maintenance alerts, and 1-click WhatsApp message triggers.
- Produces: Masked inputs (CPF/CNPJ, Phone, CEP) and ViaCEP auto-address fill in Customer forms.

- [ ] **Step 1: Integrate ViaCEP and Masks in `CustomersList.tsx`**

When user types 8 digits in CEP, call `fetchAddressByCep` and pre-fill Rua, Bairro, Cidade, Estado automatically.

- [ ] **Step 2: Implement `CustomerCRM.tsx`**

- [ ] **Step 3: Run tests & build**

Run: `npm test` and `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

Run:
```bash
git add src/components/CustomerCRM.tsx src/components/CustomersList.tsx src/App.tsx
git commit -m "feat: add customer CRM and viacep auto address lookup"
```

---

### Task 6: Financials & Accounts Receivable (`FinancialPanel.tsx`)

**Files:**
- Create: `src/components/FinancialPanel.tsx`
- Modify: `src/App.tsx`
- Test: `src/__tests__/FinancialPanel.test.tsx`

**Interfaces:**
- Produces: `/financial` Accounts Receivable view, cash flow summary, payment method breakdown, and Mark-as-Paid action.

- [ ] **Step 1: Implement `FinancialPanel.tsx`**

- [ ] **Step 2: Add test `FinancialPanel.test.tsx`**

- [ ] **Step 3: Wire route in `App.tsx`**

- [ ] **Step 4: Run tests & build**

Run: `npm test` and `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/FinancialPanel.tsx src/App.tsx
git commit -m "feat: add financial management and accounts receivable module"
```

---

### Task 7: Complete OS Stages & Printable OS Receipt (`PrintableServiceOrder.tsx`)

**Files:**
- Create: `src/components/PrintableServiceOrder.tsx`
- Modify: `src/components/ServiceOrderDetail.tsx`
- Modify: `src/components/NewServiceOrder.tsx`
- Test: `src/__tests__/PrintableServiceOrder.test.tsx`

**Interfaces:**
- Produces: Interactive Stage Stepper in OS Detail (`Entrada` → `Diagnóstico` → `Aguardando Peça` → `Em Execução` → `Pronto` → `Entregue`).
- Produces: Printable OS receipt view with workshop logo, customer info, vehicle data, items breakdown, check-in summary, and signature line.
- Produces: Masks on New Service Order inputs (Plate, Phone, CPF/CNPJ).

- [ ] **Step 1: Add input masks to `NewServiceOrder.tsx`**

- [ ] **Step 2: Implement `PrintableServiceOrder.tsx`**

- [ ] **Step 3: Enhance `ServiceOrderDetail.tsx` with Stage Stepper and Print Button**

- [ ] **Step 4: Run full test suite & production build**

Run: `npm test` and `npm run build`
Expected: PASS and clean build output.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/PrintableServiceOrder.tsx src/components/ServiceOrderDetail.tsx src/components/NewServiceOrder.tsx
git commit -m "feat: add OS stage workflow and printable receipt layout"
```
