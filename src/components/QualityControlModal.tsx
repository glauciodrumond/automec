import { ShieldCheck, CheckSquare, X, AlertTriangle, Car } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { saveQualityCheck } from '../services/autoosService'
import type { ActiveTenantContext } from '../lib/tenant'

interface QualityControlModalProps {
  activeTenant: ActiveTenantContext
  serviceOrderId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function QualityControlModal({
  activeTenant,
  serviceOrderId,
  isOpen,
  onClose,
  onSuccess,
}: QualityControlModalProps) {
  const [testDrive, setTestDrive] = useState(true)
  const [wheelTorque, setWheelTorque] = useState(true)
  const [fluids, setFluids] = useState(true)
  const [dashboardLights, setDashboardLights] = useState(true)
  const [washCleaned, setWashCleaned] = useState(true)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await saveQualityCheck(activeTenant.tenantId, serviceOrderId, activeTenant.userId, {
        testDrive,
        wheelTorque,
        fluids,
        dashboardLights,
        washCleaned,
        notes: notes.trim() || undefined,
      })

      if (res.error) {
        setError(res.error)
      } else {
        onSuccess()
        onClose()
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao registrar controle de qualidade')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card wide" style={{ borderRadius: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontFamily: 'Outfit', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={24} style={{ color: '#10b981' }} />
            Controle de Qualidade Pré-Entrega
          </h2>
          <button type="button" onClick={onClose} style={{ border: 0, background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 20px' }}>
          Para liberar a OS como <strong>PRONTO PARA ENTREGA</strong>, confirme a inspeção dos 5 itens de qualidade obrigatórios:
        </p>

        {error && <p className="error-message" role="alert">{error}</p>}

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="qc-checklist-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label className="qc-item-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: testDrive ? '#ecfdf5' : '#fff7ed', border: '1px solid', borderColor: testDrive ? '#a7f3d0' : '#fed7aa', borderRadius: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={testDrive} onChange={(e) => setTestDrive(e.target.checked)} style={{ width: 18, height: 18 }} />
                <div>
                  <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.92rem' }}>1. Test Drive de Verificação Realizado</strong>
                  <small style={{ color: '#64748b' }}>Teste dinâmico de rodagem efetuado sem ruídos ou anomalias.</small>
                </div>
              </div>
            </label>

            <label className="qc-item-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: wheelTorque ? '#ecfdf5' : '#fff7ed', border: '1px solid', borderColor: wheelTorque ? '#a7f3d0' : '#fed7aa', borderRadius: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={wheelTorque} onChange={(e) => setWheelTorque(e.target.checked)} style={{ width: 18, height: 18 }} />
                <div>
                  <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.92rem' }}>2. Torque das Rodas & Apertos Rechecados</strong>
                  <small style={{ color: '#64748b' }}>Aperto de parafusos de roda e suspensão conferidos com torquímetro.</small>
                </div>
              </div>
            </label>

            <label className="qc-item-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: fluids ? '#ecfdf5' : '#fff7ed', border: '1px solid', borderColor: fluids ? '#a7f3d0' : '#fed7aa', borderRadius: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={fluids} onChange={(e) => setFluids(e.target.checked)} style={{ width: 18, height: 18 }} />
                <div>
                  <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.92rem' }}>3. Níveis de Óleo & Fluídos Verificados</strong>
                  <small style={{ color: '#64748b' }}>Óleo do motor, arrefecimento, freio e direção no nível correto.</small>
                </div>
              </div>
            </label>

            <label className="qc-item-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: dashboardLights ? '#ecfdf5' : '#fff7ed', border: '1px solid', borderColor: dashboardLights ? '#a7f3d0' : '#fed7aa', borderRadius: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={dashboardLights} onChange={(e) => setDashboardLights(e.target.checked)} style={{ width: 18, height: 18 }} />
                <div>
                  <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.92rem' }}>4. Luzes de Alerta do Painel Zeradas</strong>
                  <small style={{ color: '#64748b' }}>Nenhuma luz de injeção, freio ou revisões acesa no painel.</small>
                </div>
              </div>
            </label>

            <label className="qc-item-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: washCleaned ? '#ecfdf5' : '#fff7ed', border: '1px solid', borderColor: washCleaned ? '#a7f3d0' : '#fed7aa', borderRadius: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={washCleaned} onChange={(e) => setWashCleaned(e.target.checked)} style={{ width: 18, height: 18 }} />
                <div>
                  <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.92rem' }}>5. Veículo Higienizado & Limpo</strong>
                  <small style={{ color: '#64748b' }}>Volante, manopla, bancos e exterior limpos sem marcas de graxa.</small>
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              Observações Adicionais da Inspeção:
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Pneu dianteiro direito calibrado com 32 PSI."
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-btn" style={{ background: '#10b981' }} disabled={submitting}>
              {submitting ? 'Aprovando...' : 'Aprovar Qualidade & Liberar OS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
