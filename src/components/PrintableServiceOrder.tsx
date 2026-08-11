import { Printer, Wrench } from 'lucide-react'
import type { Customer, ServiceOrder, ServiceOrderItem, Tenant, Vehicle } from '../types/database'

interface PrintableOSProps {
  tenant: Tenant
  order: ServiceOrder
  customer: Customer | null
  vehicle: Vehicle | null
  items: ServiceOrderItem[]
  onClose: () => void
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export function PrintableServiceOrder({ tenant, order, customer, vehicle, items, onClose }: PrintableOSProps) {
  function triggerPrint() {
    window.print()
  }

  const partsTotal = items.filter((i) => i.kind === 'part').reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
  const laborTotal = items.filter((i) => i.kind !== 'part').reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
  const totalAmount = partsTotal + laborTotal - (order.discount_amount || 0)

  return (
    <div className="printable-modal-overlay">
      <div className="printable-toolbar no-print">
        <button type="button" className="primary-btn" onClick={triggerPrint}>
          <Printer size={18} /> Imprimir / Salvar PDF
        </button>
        <button type="button" className="secondary-btn" onClick={onClose}>
          Fechar
        </button>
      </div>

      <div className="printable-paper">
        {/* Header */}
        <div className="print-header">
          <div className="print-brand">
            <Wrench size={32} />
            <div>
              <h1>{tenant.name}</h1>
              <p>CNPJ/CPF: {tenant.document || '-'} | Tel: {tenant.phone || '-'}</p>
            </div>
          </div>
          <div className="print-os-badge">
            <h2>ORDEM DE SERVIÇO #{order.code}</h2>
            <p>Data Entrada: {new Date(order.entry_at).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Customer & Vehicle Info */}
        <div className="print-section-grid">
          <div className="print-box">
            <h3>DADOS DO CLIENTE</h3>
            <p><strong>Nome:</strong> {customer?.name || '-'}</p>
            <p><strong>CPF/CNPJ:</strong> {customer?.document || '-'}</p>
            <p><strong>Telefone:</strong> {customer?.phone || '-'}</p>
            <p><strong>Endereço:</strong> {customer?.address ? `${customer.address}, ${customer.number || ''} - ${customer.city || ''}/${customer.state || ''}` : '-'}</p>
          </div>

          <div className="print-box">
            <h3>DADOS DO VEÍCULO / EQUIPAMENTO</h3>
            <p><strong>Placa:</strong> {vehicle?.plate || '-'}</p>
            <p><strong>Veículo:</strong> {[vehicle?.brand, vehicle?.model, vehicle?.year, vehicle?.color].filter(Boolean).join(' ') || '-'}</p>
            <p><strong>Quilometragem:</strong> {order.odometer ? `${order.odometer.toLocaleString('pt-BR')} km` : '-'}</p>
          </div>
        </div>

        {/* Complaint & Found Defect */}
        <div className="print-box full-width">
          <p><strong>DEFEITO RECLAMADO (SOLICITAÇÃO DO CLIENTE):</strong> {order.complaint || 'Não informado.'}</p>
          <p><strong>DIAGNÓSTICO TÉCNICO (DEFEITO ENCONTRADO):</strong> {order.found_defect || 'Em análise.'}</p>
        </div>

        {/* Items Table */}
        <div className="print-items-table">
          <h3>PRODUTOS E SERVIÇOS</h3>
          <table>
            <thead>
              <tr>
                <th>Cód / Tipo</th>
                <th>Descrição do Item / Serviço</th>
                <th>Qtd</th>
                <th>Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '16px' }}>Nenhum item registrado nesta OS.</td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id}>
                    <td>#{idx + 1} ({item.kind === 'part' ? 'PEÇA' : 'SERVIÇO'})</td>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unit_price)}</td>
                    <td>{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="print-totals-box">
          <div><span>Total Peças:</span> <strong>{formatCurrency(partsTotal)}</strong></div>
          <div><span>Total Mão de Obra:</span> <strong>{formatCurrency(laborTotal)}</strong></div>
          <div><span>Desconto:</span> <strong>{formatCurrency(order.discount_amount || 0)}</strong></div>
          <div className="grand-total"><span>TOTAL DA OS:</span> <strong>{formatCurrency(totalAmount)}</strong></div>
        </div>

        {/* Signatures */}
        <div className="print-signatures">
          <div>
            <div className="sig-line" />
            <p>Assinatura do Cliente</p>
          </div>
          <div>
            <div className="sig-line" />
            <p>Técnico Responsável ({tenant.name})</p>
          </div>
        </div>
      </div>
    </div>
  )
}
