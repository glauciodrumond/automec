import { TrendingUp, TrendingDown, BarChart2, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { Payment, ServiceOrder } from '../types/database'

interface CashTransaction {
  id: string
  tenant_id: string
  service_order_id: string | null
  payment_id: string | null
  kind: 'income' | 'expense'
  category: string
  description: string
  amount: number
  transaction_date: string
  notes: string | null
  created_at: string
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function getPeriodRange(period: string) {
  const now = new Date()
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
  }
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3)
    const start = new Date(now.getFullYear(), q * 3, 1)
    const end = new Date(now.getFullYear(), q * 3 + 3, 0)
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
  }
  // year
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear(), 11, 31)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

type DRETab = 'dre' | 'cashflow' | 'receivables'

export function FinancialDRE({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [tab, setTab] = useState<DRETab>('dre')
  const [period, setPeriod] = useState('month')
  const [completedOrders, setCompletedOrders] = useState<ServiceOrder[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    const { start, end } = getPeriodRange(period)

    const [{ data: ordData }, { data: payData }, { data: txData }] = await Promise.all([
      supabase
        .from('service_orders')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .eq('status', 'completed')
        .gte('exit_at', `${start}T00:00:00`)
        .lte('exit_at', `${end}T23:59:59`),
      supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .gte('due_date', start)
        .lte('due_date', end)
        .order('due_date', { ascending: true }),
      supabase
        .from('cash_transactions')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .gte('transaction_date', start)
        .lte('transaction_date', end)
        .order('transaction_date', { ascending: false }),
    ])

    setCompletedOrders((ordData as ServiceOrder[]) || [])
    setPayments((payData as Payment[]) || [])
    setTransactions((txData as CashTransaction[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [activeTenant.tenantId, period])

  // DRE calcs
  const grossRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const totalParts = completedOrders.reduce((sum, o) => sum + (o.parts_total || 0), 0)
  const totalLabor = completedOrders.reduce((sum, o) => sum + (o.labor_total || 0), 0)
  const totalDiscounts = completedOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0)
  const netRevenue = grossRevenue

  const expenses = transactions.filter((t) => t.kind === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const estimatedProfit = netRevenue - expenses

  // Cashflow
  const totalIncome = transactions.filter((t) => t.kind === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = expenses

  // Receivables
  const paidPayments = payments.filter((p) => p.status === 'paid')
  const pendingPayments = payments.filter((p) => p.status === 'pending')
  const overduePayments = payments.filter((p) => p.status === 'overdue')

  function exportCSV() {
    const rows = [
      ['Descrição', 'Tipo', 'Data', 'Valor'],
      ...transactions.map((t) => [t.description, t.kind === 'income' ? 'Entrada' : 'Saída', t.transaction_date, t.amount.toFixed(2)]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fluxo-caixa-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Gestão Financeira</p>
          <h1>Financeiro & DRE</h1>
        </div>
        <div className="header-actions">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ minHeight: 42, border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', background: '#fff', fontWeight: 600 }}
          >
            <option value="month">Mês Atual</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Ano Inteiro</option>
          </select>
          <button type="button" className="secondary-btn" onClick={exportCSV}>
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'dre'} className={tab === 'dre' ? 'tab-button active' : 'tab-button'} onClick={() => setTab('dre')}>
          DRE — Resultado
        </button>
        <button type="button" role="tab" aria-selected={tab === 'cashflow'} className={tab === 'cashflow' ? 'tab-button active' : 'tab-button'} onClick={() => setTab('cashflow')}>
          Fluxo de Caixa
        </button>
        <button type="button" role="tab" aria-selected={tab === 'receivables'} className={tab === 'receivables' ? 'tab-button active' : 'tab-button'} onClick={() => setTab('receivables')}>
          Contas a Receber
        </button>
      </div>

      {loading ? (
        <p className="status-message">Carregando dados financeiros...</p>
      ) : (
        <>
          {tab === 'dre' && (
            <div className="dre-layout">
              <div className="dre-statement">
                <h2>Demonstrativo de Resultado (DRE)</h2>

                <div className="dre-section">
                  <div className="dre-row header">
                    <span>RECEITAS</span>
                    <span>{completedOrders.length} OSs fechadas</span>
                  </div>
                  <div className="dre-row">
                    <span>Receita Bruta (OSs Concluídas)</span>
                    <strong className="positive">{formatCurrency(grossRevenue)}</strong>
                  </div>
                  <div className="dre-row indent">
                    <span>↳ Peças e Produtos</span>
                    <span>{formatCurrency(totalParts)}</span>
                  </div>
                  <div className="dre-row indent">
                    <span>↳ Mão de Obra e Serviços</span>
                    <span>{formatCurrency(totalLabor)}</span>
                  </div>
                  <div className="dre-row indent negative">
                    <span>(-) Descontos Concedidos</span>
                    <span>({formatCurrency(totalDiscounts)})</span>
                  </div>
                  <div className="dre-row subtotal">
                    <span>= Receita Líquida</span>
                    <strong>{formatCurrency(netRevenue)}</strong>
                  </div>
                </div>

                <div className="dre-section">
                  <div className="dre-row header">
                    <span>DESPESAS</span>
                    <span>{transactions.filter(t => t.kind === 'expense').length} lançamentos</span>
                  </div>
                  <div className="dre-row indent negative">
                    <span>(-) Despesas Operacionais</span>
                    <span>({formatCurrency(expenses)})</span>
                  </div>
                </div>

                <div className="dre-row grand-total">
                  <span>= LUCRO ESTIMADO DO PERÍODO</span>
                  <strong className={estimatedProfit >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(estimatedProfit)}
                  </strong>
                </div>
              </div>

              <div className="dre-metrics">
                <div className="metric-card success-accent">
                  <div className="metric-icon"><TrendingUp size={22} /></div>
                  <div className="metric-body">
                    <span>Receita Bruta</span>
                    <strong>{formatCurrency(grossRevenue)}</strong>
                  </div>
                </div>
                <div className="metric-card warning-accent">
                  <div className="metric-icon"><TrendingDown size={22} /></div>
                  <div className="metric-body">
                    <span>Despesas</span>
                    <strong>{formatCurrency(expenses)}</strong>
                  </div>
                </div>
                <div className={`metric-card ${estimatedProfit >= 0 ? 'success-accent' : 'primary-accent'}`}>
                  <div className="metric-icon"><BarChart2 size={22} /></div>
                  <div className="metric-body">
                    <span>Lucro Estimado</span>
                    <strong>{formatCurrency(estimatedProfit)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'cashflow' && (
            <div className="cashflow-layout">
              <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="metric-card success-accent">
                  <div className="metric-icon"><TrendingUp size={22} /></div>
                  <div className="metric-body">
                    <span>Total Entradas</span>
                    <strong>{formatCurrency(totalIncome)}</strong>
                  </div>
                </div>
                <div className="metric-card warning-accent">
                  <div className="metric-icon"><TrendingDown size={22} /></div>
                  <div className="metric-body">
                    <span>Total Saídas</span>
                    <strong>{formatCurrency(totalExpenses)}</strong>
                  </div>
                </div>
                <div className="metric-card info-accent">
                  <div className="metric-icon"><BarChart2 size={22} /></div>
                  <div className="metric-body">
                    <span>Saldo do Período</span>
                    <strong>{formatCurrency(totalIncome - totalExpenses)}</strong>
                  </div>
                </div>
              </div>

              {transactions.length === 0 ? (
                <p className="empty-state">Nenhum lançamento de caixa no período.</p>
              ) : (
                <div className="data-table">
                  <div className="data-row data-head" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
                    <span>Data</span>
                    <span>Descrição</span>
                    <span>Categoria</span>
                    <span>Tipo</span>
                    <span>Valor</span>
                  </div>
                  {transactions.map((t) => (
                    <div key={t.id} className="data-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
                      <span>{new Date(t.transaction_date).toLocaleDateString('pt-BR')}</span>
                      <span>{t.description}</span>
                      <span>{t.category}</span>
                      <span className={t.kind === 'income' ? 'positive-text' : 'negative-text'}>
                        {t.kind === 'income' ? '↑ Entrada' : '↓ Saída'}
                      </span>
                      <strong className={t.kind === 'income' ? 'positive-text' : 'negative-text'}>
                        {t.kind === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'receivables' && (
            <div className="receivables-layout">
              <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="metric-card success-accent">
                  <div className="metric-icon"><TrendingUp size={22} /></div>
                  <div className="metric-body">
                    <span>Total Pago</span>
                    <strong>{formatCurrency(paidPayments.reduce((s, p) => s + p.amount, 0))}</strong>
                    <small>{paidPayments.length} pagamento(s)</small>
                  </div>
                </div>
                <div className="metric-card warning-accent">
                  <div className="metric-icon"><TrendingDown size={22} /></div>
                  <div className="metric-body">
                    <span>A Receber</span>
                    <strong>{formatCurrency(pendingPayments.reduce((s, p) => s + p.amount, 0))}</strong>
                    <small>{pendingPayments.length} pendente(s)</small>
                  </div>
                </div>
                <div className="metric-card primary-accent">
                  <div className="metric-icon"><BarChart2 size={22} /></div>
                  <div className="metric-body">
                    <span>Em Atraso</span>
                    <strong>{formatCurrency(overduePayments.reduce((s, p) => s + p.amount, 0))}</strong>
                    <small>{overduePayments.length} em atraso</small>
                  </div>
                </div>
              </div>

              {payments.length === 0 ? (
                <p className="empty-state">Nenhum lançamento de pagamento no período.</p>
              ) : (
                <div className="data-table">
                  <div className="data-row data-head">
                    <span>Vencimento</span>
                    <span>OS</span>
                    <span>Forma</span>
                    <span>Valor</span>
                    <span>Status</span>
                    <span>Ação</span>
                  </div>
                  {payments.map((p) => (
                    <div key={p.id} className="data-row">
                      <span>{new Date(p.due_date).toLocaleDateString('pt-BR')}</span>
                      <span>#{p.service_order_id.slice(0, 6)}</span>
                      <span>{p.payment_method}</span>
                      <strong>{formatCurrency(p.amount)}</strong>
                      <span className={`status-badge status-${p.status === 'paid' ? 'open' : 'cancelled'}`}>
                        {p.status === 'paid' ? 'Pago' : p.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                      </span>
                      {p.status !== 'paid' && (
                        <button
                          type="button"
                          className="primary-btn btn-sm"
                          onClick={async () => {
                            await supabase.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', p.id)
                            void loadData()
                          }}
                        >
                          Marcar Pago
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
