import { FormEvent, ReactNode, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseConfig, supabase } from '../lib/supabase'
import {
  ActiveTenantContext,
  getActiveTenant,
  toTenantOnboardingArgs,
} from '../lib/tenant'
import type { TenantRole } from '../types/database'

interface AuthGateProps {
  children: (activeTenant: ActiveTenantContext) => ReactNode
}

interface MembershipResponse {
  tenant_id: string
  role: TenantRole
  tenants: { name: string } | null
}

type AuthMode = 'signIn' | 'signUp'

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : 'Nao foi possivel concluir esta acao.'
}

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [activeTenant, setActiveTenant] = useState<ActiveTenantContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [mode, setMode] = useState<AuthMode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [tenantDocument, setTenantDocument] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')

  const loadMembership = async (currentSession: Session) => {
    setLoading(true)
    setError(null)
    setMembershipError(null)

    const { data, error: membershipError } = await supabase
      .from('tenant_members')
      .select('tenant_id, role, tenants ( name )')
      .eq('user_id', currentSession.user.id)
      .limit(1)
      .maybeSingle()

    if (membershipError) {
      setActiveTenant(null)
      setMembershipError(messageFor(membershipError))
      setError(messageFor(membershipError))
    } else {
      setActiveTenant(
        data
          ? getActiveTenant(currentSession.user.id, data as unknown as MembershipResponse)
          : null,
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!getSupabaseConfig().configured) {
      setError('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar o Automec.')
      setLoading(false)
      return
    }

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError(messageFor(sessionError))
        setLoading(false)
        return
      }

      setSession(data.session)
      if (data.session) {
        void loadMembership(data.session)
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setActiveTenant(null)
      setNotice(null)
      if (nextSession) {
        void loadMembership(nextSession)
      } else {
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const submitCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    const response =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (response.error) {
      setError(messageFor(response.error))
      setLoading(false)
      return
    }

    if (mode === 'signUp' && !response.data.session) {
      setNotice('Confira seu e-mail para confirmar o cadastro antes de entrar.')
      setLoading(false)
    }
  }

  const createTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session) return

    setError(null)
    setLoading(true)
    const { error: rpcError } = await supabase.rpc(
      'create_tenant_with_owner',
      toTenantOnboardingArgs({ name: tenantName, document: tenantDocument, phone: tenantPhone }),
    )

    if (rpcError) {
      setError(messageFor(rpcError))
      setLoading(false)
      return
    }

    await loadMembership(session)
  }

  if (loading) {
    return <main className="auth-page"><p className="status-message">Carregando...</p></main>
  }

  if (!getSupabaseConfig().configured) {
    return <main className="auth-page"><p className="error-message">{error}</p></main>
  }

  if (!session) {
    return (
      <main className="auth-page">
        <section className="auth-panel" aria-labelledby="auth-title">
          <p className="eyebrow">Automec</p>
          <h1 id="auth-title">Acesso da oficina</h1>
          <form className="stack-form" onSubmit={submitCredentials}>
            <label>E-mail<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Senha<input type="password" autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            {error && <p className="error-message" role="alert">{error}</p>}
            {notice && <p className="notice-message">{notice}</p>}
            <button type="submit">{mode === 'signIn' ? 'Entrar' : 'Criar conta'}</button>
          </form>
          <button className="text-button" type="button" onClick={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setError(null); setNotice(null) }}>
            {mode === 'signIn' ? 'Criar um acesso' : 'Ja tenho acesso'}
          </button>
        </section>
      </main>
    )
  }

  if (!activeTenant) {
    if (membershipError) {
      return (
        <main className="auth-page">
          <section className="auth-panel">
            <p className="error-message" role="alert">Nao foi possivel validar sua oficina. Verifique a sessao e as permissoes RLS.</p>
            <button className="text-button" type="button" onClick={() => void supabase.auth.signOut()}>Sair</button>
          </section>
        </main>
      )
    }

    return (
      <main className="auth-page">
        <section className="auth-panel" aria-labelledby="onboarding-title">
          <p className="eyebrow">Primeiro acesso</p>
          <h1 id="onboarding-title">Cadastre sua oficina</h1>
          <form className="stack-form" onSubmit={createTenant}>
            <label>Nome da oficina<input value={tenantName} onChange={(event) => setTenantName(event.target.value)} required /></label>
            <label>CNPJ ou CPF<input value={tenantDocument} onChange={(event) => setTenantDocument(event.target.value)} /></label>
            <label>Telefone<input type="tel" value={tenantPhone} onChange={(event) => setTenantPhone(event.target.value)} /></label>
            {error && <p className="error-message" role="alert">{error}</p>}
            <button type="submit">Criar oficina</button>
          </form>
          <button className="text-button" type="button" onClick={() => void supabase.auth.signOut()}>Sair</button>
        </section>
      </main>
    )
  }

  return <>{children(activeTenant)}</>
}
