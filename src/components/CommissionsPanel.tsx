import { Award, TrendingUp, DollarSign, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'

interface Commission {
  id: string
  tenant_id: string
  service_order_id: string
  user_id: string
  base_amount: number
  commission_pct: number
  commission_amount: number
  status: 'pending' | 'paid'
  paid_at: string | null
  notes: string | null
  created_at: string
}

interface TeamMember {
  tenant_id: string
  user_id: string
  role: string
  commission_pct: number | null
  commission_type: string | null
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export function CommissionsPanel({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    const [{ data: comData }, { data: memData }] = await Promise.all([
      supabase
        .from('commissions')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .order('created_at', { ascending: false }),
      supabase
        .from('tenant_members')
        .select('tenant_id, user_id, role, commission_pct, commission_type')
        .eq('tenant_id', activeTenant.tenantId),
    ])

    setCommissions((comData as Commission[]) || [])
    setMembers((memData as TeamMember[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [activeTenant.tenantId])

  async function markCommissionPaid(id: string) {
    await supabase
      .from('commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('tenant_id', activeTenant.tenantId)
      .eq('id', id)

    setCommissions((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'paid' as const, paid_at: new Date().toISOString() } : c)))
  }

  const filtered = commissions.filter((c) => {
    if (filterUser !== 'all' && c.user_id !== filterUser) return false
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    return true
  })

  const totalPending = commissions.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0)
  const totalPaid = commissions.filter((c) => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0)

  // Productivity ranking: sum commission_amount by user_id
  const ranking = members.map((m) => {
    const userCommissions = commissions.filter((c) => c.user_id === m.user_id)
    const totalGenerated = userCommissions.reduce((sum, c) => sum + c.base_amount, 0)
    const totalCommission = userCommissions.reduce((sum, c) => sum + c.commission_amount, 0)
    return { userId: m.user_id, role: m.role, commissionPct: m.commission_pct || 0, totalGenerated, totalCommission, count: userCommissions.length }
  }).sort((a, b) => b.totalGenerated - a.totalGenerated)

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Gestão de Equipe</p>
          <h1>Comissões & Produtividade</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid">
        <div className="metric-card warning-accent">
          <div className="metric-icon"><DollarSign size={24} /></div>
          <div className="metric-body">
            <span>Comissões Pendentes</span>
            <strong>{formatCurrency(totalPending)}</strong>
            <small>{commissions.filter((c) => c.status === 'pending').length} a pagar</small>
          </div>
        </div>
        <div className="metric-card success-accent">
          <div className="metric-icon"><TrendingUp size={24} /></div>
          <div className="metric-body">
            <span>Total Pago em Comissões</span>
            <strong>{formatCurrency(totalPaid)}</strong>
          </div>
        </div>
        <div className="metric-card info-accent">
          <div className="metric-icon"><Award size={24} /></div>
          <div className="metric-body">
            <span>Mecânicos Ativos</span>
            <strong>{ranking.filter((r) => r.count > 0).length}</strong>
          </div>
        </div>
      </div>

      {/* Productivity Ranking */}
      <div className="dashboard-block main-block">
        <div className="block-header">
          <h2>🏆 Ranking de Produtividade (por Receita Gerada)</h2>
        </div>
        {ranking.length === 0 ? (
          <p className="empty-state">Nenhum membro cadastrado.</p>
        ) : (
          <div className="data-table">
            <div className="data-row data-head" style={{ gridTemplateColumns: '60px 1fr 1fr 1fr 1fr 1fr' }}>
              <span>#</span>
              <span>Mecânico</span>
              <span>Cargo</span>
              <span>% Comissão</span>
              <span>Receita Gerada</span>
              <span>Comissão Total</span>
            </div>
            {ranking.map((r, i) => (
              <div key={r.userId} className="data-row" style={{ gridTemplateColumns: '60px 1fr 1fr 1fr 1fr 1fr' }}>
                <span className="rank-badge">#{i + 1}</span>
                <span>{r.userId.slice(0, 8)}...</span>
                <span>{r.role}</span>
                <span>{r.commissionPct}%</span>
                <strong className="positive-text">{formatCurrency(r.totalGenerated)}</strong>
                <strong>{formatCurrency(r.totalCommission)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <span>Filtrar por:</span>
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
          <option value="all">Todos os Mecânicos</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.role} ({m.user_id.slice(0, 8)}...)
            </option>
          ))}
        </select>
        <button type="button" className={filterStatus === 'all' ? 'active' : ''} onClick={() => setFilterStatus('all')}>Todas</button>
        <button type="button" className={filterStatus === 'pending' ? 'active' : ''} onClick={() => setFilterStatus('pending')}>Pendentes</button>
        <button type="button" className={filterStatus === 'paid' ? 'active' : ''} onClick={() => setFilterStatus('paid')}>Pagas</button>
      </div>

      {/* Commissions Table */}
      {loading ? (
        <p className="status-message">Carregando comissões...</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">Nenhuma comissão registrada no período.</p>
      ) : (
        <div className="data-table">
          <div className="data-row data-head">
            <span>OS</span>
            <span>Mecânico</span>
            <span>Valor OS</span>
            <span>% Comissão</span>
            <span>Valor Comissão</span>
            <span>Status / Ação</span>
          </div>
          {filtered.map((c) => (
            <div key={c.id} className="data-row">
              <strong>#{c.service_order_id.slice(0, 6)}...</strong>
              <span>{c.user_id.slice(0, 8)}...</span>
              <span>{formatCurrency(c.base_amount)}</span>
              <span>{c.commission_pct}%</span>
              <strong className="positive-text">{formatCurrency(c.commission_amount)}</strong>
              <span>
                {c.status === 'paid' ? (
                  <span className="status-badge status-open">✓ Pago</span>
                ) : (
                  <button type="button" className="primary-btn btn-sm" onClick={() => void markCommissionPaid(c.id)}>
                    Marcar Pago
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
