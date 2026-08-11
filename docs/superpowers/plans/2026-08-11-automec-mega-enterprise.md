# Automec SaaS — Plano Enterprise Completo
## Visão: Auto Repair Management SaaS (Comercial, Nível Produção)

### Objetivo
Transformar o Automec em um SaaS completo de gestão de oficinas mecânicas — com dashboard financeiro (DRE), Kanban de OS, agenda, PDV, portal do cliente sem senha, notificações WhatsApp automáticas, comissões de mecânicos, e banco de dados otimizado com índices para consultas críticas.

---

## Banco de Dados — Migration 006: Mega Schema Enterprise

**Arquivo:** `supabase/migrations/202608110006_enterprise_full_schema.sql`

Tabelas novas:
- `schedules` — Agendamentos de serviço com `customer_id`, `vehicle_id`, `scheduled_at`, `duration_min`, `service_description`, `status`
- `purchase_orders` + `purchase_order_items` — Pedidos de compra com status de aprovação
- `commissions` — Comissões calculadas por OS por mecânico
- `cash_transactions` — Fluxo de caixa (entrada/saída)
- `service_order_approvals` — Link de aprovação online por cliente (token único)
- `service_order_tracking_tokens` — Link de rastreio público por OS

Colunas adicionadas:
- `service_orders.assigned_to` (UUID → mechanic user)
- `service_orders.approved_at`, `approved_by` — quando cliente aprovou orçamento online
- `customers.birth_date`, `customers.send_reminder_days` — para CRM de lembretes
- `tenant_members.commission_pct`, `tenant_members.commission_type`
- `products.ncm`, `products.barcode`, `products.supplier_id`

Índices críticos adicionados (análise de queries frequentes):
- `service_orders(tenant_id, status, entry_at DESC)` — Lista de OS ativas (query principal do dia-a-dia)
- `service_orders(tenant_id, assigned_to)` — OS por mecânico (kanban/comissão)
- `service_orders(tenant_id, customer_id)` — Histórico por cliente
- `service_orders(tenant_id, created_at DESC)` — DRE por período
- `payments(tenant_id, due_date, status)` — Contas a receber vencidas
- `products(tenant_id, kind, stock_current)` — Estoque crítico
- `schedules(tenant_id, scheduled_at)` — Agenda diária
- `customers(tenant_id, phone)` — Busca por telefone (CRM)
- `commissions(tenant_id, user_id, created_at)` — Relatório de comissão por mecânico

---

## Módulos a Implementar

### Task 1: Migration 006 + DB Push + Types
- [ ] Criar `202608110006_enterprise_full_schema.sql`
- [ ] Atualizar `src/types/database.ts`
- [ ] Executar `npx supabase db push`
- [ ] Teste + commit

### Task 2: Kanban de OS (`KanbanBoard.tsx`)
- [ ] Visão em colunas arrastáveis por status/etapa
- [ ] Cards com: Nº OS, placa, cliente, prioridade, valor total, mecânico
- [ ] Drag-and-drop entre etapas atualizando stage no Supabase
- [ ] Filtros por mecânico e data
- [ ] Rota `/kanban`
- [ ] Teste + commit

### Task 3: Agenda de Serviços (`ServiceSchedule.tsx`)
- [ ] Calendário semanal com slots de horário
- [ ] Modal de agendamento com busca de cliente/veículo
- [ ] Converter agendamento em OS com 1 clique
- [ ] Rota `/schedule`
- [ ] Teste + commit

### Task 4: DRE em Tempo Real + Fluxo de Caixa (`FinancialDRE.tsx`)
- [ ] DRE: Receita Bruta (OSs fechadas no período), (-) Custo de Peças, (-) Comissões, = Lucro Líquido Estimado
- [ ] Fluxo de Caixa: gráfico de barras entradas vs saídas por semana
- [ ] Filtro por período (mês atual, trimestre, ano)
- [ ] Exportação de relatório em CSV
- [ ] Atualizar `FinancialPanel.tsx` → tabs: "Contas a Receber" | "DRE" | "Fluxo de Caixa"
- [ ] Teste + commit

### Task 5: Portal do Cliente sem Senha (`CustomerPortal.tsx`)
- [ ] Rota pública `/portal/:token` — sem autenticação
- [ ] Exibe: status da OS, etapa atual, descrição dos serviços, fotos do check-in
- [ ] Seção de aprovação de orçamento: item por item (aprovar/recusar cada peça/serviço)
- [ ] Ao aprovar, registra `service_order_approvals` com timestamp
- [ ] WhatsApp share button para o cliente compartilhar com terceiros
- [ ] Geração do token ao abrir a OS (função Supabase RPC)
- [ ] Botão na OS para "Enviar Link ao Cliente" via WhatsApp direto
- [ ] Teste + commit

### Task 6: Comissões de Mecânicos (`CommissionsPanel.tsx`)
- [ ] Configuração de % de comissão por mecânico no cadastro da equipe
- [ ] Cálculo automático ao fechar OS (valor_os * commission_pct)
- [ ] Listagem de comissões pendentes/pagas
- [ ] Relatório de produtividade: ranking de mecânicos por receita gerada
- [ ] Rota `/commissions`
- [ ] Teste + commit

### Task 7: Redesign do Dashboard Executivo (`Dashboard.tsx`)
- [ ] Cards de KPI com variação percentual mês anterior
- [ ] Gráfico de barras: OSs abertas vs fechadas por dia (últimos 30 dias)
- [ ] Kanban mini-preview: contagem por status
- [ ] Agenda de hoje: próximos agendamentos do dia
- [ ] Top 5 clientes por LTV
- [ ] Alertas integrados: estoque crítico, OSs atrasadas, comissões a pagar
- [ ] Teste + commit

### Task 8: Otimização de Índices de Banco (`202608110006_enterprise_full_schema.sql` inclui)
Análise de queries críticas:

**Query mais lenta potencial:** Listagem de OS ativas por tenant com filtros de status + order by entry_at
```sql
-- Já existe parcialmente, mas precisa cobrir todos os status + assigned_to
CREATE INDEX service_orders_tenant_status_entry_idx ON service_orders(tenant_id, status, entry_at DESC);
CREATE INDEX service_orders_tenant_assigned_idx ON service_orders(tenant_id, assigned_to);
CREATE INDEX service_orders_tenant_customer_idx ON service_orders(tenant_id, customer_id, entry_at DESC);
```

**Query de DRE/Financeiro:** Somar totais de OS fechadas por período
```sql
CREATE INDEX service_orders_tenant_completed_period_idx ON service_orders(tenant_id, status, exit_at DESC)
  WHERE status = 'completed';
```

**Query de CRM:** Busca de cliente por telefone/documento
```sql
CREATE INDEX customers_tenant_phone_idx ON customers(tenant_id, phone);
CREATE INDEX customers_tenant_document_idx ON customers(tenant_id, document);
```

**Query de Agenda:** Agendamentos do dia
```sql
CREATE INDEX schedules_tenant_date_idx ON schedules(tenant_id, scheduled_at);
```

---

## Verificação

Após todas as tasks:
- `npm test` — todos os testes passando
- `npm run build` — build TypeScript sem erros
- `npx supabase db push` — todas as migrations aplicadas
