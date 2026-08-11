import { MessageSquare, Phone, MapPin, Plus, Search, User, Building, Calendar, DollarSign } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { fetchAddressByCep } from '../lib/cep'
import { maskCep, maskCpfCnpj, maskPhone } from '../lib/masks'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { Customer, ServiceOrder } from '../types/database'

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export function CustomerCRM({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [personType, setPersonType] = useState<'physical' | 'legal'>('physical')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Address state for ViaCEP
  const [cepVal, setCepVal] = useState('')
  const [phoneVal, setPhoneVal] = useState('')
  const [docVal, setDocVal] = useState('')
  const [addressVal, setAddressVal] = useState('')
  const [neighborhoodVal, setNeighborhoodVal] = useState('')
  const [cityVal, setCityVal] = useState('')
  const [stateVal, setStateVal] = useState('')
  const [fetchingCep, setFetchingCep] = useState(false)

  async function loadData() {
    setLoading(true)
    setError(null)
    const [{ data: custData }, { data: orderData }] = await Promise.all([
      supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .order('name', { ascending: true }),
      supabase
        .from('service_orders')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId),
    ])

    setCustomers((custData as Customer[]) || [])
    setOrders((orderData as ServiceOrder[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [activeTenant.tenantId])

  async function handleCepChange(val: string) {
    const masked = maskCep(val)
    setCepVal(masked)

    const clean = val.replace(/\D/g, '')
    if (clean.length === 8) {
      setFetchingCep(true)
      const addr = await fetchAddressByCep(clean)
      if (addr) {
        setAddressVal(addr.logradouro)
        setNeighborhoodVal(addr.bairro)
        setCityVal(addr.localidade)
        setStateVal(addr.uf)
      }
      setFetchingCep(false)
    }
  }

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    const fantasyName = String(form.get('fantasyName')).trim() || null
    const ie = String(form.get('ie')).trim() || null
    const email = String(form.get('email')).trim() || null
    const number = String(form.get('number')).trim() || null
    const complement = String(form.get('complement')).trim() || null

    try {
      const { error: insertError } = await supabase.from('customers').insert({
        tenant_id: activeTenant.tenantId,
        name,
        fantasy_name: fantasyName,
        person_type: personType,
        document: docVal || null,
        ie,
        phone: phoneVal || null,
        email,
        cep: cepVal || null,
        address: addressVal || null,
        number,
        complement,
        neighborhood: neighborhoodVal || null,
        city: cityVal || null,
        state: stateVal || null,
      })

      if (insertError) throw new Error(insertError.message)

      setShowModal(false)
      setCepVal('')
      setPhoneVal('')
      setDocVal('')
      setAddressVal('')
      setNeighborhoodVal('')
      setCityVal('')
      setStateVal('')
      void loadData()
    } catch (err: any) {
      setError(err?.message || 'Falha ao cadastrar cliente.')
    } finally {
      setSubmitting(false)
    }
  }

  function openWhatsApp(phone: string | null, type: 'budget' | 'ready' | 'reminder', customerName: string) {
    if (!phone) return
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone) return

    let text = ''
    if (type === 'budget') {
      text = `Olá ${customerName}, seu orçamento na ${activeTenant.tenantName} está pronto! Entre em contato para aprovação.`
    } else if (type === 'ready') {
      text = `Olá ${customerName}, seu veículo está pronto na ${activeTenant.tenantName}! Pode vir fazer a retirada.`
    } else {
      text = `Olá ${customerName}, faz um tempo desde sua última revisão na ${activeTenant.tenantName}. Que tal agendarmos uma verificação preventiva?`
    }

    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.fantasy_name && c.fantasy_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.document && c.document.includes(search)) ||
      (c.phone && c.phone.includes(search))
  )

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Gestão de Relacionamento</p>
          <h1>Clientes & CRM ({customers.length})</h1>
        </div>
        <button type="button" className="primary-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar cliente por nome, CPF/CNPJ ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}

      {loading ? (
        <p className="status-message">Carregando CRM...</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">Nenhum cliente encontrado.</p>
      ) : (
        <div className="crm-grid">
          {filtered.map((c) => {
            const custOrders = orders.filter((o) => o.customer_id === c.id)
            const totalSpent = custOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

            return (
              <div key={c.id} className="crm-card">
                <div className="crm-header">
                  <div>
                    <span className="person-badge">
                      {c.person_type === 'legal' ? <Building size={12} /> : <User size={12} />}
                      {c.person_type === 'legal' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                    </span>
                    <h3>{c.name}</h3>
                    {c.fantasy_name && <small>({c.fantasy_name})</small>}
                  </div>
                  <div className="ltv-tag">
                    <span>LTV (Total Gasto)</span>
                    <strong>{formatCurrency(totalSpent)}</strong>
                  </div>
                </div>

                <div className="crm-details">
                  {c.document && <div><strong>Doc:</strong> {c.document}</div>}
                  {c.phone && <div><Phone size={14} /> {c.phone}</div>}
                  {c.city && <div><MapPin size={14} /> {c.city}/{c.state} - {c.address} {c.number}</div>}
                  <div><Calendar size={14} /> {custOrders.length} atendimento(s) realizado(s)</div>
                </div>

                {c.phone && (
                  <div className="crm-actions">
                    <span className="actions-label"><MessageSquare size={14} /> Disparar WhatsApp:</span>
                    <div className="btn-group">
                      <button type="button" className="wa-btn" onClick={() => openWhatsApp(c.phone, 'budget', c.name)}>
                        Orçamento
                      </button>
                      <button type="button" className="wa-btn" onClick={() => openWhatsApp(c.phone, 'ready', c.name)}>
                        Veículo Pronto
                      </button>
                      <button type="button" className="wa-btn" onClick={() => openWhatsApp(c.phone, 'reminder', c.name)}>
                        Lembrete Revisão
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card wide">
            <h2>Cadastrar Novo Cliente</h2>
            <form onSubmit={(e) => void handleCreateCustomer(e)}>
              <div className="person-type-toggle">
                <button
                  type="button"
                  className={personType === 'physical' ? 'active' : ''}
                  onClick={() => setPersonType('physical')}
                >
                  <User size={16} /> Pessoa Física (CPF)
                </button>
                <button
                  type="button"
                  className={personType === 'legal' ? 'active' : ''}
                  onClick={() => setPersonType('legal')}
                >
                  <Building size={16} /> Pessoa Jurídica (CNPJ)
                </button>
              </div>

              <div className="form-grid">
                <label className="wide-field">
                  {personType === 'legal' ? 'Razão Social *' : 'Nome Completo *'}
                  <input name="name" required placeholder={personType === 'legal' ? 'Empresa Exemplo LTDA' : 'João da Silva'} />
                </label>

                {personType === 'legal' && (
                  <label>
                    Nome Fantasia
                    <input name="fantasyName" placeholder="Auto Peças Central" />
                  </label>
                )}

                <label>
                  {personType === 'legal' ? 'CNPJ com Máscara' : 'CPF com Máscara'}
                  <input
                    value={docVal}
                    onChange={(e) => setDocVal(maskCpfCnpj(e.target.value))}
                    placeholder={personType === 'legal' ? '00.000.000/0001-00' : '000.000.000-00'}
                  />
                </label>

                {personType === 'legal' && (
                  <label>
                    Inscrição Estadual (IE)
                    <input name="ie" placeholder="Isento ou Nº IE" />
                  </label>
                )}

                <label>
                  Telefone / WhatsApp (Com Máscara)
                  <input
                    type="tel"
                    value={phoneVal}
                    onChange={(e) => setPhoneVal(maskPhone(e.target.value))}
                    placeholder="(31) 99999-9999"
                  />
                </label>

                <label>
                  E-mail
                  <input name="email" type="email" placeholder="cliente@email.com" />
                </label>

                <fieldset className="wide-field">
                  <legend><MapPin size={16} /> Endereço Comercial / Residencial (ViaCEP Busca Automática)</legend>
                  <div className="form-grid">
                    <label>
                      CEP {fetchingCep && <small>(Buscando endereço...)</small>}
                      <input
                        value={cepVal}
                        onChange={(e) => void handleCepChange(e.target.value)}
                        placeholder="35164-031"
                      />
                    </label>
                    <label className="wide-field">
                      Logradouro / Rua (Preenchido Automático)
                      <input
                        name="address"
                        value={addressVal}
                        onChange={(e) => setAddressVal(e.target.value)}
                        placeholder="Rua Bogotá"
                      />
                    </label>
                    <label>
                      Número *
                      <input name="number" required placeholder="109" />
                    </label>
                    <label>
                      Complemento
                      <input name="complement" placeholder="Sala 2" />
                    </label>
                    <label>
                      Bairro
                      <input
                        name="neighborhood"
                        value={neighborhoodVal}
                        onChange={(e) => setNeighborhoodVal(e.target.value)}
                        placeholder="Parque Caravelas"
                      />
                    </label>
                    <label>
                      Cidade
                      <input
                        name="city"
                        value={cityVal}
                        onChange={(e) => setCityVal(e.target.value)}
                        placeholder="Ipatinga"
                      />
                    </label>
                    <label>
                      UF (Estado)
                      <input
                        name="state"
                        maxLength={2}
                        value={stateVal}
                        onChange={(e) => setStateVal(e.target.value)}
                        placeholder="MG"
                      />
                    </label>
                  </div>
                </fieldset>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="primary-btn">
                  {submitting ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
