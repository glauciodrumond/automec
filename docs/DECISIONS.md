# AUTOOS — Registros de Decisões de Arquitetura & Produto (ADR)

---

## ADR-001: Rebranding Oficial para AUTOOS
- **Data:** 11/08/2026
- **Contexto:** Posicionamento como "O Sistema Operacional da Oficina" (AUTOOS).
- **Decisão:** Rebranding visual e conceitual na interface do sistema para **AUTOOS — Plataforma Inteligente de Gestão Automotiva**.
- **Impacto:** Atualização do logo, títulos, cabeçalho, sidebar e marca d'água no portal do cliente e impressos.

---

## ADR-002: Arquitetura Multi-Tenant com RLS no PostgreSQL / Supabase
- **Data:** 11/08/2026
- **Contexto:** Necessidade de isolamento completo e seguro entre oficinas (tenants).
- **Decisão:** Toda tabela comercial possui obrigatoriamente a coluna `tenant_id uuid references public.tenants(id)`. O isolamento é garantido em nível de banco através de Row Level Security (RLS) usando as funções customizadas `public.is_tenant_member(tenant_id)` e `public.has_tenant_role(tenant_id, allowed_roles)`.
- **Impacto:** Nenhuma query no frontend ou backend pode ignorar `tenant_id`. Segurança de dados garantida na camada de persistência.

---

## ADR-003: Apontamento de Horas por Item/Serviço da OS
- **Data:** 11/08/2026
- **Contexto:** Mensuração da produtividade e eficiência real do mecânico.
- **Decisão:** O temporizador (Play / Pause / Concluir) do mecânico é acionado **por item de serviço individual** da OS na interface mobile `/mechanic`.
- **Impacto:** Registro detalhado na nova tabela `work_task_timings` com hora inicial, final, pausas, duração em minutos e mecânico responsável.

---

## ADR-004: Estratégia de Mensageria WhatsApp (Camada de Abstração + WA.ME)
- **Data:** 11/08/2026
- **Contexto:** Envio de orçamentos, confirmações de agendamento e notificações via WhatsApp sem custos fixos iniciais.
- **Decisão:** Utilizar envio direto via `wa.me` no MVP, encapsulado em uma camada de abstração (`src/services/messaging/whatsappService.ts`) para permitir conexão com provedores automáticos no futuro.
- **Impacto:** Custos zerados no MVP e suporte a envio rápido com 1 clique pelo navegador.

---

## ADR-005: Estratégia de Desenvolvimento Incremental (TDD + Subagents)
- **Data:** 11/08/2026
- **Contexto:** Evitar overengineering, regressões e código instável em um SaaS de grande porte.
- **Decisão:** Adoção rigorosa de metodologias por planos de execução (`writing-plans`), validações via Vitest (`npm test`) e execução automatizada via subagentes (`subagent-driven-development`).
- **Impacto:** Zero entrega marcada como "pronta" sem testes passando e verificação empírica.
