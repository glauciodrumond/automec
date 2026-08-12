# Specification & Design Document: AUTOOS Phase 2 — Advanced Inventory Kardex, Quality Control & CRM Opportunities

**Date:** 2026-08-11  
**Topic:** Automated Stock Reservation, Kardex Ledger, Pre-Delivery Quality Control, and CRM Revenue Opportunities.

---

## 1. Executive Summary

Phase 2 focuses on operational rigor, inventory accuracy, pre-delivery quality assurance, and revenue generation. It automates stock reservation upon OS approval, provides a transparent Kardex inventory ledger, enforces quality control checks before vehicle delivery, and introduces the CRM Opportunities Panel to reactivate inactive clients via WhatsApp.

---

## 2. Database Extensions (Migration `202608110008_autoos_phase2.sql`)

### 2.1 Quality Checks Table (`public.quality_checks`)
Enforces mandatory inspection before vehicle handover:
- `id` (uuid, PK)
- `tenant_id` (uuid, FK tenants)
- `service_order_id` (uuid, FK service_orders)
- `inspected_by` (uuid, FK auth.users)
- `test_drive_ok` (boolean, default true)
- `wheel_torque_ok` (boolean, default true)
- `fluids_checked` (boolean, default true)
- `dashboard_lights_clear` (boolean, default true)
- `wash_cleaned` (boolean, default true)
- `notes` (text, nullable)
- `created_at` (timestamptz)

### 2.2 RLS Policies & Indexes
- Strict `tenant_id` validation using `public.is_tenant_member(tenant_id)`.
- Unique constraint and index on `quality_checks(tenant_id, service_order_id)`.

---

## 3. Domain Service Enhancements (`src/services/autoosService.ts`)

- `reserveStockForApprovedOrder(tenantId: string, serviceOrderId: string)`: Inserts `inventory_movements` with `kind: 'reserved'` for all parts in the approved OS.
- `finalizeStockForCompletedOrder(tenantId: string, serviceOrderId: string)`: Converts reserved parts into `kind: 'out'` movements and updates `products.stock_current`.
- `getProductKardex(tenantId: string, productId: string)`: Fetches full movement ledger for a product.
- `saveQualityCheck(tenantId: string, qualityData)`: Inserts quality audit record and transitions OS stage to `ready`.
- `getCRMOpportunities(tenantId: string)`: Calculates pending quote amounts, inactive client revenue potential, and maintenance recommendations.

---

## 4. Components & Workflows

### 4.1 Automated Kardex Ledger in `ProductsList.tsx`
- Adds a "Histórico Kardex" tab to view all stock movements (In, Out, Reserved, Adjustment) per product with date, OS #, quantity, unit cost, and notes.

### 4.2 Quality Control Modal (`src/components/QualityControlModal.tsx`)
- Triggered when moving OS stage to `ready` or `delivered`.
- Enforces 5-point inspection checklist before allowing delivery.

### 4.3 Painel de Oportunidades & CRM (`src/components/CRMOportunidades.tsx`)
- Displays:
  - Orçamentos Pendentes (R$ Total)
  - Clientes Inativos (> 180 dias, R$ Potencial)
  - Manutenções Preventivas Recomendadas
- 1-Click WhatsApp Reactivation link generation.

---

## 5. Verification Strategy

- `npm test`: Add tests for stock reservation, Kardex ledger, quality checks, and CRM opportunities.
- `npm run build`: Validate TypeScript build.
- `npx supabase db push`: Synchronize DB schema.
