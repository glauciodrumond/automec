import { ArrowLeft, Save } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { CustomerInsert, ServiceOrderInsert, VehicleInsert } from '../types/database'

function optional(value: string) { return value.trim() || null }

export function NewServiceOrder({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const customer: CustomerInsert = { tenant_id: activeTenant.tenantId, name: String(form.get('customerName')).trim(), phone: optional(String(form.get('phone'))), document: optional(String(form.get('document'))) }
    const year = optional(String(form.get('year')))
    const odometer = optional(String(form.get('odometer')))
    setSubmitting(true)
    setError(null)

    const { data: createdCustomer, error: customerError } = await supabase.from('customers').insert(customer).select('id').maybeSingle()
    if (customerError || !createdCustomer) { setError('Nao foi possivel cadastrar o cliente.'); setSubmitting(false); return }

    const vehicle: VehicleInsert = {
      tenant_id: activeTenant.tenantId, customer_id: createdCustomer.id, plate: String(form.get('plate')).trim().toUpperCase(),
      brand: optional(String(form.get('brand'))), model: optional(String(form.get('model'))), year: year ? Number(year) : null, color: optional(String(form.get('color'))),
    }
    const { data: createdVehicle, error: vehicleError } = await supabase.from('vehicles').insert(vehicle).select('id').maybeSingle()
    if (vehicleError || !createdVehicle) { setError('Nao foi possivel cadastrar o veiculo.'); setSubmitting(false); return }

    const { data: latestOrder, error: codeError } = await supabase.from('service_orders').select('code').eq('tenant_id', activeTenant.tenantId).order('code', { ascending: false }).limit(1).maybeSingle()
    if (codeError) { setError('Nao foi possivel gerar o codigo da OS.'); setSubmitting(false); return }

    const order: ServiceOrderInsert = {
      tenant_id: activeTenant.tenantId, customer_id: createdCustomer.id, vehicle_id: createdVehicle.id,
      code: (latestOrder?.code ?? 0) + 1, status: 'open', priority: 'normal', created_by: activeTenant.userId,
      complaint: optional(String(form.get('complaint'))), odometer: odometer ? Number(odometer) : null,
    }
    const { data: createdOrder, error: orderError } = await supabase.from('service_orders').insert(order).select('id').maybeSingle()
    if (orderError || !createdOrder) { setError('Nao foi possivel criar a ordem de servico.'); setSubmitting(false); return }
    navigate(`/orders/${createdOrder.id}`)
  }

  return (
    <section className="screen-section">
      <div className="screen-heading"><div><p className="eyebrow">Operacao</p><h1>Nova ordem de servico</h1></div><Link className="secondary-link" to="/"><ArrowLeft aria-hidden="true" size={18} />Voltar</Link></div>
      <form className="order-form" onSubmit={(event) => void submit(event)}>
        <fieldset><legend>Cliente</legend><div className="form-grid"><label>Nome<input name="customerName" required /></label><label>Telefone<input name="phone" type="tel" /></label><label>CPF ou CNPJ<input name="document" /></label></div></fieldset>
        <fieldset><legend>Veiculo</legend><div className="form-grid"><label>Placa<input name="plate" required /></label><label>Marca<input name="brand" /></label><label>Modelo<input name="model" /></label><label>Ano<input name="year" type="number" min="1900" max="2100" /></label><label>Cor<input name="color" /></label></div></fieldset>
        <fieldset><legend>Atendimento</legend><div className="form-grid"><label>Quilometragem<input name="odometer" type="number" min="0" /></label><label className="wide-field">Reclamacao<textarea name="complaint" rows={4} /></label></div></fieldset>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="form-actions"><button type="submit" disabled={submitting}><Save aria-hidden="true" size={18} />{submitting ? 'Criando...' : 'Criar OS'}</button></div>
      </form>
    </section>
  )
}
