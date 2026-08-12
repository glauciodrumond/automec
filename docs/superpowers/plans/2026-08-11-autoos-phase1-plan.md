# AUTOOS Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement AUTOOS Phase 1 — Database extensions (task timings & kardex), Domain Services layer, Universal Search (Ctrl+K), Passaporte Digital do Veículo, Mechanic Mobile Task App (`/mechanic`), and AUTOOS Rebranding.

**Architecture:** React 18 + TypeScript + Supabase PL/pgSQL + RLS + Domain Services.

**Tech Stack:** React, TypeScript, Supabase JS, Lucide React, Vitest.

## Global Constraints

- Multi-tenant strict isolation via `tenant_id` on all queries.
- High-contrast light theme design.
- Pass test suite (`npm test`) and build cleanly (`npm run build`) on every task.

---

### Task 1: Migration 007 — Work Task Timings & Kardex Inventory Movements

**Files:**
- Create: `c:/Users/Glaucio/Documents/SaaS/automec/supabase/migrations/202608110007_autoos_phase1.sql`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/types/database.ts`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/autoos_phase1_schema.test.ts`

- [ ] **Step 1: Create Migration 007 SQL file**

Write SQL for `work_task_timings` and `inventory_movements` tables, RLS policies, and performance indexes.

- [ ] **Step 2: Push Migration to Supabase**

Run: `npx -y supabase db push`

- [ ] **Step 3: Update `src/types/database.ts`**

Add TypeScript interfaces: `WorkTaskTimingRow`, `WorkTaskTimingInsert`, `InventoryMovementRow`, `InventoryMovementInsert`.

- [ ] **Step 4: Create schema test file and verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/202608110007_autoos_phase1.sql src/types/database.ts src/__tests__/autoos_phase1_schema.test.ts
git commit -m "feat: add migration 007 - work task timings and inventory movements kardex"
```

---

### Task 2: Domain Services Layer (`autoosService.ts` & `whatsappService.ts`)

**Files:**
- Create: `c:/Users/Glaucio/Documents/SaaS/automec/src/services/autoosService.ts`
- Create: `c:/Users/Glaucio/Documents/SaaS/automec/src/services/whatsappService.ts`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/autoos_services.test.ts`

- [ ] **Step 1: Write failing test `src/__tests__/autoos_services.test.ts`**

Define assertions for `formatWhatsAppQuoteUrl` and `searchGlobalEntities`.

- [ ] **Step 2: Create `src/services/whatsappService.ts`**

Implement WhatsApp URL formatting functions for Quotes, OS Status, and Appointment Confirmations using `wa.me`.

- [ ] **Step 3: Create `src/services/autoosService.ts`**

Implement typed database wrapper functions for global search, vehicle passport history, work task timing updates, and inventory movements.

- [ ] **Step 4: Run test to verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/autoosService.ts src/services/whatsappService.ts src/__tests__/autoos_services.test.ts
git commit -m "feat: implement domain services layer and whatsapp abstraction"
```

---

### Task 3: Universal Search Component (Ctrl + K)

**Files:**
- Create: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/UniversalSearch.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/Layout.tsx`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/UniversalSearch.test.tsx`

- [ ] **Step 1: Create `UniversalSearch.tsx`**

Implement global search modal triggered by `Ctrl+K` or search button. Search across Customers, Vehicles, OS Codes, and Products.

- [ ] **Step 2: Integrate into `Layout.tsx`**

Add search trigger button in header and attach `Ctrl+K` keyboard event listener.

- [ ] **Step 3: Run test to verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/UniversalSearch.tsx src/components/Layout.tsx src/__tests__/UniversalSearch.test.tsx
git commit -m "feat: add universal search modal with Ctrl+K keyboard shortcut"
```

---

### Task 4: Passaporte Digital do Veículo & Timeline

**Files:**
- Create: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/VehiclePassport.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/App.tsx`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/VehiclePassport.test.tsx`

- [ ] **Step 1: Create `VehiclePassport.tsx`**

Build digital maintenance passport timeline by Vehicle Plate / ID. Display history, replaced parts, total invested, check-in photos, and next recommended maintenance.

- [ ] **Step 2: Add route to `App.tsx`**

Add route `/vehicles/:plate/passport` and link from CRM vehicle list.

- [ ] **Step 3: Run test to verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/VehiclePassport.tsx src/App.tsx src/__tests__/VehiclePassport.test.tsx
git commit -m "feat: add Passaporte Digital do Veiculo timeline view"
```

---

### Task 5: Mechanic Mobile App (`/mechanic`) & Item Stopwatch Pointing

**Files:**
- Create: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/MechanicPortal.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/App.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/Layout.tsx`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/MechanicPortal.test.tsx`

- [ ] **Step 1: Create `MechanicPortal.tsx`**

Build mobile-first task panel for mechanics. Display assigned OS items with live Stopwatch Timer (▶️ Iniciar / ⏸️ Pausar / ✅ Concluir) saving to `work_task_timings`.

- [ ] **Step 2: Register route in `App.tsx` and sidebar link in `Layout.tsx`**

Add route `/mechanic` and nav item "Painel do Mecânico".

- [ ] **Step 3: Run test to verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/MechanicPortal.tsx src/App.tsx src/components/Layout.tsx src/__tests__/MechanicPortal.test.tsx
git commit -m "feat: add mechanic mobile task portal with item-level stopwatch pointing"
```

---

### Task 6: AUTOOS Rebranding & Final Build & Test Verification

**Files:**
- Modify: `index.html`, `src/components/Layout.tsx`, `src/components/AuthGate.tsx`, `src/styles.css`

- [ ] **Step 1: Update branding to AUTOOS**

Update document title, brand logo, sidebar header, and CSS styles to **AUTOOS — Plataforma Inteligente de Gestão Automotiva**.

- [ ] **Step 2: Run full test suite**

Run: `npm test`

- [ ] **Step 3: Run production build**

Run: `npm run build`

- [ ] **Step 4: Final commit & push**

```bash
git add .
git commit -m "feat: complete AUTOOS Phase 1 branding, services, and core innovations"
git push origin main
```
