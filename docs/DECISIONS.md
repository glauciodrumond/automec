# AUTOOS — Registros de Decisões de Arquitetura & Produto (ADR)

---

## ADR-001: Adoção da Marca e Visão AUTOOS
- **Data:** 11/08/2026
- **Contexto:** Evolução do protótipo inicial (Automec) para uma plataforma SaaS comercial completa de Gestão Automotiva ("Sistema Operacional da Oficina").
- **Decisão:** Rebranding conceitual e arquitetural para **AUTOOS**, mantendo retrocompatibilidade com o banco de dados Supabase e migrando incrementalmente o sistema.
- **Impacto:** Foco em multi-tenancy estrito, UX de alta velocidade, automação de processos e copiloto assistivo por IA.

---

## ADR-002: Arquitetura Multi-Tenant com RLS no PostgreSQL / Supabase
- **Data:** 11/08/2026
- **Contexto:** Necessidade de isolamento completo e seguro entre oficinas (tenants).
- **Decisão:** Toda tabela comercial possui obrigatoriamente a coluna `tenant_id uuid references public.tenants(id)`. O isolamento é garantido em nível de banco através de Row Level Security (RLS) usando as funções customizadas `public.is_tenant_member(tenant_id)` e `public.has_tenant_role(tenant_id, allowed_roles)`.
- **Impacto:** Nenhuma query no frontend ou backend pode ignorar `tenant_id`. Segurança de dados garantida na camada de persistência.

---

## ADR-003: Estratégia de Desenvolvimento Incremental (TDD + Subagents)
- **Data:** 11/08/2026
- **Contexto:** Evitar overengineering, regressões e código instável em um SaaS de grande porte.
- **Decisão:** Adoção rigorosa de metodologias por planos de execução (`writing-plans`), validações via Vitest (`npm test`) e execução automatizada via subagentes (`subagent-driven-development`).
- **Impacto:** Zero entrega marcada como "pronta" sem testes passando e verificação empírica.
