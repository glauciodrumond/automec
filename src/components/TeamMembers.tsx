import { UserPlus, Shield, DollarSign, Trash2, Edit2, CheckCircle2 } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'

interface TeamMember {
  tenant_id: string
  user_id: string
  role: 'owner' | 'admin' | 'technician'
  commission_pct: number | null
  commission_type: 'percentage' | 'fixed' | null
  created_at: string
}

const roleLabels: Record<string, { label: string; color: string }> = {
  owner: { label: 'Proprietário', color: '#2563eb' },
  admin: { label: 'Administrador', color: '#7c3aed' },
  technician: { label: 'Técnico / Mecânico', color: '#10b981' },
}

export function TeamMembers({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadMembers() {
    setLoading(true)
    setError(null)
    const { data, error: membersError } = await supabase
      .from('tenant_members')
      .select('tenant_id, user_id, role, commission_pct, commission_type, created_at')
      .eq('tenant_id', activeTenant.tenantId)
      .order('created_at', { ascending: true })

    if (membersError) {
      setError('Não foi possível carregar os membros da equipe: ' + membersError.message)
    } else {
      setMembers((data as TeamMember[]) || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadMembers()
  }, [activeTenant.tenantId])

  async function handleSaveMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setNotice(null)

    const form = new FormData(e.currentTarget)
    const userId = String(form.get('userId')).trim()
    const role = (form.get('role') as TeamMember['role']) || 'technician'
    const commissionPct = Number(form.get('commissionPct')) || 0
    const commissionType = (form.get('commissionType') as TeamMember['commission_type']) || 'percentage'

    if (!userId) {
      setError('O ID do Usuário é obrigatório.')
      setSubmitting(false)
      return
    }

    if (editingMember) {
      // Update existing
      const { error: updateError } = await supabase
        .from('tenant_members')
        .update({
          role,
          commission_pct: commissionPct,
          commission_type: commissionType,
        })
        .eq('tenant_id', activeTenant.tenantId)
        .eq('user_id', editingMember.user_id)

      if (updateError) {
        setError('Falha ao atualizar membro: ' + updateError.message)
      } else {
        setNotice('Membro atualizado com sucesso!')
        setShowModal(false)
        setEditingMember(null)
        void loadMembers()
      }
    } else {
      // Add new member
      const { error: insertError } = await supabase
        .from('tenant_members')
        .insert({
          tenant_id: activeTenant.tenantId,
          user_id: userId,
          role,
          commission_pct: commissionPct,
          commission_type: commissionType,
        })

      if (insertError) {
        setError('Falha ao adicionar membro: ' + insertError.message)
      } else {
        setNotice('Novo membro adicionado à equipe com sucesso!')
        setShowModal(false)
        void loadMembers()
      }
    }

    setSubmitting(false)
  }

  async function handleRemoveMember(userId: string) {
    if (userId === activeTenant.userId) {
      alert('Você não pode remover a si mesmo da oficina!')
      return
    }

    if (!confirm('Deseja realmente remover este membro da equipe?')) return

    const { error: deleteError } = await supabase
      .from('tenant_members')
      .delete()
      .eq('tenant_id', activeTenant.tenantId)
      .eq('user_id', userId)

    if (deleteError) {
      setError('Falha ao remover membro: ' + deleteError.message)
    } else {
      setNotice('Membro removido da equipe.')
      void loadMembers()
    }
  }

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">{activeTenant.tenantName}</p>
          <h1>Membros da Equipe & Permissões</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setEditingMember(null)
              setShowModal(true)
            }}
          >
            <UserPlus size={18} /> Adicionar Membro
          </button>
        </div>
      </div>

      {notice && <p className="notice-message">{notice}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}

      {loading ? (
        <p className="status-message">Carregando equipe...</p>
      ) : members.length === 0 ? (
        <p className="empty-state">Nenhum membro cadastrado nesta oficina.</p>
      ) : (
        <div className="data-table" role="table" aria-label="Membros da equipe">
          <div className="data-row data-head" role="row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 100px' }}>
            <span role="columnheader">Usuário / ID</span>
            <span role="columnheader">Cargo</span>
            <span role="columnheader">Comissão (%)</span>
            <span role="columnheader">Data de Entrada</span>
            <span role="columnheader">Ações</span>
          </div>
          {members.map((member) => {
            const roleInfo = roleLabels[member.role] || { label: member.role, color: '#64748b' }
            const isMe = member.user_id === activeTenant.userId

            return (
              <div className="data-row" role="row" key={member.user_id} style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 100px' }}>
                <span role="cell" style={{ fontWeight: 600 }}>
                  {isMe ? 'Você (' + member.user_id.slice(0, 8) + '...)' : member.user_id}
                </span>
                <span role="cell">
                  <span className="status-badge" style={{ background: `${roleInfo.color}15`, color: roleInfo.color, border: `1px solid ${roleInfo.color}40` }}>
                    <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {roleInfo.label}
                  </span>
                </span>
                <span role="cell" style={{ fontWeight: 700, color: '#10b981' }}>
                  {member.commission_pct ? `${member.commission_pct}% (${member.commission_type === 'fixed' ? 'Fixo' : 'Percentual'})` : '0%'}
                </span>
                <span role="cell">{new Date(member.created_at).toLocaleDateString('pt-BR')}</span>
                <span role="cell" style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="secondary-btn btn-sm"
                    title="Editar comissão/cargo"
                    onClick={() => {
                      setEditingMember(member)
                      setShowModal(true)
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  {!isMe && (
                    <button
                      type="button"
                      className="icon-btn-danger btn-sm"
                      title="Remover da equipe"
                      onClick={() => void handleRemoveMember(member.user_id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Adicionar / Editar Membro */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>
              <UserPlus size={20} />
              {editingMember ? 'Editar Membro da Equipe' : 'Adicionar Membro à Equipe'}
            </h2>
            <form onSubmit={(e) => void handleSaveMember(e)}>
              <div className="form-grid">
                <label className="wide-field">
                  ID do Usuário Supabase (UUID) *
                  <input
                    name="userId"
                    required
                    defaultValue={editingMember?.user_id || ''}
                    disabled={!!editingMember}
                    placeholder="e.g. 8838382c-4235-430b-9937-..."
                  />
                  <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>
                    ID da conta do usuário no Supabase Auth.
                  </small>
                </label>

                <label>
                  Cargo na Oficina *
                  <select name="role" defaultValue={editingMember?.role || 'technician'}>
                    <option value="technician">Técnico / Mecânico</option>
                    <option value="admin">Administrador</option>
                    <option value="owner">Proprietário</option>
                  </select>
                </label>

                <label>
                  % de Comissão
                  <input
                    name="commissionPct"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue={editingMember?.commission_pct ?? 0}
                    placeholder="10.00"
                  />
                </label>

                <label className="wide-field">
                  Tipo de Comissão
                  <select name="commissionType" defaultValue={editingMember?.commission_type || 'percentage'}>
                    <option value="percentage">Percentual sobre valor total da OS</option>
                    <option value="fixed">Valor Fixo por OS</option>
                  </select>
                </label>
              </div>

              <div className="form-actions" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setShowModal(false)
                    setEditingMember(null)
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? 'Salvando...' : editingMember ? 'Salvar Alterações' : 'Adicionar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
