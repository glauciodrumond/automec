# Check-in Photos & DB Index Optimization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement database index optimizations for critical queries, guided vehicle check-in checklist UI with photo upload to Supabase Storage, and check-in photo gallery integration into Service Order detail view.

**Architecture:** Add migration for database index optimizations. Create `CheckinPanel.tsx` component to handle check-in initialization (`checkins` + `checkin_items`), category checklist editing, image uploads to Supabase Storage bucket `checkin-photos`, and metadata persistence in `checkin_photos`. Wire component into `ServiceOrderDetail.tsx` tabs `Check-in` and `Fotos`.

**Tech Stack:** React 18, TypeScript, Supabase JS Client (`@supabase/supabase-js`), Lucide React icons, Vitest, Testing Library.

## Global Constraints

- Storage bucket: `checkin-photos`.
- Storage file path pattern: `tenant/{tenant_id}/checkins/{checkin_id}/{photo_id}`.
- Check-in items categories (10): `front`, `rear`, `left_side`, `right_side`, `interior`, `dashboard`, `odometer`, `damage`, `documents_objects`, `extra`.
- Every operational query must be tenant-scoped and RLS compliant.
- No dummy/fallback silent failure masks. All RPC calls and Storage uploads must handle and present explicit errors if failed.

---

### Task 1: Database Index Optimization Migration & Verification

**Files:**
- Create: `supabase/migrations/202608110003_optimize_indexes.sql`
- Modify: `supabase/tests/schema_indexes.sql`
- Test: `src/__tests__/schema_indexes.test.ts`

**Interfaces:**
- Produces: Optimized indexes for critical query patterns.
- Consumes: PostgreSQL schema from `202608110001_initial_schema.sql` and `202608110002_create_service_order_rpc.sql`.

- [ ] **Step 1: Create SQL migration for index optimizations**

Create `supabase/migrations/202608110003_optimize_indexes.sql`:

```sql
-- Optimize service orders partial index for active orders (open, in_progress, waiting_parts)
create index if not exists service_orders_tenant_active_entry_idx 
  on public.service_orders(tenant_id, entry_at desc) 
  where status in ('open', 'in_progress', 'waiting_parts');

-- Optimize checkin items lookup by checkin_id
create index if not exists checkin_items_checkin_sort_idx 
  on public.checkin_items(checkin_id, sort_order);

-- Optimize checkin photos lookup by checkin_id and category
create index if not exists checkin_photos_checkin_category_sort_idx 
  on public.checkin_photos(checkin_id, category, sort_order);

-- Remove redundant non-tenant prefixed indexes if replaced by composite covered indexes
drop index if exists public.checkin_items_tenant_checkin_sort_idx;
drop index if exists public.checkin_photos_tenant_checkin_category_sort_idx;
```

- [ ] **Step 2: Update SQL smoke tests**

Modify `supabase/tests/schema_indexes.sql` to test the new and updated indexes.

- [ ] **Step 3: Add schema test file**

Create `src/__tests__/schema_indexes.test.ts` to verify index migration file existence and structure.

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

describe('Database Index Migrations', () => {
  it('contains index optimization migration file', () => {
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
    const files = readdirSync(migrationsDir)
    const optMigration = files.find((f) => f.includes('optimize_indexes'))
    expect(optMigration).toBeDefined()

    const content = readFileSync(join(migrationsDir, optMigration!), 'utf-8')
    expect(content).toContain('service_orders_tenant_active_entry_idx')
    expect(content).toContain('checkin_items_checkin_sort_idx')
    expect(content).toContain('checkin_photos_checkin_category_sort_idx')
  })
})
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add supabase/migrations/202608110003_optimize_indexes.sql supabase/tests/schema_indexes.sql src/__tests__/schema_indexes.test.ts
git commit -m "perf: add database index optimizations migration"
```

---

### Task 2: Guided Check-In & Photo Upload Component (`CheckinPanel.tsx`)

**Files:**
- Create: `src/components/CheckinPanel.tsx`
- Create: `src/__tests__/CheckinPanel.test.tsx`

**Interfaces:**
- Consumes: `activeTenant: ActiveTenantContext`, `serviceOrderId: string`
- Consumes: `buildInitialCheckinItems`, `DEFAULT_CHECKIN_ITEMS` from `src/lib/checkin.ts`
- Consumes: `supabase` from `src/lib/supabase.ts`
- Produces: Guided check-in panel with 10 checklist categories, status pickers, notes, image upload to Supabase storage, and photo gallery per category and global.

- [ ] **Step 1: Write failing component tests**

Create `src/__tests__/CheckinPanel.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CheckinPanel } from '../components/CheckinPanel'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/photo.jpg' } })),
      })),
    },
  },
}))

