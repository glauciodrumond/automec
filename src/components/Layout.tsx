import { LayoutDashboard, ClipboardList, Package, Users, DollarSign, LogOut, Wrench, ChevronRight, UserCheck, BarChart3, Calendar, KanbanSquare, Award, Kanban } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'

interface LayoutProps {
  activeTenant: ActiveTenantContext
  children: React.ReactNode
}

const roleLabels = {
  owner: 'Proprietário',
  admin: 'Administrador',
  technician: 'Técnico',
}

export function Layout({ activeTenant, children }: LayoutProps) {
  return (
    <div className="enterprise-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Wrench size={22} />
          </div>
          <div className="brand-text">
            <strong>Automec</strong>
            <small>SaaS Oficina</small>
          </div>
        </div>

        <div className="tenant-selector-pill">
          <span>Oficina Ativa:</span>
          <strong>{activeTenant.tenantName}</strong>
        </div>

        <nav className="sidebar-nav">
          <NavLink end to="/" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>

          <NavLink to="/kanban" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <KanbanSquare size={18} />
            <span>Kanban OS</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>

          <NavLink to="/orders" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <ClipboardList size={18} />
            <span>Ordens de Serviço</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>

          <NavLink to="/kanban" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <Kanban size={18} />
            <span>Kanban</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>

          <NavLink to="/schedule" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <Calendar size={18} />
            <span>Agenda</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>

          <NavLink to="/products" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <Package size={18} />
            <span>Estoque & Peças</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>

          <NavLink to="/customers" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <UserCheck size={18} />
            <span>Clientes & CRM</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>

          <NavLink to="/financial" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <DollarSign size={18} />
            <span>Financeiro & DRE</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>

          <NavLink to="/commissions" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <Award size={18} />
            <span>Comissões</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>

          <NavLink to="/team" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <Users size={18} />
            <span>Equipe</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <span className="role-tag">{roleLabels[activeTenant.role]}</span>
          </div>
          <button
            type="button"
            className="logout-btn"
            title="Sair do sistema"
            onClick={() => void supabase.auth.signOut()}
          >
            <LogOut size={16} /> <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="main-workspace">
        <header className="workspace-header">
          <div className="header-greeting">
            <h2>{activeTenant.tenantName}</h2>
          </div>
        </header>
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  )
}
