# Automec Full Features Design Spec

## Summary

Expand Automec SaaS from basic MVP to complete workshop ERP based on market legacy software patterns (Quipos Help ERP).
Add complete inventory/products management (`products`), full customer profile fields (PF/PJ, CEP, address, state registration), service order financial breakdown (products vs labor totals, discounts, found defects), and product picker for service order items.

## Database Extensions

### 1. `products`
Stores inventory items, services, and labor rates.
Fields:
- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid not null references tenants(id) on delete cascade`
- `code bigint not null`
- `name text not null`
- `group_name text null`
- `kind text not null check (kind in ('part', 'labor', 'service')) default 'part'`
- `unit text not null default 'UN'`
- `cost_price numeric(12,2) not null default 0`
- `sell_price numeric(12,2) not null default 0`
- `stock_current numeric(12,2) not null default 0`
- `stock_min numeric(12,2) not null default 0`
- `ncm text null`
- `active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Unique constraint: `(tenant_id, code)`

### 2. `customers` Extensions
Add columns:
- `fantasy_name text null`
- `person_type text not null default 'physical' check (person_type in ('physical', 'legal'))`
- `cep text null`
- `number text null`
- `complement text null`
- `neighborhood text null`
- `city text null`
- `state text null`
- `ie text null`

### 3. `service_orders` Extensions
Add columns:
- `order_type text not null default 'normal' check (order_type in ('normal', 'warranty', 'budget'))`
- `found_defect text null`
- `discount_amount numeric(12,2) not null default 0`
- `labor_total numeric(12,2) not null default 0`
- `parts_total numeric(12,2) not null default 0`
- `total_amount numeric(12,2) not null default 0`

### 4. `service_order_items` Extensions
Add column:
- `product_id uuid null references products(id) on delete set null`

## UI Modules

1. **Produtos / Estoque (`/products`)**:
   - Products list with search, filter by kind, stock warning badges.
   - New/Edit Product form (code, name, group, cost, sell price, stock min/current, unit, NCM).

2. **Clientes Expandido (`/customers`)**:
   - Customers list with search by name/CPF/CNPJ.
   - Form with full PF/PJ toggle, CEP auto-fill, address details.

3. **Ordem de Serviço Completa (`/orders/:id`)**:
   - Header with totals banner (Peças, Serviços, Desconto, Total R$).
   - Tab `Resumo`: Complaint vs Found Defect (`Defeito Encontrado`).
   - Tab `Itens`: Interactive product picker + manual line items. Calculates line total and updates OS totals.

4. **Navigation Shell Update**:
   - Navigation links: `Ordens`, `Estoque`, `Clientes`, `Equipe`.