describe('CheckinPanel', () => {
  it('renders check-in loading state then displays checklist categories', async () => {
    const activeTenant = { userId: 'user-1', tenantId: 'tenant-1', tenantName: 'Oficina Central', role: 'owner' as const }
    render(<CheckinPanel activeTenant={activeTenant} serviceOrderId="order-1" mode="checkin" />)

    expect(screen.getByText(/carregando check-in/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Frente')).toBeInTheDocument()
      expect(screen.getByText('Traseira')).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../components/CheckinPanel'"

- [ ] **Step 3: Implement `CheckinPanel.tsx`**

Create `src/components/CheckinPanel.tsx` supporting:
1. `mode`: `'checkin'` (checklist editor + photos) or `'photos'` (free photo gallery).
2. Automatic check-in initialization if none exists (`insert into checkins` + `insert into checkin_items`).
3. Loading items and photos for the check-in.
4. Item status change buttons (`ok`, `attention`, `damaged`, `not_applicable`) with immediate DB update.
5. Notes edit on blur/change with DB update.
6. File input for image uploads per category:
   - Upload file to Supabase Storage: bucket `'checkin-photos'`, path `tenant/${tenant_id}/checkins/${checkin_id}/${photo_id}.${ext}`.
   - Insert row into `checkin_photos` (`tenant_id`, `checkin_id`, `checkin_item_id`, `category`, `storage_path`, `content_type`, `size_bytes`, `uploaded_by`).
   - Reload photos state after upload.
7. Delete photo feature: removes row from `checkin_photos` and deletes file from storage bucket.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/CheckinPanel.tsx src/__tests__/CheckinPanel.test.tsx
git commit -m "feat: add guided checkin panel and photo upload component"
```

---

### Task 3: Wire Check-In & Photo Gallery into `ServiceOrderDetail.tsx`

**Files:**
- Modify: `src/components/ServiceOrderDetail.tsx`
- Modify: `src/__tests__/service-order-workflow.test.tsx`

**Interfaces:**
- Consumes: `CheckinPanel` from `src/components/CheckinPanel.tsx`
- Produces: Integrated Service Order Detail page with working `Check-in` and `Fotos` tabs.

- [ ] **Step 1: Modify `ServiceOrderDetail.tsx`**

Update `ServiceOrderDetail.tsx` to replace placeholder tab text with `<CheckinPanel activeTenant={activeTenant} serviceOrderId={order.id} mode="checkin" />` in tab `checkin` and `<CheckinPanel activeTenant={activeTenant} serviceOrderId={order.id} mode="photos" />` in tab `photos`.

- [ ] **Step 2: Update workflow test**

Modify `src/__tests__/service-order-workflow.test.tsx` to test tab switching to `Check-in` and `Fotos`.

- [ ] **Step 3: Run full test suite and build**

Run: `npm test` and `npm run build`
Expected: PASS and clean build output.

- [ ] **Step 4: Commit**

Run:
```bash
git add src/components/ServiceOrderDetail.tsx src/__tests__/service-order-workflow.test.tsx
git commit -m "feat: wire checkin panel and photo gallery into service order detail view"
```
