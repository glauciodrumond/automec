# 🚗 AUTOOS — PRODUCT / TECHNICAL DISCOVERY REPORT

**Plataforma Inteligente de Gestão Automotiva**  
**Versão do Relatório:** 1.0  
**Data:** 11/08/2026  
**Status:** Concluído / Aguardando Validação  

---

## A. Estado Atual
O repositório (anteriormente intitulado *Automec*) possui uma base funcional bem estruturada para gestão básica de oficinas. Foi recentemente expandido com um schema enterprise Supabase (migração 006), módulo Kanban de OS, agenda semanal, DRE financeiro em tempo real, painel de comissões, portal do cliente sem senha e um check-in visual de veículos totalmente redesenhado. A base de código compila sem erros via `npm run build` e possui 13 arquivos de testes integrados (23 testes no Vitest) com 100% de aprovação.

---

## B. Stack Tecnológica
- **Frontend:** React 18.3.1 + TypeScript 5.5.0 + Vite 7.3.1
- **Roteamento:** React Router DOM v7
- **Estilização:** Vanilla CSS modular (`src/styles.css`) com suporte a temas claros de alto contraste, tipografia Inter & Outfit via Google Fonts e layouts responsivos em tela cheia.
- **Ícones:** Lucide React (`lucide-react`)
- **Backend & Banco de Dados:** Supabase (PostgreSQL 15+ remoto na instância `https://ovrcbzovnbetbshjcmed.supabase.co`)
- **Autenticação:** Supabase Auth (Email / Password + JWT)
- **Armazenamento de Arquivos:** Supabase Storage (Bucket `tenant-files`)
- **Testes:** Vitest 3.2.6 + React Testing Library + JSDOM
- **Hospedagem:** Vercel (com reescrita SPA configurada em `vercel.json`)

---

## C. Arquitetura Atual
- **Padrão:** Single Page Application (SPA) multi-tenant client-side com RLS server-side.
- **Tenant Context:** O contexto ativo do tenant é mantido no estado React via `ActiveTenantContext` (`tenantId`, `tenantName`, `userId`, `role`).
- **Comunicação de Dados:** Conexões diretas via `@supabase/supabase-js` protegidas por políticas RLS baseadas em Funções PostgreSQL (`is_tenant_member` e `has_tenant_role`).

---

## D. Banco de Dados & Schema
O banco remoto Supabase é composto por 6 migrações SQL aplicadas:
1. `202608110001_initial_schema.sql` — Tabelas base (`tenants`, `tenant_members`, `customers`, `vehicles`, `service_orders`, `service_order_items`, `checkins`, `checkin_items`, `checkin_photos`, `audit_events`).
2. `202608110002_create_service_order_rpc.sql` — RPC transacional para criação de OS com autoincremento de código atômico por tenant.
3. `202608110003_optimize_indexes.sql` — Índices cobrindo OS ativas e buscas por checkin.
4. `202608110004_full_features.sql` — Inclusão de tabela de `products` (estoque) e colunas financeiras na OS.
5. `202608110005_enterprise_features.sql` — Tabela de `payments` (contas a receber/pagar).
6. `202608110006_enterprise_full_schema.sql` — Tabelas `schedules`, `commissions`, `cash_transactions`, `service_order_tokens` e `service_order_approvals`, além de 12 índices de alta performance.

---

## E. Autenticação
- Implementada via `src/components/AuthGate.tsx`.
- Fluxo: Login / Cadastro com e-mail e senha. Na autenticação, busca os tenants do usuário em `tenant_members`. Se o usuário não possuir tenant, executa a RPC `create_tenant_with_owner` para criar um novo tenant e vinculá-lo como `owner`.

---

## F. Segurança & Multi-Tenancy
- **Camada de Isolamento:** Multi-tenant por coluna `tenant_id` em todas as tabelas comerciais.
- **Políticas RLS:** RLS ativado em 100% das tabelas. Consultas e mutações são validadas pelas funções SECURITY DEFINER `is_tenant_member(tenant_id)` e `has_tenant_role(tenant_id, roles)`.
- **Acesso Público Controlado:** O Portal do Cliente utiliza tokens UUID únicos com validade de 90 dias registrados na tabela `service_order_tokens` para permitir leitura e aprovação de orçamentos sem exigir login.

---

## G. Frontend
- Organizado na pasta `src/components/`:
  - `Dashboard.tsx`: Indicadores KPI, atalhos e lista recente.
  - `KanbanBoard.tsx`: Quadro Kanban com 6 colunas por etapa.
  - `ServiceOrderList.tsx` & `ServiceOrderDetail.tsx`: Consulta, edição, adição de itens, recibo impresso e link do cliente.
  - `NewServiceOrder.tsx`: Formulário com máscaras (CPF/CNPJ, Telefone, Placa) e ViaCEP.
  - `CheckinPanel.tsx`: Check-in visual por 8 seções do veículo e upload de fotos.
  - `ServiceSchedule.tsx`: Calendário semanal de agendamentos.
  - `ProductsList.tsx`: Catálogo de peças/serviços com alertas de estoque mínimo.
  - `CustomerCRM.tsx`: Cadastro de clientes, veículos e histórico.
  - `FinancialDRE.tsx`: DRE, Fluxo de Caixa e Contas a Receber.
  - `CommissionsPanel.tsx`: Ranking de produtividade e controle de comissões.
  - `TeamMembers.tsx`: Gestão de membros da equipe, papéis e comissões.

