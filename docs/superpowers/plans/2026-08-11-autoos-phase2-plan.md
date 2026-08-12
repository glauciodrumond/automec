# AUTOOS Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement AUTOOS Phase 2 — Migration 008 (Quality Checks), Domain Service extensions for Kardex & Stock Reservation, Quality Control pre-delivery modal, and CRM Opportunities Panel with 1-click WhatsApp reactivation.

**Architecture:** React 18 + TypeScript + Supabase PL/pgSQL + RLS.

**Tech Stack:** React, TypeScript, Supabase JS, Lucide React, Vitest.

## Global Constraints

- Multi-tenant strict isolation via `tenant_id` on all queries.
- High-contrast light theme design.
- Pass test suite (`npm test`) and build cleanly (`npm run build`) on every task.

---

### Task 1: Migration 008 — Quality Checks Table & DB Types

**Files:**
- Create: `c:/Users/Glaucio/Documents/SaaS/automec/supabase/migrations/202608110008_autoos_phase2.sql`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/types/database.ts`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/autoos_phase2_schema.test.ts`

- [ ] **Step 1: Write Migration 008 SQL**

Create `quality_checks` table, unique index on `(tenant_id, service_order_id)`, and RLS policies.

- [ ] **Step 2: Push migration to Supabase**

Run: `npx -y supabase db push`

- [ ] **Step 3: Update `src/types/database.ts`**

Add TypeScript types: `QualityCheckRow`, `QualityCheckInsert`.

- [ ] **Step 4: Create schema test file and verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/202608110008_autoos_phase2.sql src/types/database.ts src/__tests__/autoos_phase2_schema.test.ts
git commit -m "feat: add migration 008 - quality checks table and RLS policies"
```

---

### Task 2: Domain Service Extensions for Kardex, Quality Control & CRM Opportunities

**Files:**
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/services/autoosService.ts`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/autoos_phase2_services.test.ts`

- [ ] **Step 1: Write failing test `src/__tests__/autoos_phase2_services.test.ts`**

Define assertions for `getProductKardex`, `reserveStockForApprovedOrder`, and `getCRMOpportunities`.

- [ ] **Step 2: Implement Kardex, Stock Reservation, Quality Control & CRM functions in `autoosService.ts`**

Implement `reserveStockForApprovedOrder`, `finalizeStockForCompletedOrder`, `getProductKardex`, `saveQualityCheck`, and `getCRMOpportunities`.

- [ ] **Step 3: Run test to verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/autoosService.ts src/__tests__/autoos_phase2_services.test.ts
git commit -m "feat: implement domain service methods for kardex, stock reservation, and quality checks"
```

---

### Task 3: Automated Stock Reservation & Kardex View in `ProductsList.tsx`

**Files:**
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/ProductsList.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/ServiceOrderDetail.tsx`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/kardex.test.tsx`

- [ ] **Step 1: Add Kardex tab to `ProductsList.tsx`**

Display stock movement history table (In, Out, Reserved, Adjustment) per product.

- [ ] **Step 2: Trigger stock reservation in `ServiceOrderDetail.tsx`**

Call `reserveStockForApprovedOrder` when OS status changes to approved or in execution.

- [ ] **Step 3: Run test to verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ProductsList.tsx src/components/ServiceOrderDetail.tsx src/__tests__/kardex.test.tsx
git commit -m "feat: add Kardex inventory view and automated stock reservation on OS approval"
```

---

### Task 4: Pre-Delivery Quality Control Modal (`QualityControlModal.tsx`)

**Files:**
- Create: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/QualityControlModal.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/KanbanBoard.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/ServiceOrderDetail.tsx`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/QualityControl.test.tsx`

- [ ] **Step 1: Create `QualityControlModal.tsx`**

5-point inspection checklist (Test Drive, Wheel Torque, Fluids, Dashboard Lights, Wash Clean) before permitting OS transition to `ready` or `delivered`.

- [ ] **Step 2: Connect Quality Control Modal in `KanbanBoard.tsx` & `ServiceOrderDetail.tsx`**

Intercept stage changes to `ready` / `delivered` and open Quality Control Modal.

- [ ] **Step 3: Run test to verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/QualityControlModal.tsx src/components/KanbanBoard.tsx src/components/ServiceOrderDetail.tsx src/__tests__/QualityControl.test.tsx
git commit -m "feat: add pre-delivery quality control inspection modal"
```

---

### Task 5: CRM Opportunities Panel (`CRMOportunidades.tsx`) & 1-Click Reactivation

**Files:**
- Create: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/CRMOportunidades.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/App.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/Layout.tsx`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/CRMOportunidades.test.tsx`

- [ ] **Step 1: Create `CRMOportunidades.tsx`**

Display revenue potential dashboard: Pending Quotes (R$), Inactive Clients (> 180 days, R$), Recommended Preventative Maintenance. 1-Click WhatsApp reactivation button.

- [ ] **Step 2: Register route in `App.tsx` and sidebar link in `Layout.tsx`**

Add `/crm-opportunities` route and "Oportunidades & CRM" nav link.

- [ ] **Step 3: Run test to verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/CRMOportunidades.tsx src/App.tsx src/components/Layout.tsx src/__tests__/CRMOportunidades.test.tsx
git commit -m "feat: add CRM Opportunities revenue dashboard with 1-click whatsapp reactivation"
```

---

### Task 6: Final Verification, Build & Push

**Files:**
- All modified components and services.

- [ ] **Step 1: Run full test suite**

Run: `npm test`

- [ ] **Step 2: Run production build**

Run: `npm run build`

- [ ] **Step 3: Commit & Push to GitHub**

```bash
git add .
git commit -m "feat: complete AUTOOS Phase 2 - kardex, stock reservation, quality control, and CRM opportunities"
git push origin main
```
