import { ClipboardCheck, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { getCustomChecklists, addCustomChecklistItem } from '../services/autoosService'
import type { ActiveTenantContext } from '../lib/tenant'
import type { CustomChecklist } from '../types/database'

export function ChecklistConfig({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [checklists, setChecklists] = useState<CustomChecklist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState('Revisão Geral')
  const [itemLabel, setItemLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadChecklists() {
    setLoading(true)
    setError(null)

    try {
      const data = await getCustomChecklists(activeTenant.tenantId)
      setChecklists(data)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar checklists customizados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadChecklists()
  }, [activeTenant.tenantId])

  async function handleAddItem(e: FormEvent) {
    e.preventDefault()
    if (!itemLabel.trim() || !categoryName.trim()) return
    setSubmitting(true)

    try {
      await addCustomChecklistItem(activeTenant.tenantId, categoryName.trim(), itemLabel.trim())
      setItemLabel('')
      void loadChecklists()
    } catch (err: any) {
      setError(err?.message || 'Erro ao adicionar item de checklist')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="status-message">Carregando checklists de inspeção...</p>
  if (error) return <p className="error-message">{error}</p>

  // Group items by category
  const categories = Array.from(new Set(checklists.map((c) => c.category_name)))

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Configurações de Inspeção</p>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardCheck size={30} style={{ color: '#2563eb' }} />
            Checklists de Inspeção Personalizados ({checklists.length})
          </h1>
        </div>
      </div>

      {/* Add Item Form */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.05rem', margin: '0 0 14px', fontFamily: 'Outfit', color: '#0f172a' }}>Novo Item de Inspeção</h2>
        <form onSubmit={(e) => void handleAddItem(e)} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ flex: 1, minWidth: 200 }}>
            Categoria de Serviço
            <select value={categoryName} onChange={(e) => setCategoryName(e.target.value)}>
              <option value="Revisão Geral">Revisão Geral</option>
              <option value="Sistema de Freios">Sistema de Freios</option>
              <option value="Ar-Condicionado">Ar-Condicionado</option>
              <option value="Suspensão & Direção">Suspensão & Direção</option>
              <option value="Troca de Óleo & Filtros">Troca de Óleo & Filtros</option>
            </select>
          </label>

          <label style={{ flex: 2, minWidth: 280 }}>
            Descrição do Item de Inspeção *
            <input
              value={itemLabel}
              onChange={(e) => setItemLabel(e.target.value)}
              required
              placeholder="Ex: Verificar espessura das pastilhas de freio dianteiras"
            />
          </label>

          <button type="submit" className="primary-btn" disabled={submitting}>
            <Plus size={16} /> {submitting ? 'Adicionando...' : 'Adicionar ao Checklist'}
          </button>
        </form>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <p className="empty-state">Nenhum item customizado adicionado. Utilize o formulário acima.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {categories.map((cat) => {
            const catItems = checklists.filter((c) => c.category_name === cat)

            return (
              <div key={cat} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#0f172a', fontFamily: 'Outfit', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                  📋 {cat} ({catItems.length} itens)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {catItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>{item.item_label}</span>
                      <span className="status-badge status-completed" style={{ fontSize: '0.75rem' }}>Ativo</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
