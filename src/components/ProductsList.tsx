import { AlertCircle, Plus, Search, Tag, Package, DollarSign } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { Product, ProductKind } from '../types/database'

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export function ProductsList({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadProducts() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', activeTenant.tenantId)
      .order('code', { ascending: true })

    if (fetchError) {
      setError('Erro ao carregar produtos.')
    } else {
      setProducts((data as Product[]) || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadProducts()
  }, [activeTenant.tenantId])

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    const groupName = String(form.get('groupName')).trim() || null
    const kind = (form.get('kind') as ProductKind) || 'part'
    const unit = String(form.get('unit')).trim() || 'UN'
    const costPrice = Number(form.get('costPrice')) || 0
    const sellPrice = Number(form.get('sellPrice')) || 0
    const stockCurrent = Number(form.get('stockCurrent')) || 0
    const stockMin = Number(form.get('stockMin')) || 0
    const ncm = String(form.get('ncm')).trim() || null

    try {
      // Calculate next code
      const { data: maxCodeData } = await supabase
        .from('products')
        .select('code')
        .eq('tenant_id', activeTenant.tenantId)
        .order('code', { ascending: false })
        .limit(1)

      const nextCode = (maxCodeData?.[0]?.code || 0) + 1

      const { error: insertError } = await supabase.from('products').insert({
        tenant_id: activeTenant.tenantId,
        code: nextCode,
        name,
        group_name: groupName,
        kind,
        unit,
        cost_price: costPrice,
        sell_price: sellPrice,
        stock_current: stockCurrent,
        stock_min: stockMin,
        ncm,
      })

      if (insertError) throw new Error(insertError.message)

      setShowModal(false)
      void loadProducts()
    } catch (err: any) {
      setError(err?.message || 'Falha ao cadastrar produto.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toString().includes(search) ||
      (p.group_name && p.group_name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <section className="screen-section">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Estoque & Serviços</p>
          <h1>Produtos e Serviços ({products.length})</h1>
        </div>
        <button type="button" className="primary-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Novo Produto / Serviço
        </button>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar por código, nome ou grupo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}

      {loading ? (
        <p className="status-message">Carregando catálogo...</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">Nenhum produto ou serviço cadastrado.</p>
      ) : (
        <div className="data-table">
          <div className="data-row data-head">
            <span>Cód</span>
            <span>Nome / Grupo</span>
            <span>Tipo</span>
            <span>Estoque</span>
            <span>Custo</span>
            <span>Venda</span>
          </div>
          {filtered.map((prod) => {
            const isLowStock = prod.kind === 'part' && prod.stock_current <= prod.stock_min
            return (
              <div key={prod.id} className="data-row">
                <strong>#{prod.code}</strong>
                <div>
                  <strong>{prod.name}</strong>
                  {prod.group_name && <small className="sub-copy"> {prod.group_name}</small>}
                </div>
                <span>
                  <Tag size={12} /> {prod.kind === 'part' ? 'Peça' : prod.kind === 'labor' ? 'Mão de Obra' : 'Serviço'}
                </span>
                <span>
                  {prod.kind === 'part' ? (
                    <span className={isLowStock ? 'stock-badge low' : 'stock-badge ok'}>
                      {prod.stock_current} {prod.unit}
                      {isLowStock && <span title="Estoque baixo"><AlertCircle size={12} /></span>}
                    </span>
                  ) : (
                    '-'
                  )}
                </span>
                <span>{formatCurrency(prod.cost_price)}</span>
                <strong>{formatCurrency(prod.sell_price)}</strong>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Cadastrar Produto / Serviço</h2>
            <form onSubmit={(e) => void handleCreateProduct(e)}>
              <div className="form-grid">
                <label className="wide-field">
                  Nome do Item *
                  <input name="name" required placeholder="Ex: Lâmpada 1 Polo W21W / Troca de Óleo" />
                </label>

                <label>
                  Grupo / Categoria
                  <input name="groupName" placeholder="Ex: Iluminação, Freios, Motor" />
                </label>

                <label>
                  Tipo *
                  <select name="kind" defaultValue="part">
                    <option value="part">Peça / Mercadoria</option>
                    <option value="labor">Mão de Obra</option>
                    <option value="service">Serviço Terceirizado</option>
                  </select>
                </label>

                <label>
                  Unidade
                  <input name="unit" defaultValue="UN" placeholder="UN, L, KG, HR" />
                </label>

                <label>
                  Preço Custo (R$)
                  <input name="costPrice" type="number" step="0.01" min="0" defaultValue="0" />
                </label>

                <label>
                  Preço Venda (R$) *
                  <input name="sellPrice" type="number" step="0.01" min="0" required defaultValue="0" />
                </label>

                <label>
                  Estoque Atual
                  <input name="stockCurrent" type="number" step="1" defaultValue="0" />
                </label>

                <label>
                  Estoque Mínimo
                  <input name="stockMin" type="number" step="1" defaultValue="0" />
                </label>

                <label>
                  NCM
                  <input name="ncm" placeholder="Ex: 85392110" />
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="primary-btn">
                  {submitting ? 'Salvando...' : 'Salvar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
