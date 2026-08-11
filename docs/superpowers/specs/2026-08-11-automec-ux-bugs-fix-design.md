# Specification & Design Document: Automec SaaS UX & Bug Resolutions

**Date:** 2026-08-11
**Topic:** Bug resolution, vehicle checkin redesign, team management, and menu-by-menu UX polish.

---

## 1. Objectives

- Eliminate all runtime crashes, database constraint violations, and query errors.
- Transform the vehicle check-in workflow into an industry-grade, visual inspection module with photos.
- Implement team member onboarding and management with role assignment and commission configuration.
- Audit every menu in the sidebar to ensure zero white/blank screens, high contrast light mode design, and responsive widescreen layouts.

---

## 2. Bug Resolutions & Root Causes

### 2.1 Check-in Unique Constraint Violation
- **Issue:** `duplicate key value violates unique constraint "checkins_tenant_service_order_idx"`
- **Fix:** In `src/components/CheckinPanel.tsx`, switch from raw `.insert()` to `upsert` or atomic `maybeSingle()` + `select()` lookup before insert with `.onConflict('tenant_id, service_order_id')`. Ensure initial `checkin_items` are inserted safely.

### 2.2 Service Order Item Addition Failure
- **Issue:** "Falha ao adicionar item à OS."
- **Fix:** In `src/components/ServiceOrderDetail.tsx`:
  - Handle `product_id` correctly (pass `null` if not selected, UUID if selected).
  - Explicitly display Supabase error message if insert fails instead of hiding it.
  - Automatically recalculate order totals (`labor_total`, `parts_total`, `total_amount`) and sync with state.

### 2.3 Kanban Blank Screen
- **Issue:** Kanban screen turns white or fails to render.
- **Fix:** In `src/components/KanbanBoard.tsx`:
  - Replace invalid queries (`display_name`, `mechanic_id`, `mechanic_name`) with valid schema attributes (`assigned_to`, `tenant_members`).
  - Wrap data loading in robust error handling with fallback states so the UI never crashes to a blank screen.

### 2.4 Team Member Addition
- **Issue:** Unable to add team members.
- **Fix:** In `src/components/TeamMembers.tsx`:
  - Add "Novo Membro da Equipe" modal with fields: User ID / Email, Role (`owner`, `admin`, `technician`), Commission % (`commission_pct`), and Commission Type (`percentage`, `fixed`).
  - Support editing member roles/commissions and removing members.

---

## 3. Redesigned Vehicle Check-in (`CheckinPanel.tsx`)

### Layout & Visual Structure
- Organized into 8 distinct vehicle sections:
  1. **Frente** (Parachoque, Faróis, Capô, Gruta)
  2. **Traseira** (Parachoque, Lanternas, Porta-malas)
  3. **Lateral Esquerda** (Portas, Paralamas, Retrovisor, Vidros)
  4. **Lateral Direita** (Portas, Paralamas, Retrovisor, Vidros)
  5. **Interior** (Bancos, Estofamento, Ar Condicionado, Som)
  6. **Painel / Odômetro** (Quilometragem, Luzes de Alerta, Nível de Combustível)
  7. **Avarias / Danos** (Arranhões, Amassados, Trincas)
  8. **Objetos & Documentos** (Estepes, Macaco, Chave de Roda, Documento do Veículo)

### Status Controls
- Interactive status selector for each item:
  - `OK` (Green badge)
  - `Atenção` (Yellow badge)
  - `Danificado` (Red badge)
  - `N/A` (Gray badge)
- Notes input per item for detailed observations.
- Auto-save on status/notes change.

### Photo Gallery & Storage Integration
- Photo upload dropzone per category.
- Instant storage in Supabase bucket `tenant-files` under `tenant/{tenantId}/checkins/{checkinId}/{photoId}.jpg`.
- Thumbnail grid with caption input, zoom preview modal, and delete action.

---

## 4. Menu-by-Menu Audit & UI Standards

| Menu Item | Path | Status / Target Polish |
|-----------|------|------------------------|
| **Dashboard** | `/` | KPIs (Faturamento, OSs Ativas, Peças Críticas, Agendamentos), Tabela de OSs recentes, Atalhos rápidos |
| **Kanban OS** | `/kanban` | 6 colunas por etapa (`Entrada`, `Diagnóstico`, `Aguard. Peça`, `Em Execução`, `Pronto`, `Entregue`), 1-click stage navigation, filtro por mecânico e período |
| **Ordens de Serviço** | `/orders` | Lista filtrável por código, cliente, placa e status, botão de Nova OS |
| **Nova OS** | `/orders/new` | Cadastro integrado de Cliente + Veículo com busca por CEP (ViaCEP) e máscaras (CPF/CNPJ, Tel, Placa) |
| **Detalhe da OS** | `/orders/:id` | Stepper de progresso, abas (Geral, Peças/Serviços, Check-in, Fotos, Financeiro), recibo impresso, link para Portal do Cliente |
| **Agenda** | `/schedule` | Visão semanal com contagem por dia, modal de novo agendamento |
| **Estoque & Peças** | `/products` | Lista de peças, filtro por estoque baixo, cadastro/edição com Custo, Venda e NCM |
| **Clientes & CRM** | `/customers` | Cadastro de clientes com CEP online, histórico de veículos, LTV, botão WhatsApp direto |
| **Financeiro & DRE** | `/financial` | DRE com resultado líquido, Fluxo de Caixa, Contas a Receber com baixa com 1 clique, exportação CSV |
| **Comissões** | `/commissions` | Ranking de produtividade por mecânico, comissões pendentes e pagas |
| **Equipe** | `/team` | Tabela de membros, modal de inclusão de novos técnicos/admins, configuração de comissão |

---

## 5. Verification Plan

- `npm test` — Ensure all Vitest tests pass without errors.
- `npm run build` — Validate TypeScript compilation and Vite bundle.
- Manual inspection of all 10 menu views to ensure flawless rendering and response.
