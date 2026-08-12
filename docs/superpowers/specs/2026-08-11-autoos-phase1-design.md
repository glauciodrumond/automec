# Specification & Design Document: AUTOOS Phase 1 — Platform Foundation & Core Innovations

**Date:** 2026-08-11  
**Topic:** Rebranding, Domain Services, Universal Search (Ctrl+K), Passaporte Digital do Veículo, and Mechanic Mobile Task App (`/mechanic`).  

---

## 1. Executive Summary

Phase 1 establishes the operational core of **AUTOOS — Plataforma Inteligente de Gestão Automotiva**. This phase transitions the application from UI-centric queries to a decoupled domain service architecture, introduces global instant navigation (Universal Search), creates the Digital Vehicle Passport (maintenance timeline), launches the mobile-first mechanic task portal with item-level stopwatch pointing, and implements inventory Kardex tracking.

---

## 2. Database Extensions (Migration `202608110007_autoos_phase1.sql`)

### 2.1 Work Task Timings (`public.work_task_timings`)
Tracks item-level labor execution for mechanics:
- `id` (uuid, PK)
- `tenant_id` (uuid, FK tenants)
- `service_order_id` (uuid, FK service_orders)
- `service_order_item_id` (uuid, FK service_order_items)
- `mechanic_id` (uuid, FK auth.users)
- `status` (text: 'running', 'paused', 'completed')
- `started_at` (timestamptz)
- `paused_at` (timestamptz, nullable)
- `ended_at` (timestamptz, nullable)
- `duration_seconds` (integer, default 0)
- `created_at` (timestamptz)

### 2.2 Inventory Movements (`public.inventory_movements`)
Kardex ledger for stock auditing and reservations:
- `id` (uuid, PK)
- `tenant_id` (uuid, FK tenants)
- `product_id` (uuid, FK products)
- `service_order_id` (uuid, FK service_orders, nullable)
- `kind` (text: 'in', 'out', 'reserved', 'adjustment')
- `quantity` (numeric(12,2))
- `unit_cost` (numeric(12,2), nullable)
- `notes` (text, nullable)
- `created_at` (timestamptz)

### 2.3 RLS Policies & Indexes
- Mandatory `tenant_id` check via `public.is_tenant_member(tenant_id)`.
- Indexes on `work_task_timings(tenant_id, mechanic_id, status)` and `inventory_movements(tenant_id, product_id, created_at)`.

---

## 3. Domain Services Layer (`src/services/`)

Decouples Supabase calls from React components:
- `src/services/autoosService.ts`: Typed data access methods (`getCustomers`, `getVehicles`, `getServiceOrders`, `getInventory`, `getVehiclePassport`).
- `src/services/whatsappService.ts`: Formats structured messages (Quotes, OS Status, Appointment Confirmations) and opens `wa.me` links securely.

---

## 4. Feature Components & User Workflows

### 4.1 Universal Search (`src/components/UniversalSearch.tsx`)
- Triggered by `Ctrl + K` or search bar in header.
- Instant fuzzy search across Customers, Vehicles (Plates), Service Orders (Codes), and Parts.
- Keyboard accessible (`Up`, `Down`, `Enter`, `Esc`).

### 4.2 Passaporte Digital do Veículo (`src/components/VehiclePassport.tsx`)
- Timeline view by Plate / Vehicle ID.
- Displays chronological service history, replaced parts list, total investment, uploaded check-in photos, and next maintenance alert (calculated based on 180-day or 10,000km cycle).

### 4.3 Mechanic Mobile App (`src/components/MechanicPortal.tsx`)
- Accessible via `/mechanic` route (Mobile-first responsive layout).
- Displays assigned tasks for logged-in technician.
- Item-level stopwatch controls (▶️ Iniciar, ⏸️ Pausar, ✅ Concluir).
- Photo attachment & inspection notes per item.

### 4.4 AUTOOS Rebranding
- Visual branding update: Header, Sidebar, Login page, Printable receipts, and Customer Portal updated to **AUTOOS**.

---

## 5. Verification & Test Strategy

- `npm test`: Add tests for domain services, time-tracking logic, and component rendering.
- `npm run build`: Verify TypeScript compilation and production bundle.
- Migration push: Execute `npx supabase db push`.
