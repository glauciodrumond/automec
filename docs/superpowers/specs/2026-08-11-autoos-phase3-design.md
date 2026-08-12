# Specification & Design Document: AUTOOS Phase 3 — Workshop Elevators/Boxes & Custom Checklists

**Date:** 2026-08-11  
**Topic:** Elevators/Workstations Management, Visual Box Allocation, and Custom Inspection Checklists by Service Category.

---

## 1. Executive Summary

Phase 3 enhances physical workshop operations. It provides real-time allocation of physical elevators, pits, and work bays (Workstations), links active Service Orders to assigned elevators, and introduces custom checklist definitions tailored by service type (e.g. Brakes, Air Conditioning, General Overhaul).

---

## 2. Database Extensions (Migration `202608110009_autoos_phase3.sql`)

### 2.1 Workstations Table (`public.work_stations`)
Tracks physical workshop assets:
- `id` (uuid, PK)
- `tenant_id` (uuid, FK tenants)
- `name` (text, e.g. "Elevador 1 - Alinhamento")
- `kind` (text: 'elevator', 'box', 'pit')
- `status` (text: 'available', 'occupied', 'maintenance')
- `current_service_order_id` (uuid, FK service_orders, nullable)
- `created_at` (timestamptz)

### 2.2 Column Addition to `service_orders`
- `work_station_id` (uuid, FK work_stations, nullable)

### 2.3 Custom Checklists Table (`public.custom_checklists`)
- `id` (uuid, PK)
- `tenant_id` (uuid, FK tenants)
- `category_name` (text)
- `item_label` (text)
- `sort_order` (integer, default 0)
- `created_at` (timestamptz)

---

## 3. Domain Service Methods (`src/services/autoosService.ts`)

- `getWorkstations(tenantId: string)`: Fetches list of elevators/boxes with active OS details.
- `assignOrderToWorkstation(tenantId: string, serviceOrderId: string, workstationId: string)`: Binds OS to elevator and marks elevator as occupied.
- `releaseWorkstation(tenantId: string, workstationId: string)`: Frees elevator and marks as available.
- `getCustomChecklists(tenantId: string)`: Fetches custom checklist items for tenant.

---

## 4. Components

### 4.1 Painel de Elevadores & Boxes (`src/components/WorkStationPanel.tsx`)
- Visual grid of workshop elevators/boxes with real-time status (Available, Occupied with OS/Plate, Under Maintenance).
- Quick assignment selector.

### 4.2 Configuração de Checklists (`src/components/ChecklistConfig.tsx`)
- Management screen for adding/removing custom inspection items per service category.

---

## 5. Verification Plan

- `npm test`: Assert workstations and custom checklist schema tests.
- `npm run build`: Validate production build.
- `npx supabase db push`: Synchronize DB schema.
