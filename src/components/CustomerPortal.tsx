import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortalToken {
  service_order_id: string
  tenant_id: string
  expires_at: string | null
}

interface PortalOrder {
  id: string
  code: number
  stage: string | null
  complaint: string | null
  entry_at: string
  total_amount: number | null
  customer_id: string
  vehicle_id: string
}

interface PortalItem {
  id: string
  description: string
  kind: string
  quantity: number
  unit_price: number
}

interface PortalApproval {
  item_id: string | null
  decision: 'approved' | 'refused'
}

interface PortalTenant {
  id: string
  name: string
  logo_url?: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const stageLabels: Record<string, string> = {
  entry: '1/6 — Veículo na entrada',
  diagnosis: '2/6 — Em diagnóstico',
  waiting_parts: '3/6 — Aguardando peças',
  in_execution: '4/6 — Serviços em andamento',
  ready: '5/6 — Pronto para retirada! ✓',
  delivered: 'Entregue',
}

const stageOrder = ['entry', 'diagnosis', 'waiting_parts', 'in_execution', 'ready', 'delivered']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value))
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomerPortal() {
  const { token } = useParams<{ token: string }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tenantData, setTenantData] = useState<PortalTenant | null>(null)
  const [order, setOrder] = useState<PortalOrder | null>(null)
  const [items, setItems] = useState<PortalItem[]>([])
  const [existingApprovals, setExistingApprovals] = useState<PortalApproval[]>([])
  const [submitted, setSubmitted] = useState(false)

  // Approval form state
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'refused' | null>>({})
  const [customerName, setCustomerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token inválido ou ausente.')
      setLoading(false)
      return
    }
    void loadPortal(token)
  }, [token])

  async function loadPortal(tkn: string) {
    setLoading(true)
    setError(null)

    try {
      // 1. Validate token
      const { data: tokenRow, error: tokenError } = await supabase
        .from('service_order_tokens')
        .select('service_order_id, tenant_id, expires_at')
        .eq('token', tkn)
        .maybeSingle()

      if (tokenError || !tokenRow) {
        setError('Link inválido ou expirado. Solicite um novo link à oficina.')
        setLoading(false)
        return
      }

      const { service_order_id, tenant_id, expires_at } = tokenRow as PortalToken

      if (expires_at && new Date(expires_at) < new Date()) {
        setError('Este link expirou. Solicite um novo link à oficina.')
        setLoading(false)
        return
      }

      // 2. Load tenant info (public policy or graceful fallback)
      const { data: tenantRow } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('id', tenant_id)
        .maybeSingle()

      setTenantData(tenantRow as PortalTenant | null)

      // 3. Load service order
      const { data: orderRow } = await supabase
        .from('service_orders')
        .select('id, code, stage, complaint, entry_at, total_amount, customer_id, vehicle_id')
        .eq('id', service_order_id)
        .maybeSingle()

      if (orderRow) setOrder(orderRow as PortalOrder)

      // 4. Load items
      const { data: itemRows } = await supabase
        .from('service_order_items')
        .select('id, description, kind, quantity, unit_price')
        .eq('service_order_id', service_order_id)
        .order('created_at', { ascending: true })

      const loadedItems = (itemRows as PortalItem[] | null) ?? []
      setItems(loadedItems)

      // Initialize decisions map
      const initialDecisions: Record<string, 'approved' | 'refused' | null> = {}
      loadedItems.forEach((item) => {
        initialDecisions[item.id] = null
      })
      setDecisions(initialDecisions)

      // 5. Check for existing approvals (public table)
      const { data: approvalRows } = await supabase
        .from('service_order_approvals')
        .select('item_id, decision')
        .eq('service_order_id', service_order_id)

      const loadedApprovals = (approvalRows as PortalApproval[] | null) ?? []
      setExistingApprovals(loadedApprovals)
      if (loadedApprovals.length > 0) setSubmitted(true)
    } catch {
      setError('Erro ao carregar informações. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function toggleDecision(itemId: string, decision: 'approved' | 'refused') {
    setDecisions((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === decision ? null : decision,
    }))
  }

  async function handleSubmitApproval() {
    if (!order || !token) return
    if (!customerName.trim()) {
      setSubmitError('Por favor, informe seu nome antes de confirmar.')
      return
    }

    const unset = items.filter((item) => decisions[item.id] === null)
    if (unset.length > 0) {
      setSubmitError('Por favor, aprove ou recuse todos os itens antes de confirmar.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const rows = items.map((item) => ({
        service_order_id: order.id,
        item_id: item.id,
        decision: decisions[item.id] as 'approved' | 'refused',
        customer_name: customerName.trim(),
        token,
      }))

      const { error: insertError } = await supabase.from('service_order_approvals').insert(rows)

      if (insertError) {
        setSubmitError('Erro ao enviar aprovação. Tente novamente.')
        return
      }

      setSubmitted(true)
    } catch {
      setSubmitError('Erro inesperado. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Stage progress index ──────────────────────────────────────────────────
  const currentStageIndex = order?.stage ? stageOrder.indexOf(order.stage) : 0
  const stageDisplay = order?.stage ? (stageLabels[order.stage] ?? order.stage) : '—'

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="portal-page">
        <div className="portal-body" style={{ paddingTop: 60, textAlign: 'center', color: '#64748b' }}>
          <p>Carregando informações...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="portal-page">
        <header className="portal-header">
          <div>
            <div className="portal-brand">Automec</div>
            <div className="portal-subtitle">Portal do Cliente</div>
          </div>
        </header>
        <div className="portal-body">
          <div className="portal-card">
            <p className="error-message" role="alert">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="portal-page">
      {/* Header */}
      <header className="portal-header">
        <div>
          <div className="portal-brand">{tenantData?.name ?? 'Oficina'}</div>
          <div className="portal-subtitle">Portal do Cliente</div>
        </div>
      </header>

      <div className="portal-body">
        {/* Progress Card */}
        <div className="portal-card">
          <h2>Status da Ordem de Serviço</h2>
          {order && (
            <>
              <p style={{ margin: 0, fontWeight: 700, color: '#2563eb', fontSize: '1rem' }}>{stageDisplay}</p>
              <div className="progress-bar-stages">
                {stageOrder.map((stage, idx) => {
                  let className = 'progress-stage'
                  if (idx < currentStageIndex) className += ' done'
                  else if (idx === currentStageIndex) className += ' current'
                  return <div key={stage} className={className} title={stageLabels[stage]} />
                })}
              </div>
            </>
          )}
        </div>

        {/* OS Details Card */}
        {order && (
          <div className="portal-card">
            <h2>Detalhes da Ordem #{order.code}</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 600, width: '40%' }}>Reclamação do cliente</td>
                  <td style={{ padding: '6px 0', color: '#0f172a' }}>{order.complaint || 'Não informado'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 600 }}>Data de entrada</td>
                  <td style={{ padding: '6px 0', color: '#0f172a' }}>{formatDate(order.entry_at)}</td>
                </tr>
                {order.total_amount != null && (
                  <tr>
                    <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 600 }}>Total estimado</td>
                    <td style={{ padding: '6px 0', color: '#0f172a', fontWeight: 700 }}>{formatCurrency(order.total_amount)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Items Table */}
        {items.length > 0 && (
          <div className="portal-card">
            <h2>Itens e Serviços</h2>
            <div className="data-table" style={{ fontSize: '0.875rem' }}>
              <div className="data-row data-head" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr' }}>
                <span>Descrição</span>
                <span>Qtd</span>
                <span>Unitário</span>
                <span>Total</span>
                <span>Status</span>
              </div>
              {items.map((item) => {
                const approval = existingApprovals.find((a) => a.item_id === item.id)
                let statusBadge: React.ReactNode
                if (!submitted) {
                  statusBadge = (
                    <span
                      style={{
                        background: '#fff7ed',
                        color: '#c2410c',
                        border: '1px solid #fed7aa',
                        borderRadius: 999,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                      }}
                    >
                      Aguardando aprovação
                    </span>
                  )
                } else if (approval?.decision === 'approved') {
                  statusBadge = (
                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.82rem' }}>✓ Aprovado</span>
                  )
                } else if (approval?.decision === 'refused') {
                  statusBadge = (
                    <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.82rem' }}>✗ Recusado</span>
                  )
                } else {
                  statusBadge = <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>—</span>
                }
                return (
                  <div className="data-row" key={item.id} style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr' }}>
                    <strong>{item.description}</strong>
                    <span>{item.quantity}</span>
                    <span>{formatCurrency(item.unit_price)}</span>
                    <strong>{formatCurrency(item.quantity * item.unit_price)}</strong>
                    <span>{statusBadge}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Approval Section */}
        {items.length > 0 && !submitted && (
          <div className="portal-card">
            <h2>Aprove seu orçamento</h2>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.9rem' }}>
              Revise cada item abaixo e confirme sua decisão. Após enviar, não será possível alterar.
            </p>

            {items.map((item) => (
              <div className="approval-item" key={item.id}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{item.description}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {item.quantity}× {formatCurrency(item.unit_price)} ={' '}
                    <strong>{formatCurrency(item.quantity * item.unit_price)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="approval-approve-btn"
                  onClick={() => toggleDecision(item.id, 'approved')}
                  style={{
                    opacity: decisions[item.id] === 'approved' ? 1 : 0.4,
                    outline: decisions[item.id] === 'approved' ? '2px solid #059669' : 'none',
                  }}
                  aria-pressed={decisions[item.id] === 'approved'}
                >
                  ✓ Aprovar
                </button>
                <button
                  type="button"
                  className="approval-refuse-btn"
                  onClick={() => toggleDecision(item.id, 'refused')}
                  style={{
                    opacity: decisions[item.id] === 'refused' ? 1 : 0.4,
                    outline: decisions[item.id] === 'refused' ? '2px solid #dc2626' : 'none',
                  }}
                  aria-pressed={decisions[item.id] === 'refused'}
                >
                  ✗ Recusar
                </button>
              </div>
            ))}

            <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6, fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>
                Seu nome completo *
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  style={{ minHeight: 44, border: '1px solid #cbd5e1', borderRadius: 6, padding: '10px 12px', fontSize: '1rem' }}
                />
              </label>

              {submitError && (
                <p className="error-message" role="alert" style={{ margin: 0 }}>
                  {submitError}
                </p>
              )}

              <button
                type="button"
                className="primary-btn"
                disabled={submitting}
                onClick={() => void handleSubmitApproval()}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {submitting ? 'Enviando...' : 'Confirmar Aprovação'}
              </button>
            </div>
          </div>
        )}

        {/* Submitted confirmation */}
        {submitted && (
          <div className="portal-card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ margin: '0 0 8px' }}>Resposta registrada!</h2>
            <p style={{ color: '#64748b', margin: 0 }}>
              Sua aprovação foi enviada com sucesso. A oficina foi notificada e entrará em contato em breve.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="portal-footer">Powered by Automec — Sistema de Gestão para Oficinas</div>
      </div>
    </div>
  )
}
