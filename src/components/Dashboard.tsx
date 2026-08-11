import { DollarSign, Wrench, AlertTriangle, ArrowUpRight, Plus, Users, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { Product, ServiceOrder } from '../types/database'

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export function Dashboard({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  async function loadDashboard() {
    setLoading(true)
    const [{ data: orderData }, { data: productData }] = await Promise.all([
      supabase
        .from('service_orders')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .order('entry_at', { ascending: false }),
      supabase
        .from('products')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .eq('kind', 'part'),
    ])

    const loadedOrders = (orderData as ServiceOrder[]) || []
    const loadedProducts = (productData as Product[]) || []

    setOrders(loadedOrders)
    setLowStockProducts(loadedProducts.filter((p) => p.stock_current <= p.stock_min))
    setLoading(false)
  }

  useEffect(() => {
    void loadDashboard()
  }, [activeTenant.tenantId])

  const openOrders = orders.filter((o) => ['open', 'in_progress', 'waiting_parts'].includes(o.status))
  const completedOrders = orders.filter((o) => o.status === 'completed')

  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const avgTicket = completedOrders.length ? totalRevenue / completedOrders.length : 0

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Painel de Controle</p>
          <h1>Dashboard da Oficina</h1>
        </div>
        <div className="header-actions">
          <Link to="/orders/new" className="primary-btn">
            <Plus size={18} /> Nova Ordem de Serviço
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary-accent">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-body">
            <span>Faturamento Concluído</span>
            <strong>{formatCurrency(totalRevenue)}</strong>
            <small>{completedOrders.length} OSs concluídas</small>
          </div>
        </div>

        <div className="metric-card info-accent">
          <div className="metric-icon">
            <Wrench size={24} />
          </div>
          <div className="metric-body">
            <span>OSs em Andamento</span>
            <strong>{openOrders.length}</strong>
            <small>Abertas, diagnóstico e execução</small>
          </div>
        </div>

        <div className="metric-card success-accent">
          <div className="metric-icon">
            <ShoppingBag size={24} />
          </div>
          <div className="metric-body">
            <span>Ticket Médio por OS</span>
            <strong>{formatCurrency(avgTicket)}</strong>
            <small>Média por atendimento</small>
          </div>
        </div>

        <div className="metric-card warning-accent">
          <div className="metric-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="metric-body">
            <span>Estoque Crítico</span>
            <strong>{lowStockProducts.length}</strong>
            <small>Itens no mínimo ou zerados</small>
          </div>
        </div>
      </div>

      <div className="dashboard-content-split">
        {/* Recent OS List */}
        <div className="dashboard-block main-block">
          <div className="block-header">
            <h2>Últimas Ordens de Serviço</h2>
            <Link to="/orders" className="text-link">
              Ver todas <ArrowUpRight size={14} />
            </Link>
          </div>

          {loading ? (
            <p className="status-message">Carregando painel...</p>
          ) : orders.length === 0 ? (
            <p className="empty-state">Nenhuma ordem de serviço registrada.</p>
          ) : (
            <div className="data-table">
              <div className="data-row data-head">
                <span>OS</span>
                <span>Data</span>
                <span>Status</span>
                <span>Etapa</span>
                <span>Total</span>
                <span>Ação</span>
              </div>
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="data-row">
                  <strong>#{o.code}</strong>
                  <span>{new Date(o.entry_at).toLocaleDateString('pt-BR')}</span>
                  <span className={`status-badge status-${o.status}`}>{o.status}</span>
                  <span className="stage-badge">{o.stage || 'Entrada'}</span>
                  <strong>{formatCurrency(o.total_amount || 0)}</strong>
                  <Link to={`/orders/${o.id}`} className="secondary-btn btn-sm">
                    Abrir
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Alerts Block */}
        <div className="dashboard-block side-block">
          <div className="block-header">
            <h2>Alertas de Peças</h2>
            <Link to="/products" className="text-link">
              Gerenciar <ArrowUpRight size={14} />
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="notice-message">Todos os itens de estoque estão normais.</p>
          ) : (
            <div className="stock-alert-list">
              {lowStockProducts.slice(0, 5).map((p) => (
                <div key={p.id} className="stock-alert-item">
                  <div>
                    <strong>{p.name}</strong>
                    <small>Mínimo: {p.stock_min} {p.unit}</small>
                  </div>
                  <span className="stock-count low">
                    {p.stock_current} {p.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
