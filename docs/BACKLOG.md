# AUTOOS — Product Backlog

---

## 🎯 ÉPICOS E USERS STORIES (MVP)

### EP-01: Foundation & RBAC
- **US-01.1:** Como proprietário, quero criar uma conta para minha oficina e definir permissões granulares por cargo (Owner, Admin, Recepção, Mecânico, Estoquista, Financeiro).
- **US-01.2:** Como sistema, devo auditar todas as ações críticas (mudança de preço, desconto, exclusão, cancelamento) na tabela `audit_events`.

### EP-02: Gestão de Clientes & Veículos (Passaporte Digital)
- **US-02.1:** Como recepcionista, quero cadastrar clientes com máscaras automáticas (CPF/CNPJ, Telefone, CEP com auto-fill ViaCEP).
- **US-02.2:** Como recepcionista, quero vincular múltiplos veículos a um cliente e visualizar a linha do tempo completa (Passaporte Digital) de todas as manutenções, peças e fotos do veículo.

### EP-03: Recepção, Agendamento & Check-in Visual
- **US-03.1:** Como recepcionista, quero agendar atendimentos em um calendário intuitivo por data/hora e mecânico responsável.
- **US-03.2:** Como recepcionista/mecânico, quero realizar o check-in do veículo por seções (Frente, Traseira, Laterais, Painel, Avarias, Objetos), registrando quilometragem, nível de combustível, checklist e anexando fotos.

### EP-04: Orçamentos, Aprovação Online & OS Kanban
- **US-04.1:** Como recepcionista, quero criar orçamentos com peças e serviços, calculando totais e gerando um link único para envio ao cliente pelo WhatsApp.
- **US-04.2:** Como cliente, quero acessar meu orçamento pelo navegador (sem senha) e aprovar ou recusar itens individualmente.
- **US-04.3:** Como gerente, quero visualizar e mover Ordens de Serviço em um Kanban operacional de 6 etapas (`Entrada`, `Diagnóstico`, `Aguard. Peça`, `Em Execução`, `Pronto`, `Entregue`).

### EP-05: Apontamento & Experiência do Mecânico
- **US-05.1:** Como mecânico, quero acessar a tela "Minhas Tarefas" mobile-first para dar play/pause nas minhas atividades e registrar o tempo trabalhado.

### EP-06: Estoque, Reservas & Kardex
- **US-06.1:** Como estoquista, quero cadastrar produtos com SKU, NCM, código de barras, estoque mínimo e preço de custo/venda.
- **US-06.2:** Como sistema, quero reservar peças automaticamente assim que uma OS for aprovada e dar baixa no estoque no faturamento.

### EP-07: Financeiro (DRE, DFC & Comissões)
- **US-07.1:** Como proprietário, quero visualizar o DRE em tempo real com receita bruta, custo de peças, despesas e lucro líquido.
- **US-07.2:** Como gerente, quero calcular automaticamente as comissões dos mecânicos por OS fechada e efetuar os lançamentos em contas a pagar.
