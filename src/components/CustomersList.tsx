import { Plus, Search, User, Building, MapPin, Phone } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { Customer } from '../types/database'

export function CustomersList({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [personType, setPersonType] = useState<'physical' | 'legal'>('physical')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadCustomers() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', activeTenant.tenantId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Erro ao carregar clientes.')
    } else {
      setCustomers((data as Customer[]) || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadCustomers()
  }, [activeTenant.tenantId])

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    const fantasyName = String(form.get('fantasyName')).trim() || null
    const document = String(form.get('document')).trim() || null
    const ie = String(form.get('ie')).trim() || null
    const phone = String(form.get('phone')).trim() || null
    const email = String(form.get('email')).trim() || null
    const cep = String(form.get('cep')).trim() || null
    const address = String(form.get('address')).trim() || null
    const number = String(form.get('number')).trim() || null
    const complement = String(form.get('complement')).trim() || null
    const neighborhood = String(form.get('neighborhood')).trim() || null
    const city = String(form.get('city')).trim() || null
    const state = String(form.get('state')).trim() || null

    try {
      const { error: insertError } = await supabase.from('customers').insert({
        tenant_id: activeTenant.tenantId,
        name,
        fantasy_name: fantasyName,
        person_type: personType,
        document,
        ie,
        phone,
        email,
        cep,
        address,
        number,
        complement,
        neighborhood,
        city,
        state,
      })

      if (insertError) throw new Error(insertError.message)

      setShowModal(false)
      void loadCustomers()
    } catch (err: any) {
      setError(err?.message || 'Falha ao cadastrar cliente.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.fantasy_name && c.fantasy_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.document && c.document.includes(search)) ||
      (c.phone && c.phone.includes(search))
  )

  return (
    <section className="screen-section">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Cadastros</p>
          <h1>Clientes ({customers.length})</h1>
        </div>
        <button type="button" className="primary-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}

      {loading ? (
        <p className="status-message">Carregando clientes...</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">Nenhum cliente cadastrado.</p>
      ) : (
        <div className="data-table">
          <div className="data-row data-head">
            <span>Tipo</span>
            <span>Nome / Nome Fantasia</span>
            <span>CPF / CNPJ</span>
            <span>Telefone / E-mail</span>
            <span>Cidade / UF</span>
          </div>
          {filtered.map((c) => (
            <div key={c.id} className="data-row">
              <span>
                {c.person_type === 'legal' ? (
                  <span className="badge-type legal"><Building size={12} /> PJ</span>
                ) : (
                  <span className="badge-type physical"><User size={12} /> PF</span>
                )}
              </span>
              <div>
                <strong>{c.name}</strong>
                {c.fantasy_name && <small className="sub-copy"> ({c.fantasy_name})</small>}
              </div>
              <span>{c.document || '-'}</span>
              <div>
                {c.phone && <span><Phone size={12} /> {c.phone}</span>}
                {c.email && <small className="sub-copy">{c.email}</small>}
              </div>
              <span>
                {c.city ? `${c.city}${c.state ? `/${c.state}` : ''}` : '-'}
              </span>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card wide">
            <h2>Cadastrar Cliente</h2>
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
                  {personType === 'legal' ? 'CNPJ' : 'CPF'}
                  <input name="document" placeholder={personType === 'legal' ? '00.000.000/0001-00' : '000.000.000-00'} />
                </label>

                {personType === 'legal' && (
                  <label>
                    Inscrição Estadual (IE)
                    <input name="ie" placeholder="Isento ou Nº IE" />
                  </label>
                )}

                <label>
                  Telefone / WhatsApp
                  <input name="phone" type="tel" placeholder="(31) 99999-9999" />
                </label>

                <label>
                  E-mail
                  <input name="email" type="email" placeholder="cliente@email.com" />
                </label>

                <fieldset className="wide-field">
                  <legend><MapPin size={16} /> Endereço Comercial / Residencial</legend>
                  <div className="form-grid">
                    <label>
                      CEP
                      <input name="cep" placeholder="30000-000" />
                    </label>
                    <label className="wide-field">
                      Logradouro / Rua
                      <input name="address" placeholder="Rua Bogotá" />
                    </label>
                    <label>
                      Número
                      <input name="number" placeholder="109" />
                    </label>
                    <label>
                      Complemento
                      <input name="complement" placeholder="Sala 2" />
                    </label>
                    <label>
                      Bairro
                      <input name="neighborhood" placeholder="Parque Caravelas" />
                    </label>
                    <label>
                      Cidade
                      <input name="city" placeholder="Ipatinga" />
                    </label>
                    <label>
                      UF (Estado)
                      <input name="state" placeholder="MG" maxLength={2} />
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
