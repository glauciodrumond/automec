import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { ServiceOrderPriority, ServiceOrderStage } from '../types/database'

interface KanbanOrder {
  id: string
  code: number
  stage: ServiceOrderStage
  priority: ServiceOrderPriority
  total_amount: number | null
  customer_name: string
  plate: string
  brand: string | null
  model: string | null
  assigned_to: string | null
}

interface MechanicOption {
  user_id: string
  role?: string | null
}

const STAGES: { id: ServiceOrderStage; label: string; color: string }[] = [
  { id: 'entry', label: 'Entrada', color: '#64748b' },
  { id: 'diagnosis', label: 'Diagnóstico', color: '#f59e0b' },
  { id: 'waiting_parts', label: 'Aguard. Peça', color: '#ef4444' },
  { id: 'in_execution', label: 'Em Execução', color: '#3b82f6' },
  { id: 'ready', label: 'Pronto ✓', color: '#10b981' },
  { id: 'delivered', label: 'Entregue', color: '#6b7280' },
]

const PRIORITY_LABELS: Record<ServiceOrderPriority, string> = {
  high: 'Alta',
  normal: 'Normal',
  low: 'Baixa',
}

function formatCurrency(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface KanbanBoardProps {
  activeTenant: ActiveTenantContext
}

export function KanbanBoard({ activeTenant }: KanbanBoardProps) {
  const [orders, setOrders] = useState<KanbanOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mechanics, setMechanics] = useState<MechanicOption[]>([])
  const [filterMechanic, setFilterMechanic] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        const { data: memberData } = await supabase
          .from('tenant_members')
          .select('user_id, role')
          .eq('tenant_id', activeTenant.tenantId)

        let query = supabase
          .from('service_orders')
          .select(`
            id, code, stage, priority, total_amount, assigned_to,
            customers(name),
            vehicles(plate, brand, model)
          `)
          .eq('tenant_id', activeTenant.tenantId)
          .neq('status', 'cancelled')
          .order('code', { ascending: false })

        if (filterDateFrom) query = query.gte('entry_at', filterDateFrom)
        if (filterDateTo) query = query.lte('entry_at', filterDateTo + 'T23:59:59')

        const { data, error: fetchError } = await query

        if (!active) return

        if (fetchError) {
          setError('Não foi possível carregar as ordens de serviço.')
          setLoading(false)
          return
        }

        type VehicleRow = { plate: string; brand: string | null; model: string | null }
        type CustomerRow = { name: string }

        const rows: KanbanOrder[] = ((data as any[]) ?? []).map((row) => ({
          id: row.id as string,
          code: row.code as number,
          stage: ((row.stage ?? 'entry') as ServiceOrderStage),
          priority: row.priority as ServiceOrderPriority,
          total_amount: (row.total_amount as number | null) ?? null,
          customer_name: (row.customers as CustomerRow | null)?.name ?? 'Cliente',
          plate: (row.vehicles as VehicleRow | null)?.plate ?? '—',
          brand: (row.vehicles as VehicleRow | null)?.brand ?? null,
          model: (row.vehicles as VehicleRow | null)?.model ?? null,
          assigned_to: (row.assigned_to as string | null) ?? null,
        }))

        setOrders(rows)
        setMechanics(
          ((memberData as any[]) ?? []).map((m) => ({
            user_id: m.user_id as string,
            role: (m.role as string | null) ?? null,
          }))
        )
        setLoading(false)
      } catch (err) {
        if (!active) return
        setError('Não foi possível carregar as ordens de serviço.')
        setLoading(false)
      }
    }

    void loadData()
    return () => {
      active = false
    }
  }, [activeTenant.tenantId, filterDateFrom, filterDateTo])

  async function moveCard(orderId: string, newStage: ServiceOrderStage) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, stage: newStage } : o))
    )
    await supabase
      .from('service_orders')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('tenant_id', activeTenant.tenantId)
      .eq('id', orderId)
  }

  const filteredOrders = filterMechanic
    ? orders.filter((o) => o.assigned_to === filterMechanic)
    : orders

  const stageIndex = (stageId: ServiceOrderStage) =>
    STAGES.findIndex((s) => s.id === stageId)

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Operação</p>
          <h1>Kanban — Ordens de Serviço</h1>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#334155' }}>
          Mecânico:
          <select
            value={filterMechanic}
            onChange={(e) => setFilterMechanic(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
          >
            <option value="">Todos</option>
            {mechanics.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.user_id}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#334155' }}>
          De:
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#334155' }}>
          Até:
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
          />
        </label>

        {(filterMechanic || filterDateFrom || filterDateTo) && (
          <button
            type="button"
            className="secondary-btn"
            style={{ padding: '4px 12px', fontSize: '0.82rem' }}
            onClick={() => {
              setFilterMechanic('')
              setFilterDateFrom('')
              setFilterDateTo('')
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {loading && <p className="status-message">Carregando ordens...</p>}
      {error && (
        <div className="error-message" role="alert" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="kanban-board">
          {STAGES.map((stage) => {
            const stageOrders = filteredOrders.filter((o) => o.stage === stage.id)
            const stageIdx = stageIndex(stage.id)

            return (
              <div key={stage.id} className="kanban-column">
                <div className="kanban-col-header" style={{ background: stage.color }}>
                  <span className="kanban-col-title">{stage.label}</span>
                  <span className="kanban-col-count">{stageOrders.length}</span>
                </div>

                <div className="kanban-cards">
                  {stageOrders.length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', margin: '12px 0' }}>
                      Nenhuma OS
                    </p>
                  )}

                  {stageOrders.map((order) => {
                    const prevStage = stageIdx > 0 ? STAGES[stageIdx - 1].id : null
                    const nextStage = stageIdx < STAGES.length - 1 ? STAGES[stageIdx + 1].id : null

                    return (
                      <div key={order.id} className="kanban-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className="kanban-card-number">OS {order.code}</span>
                          <span className={`priority-badge ${order.priority}`}>
                            {PRIORITY_LABELS[order.priority]}
                          </span>
                        </div>

                        <Link to={`/orders/${order.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                          <div className="kanban-card-plate">{order.plate}</div>
                          <div className="kanban-card-vehicle">
                            {[order.brand, order.model].filter(Boolean).join(' ') || 'Veículo'}
                          </div>
                          <div className="kanban-card-customer">{order.customer_name}</div>
                          {order.assigned_to && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                              🔧 {order.assigned_to}
                            </div>
                          )}
                          <div className="kanban-card-total">{formatCurrency(order.total_amount)}</div>
                        </Link>

                        <div className="kanban-card-nav">
                          {prevStage && (
                            <button
                              type="button"
                              className="kanban-nav-btn"
                              title={`Mover para ${STAGES[stageIdx - 1].label}`}
                              onClick={() => void moveCard(order.id, prevStage)}
                            >
                              <ChevronLeft size={14} />
                            </button>
                          )}
                          {nextStage && (
                            <button
                              type="button"
                              className="kanban-nav-btn"
                              title={`Mover para ${STAGES[stageIdx + 1].label}`}
                              onClick={() => void moveCard(order.id, nextStage)}
                            >
                              <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
