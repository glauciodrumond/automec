import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { TenantMember, TenantRole } from '../types/database'

interface TeamMembersProps {
  activeTenant: ActiveTenantContext
}

const roleLabels: Record<TenantRole, string> = {
  owner: 'Proprietario',
  admin: 'Administrador',
  technician: 'Tecnico',
}

export function TeamMembers({ activeTenant }: TeamMembersProps) {
  const [members, setMembers] = useState<TenantMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadMembers = async () => {
      setLoading(true)
      const { data, error: membersError } = await supabase
        .from('tenant_members')
        .select('tenant_id, user_id, role, created_at')
        .eq('tenant_id', activeTenant.tenantId)
        .order('created_at')

      if (!active) return
      if (membersError) {
        setError(membersError.message)
      } else {
        setMembers((data ?? []) as TenantMember[])
      }
      setLoading(false)
    }

    void loadMembers()
    return () => { active = false }
  }, [activeTenant.tenantId])

  return (
    <section className="screen-section" aria-labelledby="team-title">
      <div className="screen-heading"><div><p className="eyebrow">{activeTenant.tenantName}</p><h1 id="team-title">Equipe</h1></div></div>
      {loading && <p className="status-message">Carregando equipe...</p>}
      {error && <p className="error-message" role="alert">Nao foi possivel carregar a equipe. Verifique a sessao e as permissoes RLS.</p>}
      {!loading && !error && members.length === 0 && <p className="empty-state">Nenhum membro esta visivel para esta oficina.</p>}
      {!loading && !error && members.length > 0 && (
        <div className="data-table" role="table" aria-label="Membros da equipe">
          <div className="data-row data-head" role="row"><span role="columnheader">Membro</span><span role="columnheader">Funcao</span><span role="columnheader">Entrada</span></div>
          {members.map((member) => (
            <div className="data-row" role="row" key={member.user_id}>
              <span role="cell">{member.user_id === activeTenant.userId ? 'Voce' : `Membro ${member.user_id.slice(0, 8)}`}</span>
              <span role="cell"><span className="role-badge">{roleLabels[member.role]}</span></span>
              <span role="cell">{new Date(member.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
