# Automec SaaS UX & Bug Resolutions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all reported database and query bugs (check-in unique constraint, OS item addition, Kanban white screen), redesign vehicle check-in with visual sections and photos, and implement full team member onboarding.

**Architecture:** React 18 + TypeScript + Supabase client-side RLS integration.

**Tech Stack:** React, TypeScript, Supabase JS, Lucide React, Vitest.

## Global Constraints

- High-contrast light theme design only.
- Strict tenant isolation using `.eq('tenant_id', activeTenant.tenantId)` on every database query.
- Pass tests (`npm test`) and build cleanly (`npm run build`) on every task.

---

### Task 1: Fix Checkin Unique Constraint Violation & Safe Initialization

**Files:**
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/CheckinPanel.tsx`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/checkin.test.ts`

**Interfaces:**
- `CheckinPanel({ activeTenant, serviceOrderId, mode })`

- [ ] **Step 1: Write test for safe checkin lookup and creation**

Ensure `loadCheckin` handles concurrent calls gracefully using `maybeSingle` and fallback gracefully without throwing unique constraint errors.

- [ ] **Step 2: Implement safe checkin initialization in `CheckinPanel.tsx`**

Replace raw `.insert()` with `.select().maybeSingle()` check and safe fallback logic. Handle existing checkin gracefully.

- [ ] **Step 3: Run tests to verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/CheckinPanel.tsx src/__tests__/checkin.test.ts
git commit -m "fix: resolve checkin unique constraint violation on load"
```

---

### Task 2: Fix Kanban Board Query Errors & Fallback Render

**Files:**
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/KanbanBoard.tsx`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/KanbanBoard.test.tsx`

**Interfaces:**
- `KanbanBoard({ activeTenant })`

- [ ] **Step 1: Fix query in `KanbanBoard.tsx`**

Remove non-existent columns (`display_name`, `mechanic_id`, `mechanic_name`).
Query `assigned_to` from `service_orders` and join `tenant_members` properly using valid columns (`user_id, role`).

- [ ] **Step 2: Add robust error boundary and empty state**

Ensure that if an error occurs during fetch, a clear error message is displayed instead of a blank screen.

- [ ] **Step 3: Run test to verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/KanbanBoard.tsx src/__tests__/KanbanBoard.test.tsx
git commit -m "fix: resolve invalid query columns and white screen bug in kanban board"
```

---

### Task 3: Fix Service Order Item Addition & Error Messaging

**Files:**
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/ServiceOrderDetail.tsx`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/service-order-workflow.test.tsx`

**Interfaces:**
- `ServiceOrderDetail({ activeTenant })`

- [ ] **Step 1: Fix item addition logic in `ServiceOrderDetail.tsx`**

Format `product_id` as UUID or `null`. Display exact Supabase error message if insert fails. Recalculate and update order totals.

- [ ] **Step 2: Run tests to verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ServiceOrderDetail.tsx src/__tests__/service-order-workflow.test.tsx
git commit -m "fix: resolve OS item addition error handling and totals recalculation"
```

---

### Task 4: Complete Vehicle Check-in Redesign (Grid, Badges & Photo Upload)

**Files:**
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/CheckinPanel.tsx`
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/styles.css`

- [ ] **Step 1: Redesign `CheckinPanel.tsx` into 8 structured vehicle inspection sections**

Implement section cards (Frente, Traseira, Lateral Esquerda, Lateral Direita, Interior, Painel/Odômetro, Avarias, Objetos), status badges (OK, Atenção, Danificado, N/A), notes inputs, and photo dropzone per section.

- [ ] **Step 2: Add styles in `src/styles.css`**

Add CSS rules for inspection cards, badge selectors, photo grid, and zoom modal.

- [ ] **Step 3: Run tests & build to verify**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/CheckinPanel.tsx src/styles.css
git commit -m "feat: redesign vehicle checkin with structured inspection grid and photos"
```

---

### Task 5: Implement Team Member Onboarding & Management Modal

**Files:**
- Modify: `c:/Users/Glaucio/Documents/SaaS/automec/src/components/TeamMembers.tsx`
- Test: `c:/Users/Glaucio/Documents/SaaS/automec/src/__tests__/team.test.tsx`

- [ ] **Step 1: Create test `src/__tests__/team.test.tsx`**

Verify `TeamMembers` component renders team list and add member action.

- [ ] **Step 2: Add "Novo Membro" modal and edit action to `TeamMembers.tsx`**

Fields: User ID / Email, Role (`owner`, `admin`, `technician`), Commission % (`commission_pct`), Commission Type (`percentage`, `fixed`). Support adding and updating team members.

- [ ] **Step 3: Run tests to verify**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/TeamMembers.tsx src/__tests__/team.test.tsx
git commit -m "feat: add team member onboarding modal and commission settings"
```

---

### Task 6: Final Menu-by-Menu Audit & Build Verification

**Files:**
- Verify all components: `Dashboard.tsx`, `KanbanBoard.tsx`, `ServiceOrderList.tsx`, `ServiceOrderDetail.tsx`, `NewServiceOrder.tsx`, `ServiceSchedule.tsx`, `ProductsList.tsx`, `CustomerCRM.tsx`, `FinancialDRE.tsx`, `CommissionsPanel.tsx`, `TeamMembers.tsx`

- [ ] **Step 1: Run full test suite**

Run: `npm test`

- [ ] **Step 2: Run production build**

Run: `npm run build`

- [ ] **Step 3: Final Git commit**

```bash
git add .
git commit -m "chore: complete menu audit and full build verification"
```
