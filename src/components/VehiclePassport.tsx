import { Car, Calendar, Wrench, ShieldCheck, Clock, User, Phone, Image as ImageIcon, Download, Share2, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getVehiclePassport, type VehiclePassportData } from '../services/autoosService'
import type { ActiveTenantContext } from '../lib/tenant'
import type { ServiceOrderItemRow, ServiceOrderRow } from '../types/database'

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export function VehiclePassport({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const { plate } = useParams<{ plate: string }>()
  const [passport, setPassport] = useState<VehiclePassportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!plate) return
    setLoading(true)
    setError(null)

    getVehiclePassport(activeTenant.tenantId, plate)
      .then((data: VehiclePassportData | null) => {
        if (!data) {
          setError(`Veículo com placa "${plate}" não foi encontrado.`)
        } else {
          setPassport(data)
        }
      })
      .catch((err: any) => setError(err?.message || 'Erro ao carregar passaporte do veículo'))
      .finally(() => setLoading(false))
  }, [activeTenant.tenantId, plate])

  if (loading) return <p className="status-message">Carregando Passaporte Digital do Veículo...</p>
  if (error || !passport) return <p className="error-message">{error || 'Veículo não encontrado'}</p>

  const { vehicle, owner: customer, serviceOrders: orders, totalInvestment: totalInvested, nextMaintenanceAlert } = passport
  const nextMaintenanceDate = nextMaintenanceAlert.nextMaintenanceDate || 'Em 180 dias ou 10.000 km'

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Passaporte Digital do Veículo</p>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Car size={32} style={{ color: '#2563eb' }} />
            Placa: {vehicle.plate}
          </h1>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-btn" onClick={() => window.print()}>
            <Download size={16} /> Imprimir Passaporte
          </button>
        </div>
      </div>

      {/* Vehicle Summary Card */}
      <div className="passport-header-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Marca / Modelo</span>
            <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a' }}>{vehicle.brand || ''} {vehicle.model}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Ano / Cor</span>
            <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a' }}>{vehicle.year || '—'} · {vehicle.color || '—'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Proprietário Atual</span>
            <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a' }}>{customer?.name || 'Cliente'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Investimento Total</span>
            <strong style={{ display: 'block', fontSize: '1.1rem', color: '#10b981' }}>{formatCurrency(totalInvested)}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Próxima Revisão</span>
            <strong style={{ display: 'block', fontSize: '1.1rem', color: '#2563eb' }}>{nextMaintenanceDate}</strong>
          </div>
        </div>
      </div>

      {/* Maintenance Timeline */}
      <div className="passport-timeline-container">
        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={20} style={{ color: '#2563eb' }} /> Linha do Tempo de Manutenções Realizadas ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <p className="empty-state">Nenhuma Ordem de Serviço concluída para este veículo.</p>
        ) : (
          <div className="timeline-list" style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', paddingLeft: 24, borderLeft: '3px solid #cbd5e1' }}>
            {orders.map((ord: ServiceOrderRow & { items?: ServiceOrderItemRow[] }) => (

              <div key={ord.id} className="timeline-item" style={{ position: 'relative', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
                {/* Timeline Dot */}
                <div style={{ position: 'absolute', left: -34, top: 20, width: 18, height: 18, borderRadius: '50%', background: '#2563eb', border: '4px solid #fff' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                  <div>
                    <span className="kanban-card-number">OS #{ord.code}</span>
                    <h3 style={{ margin: '4px 0 0', fontSize: '1.05rem', color: '#0f172a' }}>{ord.complaint || 'Revisão periódica'}</h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ display: 'block', fontSize: '1.1rem', color: '#10b981' }}>{formatCurrency(ord.total_amount || 0)}</strong>
                    <small style={{ color: '#64748b' }}>{new Date(ord.entry_at).toLocaleDateString('pt-BR')}</small>
                  </div>
                </div>

                {/* Items Breakdown */}
                {ord.items && ord.items.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Peças & Serviços Realizados:</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginTop: 6 }}>
                      {ord.items.map((it: ServiceOrderItemRow) => (

                        <div key={it.id} style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{it.description}</span>
                          <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem' }}>
                            {it.quantity}x · {formatCurrency(it.unit_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
