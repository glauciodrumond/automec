import { Calendar, Clock, ChevronRight, Plus, CheckCircle, XCircle } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { Customer, Vehicle } from '../types/database'

interface Schedule {
  id: string
  tenant_id: string
  customer_id: string | null
  vehicle_id: string | null
  assigned_to: string | null
  scheduled_at: string
  duration_min: number
  service_description: string
  status: 'scheduled' | 'confirmed' | 'converted' | 'cancelled'
  service_order_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Agendado', color: '#f59e0b' },
  confirmed: { label: 'Confirmado', color: '#2563eb' },
  converted: { label: 'Convertido em OS', color: '#10b981' },
  cancelled: { label: 'Cancelado', color: '#ef4444' },
}

function getWeekDates(offset = 0) {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1 + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function ServiceSchedule({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const weekDates = getWeekDates(weekOffset)

  async function loadData() {
    setLoading(true)
    const start = weekDates[0].toISOString()
    const end = weekDates[6].toISOString()

    const [{ data: sched }, { data: custs }] = await Promise.all([
      supabase
        .from('schedules')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .gte('scheduled_at', start)
        .lte('scheduled_at', end)
        .order('scheduled_at', { ascending: true }),
      supabase
        .from('customers')
        .select('id, name, phone')
        .eq('tenant_id', activeTenant.tenantId)
        .order('name', { ascending: true }),
    ])

    setSchedules((sched as Schedule[]) || [])
    setCustomers((custs as Customer[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [activeTenant.tenantId, weekOffset])

  async function handleCreateSchedule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const customerId = String(form.get('customerId')).trim() || null
    const serviceDescription = String(form.get('serviceDescription')).trim()
    const scheduledAt = String(form.get('scheduledAt')).trim()
    const durationMin = Number(form.get('durationMin')) || 60
    const notes = String(form.get('notes')).trim() || null

    const { error: insertError } = await supabase.from('schedules').insert({
      tenant_id: activeTenant.tenantId,
      customer_id: customerId,
      scheduled_at: scheduledAt,
      duration_min: durationMin,
      service_description: serviceDescription,
      notes,
    })

    if (insertError) {
      setError('Falha ao criar agendamento.')
    } else {
      setShowModal(false)
      void loadData()
    }
    setSubmitting(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase
      .from('schedules')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('tenant_id', activeTenant.tenantId)
      .eq('id', id)

    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, status: status as Schedule['status'] } : s)))
  }

  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  return (
    <section className="screen-section full-widescreen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Gestão de Tempo</p>
          <h1>Agenda de Serviços</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            ← Semana Ant.
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setWeekOffset(0)}
          >
            Hoje
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setWeekOffset((w) => w + 1)}
          >
            Próx. Semana →
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setSelectedDate(new Date().toISOString().slice(0, 16))
              setShowModal(true)
            }}
          >
            <Plus size={18} /> Novo Agendamento
          </button>
        </div>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}

      <div className="schedule-week-grid">
        {weekDates.map((date, i) => {
          const daySchedules = schedules.filter((s) => isSameDay(new Date(s.scheduled_at), date))
          const isToday = isSameDay(date, new Date())

          return (
            <div key={i} className={`schedule-day-col ${isToday ? 'today' : ''}`}>
              <div className="schedule-day-header">
                <span className="schedule-day-name">{dayNames[i]}</span>
                <span className="schedule-day-num">{date.getDate()}/{date.getMonth() + 1}</span>
                <span className="schedule-day-count">{daySchedules.length}</span>
              </div>

              <div className="schedule-day-events">
                {loading ? (
                  <p className="schedule-empty">Carregando...</p>
                ) : daySchedules.length === 0 ? (
                  <p className="schedule-empty">Sem agendamentos</p>
                ) : (
                  daySchedules.map((s) => {
                    const st = STATUS_LABELS[s.status]
                    const custName = customers.find((c) => c.id === s.customer_id)?.name || 'Cliente'
                    return (
                      <div key={s.id} className="schedule-event-card">
                        <div className="schedule-event-time">
                          <Clock size={12} /> {new Date(s.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          <span> · {s.duration_min}min</span>
                        </div>
                        <strong>{s.service_description}</strong>
                        <small>{custName}</small>
                        <div className="schedule-event-badge" style={{ background: `${st.color}20`, color: st.color }}>
                          {st.label}
                        </div>
                        {s.status === 'scheduled' && (
                          <div className="schedule-event-actions">
                            <button
                              type="button"
                              className="sched-action-btn confirm"
                              title="Confirmar"
                              onClick={() => void updateStatus(s.id, 'confirmed')}
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              type="button"
                              className="sched-action-btn cancel"
                              title="Cancelar"
                              onClick={() => void updateStatus(s.id, 'cancelled')}
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}

                <button
                  type="button"
                  className="schedule-add-slot"
                  onClick={() => {
                    const d = new Date(date)
                    d.setHours(8, 0, 0, 0)
                    setSelectedDate(d.toISOString().slice(0, 16))
                    setShowModal(true)
                  }}
                >
                  <Plus size={12} /> Agendar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2><Calendar size={18} /> Novo Agendamento</h2>
            <form onSubmit={(e) => void handleCreateSchedule(e)}>
              <div className="form-grid">
                <label>
                  Cliente
                  <select name="customerId">
                    <option value="">-- Sem cadastro --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="wide-field">
                  Descrição do Serviço *
                  <input name="serviceDescription" required placeholder="Troca de óleo + filtros" />
                </label>

                <label>
                  Data e Hora *
                  <input
                    name="scheduledAt"
                    type="datetime-local"
                    required
                    defaultValue={selectedDate}
                  />
                </label>

                <label>
                  Duração (minutos)
                  <input name="durationMin" type="number" min="15" step="15" defaultValue="60" />
                </label>

                <label className="wide-field">
                  Observações
                  <textarea name="notes" rows={3} placeholder="Informações adicionais..." />
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
