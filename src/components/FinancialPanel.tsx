import { DollarSign, CheckCircle2, Clock, AlertTriangle, CreditCard, Search, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { Payment, ServiceOrder, Customer } from '../types/database'

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

const methodLabels: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  ticket: 'Boleto Bancário',
  billed: 'Faturado',
}

export function FinancialPanel({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [ordersMap, setOrdersMap] = useState<Record<string, ServiceOrder>>({})
  const [customersMap, setCustomersMap] = useState<Record<string, Customer>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  async function loadFinancials() {
    setLoading(true)
    setError(null)
    const [{ data: payData }, { data: orderData }, { data: custData }] = await Promise.all([
      supabase.from('payments').select('*').eq('tenant_id', activeTenant.tenantId).order('due_date', { ascending: true }),
      supabase.from('service_orders').select('*').eq('tenant_id', activeTenant.tenantId),
      supabase.from('customers').select('*').eq('tenant_id', activeTenant.tenantId),
    ])

    const loadedPayments = (payData as Payment[]) || []
    const loadedOrders = (orderData as ServiceOrder[]) || []
    const loadedCustomers = (custData as Customer[]) || []

    const oMap: Record<string, ServiceOrder> = {}
    loadedOrders.forEach((o) => {
      oMap[o.id] = o
    })

    const cMap: Record<string, Customer> = {}
    loadedCustomers.forEach((c) => {
      cMap[c.id] = c
    })

    setPayments(loadedPayments)
    setOrdersMap(oMap)
    setCustomersMap(cMap)
    setLoading(false)
  }

  useEffect(() => {
    void loadFinancials()
  }, [activeTenant.tenantId])

  async function markAsPaid(paymentId: string) {
    setError(null)
    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('tenant_id', activeTenant.tenantId)
      .eq('id', paymentId)

    if (updateError) {
      setError('Falha ao atualizar pagamento.')
    } else {
      void loadFinancials()
    }
  }

  const paidTotal = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0)
  const pendingTotal = payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0)
  const overdueTotal = payments.filter((p) => p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0)

  const filteredPayments = payments.filter((p) => {
    if (statusFilter === 'all') return true
    return p.status === statusFilter
  })

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Gestão Financeira</p>
          <h1>Contas a Receber ({payments.length})</h1>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card success-accent">
          <div className="metric-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-body">
            <span>Total Recebido (Pago)</span>
            <strong>{formatCurrency(paidTotal)}</strong>
          </div>
        </div>

        <div className="metric-card warning-accent">
          <div className="metric-icon">
            <Clock size={24} />
          </div>
          <div className="metric-body">
            <span>Pendente a Receber</span>
            <strong>{formatCurrency(pendingTotal)}</strong>
          </div>
        </div>

        <div className="metric-card primary-accent">
          <div className="metric-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-body">
            <span>Em Atraso</span>
            <strong>{formatCurrency(overdueTotal)}</strong>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <span>Filtrar por Status:</span>
        <button type="button" className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>
          Todos
        </button>
        <button type="button" className={statusFilter === 'pending' ? 'active' : ''} onClick={() => setStatusFilter('pending')}>
          Pendentes
        </button>
        <button type="button" className={statusFilter === 'paid' ? 'active' : ''} onClick={() => setStatusFilter('paid')}>
          Pagos
        </button>
        <button type="button" className={statusFilter === 'overdue' ? 'active' : ''} onClick={() => setStatusFilter('overdue')}>
          Atrasados
        </button>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}

      {loading ? (
        <p className="status-message">Carregando dados financeiros...</p>
      ) : filteredPayments.length === 0 ? (
        <p className="empty-state">Nenhum lançamento financeiro registrado.</p>
      ) : (
        <div className="data-table">
          <div className="data-row data-head">
            <span>OS</span>
            <span>Cliente</span>
            <span>Forma Pagamento</span>
            <span>Vencimento</span>
            <span>Valor</span>
            <span>Status / Ação</span>
          </div>
          {filteredPayments.map((p) => {
            const order = ordersMap[p.service_order_id]
            const customer = p.customer_id ? customersMap[p.customer_id] : null

            return (
              <div key={p.id} className="data-row">
                <strong>#{order?.code || '-'}</strong>
                <span>{customer?.name || 'Cliente'}</span>
                <span>
                  <CreditCard size={14} /> {methodLabels[p.payment_method] || p.payment_method}
                </span>
                <span>
                  <Calendar size={14} /> {new Date(p.due_date).toLocaleDateString('pt-BR')}
                </span>
                <strong>{formatCurrency(p.amount)}</strong>
                <span>
                  {p.status === 'paid' ? (
                    <span className="status-badge status-open">Pago</span>
                  ) : (
                    <button type="button" className="primary-btn btn-sm" onClick={() => void markAsPaid(p.id)}>
                      Marcar Pago
                    </button>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
