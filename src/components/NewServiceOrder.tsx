import { ArrowLeft, Save } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { maskCpfCnpj, maskPhone, maskPlate } from '../lib/masks'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'

function optional(value: string) { return value.trim() || null }

export function NewServiceOrder({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [phoneVal, setPhoneVal] = useState('')
  const [docVal, setDocVal] = useState('')
  const [plateVal, setPlateVal] = useState('')

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
      p_customer_phone: phoneVal || null,
      p_customer_document: docVal || null,
      p_vehicle_plate: plateVal.trim().toUpperCase(),
      p_vehicle_brand: optional(String(form.get('brand'))),
      p_vehicle_model: optional(String(form.get('model'))),
      p_vehicle_year: year ? Number(year) : null,
      p_vehicle_color: optional(String(form.get('color'))),
      p_complaint: optional(String(form.get('complaint'))),
      p_odometer: odometer ? Number(odometer) : null,
    })
    if (rpcError || !createdOrderId) { setError('Não foi possível criar a ordem de serviço.'); setSubmitting(false); return }
    navigate(`/orders/${createdOrderId}`)
  }

  return (
    <section className="screen-section">
      <div className="screen-heading"><div><p className="eyebrow">Operação</p><h1>Nova ordem de serviço</h1></div><Link className="secondary-link" to="/"><ArrowLeft aria-hidden="true" size={18} />Voltar</Link></div>
      <form className="order-form" onSubmit={(event) => void submit(event)}>
        <fieldset>
          <legend>Cliente</legend>
          <div className="form-grid">
            <label>Nome *<input name="customerName" required placeholder="João da Silva" /></label>
            <label>Telefone (Com Máscara)<input name="phone" type="tel" value={phoneVal} onChange={(e) => setPhoneVal(maskPhone(e.target.value))} placeholder="(31) 99999-9999" /></label>
            <label>CPF ou CNPJ (Com Máscara)<input name="document" value={docVal} onChange={(e) => setDocVal(maskCpfCnpj(e.target.value))} placeholder="000.000.000-00" /></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Veículo</legend>
          <div className="form-grid">
            <label>Placa *<input name="plate" required value={plateVal} onChange={(e) => setPlateVal(maskPlate(e.target.value))} placeholder="GXS-1693" /></label>
            <label>Marca<input name="brand" placeholder="Fiat" /></label>
            <label>Modelo<input name="model" placeholder="Uno" /></label>
            <label>Ano<input name="year" type="number" min="1900" max="2100" placeholder="2021" /></label>
            <label>Cor<input name="color" placeholder="Preto" /></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Atendimento</legend>
          <div className="form-grid">
            <label>Quilometragem<input name="odometer" type="number" min="0" placeholder="45210" /></label>
            <label className="wide-field">Reclamação<textarea name="complaint" rows={4} placeholder="Descreva a reclamação do cliente..." /></label>
          </div>
        </fieldset>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="form-actions"><button type="submit" className="primary-btn" disabled={submitting}><Save aria-hidden="true" size={18} />{submitting ? 'Criando...' : 'Criar OS'}</button></div>
      </form>
    </section>
  )
}
