import { Layers, Plus, CheckCircle2, Wrench, AlertOctagon, User, Car } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { getWorkstations, createWorkstation, releaseWorkstation } from '../services/autoosService'
import type { ActiveTenantContext } from '../lib/tenant'
import type { WorkStation } from '../types/database'

const KIND_LABELS: Record<string, string> = {
  elevator: 'Elevador Automotivo',
  box: 'Box de Atendimento',
  pit: 'Valeta de Inspeção',
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  available: { label: 'Livre / Disponível', bg: '#ecfdf5', color: '#10b981' },
  occupied: { label: 'Ocupado', bg: '#eff6ff', color: '#2563eb' },
  maintenance: { label: 'Manutenção', bg: '#fef2f2', color: '#ef4444' },
}

export function WorkStationPanel({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [stations, setStations] = useState<WorkStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newKind, setNewKind] = useState<'elevator' | 'box' | 'pit'>('elevator')
  const [submitting, setSubmitting] = useState(false)

  async function loadStations() {
    setLoading(true)
    setError(null)
    try {
      const data = await getWorkstations(activeTenant.tenantId)
      setStations(data)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar elevadores e boxes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStations()
  }, [activeTenant.tenantId])

  async function handleCreateStation(e: FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSubmitting(true)

    try {
      await createWorkstation(activeTenant.tenantId, newName.trim(), newKind)
      setShowModal(false)
      setNewName('')
      void loadStations()
    } catch (err: any) {
      setError(err?.message || 'Erro ao cadastrar elevador')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRelease(stationId: string) {
    if (!confirm('Deseja liberar este elevador/box para atendimento?')) return
    await releaseWorkstation(activeTenant.tenantId, stationId)
    void loadStations()
  }

  if (loading) return <p className="status-message">Carregando mapa de elevadores e boxes...</p>
  if (error) return <p className="error-message">{error}</p>

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Recursos Físicos da Oficina</p>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={30} style={{ color: '#2563eb' }} />
            Mapa de Elevadores, Boxes & Valetas ({stations.length})
          </h1>
        </div>
        <div className="header-actions">
          <button type="button" className="primary-btn" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Adicionar Elevador/Box
          </button>
        </div>
      </div>

      {stations.length === 0 ? (
        <p className="empty-state">Nenhum elevador ou box cadastrado. Clique no botão acima para adicionar.</p>
      ) : (
        <div className="workstations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {stations.map((st) => {
            const stInfo = STATUS_LABELS[st.status] || { label: st.status, bg: '#f1f5f9', color: '#64748b' }

            return (
              <div
                key={st.id}
                className="workstation-card"
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: st.status === 'occupied' ? '0 4px 12px rgba(37,99,235,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                      {KIND_LABELS[st.kind] || st.kind}
                    </span>
                    <h3 style={{ margin: '2px 0 0', fontSize: '1.15rem', color: '#0f172a', fontFamily: 'Outfit' }}>{st.name}</h3>
                  </div>

                  <span className="status-badge" style={{ background: stInfo.bg, color: stInfo.color, border: `1px solid ${stInfo.color}40`, fontWeight: 700 }}>
                    {stInfo.label}
                  </span>
                </div>

                {st.status === 'occupied' && (
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', margin: '12px 0' }}>
                    <small style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'block' }}>OS ALOCADA NESTE ELEVADOR</small>
                    <strong style={{ color: '#2563eb', fontSize: '0.95rem' }}>OS #{st.current_service_order_id?.slice(0, 8)}...</strong>
                  </div>
                )}

                {st.status === 'occupied' && (
                  <button
                    type="button"
                    className="secondary-btn btn-sm"
                    style={{ width: '100%', marginTop: 8 }}
                    onClick={() => void handleRelease(st.id)}
                  >
                    Desocupar / Liberar Elevador
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Adicionar Elevador */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Adicionar Elevador ou Box de Atendimento</h2>
            <form onSubmit={(e) => void handleCreateStation(e)}>
              <div className="form-grid">
                <label className="wide-field">
                  Nome do Elevador / Box *
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    placeholder="Ex: Elevador 1 - Alinhamento"
                  />
                </label>

                <label className="wide-field">
                  Tipo de Equipamento *
                  <select value={newKind} onChange={(e) => setNewKind(e.target.value as any)}>
                    <option value="elevator">Elevador Automotivo</option>
                    <option value="box">Box de Atendimento / Rápido</option>
                    <option value="pit">Valeta de Inspeção / Alinhamento</option>
                  </select>
                </label>
              </div>

              <div className="form-actions" style={{ marginTop: 20 }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? 'Cadastrando...' : 'Cadastrar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