---

## H. Backend
- Sem servidor de aplicação Node.js isolado; a lógica de negócio e regras de integridade residem em RPCs PL/pgSQL no PostgreSQL do Supabase e nas regras de RLS.

---

## I. Integrações Atuais
1. **ViaCEP API:** Consulta online automática de CEP (`src/lib/cep.ts`).
2. **WhatsApp Web Direct:** Abertura de conversas com links pré-formatados para envio de orçamentos.

---

## J. Problemas Encontrados (Dívida Técnica)
1. **Ausência de Camada de Serviços Frontend:** As chamadas ao Supabase estão diretamente acopladas dentro dos componentes React (`useEffect` e manipuladores de eventos), dificultando reuso e testes unitários puros.
2. **Ausência de Apontamento Mobile do Mecânico:** Falta uma interface "Minhas Tarefas" otimizada para smartphones com timer play/pause de execução.
3. **Ausência de Reserva e Histórico de Estoque (Kardex):** A adição de peças em OS diminui o estoque mas não mantém histórico de movimentação (`inventory_movements`) nem suporta reserva de peças aprovadas.
4. **Sem abstração para WhatsApp API oficial / Provedores:** O envio atual é feito abrindo o `wa.me` via navegador.

---

## K. Riscos
- **Acoplamento Direct DB-UI:** Se a estrutura do Supabase mudar sem uma camada de abstração de serviço no frontend, vários componentes podem quebrar simultaneamente.
- **Limite de Rate Limit no Email do Supabase:** Cadastro de usuários diretamente no Supabase Auth pode atingir limite de envio de e-mails de confirmação caso não utilize provedor SMTP próprio.

---

## L. Oportunidades de Reaproveitamento (100% Aproveitável)
- O schema PostgreSQL/Supabase atual é extremadamente sólido e já possui as tabelas core para o MVP.
- Os utilitários de máscara (`masks.ts`), consulta de CEP (`cep.ts`) e o visual do `styles.css` atendem perfeitamente aos requisitos de UX do brief AUTOOS.
- O componente de Check-in por 8 setores e o Portal do Cliente sem senha já atendem aos requisitos avançados do PRD.

---

## M. Lacunas em Relação ao PRD Master (AUTOOS)

| Funcionalidade PRD | Estado No Repositório | Ação Necessária |
|-------------------|-----------------------|-----------------|
| **Passaporte Digital do Veículo** | Parcial (histórico por cliente) | Criar visão pública/interna de timeline completa por veículo (placa/chassi) |
| **Apontamento de Mecânico (Play/Pause)** | Não iniciado | Criar tela mobile `/mechanic` para tarefas com temporizador de execução |
| **Checklist Configurável** | Fixo por categorias padrão | Permitir criar checklists customizados por categoria de serviço |
| **Gestão de Kardex & Reserva** | Apenas `stock_current` | Criar tabela `inventory_movements` com entradas, saídas e reservas |
| **Copiloto de IA Assistivo** | Não iniciado | Implementar integração de IA para resumo de diagnósticos e copiloto administrativo |
| **Busca Universal Global** | Não iniciado | Criar atalho de busca rápida (Ctrl+K) por Cliente, Placa, OS e Peça |

---

## N. Proposta de Arquitetura Alvo

```
[ Frontend: React 18 + Vite (AUTOOS Design System) ]
         │
         ├── [ Domain Services Layer (src/services/) ]
         │         ├── customerService.ts
         │         ├── vehicleService.ts
         │         ├── workOrderService.ts
         │         ├── inventoryService.ts
         │         └── financialService.ts
         │
         ├── [ Messaging Layer (src/services/messaging/) ]
         │         └── whatsappProvider.ts (Interface de Abstração)
         │
         └── [ Persistence Layer: Supabase PostgreSQL + RLS ]
                   ├── Auth / RLS (is_tenant_member, has_tenant_role)
                   ├── RPCs (Transações atômicas de OS, Código, Estoque)
                   └── Storage (tenant-files bucket)
```

---

## O. Proposta de MVP Comercial (Escopo da Próxima Fase)

1. **Camada de Serviços & Refatoração de Domínio (`src/services/`)**
2. **Busca Universal Global (Ctrl + K)**
3. **Passaporte Digital do Veículo & Timeline Integrada**
4. **Painel do Mecânico Mobile-First (`/mechanic`) com Apontamento de Horas**
5. **Kardex de Estoque (`inventory_movements`) com Reserva Automática**
6. **Controle de Qualidade & Regras de Entrega**

---

## P. Dependências Necessárias
- Nenhuma dependência externa pesada necessária neste momento. Manter o app leve e rápido sem bibliotecas desnecessárias.

---

## Q. Perguntas que Precisam de Decisão do Produto

1. **Provedor WhatsApp:** Devemos manter a abertura transparente do `wa.me` (gratuito) para o MVP e adicionar suporte a API de parceiros (Z-API / Evolution API) como opcional?
2. **Apontamento de Mecânicos:** O mecânico deve registrar apontamento por item da OS ou pela OS como um todo?
3. **Identidade Visual:** Confirmar a adoção oficial do nome **AUTOOS** na interface em substituição a *Automec*.
