import { TrendingUp, DollarSign, Users, RefreshCw, MessageSquare, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCRMOpportunities, type CRMOpportunitiesData } from '../services/autoosService'
import { formatWhatsAppQuoteUrl, openWhatsAppMessage } from '../services/whatsappService'
import type { ActiveTenantContext } from '../lib/tenant'

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export function CRMOportunidades({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [data, setData] = useState<CRMOpportunitiesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    getCRMOpportunities(activeTenant.tenantId)
      .then((res) => setData(res))
      .catch((err: any) => setError(err?.message || 'Erro ao carregar oportunidades de CRM'))
      .finally(() => setLoading(false))
  }, [activeTenant.tenantId])

  if (loading) return <p className="status-message">Carregando painel de oportunidades de receita...</p>
  if (error || !data) return <p className="error-message">{error || 'Erro ao carregar dados'}</p>

  const totalPotential = data.pendingQuotesTotal + data.inactiveClientsTotal

  function handleReactivateWhatsApp(customerName: string, phone: string | null) {
    if (!phone) {
      alert('Cliente não possui telefone cadastrado.')
      return
    }
    const cleanPhone = phone.replace(/\D/g, '')
    const msg = `Olá ${customerName}! Tudo bem? Sentimos sua falta aqui na ${activeTenant.tenantName}. Que tal agendarmos uma revisão preventiva com checklist gratuito para o seu veículo nesta semana?`
    openWhatsAppMessage(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`)
  }

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Inteligência Comercial & Receita</p>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={30} style={{ color: '#10b981' }} />
            Oportunidades de Receita & CRM
          </h1>
        </div>
      </div>

      {/* Revenue Opportunities KPI Bar */}
      <div className="checkin-summary-bar" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="summary-stat attention" style={{ background: '#fff' }}>
          <span>Orçamentos Pendentes de Aprovação</span>
          <strong style={{ color: '#f59e0b', fontSize: '1.5rem' }}>{formatCurrency(data.pendingQuotesTotal)}</strong>
          <small style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>{data.pendingQuotes.length} orçamento(s) aguardando resposta</small>
        </div>

        <div className="summary-stat ok" style={{ background: '#fff' }}>
          <span>Clientes Inativos (&gt; 180 Dias)</span>
          <strong style={{ color: '#2563eb', fontSize: '1.5rem' }}>{formatCurrency(data.inactiveClientsTotal)}</strong>
          <small style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>{data.inactiveClients.length} cliente(s) para reativação</small>
        </div>

        <div className="summary-stat photos" style={{ background: '#fff', borderColor: '#10b981' }}>
          <span>Potencial Estimado de Receita</span>
          <strong style={{ color: '#10b981', fontSize: '1.5rem' }}>{formatCurrency(totalPotential)}</strong>
          <small style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>Oportunidades prontas para fechamento</small>
        </div>
      </div>

      {/* Inactive Clients Reactivation List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Pending Quotes Column */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: '1.1rem', fontFamily: 'Outfit', color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={20} style={{ color: '#f59e0b' }} /> Orçamentos Pendentes ({data.pendingQuotes.length})
          </h2>

          {data.pendingQuotes.length === 0 ? (
            <p className="empty-state">Nenhum orçamento pendente de aprovação.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.pendingQuotes.map((quote) => (
                <div key={quote.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0f172a' }}>OS #{quote.code} · {quote.customer_name}</strong>
                    <small style={{ color: '#64748b' }}>{quote.plate} · {new Date(quote.created_at).toLocaleDateString('pt-BR')}</small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ display: 'block', color: '#10b981', fontSize: '1rem' }}>{formatCurrency(quote.total_amount || 0)}</strong>
                    <button
                      type="button"
                      className="primary-btn btn-sm"
                      style={{ marginTop: 4, background: '#2563eb', padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => handleReactivateWhatsApp(quote.customer_name, quote.customer_phone)}
                    >
                      <MessageSquare size={12} /> Lembrar no WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inactive Clients Column */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: '1.1rem', fontFamily: 'Outfit', color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} style={{ color: '#2563eb' }} /> Clientes para Reativação (&gt; 180 Dias) ({data.inactiveClients.length})
          </h2>

          {data.inactiveClients.length === 0 ? (
            <p className="empty-state">Todos os seus clientes realizaram manutenção recentemente!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.inactiveClients.map((client) => (
                <div key={client.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0f172a' }}>{client.name}</strong>
                    <small style={{ color: '#64748b' }}>{client.phone || 'Sem telefone'}</small>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="primary-btn btn-sm"
                      style={{ background: '#10b981', padding: '6px 12px', fontSize: '0.78rem' }}
                      onClick={() => handleReactivateWhatsApp(client.name, client.phone)}
                    >
                      <MessageSquare size={13} /> Reativar pelo WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
