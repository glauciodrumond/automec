import { ArrowLeft } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckinPanel } from './CheckinPanel'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { Customer, ServiceOrder, ServiceOrderItem, Vehicle } from '../types/database'

type Tab = 'summary' | 'checkin' | 'items' | 'photos'
const tabs: Array<{ id: Tab; label: string }> = [{ id: 'summary', label: 'Resumo' }, { id: 'checkin', label: 'Check-in' }, { id: 'items', label: 'Itens' }, { id: 'photos', label: 'Fotos' }]

function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
function formatCurrency(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) }

export function ServiceOrderDetail({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const { id } = useParams()
  const tabId = useId()
  const [tab, setTab] = useState<Tab>('summary')
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [items, setItems] = useState<ServiceOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadOrder() {
      if (!id) return
      setLoading(true)
      const { data: loadedOrder, error: orderError } = await supabase.from('service_orders').select('*').eq('tenant_id', activeTenant.tenantId).eq('id', id).maybeSingle()
      if (!active) return
      if (orderError || !loadedOrder) { setError('Ordem de servico nao encontrada.'); setLoading(false); return }
      const typedOrder = loadedOrder as ServiceOrder
      const [{ data: loadedCustomer }, { data: loadedVehicle }, { data: loadedItems, error: itemsError }] = await Promise.all([
        supabase.from('customers').select('*').eq('tenant_id', activeTenant.tenantId).eq('id', typedOrder.customer_id).maybeSingle(),
        supabase.from('vehicles').select('*').eq('tenant_id', activeTenant.tenantId).eq('id', typedOrder.vehicle_id).maybeSingle(),
        supabase.from('service_order_items').select('*').eq('tenant_id', activeTenant.tenantId).eq('service_order_id', typedOrder.id).order('created_at', { ascending: true }),
      ])
      if (!active) return
      setOrder(typedOrder)
      setCustomer((loadedCustomer as Customer | null) ?? null)
      setVehicle((loadedVehicle as Vehicle | null) ?? null)
      if (itemsError) setError('Nao foi possivel carregar os itens da OS.')
      setItems((loadedItems as ServiceOrderItem[] | null) ?? [])
      setLoading(false)
    }
    void loadOrder()
    return () => { active = false }
  }, [activeTenant.tenantId, id])

  if (loading) return <p className="status-message">Carregando ordem...</p>
  if (error && !order) return <section className="screen-section"><Link className="secondary-link" to="/"><ArrowLeft aria-hidden="true" size={18} />Voltar</Link><p className="error-message" role="alert">{error}</p></section>
  if (!order) return null

  return <section className="screen-section">
    <div className="screen-heading"><div><p className="eyebrow">Ordem de servico</p><h1>OS {order.code}</h1></div><Link className="secondary-link" to="/"><ArrowLeft aria-hidden="true" size={18} />Voltar</Link></div>
    <section className="order-header" aria-label="Dados da ordem"><div><span>Status</span><strong>{order.status}</strong></div><div><span>Prioridade</span><strong>{order.priority}</strong></div><div><span>Veiculo</span><strong>{vehicle?.plate ?? 'Sem placa'}</strong></div><div><span>Cliente</span><strong>{customer?.name ?? 'Nao encontrado'}</strong></div><div><span>Entrada</span><strong>{formatDate(order.entry_at)}</strong></div><div><span>Hodometro</span><strong>{order.odometer?.toLocaleString('pt-BR') ?? '-' } km</strong></div></section>
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="tabs" role="tablist" aria-label="Detalhes da ordem">{tabs.map((item) => <button type="button" role="tab" key={item.id} id={`${tabId}-${item.id}`} aria-selected={tab === item.id} aria-controls={`${tabId}-panel`} className={tab === item.id ? 'tab-button active' : 'tab-button'} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
    <section id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${tab}`} className="tab-panel">
      {tab === 'summary' && <div className="detail-copy"><h2>Resumo</h2><p><strong>Reclamacao:</strong> {order.complaint || 'Nao informada.'}</p><p><strong>Veiculo:</strong> {[vehicle?.brand, vehicle?.model].filter(Boolean).join(' ') || 'Dados nao informados.'}</p></div>}
      {tab === 'checkin' && <CheckinPanel activeTenant={activeTenant} serviceOrderId={order.id} mode="checkin" />}
      {tab === 'items' && (items.length ? <div className="data-table items-table"><div className="data-row data-head"><span>Tipo</span><span>Descricao</span><span>Quantidade</span><span>Valor unitario</span></div>{items.map((item) => <div className="data-row" key={item.id}><span>{item.kind}</span><strong>{item.description}</strong><span>{item.quantity}</span><span>{formatCurrency(item.unit_price)}</span></div>)}</div> : <p className="empty-state">Nenhum item cadastrado nesta OS.</p>)}
      {tab === 'photos' && <CheckinPanel activeTenant={activeTenant} serviceOrderId={order.id} mode="photos" />}
    </section>
  </section>
}
