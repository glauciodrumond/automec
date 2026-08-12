import { LayoutDashboard, ClipboardList, Package, Users, DollarSign, LogOut, Wrench, ChevronRight, UserCheck, Calendar, KanbanSquare, Award, Search, Layers, Truck, Bot } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UniversalSearch } from './UniversalSearch'
import type { ActiveTenantContext } from '../lib/tenant'

interface LayoutProps {
  activeTenant: ActiveTenantContext
  children: React.ReactNode
}

const roleLabels = {
  owner: 'Proprietário',
  admin: 'Administrador',
  technician: 'Técnico / Mecânico',
}

export function Layout({ activeTenant, children }: LayoutProps) {
  const [showSearch, setShowSearch] = useState(false)

  return (
    <div className="enterprise-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon" style={{ background: '#2563eb' }}>
            <Wrench size={22} />
          </div>
          <div className="brand-text">
            <strong style={{ fontFamily: 'Outfit', fontSize: '1.3rem', letterSpacing: '0.02em' }}>AUTOOS</strong>
            <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Gestão Automotiva</small>
          </div>
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

          <NavLink to="/mechanic" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <Wrench size={18} />
            <span>Painel do Mecânico</span>
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

          <NavLink to="/crm-opportunities" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <Award size={18} />
            <span>Oportunidades & CRM</span>
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

          <NavLink to="/workstations" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <Layers size={18} />
            <span>Elevadores & Boxes</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>

          <NavLink to="/checklist-config" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <ClipboardList size={18} />
            <span>Checklists</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>

          <NavLink to="/purchases" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <Truck size={18} />
            <span>Compras & Entradas</span>
            <ChevronRight size={14} className="arrow-icon" />
          </NavLink>

          <NavLink to="/copilot" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <Bot size={18} />
            <span>Copiloto IA</span>
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
        <header className="workspace-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="header-greeting">
            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', color: '#0f172a' }}>{activeTenant.tenantName}</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Global Search Button */}
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setShowSearch(true)}
              style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#475569', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8 }}
            >
              <Search size={16} style={{ color: '#2563eb' }} />
              <span>Busca Universal</span>
              <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 6px', fontSize: '0.72rem', color: '#64748b' }}>Ctrl+K</kbd>
            </button>
          </div>
        </header>

        <main className="workspace-content">{children}</main>

        {/* Global Search Modal */}
        <UniversalSearch
          activeTenant={activeTenant}
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
        />
      </div>
    </div>
  )
}
