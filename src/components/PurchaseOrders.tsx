import { Truck, Plus, PackageCheck, Building2, CheckCircle2, Clock, Phone, Mail } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { getSuppliers, createSupplier, getPurchaseOrders, receivePurchaseOrder } from '../services/autoosService'
import { maskCpfCnpj, maskPhone } from '../lib/masks'
import type { ActiveTenantContext } from '../lib/tenant'
import type { Supplier, PurchaseOrder } from '../types/database'

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export function PurchaseOrders({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSupplierModal, setShowSupplierModal] = useState(false)

  const [supName, setSupName] = useState('')
  const [supCnpj, setSupCnpj] = useState('')
  const [supPhone, setSupPhone] = useState('')
  const [supEmail, setSupEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [supList, poList] = await Promise.all([
        getSuppliers(activeTenant.tenantId),
        getPurchaseOrders(activeTenant.tenantId),
      ])
      setSuppliers(supList)
      setOrders(poList)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados de compras')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [activeTenant.tenantId])

  async function handleAddSupplier(e: FormEvent) {
    e.preventDefault()
    if (!supName.trim()) return
    setSubmitting(true)

    try {
      await createSupplier(activeTenant.tenantId, {
        name: supName.trim(),
        cnpj: supCnpj.trim() || undefined,
        phone: supPhone.trim() || undefined,
        email: supEmail.trim() || undefined,
      })
      setShowSupplierModal(false)
      setSupName('')
      setSupCnpj('')
      setSupPhone('')
      setSupEmail('')
      void loadData()
    } catch (err: any) {
      setError(err?.message || 'Erro ao cadastrar fornecedor')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReceiveOrder(poId: string) {
    if (!confirm('Confirmar recebimento das peças e dar entrada automática no estoque?')) return
    await receivePurchaseOrder(activeTenant.tenantId, poId)
    void loadData()
  }

  if (loading) return <p className="status-message">Carregando portal de compras e fornecedores...</p>
  if (error) return <p className="error-message">{error}</p>

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Gestão de Suprimentos & Estoque</p>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Truck size={30} style={{ color: '#2563eb' }} />
            Compras, Fornecedores & Entradas de Peças
          </h1>
        </div>
        <div className="header-actions">
          <button type="button" className="primary-btn" onClick={() => setShowSupplierModal(true)}>
            <Building2 size={18} /> Novo Fornecedor
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Suppliers List Column */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: '1.05rem', margin: '0 0 14px', fontFamily: 'Outfit', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} style={{ color: '#2563eb' }} /> Fornecedores Cadastrados ({suppliers.length})
          </h2>

          {suppliers.length === 0 ? (
            <p className="empty-state">Nenhum fornecedor cadastrado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {suppliers.map((sup) => (
                <div key={sup.id} style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0f172a' }}>{sup.name}</strong>
                  {sup.cnpj && <small style={{ display: 'block', color: '#64748b' }}>CNPJ: {maskCpfCnpj(sup.cnpj)}</small>}
                  {sup.phone && <small style={{ display: 'block', color: '#64748b' }}>📞 {maskPhone(sup.phone)}</small>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Orders List Column */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: '1.05rem', margin: '0 0 14px', fontFamily: 'Outfit', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PackageCheck size={18} style={{ color: '#10b981' }} /> Pedidos de Compra ({orders.length})
          </h2>

          {orders.length === 0 ? (
            <p className="empty-state">Nenhum pedido de compra emitido.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map((po) => (
                <div key={po.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <div>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.95rem' }}>Pedido #{po.id.slice(0, 8)}</strong>
                    <small style={{ color: '#64748b' }}>Data: {new Date(po.created_at).toLocaleDateString('pt-BR')}</small>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ display: 'block', color: '#10b981', fontSize: '1rem' }}>{formatCurrency(po.total_cost)}</strong>
                    {po.status === 'received' ? (
                      <span className="status-badge status-completed" style={{ marginTop: 4, display: 'inline-block' }}>
                        Entrada Concluída
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="primary-btn btn-sm"
                        style={{ marginTop: 4, background: '#10b981', fontSize: '0.78rem' }}
                        onClick={() => void handleReceiveOrder(po.id)}
                      >
                        Confirmar Entrada no Estoque
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Fornecedor */}
      {showSupplierModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Cadastrar Novo Fornecedor</h2>
            <form onSubmit={(e) => void handleAddSupplier(e)}>
              <div className="form-grid">
                <label className="wide-field">
                  Razão Social / Nome Fantasia *
                  <input value={supName} onChange={(e) => setSupName(e.target.value)} required placeholder="Ex: Distribuidora de Peças Brasil" />
                </label>

                <label>
                  CNPJ
                  <input value={supCnpj} onChange={(e) => setSupCnpj(maskCpfCnpj(e.target.value))} placeholder="00.000.000/0001-00" />
                </label>

                <label>
                  Telefone / WhatsApp
                  <input value={supPhone} onChange={(e) => setSupPhone(maskPhone(e.target.value))} placeholder="(11) 99999-9999" />
                </label>

                <label className="wide-field">
                  E-mail de Contato
                  <input type="email" value={supEmail} onChange={(e) => setSupEmail(e.target.value)} placeholder="vendas@fornecedor.com" />
                </label>
              </div>

              <div className="form-actions" style={{ marginTop: 20 }}>
                <button type="button" className="secondary-btn" onClick={() => setShowSupplierModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
