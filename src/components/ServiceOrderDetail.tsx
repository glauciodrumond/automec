import { ArrowLeft, Plus, Trash2, Save, Tag, Printer, CheckCircle, Share2 } from 'lucide-react'
import { FormEvent, useEffect, useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckinPanel } from './CheckinPanel'
import { PrintableServiceOrder } from './PrintableServiceOrder'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { Customer, Product, ServiceOrder, ServiceOrderItem, ServiceOrderItemKind, ServiceOrderStage, Tenant, Vehicle } from '../types/database'

type Tab = 'summary' | 'checkin' | 'items' | 'photos'
const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'summary', label: 'Resumo' },
  { id: 'checkin', label: 'Check-in' },
  { id: 'items', label: 'Itens & Serviços' },
  { id: 'photos', label: 'Fotos' },
]

const stageLabels: Array<{ id: ServiceOrderStage; label: string }> = [
  { id: 'entry', label: '1. Entrada' },
  { id: 'diagnosis', label: '2. Diagnóstico' },
  { id: 'waiting_parts', label: '3. Aguard. Peça' },
  { id: 'in_execution', label: '4. Em Execução' },
  { id: 'ready', label: '5. Pronto' },
  { id: 'delivered', label: '6. Entregue' },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function ServiceOrderDetail({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const { id } = useParams()
  const tabId = useId()
  const [tab, setTab] = useState<Tab>('summary')
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [items, setItems] = useState<ServiceOrderItem[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [foundDefectInput, setFoundDefectInput] = useState('')
  const [savingDefect, setSavingDefect] = useState(false)

  async function loadOrder() {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const { data: loadedOrder, error: orderError } = await supabase
        .from('service_orders')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .eq('id', id)
        .maybeSingle()

      if (orderError || !loadedOrder) {
        setError('Ordem de serviço não encontrada.')
        setLoading(false)
        return
      }

      const typedOrder = loadedOrder as ServiceOrder
      setOrder(typedOrder)
      setFoundDefectInput(typedOrder.found_defect || '')

      const [{ data: loadedTenant }, { data: loadedCustomer }, { data: loadedVehicle }, { data: loadedItems }, { data: loadedProducts }] =
        await Promise.all([
          supabase.from('tenants').select('*').eq('id', activeTenant.tenantId).maybeSingle(),
          supabase.from('customers').select('*').eq('tenant_id', activeTenant.tenantId).eq('id', typedOrder.customer_id).maybeSingle(),
          supabase.from('vehicles').select('*').eq('tenant_id', activeTenant.tenantId).eq('id', typedOrder.vehicle_id).maybeSingle(),
          supabase.from('service_order_items').select('*').eq('tenant_id', activeTenant.tenantId).eq('service_order_id', typedOrder.id).order('created_at', { ascending: true }),
          supabase.from('products').select('*').eq('tenant_id', activeTenant.tenantId).eq('active', true).order('name', { ascending: true }),
        ])

      setTenant((loadedTenant as Tenant | null) ?? null)
      setCustomer((loadedCustomer as Customer | null) ?? null)
      setVehicle((loadedVehicle as Vehicle | null) ?? null)
      setItems((loadedItems as ServiceOrderItem[] | null) ?? [])
      setAvailableProducts((loadedProducts as Product[] | null) ?? [])
    } catch (err: any) {
      setError('Erro ao carregar OS.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrder()
  }, [activeTenant.tenantId, id])

  async function updateTotals(currentItems: ServiceOrderItem[]) {
    if (!order) return
    const partsTotal = currentItems.filter((i) => i.kind === 'part').reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
    const laborTotal = currentItems.filter((i) => i.kind !== 'part').reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
    const discount = order.discount_amount || 0
    const totalAmount = Math.max(0, partsTotal + laborTotal - discount)

    setOrder((prev) => (prev ? { ...prev, parts_total: partsTotal, labor_total: laborTotal, total_amount: totalAmount } : prev))

    await supabase
      .from('service_orders')
      .update({
        parts_total: partsTotal,
        labor_total: laborTotal,
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', activeTenant.tenantId)
      .eq('id', order.id)
  }

  async function handleStageChange(newStage: ServiceOrderStage) {
    if (!order) return
    setOrder((prev) => (prev ? { ...prev, stage: newStage } : prev))
    await supabase
      .from('service_orders')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('tenant_id', activeTenant.tenantId)
      .eq('id', order.id)
  }

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!order) return
    setError(null)

    const form = new FormData(event.currentTarget)
    const productIdRaw = String(form.get('productId') || '').trim()
    const productId = productIdRaw && productIdRaw !== '' ? productIdRaw : null
    const kind = (form.get('kind') as ServiceOrderItemKind) || 'part'
    const description = String(form.get('description')).trim()
    const quantity = Number(form.get('quantity')) || 1
    const unitPrice = Number(form.get('unitPrice')) || 0

    if (!description) return

    const { data: newItem, error: insertError } = await supabase
      .from('service_order_items')
      .insert({
        tenant_id: activeTenant.tenantId,
        service_order_id: order.id,
        product_id: productId,
        kind,
        description,
        quantity,
        unit_price: unitPrice,
      })
      .select()
      .single()

    if (insertError) {
      setError('Falha ao adicionar item: ' + (insertError.message || 'Erro desconhecido'))
      return
    }

    if (!newItem) {
      setError('Falha ao adicionar item: Erro desconhecido')
      return
    }

    const updatedItems = [...items, newItem as ServiceOrderItem]
    setItems(updatedItems)
    setShowItemModal(false)
    await updateTotals(updatedItems)
  }

  async function handleDeleteItem(itemId: string) {
    if (!order) return
    const { error: deleteError } = await supabase
      .from('service_order_items')
      .delete()
      .eq('tenant_id', activeTenant.tenantId)
      .eq('id', itemId)

    if (deleteError) {
      setError('Falha ao remover item.')
      return
    }

    const updatedItems = items.filter((i) => i.id !== itemId)
    setItems(updatedItems)
    await updateTotals(updatedItems)
  }

  async function handleSendPortalLink() {
    if (!order) return
    const { data: tokenValue } = await supabase.rpc('get_or_create_order_token', {
      p_service_order_id: order.id,
    })
    if (tokenValue) {
      const portalUrl = `${window.location.origin}/portal/${tokenValue as string}`
      const phone = customer?.phone?.replace(/\D/g, '')
      if (phone) {
        const msg = `Olá ${customer?.name ?? ''}! Acesse o status do seu veículo e aprove o orçamento: ${portalUrl}`
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank')
      } else {
        await navigator.clipboard.writeText(portalUrl)
        alert('Link copiado para a área de transferência!')
      }
    } else {
      alert('Não foi possível gerar o link do portal. Verifique a configuração.')
    }
  }

  async function handleSaveFoundDefect() {
    if (!order) return
    setSavingDefect(true)
    const { error: updateError } = await supabase
      .from('service_orders')
      .update({ found_defect: foundDefectInput.trim() || null, updated_at: new Date().toISOString() })
      .eq('tenant_id', activeTenant.tenantId)
      .eq('id', order.id)

    if (updateError) {
      setError('Falha ao salvar defeito encontrado.')
    } else {
      setOrder((prev) => (prev ? { ...prev, found_defect: foundDefectInput.trim() || null } : prev))
    }
    setSavingDefect(false)
  }

  function handleProductSelect(productId: string, form: HTMLFormElement) {
    const prod = availableProducts.find((p) => p.id === productId)
    if (prod) {
      const descInput = form.elements.namedItem('description') as HTMLInputElement
      const priceInput = form.elements.namedItem('unitPrice') as HTMLInputElement
      const kindSelect = form.elements.namedItem('kind') as HTMLSelectElement
      if (descInput) descInput.value = prod.name
      if (priceInput) priceInput.value = prod.sell_price.toString()
      if (kindSelect) kindSelect.value = prod.kind
    }
  }

  if (loading) return <p className="status-message">Carregando ordem...</p>
  if (error && !order)
    return (
      <section className="screen-section">
        <Link className="secondary-link" to="/orders">
          <ArrowLeft aria-hidden="true" size={18} /> Voltar
        </Link>
        <p className="error-message" role="alert">{error}</p>
      </section>
    )
  if (!order) return null

  const partsTotal = items.filter((i) => i.kind === 'part').reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
  const laborTotal = items.filter((i) => i.kind !== 'part').reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
  const totalAmount = partsTotal + laborTotal - (order.discount_amount || 0)
  const currentStage = order.stage || 'entry'

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Ordem de serviço #{order.code}</p>
          <h1>OS {order.code} - {order.status.toUpperCase()}</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-btn" onClick={() => void handleSendPortalLink()}>
            <Share2 size={16} /> Enviar Link ao Cliente
          </button>
          <button type="button" className="secondary-btn" onClick={() => setShowPrintModal(true)}>
            <Printer size={16} /> Imprimir / PDF
          </button>
          <Link className="secondary-link" to="/orders">
            <ArrowLeft aria-hidden="true" size={18} /> Voltar
          </Link>
        </div>
      </div>

      {/* Stage Stepper */}
      <div className="stage-stepper">
        {stageLabels.map((stg) => {
          const isCurrent = currentStage === stg.id
          return (
            <button
              key={stg.id}
              type="button"
              className={isCurrent ? 'step-btn active' : 'step-btn'}
              onClick={() => void handleStageChange(stg.id)}
            >
              <CheckCircle size={14} /> {stg.label}
            </button>
          )
        })}
      </div>

      <section className="order-header" aria-label="Dados da ordem">
        <div>
          <span>Status</span>
          <strong>{order.status}</strong>
        </div>
        <div>
          <span>Veículo</span>
          <strong>{vehicle?.plate ?? 'Sem placa'}</strong>
        </div>
        <div>
          <span>Cliente</span>
          <strong>{customer?.name ?? 'Não encontrado'}</strong>
        </div>
        <div>
          <span>Entrada</span>
          <strong>{formatDate(order.entry_at)}</strong>
        </div>
        <div>
          <span>Km</span>
          <strong>{order.odometer?.toLocaleString('pt-BR') ?? '-'} km</strong>
        </div>
      </section>

      {/* Financial Summary Banner */}
      <div className="financial-banner">
        <div><span>Peças / Produtos</span><strong>{formatCurrency(partsTotal)}</strong></div>
        <div><span>Mão de Obra / Serviços</span><strong>{formatCurrency(laborTotal)}</strong></div>
        <div><span>Desconto</span><strong>{formatCurrency(order.discount_amount || 0)}</strong></div>
        <div className="total-highlight"><span>Total OS</span><strong>{formatCurrency(totalAmount)}</strong></div>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}

      <div className="tabs" role="tablist" aria-label="Detalhes da ordem">
        {tabs.map((item) => (
          <button
            type="button"
            role="tab"
            key={item.id}
            id={`${tabId}-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`${tabId}-panel`}
            className={tab === item.id ? 'tab-button active' : 'tab-button'}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${tab}`} className="tab-panel">
        {tab === 'summary' && (
          <div className="detail-copy">
            <h2>Resumo Técnico</h2>
            <p><strong>Defeito Reclamado (Cliente):</strong> {order.complaint || 'Não informado.'}</p>
            <p><strong>Veículo:</strong> {[vehicle?.brand, vehicle?.model, vehicle?.year, vehicle?.color].filter(Boolean).join(' ') || 'Dados não informados.'}</p>

            <div className="defect-box">
              <label>
                <strong>Defeito Encontrado (Diagnóstico da Oficina):</strong>
                <textarea
                  rows={4}
                  value={foundDefectInput}
                  placeholder="Descreva o diagnóstico técnico..."
                  onChange={(e) => setFoundDefectInput(e.target.value)}
                />
              </label>
              <button type="button" className="primary-btn" disabled={savingDefect} onClick={() => void handleSaveFoundDefect()}>
                <Save size={16} /> {savingDefect ? 'Salvando...' : 'Salvar Diagnóstico'}
              </button>
            </div>
          </div>
        )}

        {tab === 'checkin' && <CheckinPanel activeTenant={activeTenant} serviceOrderId={order.id} mode="checkin" />}

        {tab === 'items' && (
          <div className="items-tab-content">
            <div className="tab-toolbar">
              <h2>Itens da Ordem de Serviço</h2>
              <button type="button" className="primary-btn" onClick={() => setShowItemModal(true)}>
                <Plus size={16} /> Adicionar Item / Peça
              </button>
            </div>

            {items.length === 0 ? (
              <p className="empty-state">Nenhum produto ou serviço cadastrado nesta OS.</p>
            ) : (
              <div className="data-table items-table">
                <div className="data-row data-head">
                  <span>Tipo</span>
                  <span>Descrição</span>
                  <span>Qtd</span>
                  <span>Unitário</span>
                  <span>Total</span>
                  <span>Ação</span>
                </div>
                {items.map((item) => (
                  <div className="data-row" key={item.id}>
                    <span>
                      <Tag size={12} /> {item.kind === 'part' ? 'Peça' : item.kind === 'labor' ? 'Mão de Obra' : 'Serviço'}
                    </span>
                    <strong>{item.description}</strong>
                    <span>{item.quantity}</span>
                    <span>{formatCurrency(item.unit_price)}</span>
                    <strong>{formatCurrency(item.quantity * item.unit_price)}</strong>
                    <button type="button" className="icon-btn-danger" onClick={() => void handleDeleteItem(item.id)} title="Remover item">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'photos' && <CheckinPanel activeTenant={activeTenant} serviceOrderId={order.id} mode="photos" />}
      </section>

      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Adicionar Item à OS</h2>
            <form onSubmit={(e) => void handleAddItem(e)}>
              <div className="form-grid">
                {availableProducts.length > 0 && (
                  <label className="wide-field">
                    Selecionar do Catálogo (Opcional)
                    <select name="productId" onChange={(e) => handleProductSelect(e.target.value, e.currentTarget.form!)}>
                      <option value="">-- Seleção livre (digitado manual) --</option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.code} - {p.name} ({formatCurrency(p.sell_price)})
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  Tipo de Item *
                  <select name="kind" defaultValue="part">
                    <option value="part">Peça / Produto</option>
                    <option value="labor">Mão de Obra</option>
                    <option value="other">Outros Serviços</option>
                  </select>
                </label>

                <label className="wide-field">
                  Descrição do Item *
                  <input name="description" required placeholder="Ex: Lâmpada 1 Polo / Pintura Para-choque" />
                </label>

                <label>
                  Quantidade *
                  <input name="quantity" type="number" step="0.01" min="0.01" defaultValue="1" required />
                </label>

                <label>
                  Valor Unitário (R$) *
                  <input name="unitPrice" type="number" step="0.01" min="0" defaultValue="0" required />
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowItemModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn">
                  Adicionar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPrintModal && tenant && (
        <PrintableServiceOrder
          tenant={tenant}
          order={order}
          customer={customer}
          vehicle={vehicle}
          items={items}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </section>
  )
}
