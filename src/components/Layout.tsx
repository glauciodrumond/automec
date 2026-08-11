import { LogOut, Users, Wrench } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'

interface LayoutProps {
  activeTenant: ActiveTenantContext
  children: React.ReactNode
}

const roleLabels = {
  owner: 'Proprietario',
  admin: 'Administrador',
  technician: 'Tecnico',
}

export function Layout({ activeTenant, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-block"><Wrench aria-hidden="true" size={20} /><span>{activeTenant.tenantName}</span></div>
        <nav aria-label="Navegacao principal" className="main-nav">
          <NavLink end to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Ordens</NavLink>
          <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Estoque</NavLink>
          <NavLink to="/customers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Clientes</NavLink>
          <NavLink to="/team" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Users aria-hidden="true" size={16} />Equipe</NavLink>
        </nav>
        <div className="account-actions">
          <span className="role-badge">{roleLabels[activeTenant.role]}</span>
          <button className="icon-button" type="button" title="Sair" aria-label="Sair" onClick={() => void supabase.auth.signOut()}><LogOut aria-hidden="true" size={18} /></button>
        </div>
      </header>
      <main className="page-content">{children}</main>
    </div>
  )
}
