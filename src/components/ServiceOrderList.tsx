import { ClipboardPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { ServiceOrderStatus } from '../types/database'

interface OrderListRow {
  id: string
  code: number
  status: ServiceOrderStatus
  priority: string
  entry_at: string
  customers: { name: string } | null
  vehicles: { plate: string; brand: string | null; model: string | null } | null
}

const statusLabels: Record<ServiceOrderStatus, string> = {
  open: 'Aberta',
  in_progress: 'Em andamento',
  waiting_parts: 'Aguardando pecas',
  completed: 'Concluida',
  cancelled: 'Cancelada',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export function ServiceOrderList({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [orders, setOrders] = useState<OrderListRow[]>([])
  const [completedRecent, setCompletedRecent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadOrders() {
      setLoading(true)
      const [{ data: activeOrders, error: activeError }, { data: completedOrders, error: completedError }] = await Promise.all([
        supabase
          .from('service_orders')
          .select('id, code, status, priority, entry_at, customers(name), vehicles(plate, brand, model)')
          .eq('tenant_id', activeTenant.tenantId)
          .in('status', ['open', 'in_progress', 'waiting_parts'])
          .order('entry_at', { ascending: false }),
        supabase
          .from('service_orders')
          .select('id')
          .eq('tenant_id', activeTenant.tenantId)
          .eq('status', 'completed')
          .order('entry_at', { ascending: false })
          .limit(10),
      ])

      if (!active) return
      if (activeError || completedError) {
        setError('Nao foi possivel carregar as ordens de servico.')
      } else {
        setOrders((activeOrders ?? []) as unknown as OrderListRow[])
        setCompletedRecent(completedOrders?.length ?? 0)
      }
      setLoading(false)
    }

    void loadOrders()
    return () => { active = false }
  }, [activeTenant.tenantId])

  const openCount = orders.filter((order) => order.status === 'open').length
  const inProgressCount = orders.filter((order) => order.status === 'in_progress').length

  return (
    <section className="screen-section">
      <div className="screen-heading">
        <div><p className="eyebrow">Operacao</p><h1>Ordens de servico</h1></div>
        <Link className="primary-link" to="/orders/new"><ClipboardPlus aria-hidden="true" size={18} />Nova OS</Link>
      </div>
      <div className="dashboard-grid" aria-label="Resumo das ordens">
        <div className="dashboard-card"><span>Abertas</span><strong className="dashboard-card-value">{openCount}</strong></div>
        <div className="dashboard-card"><span>Em andamento</span><strong className="dashboard-card-value">{inProgressCount}</strong></div>
        <div className="dashboard-card"><span>Concluidas recentes</span><strong className="dashboard-card-value">{completedRecent}</strong></div>
      </div>
      {loading && <p className="status-message">Carregando ordens...</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
      {!loading && !error && (orders.length === 0 ? <p className="empty-state">Nao ha ordens em aberto no momento.</p> : (
        <div className="data-table order-table">
          <div className="data-row data-head"><span>OS</span><span>Cliente e veiculo</span><span>Status</span><span>Entrada</span></div>
          {orders.map((order) => (
            <Link className="data-row order-row" key={order.id} to={`/orders/${order.id}`} aria-label={`OS ${order.code}`}>
              <strong>OS {order.code}</strong>
              <span><strong>{order.customers?.name ?? 'Cliente nao encontrado'}</strong><small>{order.vehicles?.plate ?? 'Sem placa'}{order.vehicles?.brand || order.vehicles?.model ? ` - ${[order.vehicles?.brand, order.vehicles?.model].filter(Boolean).join(' ')}` : ''}</small></span>
              <span className={`status-badge status-${order.status}`}>{statusLabels[order.status]}</span>
              <span>{formatDate(order.entry_at)}</span>
            </Link>
          ))}
        </div>
      ))}
    </section>
  )
}
