import { ArrowLeft, Save } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'

function optional(value: string) { return value.trim() || null }

export function NewServiceOrder({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const year = optional(String(form.get('year')))
    const odometer = optional(String(form.get('odometer')))
    setSubmitting(true)
    setError(null)

    const { data: createdOrderId, error: rpcError } = await supabase.rpc('create_service_order_with_customer_vehicle', {
      p_tenant_id: activeTenant.tenantId,
      p_customer_name: String(form.get('customerName')).trim(),
      p_customer_phone: optional(String(form.get('phone'))),
      p_customer_document: optional(String(form.get('document'))),
      p_vehicle_plate: String(form.get('plate')).trim().toUpperCase(),
      p_vehicle_brand: optional(String(form.get('brand'))),
      p_vehicle_model: optional(String(form.get('model'))),
      p_vehicle_year: year ? Number(year) : null,
      p_vehicle_color: optional(String(form.get('color'))),
      p_complaint: optional(String(form.get('complaint'))),
      p_odometer: odometer ? Number(odometer) : null,
    })
    if (rpcError || !createdOrderId) { setError('Nao foi possivel criar a ordem de servico.'); setSubmitting(false); return }
    navigate(`/orders/${createdOrderId}`)
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
