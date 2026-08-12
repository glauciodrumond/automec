# AUTOOS Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement AUTOOS Phase 3 — Migration 009 (Workstations & Custom Checklists), Domain Service methods, Elevators/Boxes visual allocation panel (`WorkStationPanel.tsx`), and Custom Checklist configuration screen (`ChecklistConfig.tsx`).

**Architecture:** React 18 + TypeScript + Supabase PL/pgSQL + RLS.

**Tech Stack:** React, TypeScript, Supabase JS, Lucide React, Vitest.

## Global Constraints

- Multi-tenant strict isolation via `tenant_id` on all queries.
- High-contrast light theme design.
- Pass test suite (`npm test`) and build cleanly (`npm run build`) on every task.

---

### Task 1: Migration 009 — Workstations & Custom Checklists Schema

**Files:**
- Create: `c:/Users/Glaucio/Documents/SaaS/automec/supabase/migrations/202608110009_autoos_phase3.sql`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/types/database.ts`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/autoos_phase3_schema.test.ts`

- [ ] **Step 1: Write Migration 009 SQL**

Create `work_stations` and `custom_checklists` tables, add `work_station_id` to `service_orders`, add RLS policies and performance indexes.

- [ ] **Step 2: Push migration to Supabase**

Run: `npx -y supabase db push`

- [ ] **Step 3: Update `src/types/database.ts`**

Add TypeScript types: `WorkStationRow`, `WorkStationInsert`, `CustomChecklistRow`, `CustomChecklistInsert`.

- [ ] **Step 4: Create schema test file and verify**

Run: `npm test`
Expected: PASS

---

### Task 2: Domain Service Methods for Workstations & Custom Checklists

**Files:**
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/services/autoosService.ts`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/autoos_phase3_services.test.ts`

- [ ] **Step 1: Write failing test `src/__tests__/autoos_phase3_services.test.ts`**

Assert `getWorkstations` and `assignOrderToWorkstation`.

- [ ] **Step 2: Implement workstation and custom checklist methods in `autoosService.ts`**

Implement `getWorkstations`, `assignOrderToWorkstation`, `releaseWorkstation`, `getCustomChecklists`.

- [ ] **Step 3: Run test to verify**

Run: `npm test`
Expected: PASS

---

### Task 3: Painel de Elevadores & Boxes (`WorkStationPanel.tsx`)

**Files:**
- Create: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/WorkStationPanel.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/App.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/Layout.tsx`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/WorkStationPanel.test.tsx`

- [ ] **Step 1: Create `WorkStationPanel.tsx`**

Visual card grid of workshop elevators/boxes with real-time status (Available, Occupied with OS/Plate, Under Maintenance). Assignment dropdown.

- [ ] **Step 2: Add route in `App.tsx` and link in `Layout.tsx`**

Add `/workstations` route and "Elevadores & Boxes" nav link.

- [ ] **Step 3: Run test to verify**

Run: `npm test`
Expected: PASS

---

### Task 4: Configuração de Checklists Personalizados (`ChecklistConfig.tsx`)

**Files:**
- Create: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/ChecklistConfig.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/App.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/Layout.tsx`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/ChecklistConfig.test.tsx`

- [ ] **Step 1: Create `ChecklistConfig.tsx`**

Management screen for adding/deleting custom inspection checklist items per service category.

- [ ] **Step 2: Add route in `App.tsx` and link in `Layout.tsx`**

Add `/checklist-config` route and "Checklists" nav link.

- [ ] **Step 3: Run test to verify**

Run: `npm test`
Expected: PASS

---

### Task 5: Final Build & Test Suite Verification

- [ ] **Step 1: Run full test suite**

Run: `npm test`

- [ ] **Step 2: Run production build**

Run: `npm run build`
