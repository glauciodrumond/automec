import { Play, Pause, CheckCircle2, Clock, Camera, Wrench, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { startWorkTaskTiming, pauseWorkTaskTiming, completeWorkTaskTiming } from '../services/autoosService'
import type { ActiveTenantContext } from '../lib/tenant'

interface MechanicTaskItem {
  id: string
  service_order_id: string
  description: string
  kind: string
  quantity: number
  unit_price: number
  os_code: number
  plate: string
  brand: string | null
  model: string | null
  complaint: string | null
  timing?: {
    id: string
    status: 'running' | 'paused' | 'completed'
    started_at: string
    duration_seconds: number
  } | null
}

function formatDuration(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function MechanicPortal({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [tasks, setTasks] = useState<MechanicTaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({})

  async function loadMechanicTasks() {
    setLoading(true)
    setError(null)

    try {
      // 1. Fetch active service orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('service_orders')
        .select(`
          id, code, complaint, vehicle_id,
          vehicles(plate, brand, model)
        `)
        .eq('tenant_id', activeTenant.tenantId)
        .in('status', ['open', 'in_progress', 'waiting_parts'])

      if (ordersError) throw ordersError

      const orderIds = (ordersData || []).map((o) => o.id)
      if (orderIds.length === 0) {
        setTasks([])
        setLoading(false)
        return
      }

      // 2. Fetch items for active orders
      const { data: itemsData, error: itemsError } = await supabase
        .from('service_order_items')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .in('service_order_id', orderIds)

      if (itemsError) throw itemsError

      // 3. Fetch active task timings
      const { data: timingsData } = await supabase
        .from('work_task_timings')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .eq('mechanic_id', activeTenant.userId)

      const timingMap = new Map((timingsData || []).map((t) => [t.service_order_item_id, t]))

      const mappedTasks: MechanicTaskItem[] = (itemsData || []).map((item) => {
        const order = (ordersData || []).find((o) => o.id === item.service_order_id)
        const vehicle = order?.vehicles as any
        const timing = timingMap.get(item.id)

        return {
          id: item.id,
          service_order_id: item.service_order_id,
          description: item.description,
          kind: item.kind,
          quantity: item.quantity,
          unit_price: item.unit_price,
          os_code: order?.code || 0,
          plate: vehicle?.plate || '—',
          brand: vehicle?.brand || null,
          model: vehicle?.model || null,
          complaint: order?.complaint || null,
          timing: timing
            ? {
                id: timing.id,
                status: timing.status as any,
                started_at: timing.started_at,
                duration_seconds: timing.duration_seconds || 0,
              }
            : null,
        }
      })

      setTasks(mappedTasks)

      // Initialize live timer counts
      const timerState: Record<string, number> = {}
      mappedTasks.forEach((t) => {
        if (t.timing) {
          timerState[t.id] = t.timing.duration_seconds || 0
        }
      })
      setActiveTimers(timerState)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar tarefas do mecânico')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMechanicTasks()
  }, [activeTenant.tenantId])

  // Live timer interval for running tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers((prev) => {
        const next = { ...prev }
        tasks.forEach((t) => {
          if (t.timing?.status === 'running') {
            next[t.id] = (next[t.id] || 0) + 1
          }
        })
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [tasks])

  async function handleStartTask(item: MechanicTaskItem) {
    const timingId = await startWorkTaskTiming(activeTenant.tenantId, item.service_order_id, item.id, activeTenant.userId)
    if (timingId) {
      void loadMechanicTasks()
    }
  }

  async function handlePauseTask(item: MechanicTaskItem) {
    if (!item.timing) return
    await pauseWorkTaskTiming(activeTenant.tenantId, item.timing.id)
    void loadMechanicTasks()
  }

  async function handleCompleteTask(item: MechanicTaskItem) {
    if (!item.timing) return
    await completeWorkTaskTiming(activeTenant.tenantId, item.timing.id)
    void loadMechanicTasks()
  }

  if (loading) return <p className="status-message">Carregando painel do mecânico...</p>
  if (error) return <p className="error-message">{error}</p>

  return (
    <section className="screen-section full-widescreen" style={{ maxWidth: 768, margin: '0 auto' }}>
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Painel do Mecânico (Mobile-First)</p>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wrench size={26} style={{ color: '#2563eb' }} />
            Minhas Tarefas & Apontamento
          </h1>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="empty-state">Nenhuma tarefa de serviço pendente para apontamento no momento.</p>
      ) : (
        <div className="mechanic-tasks-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tasks.map((task) => {
            const isRunning = task.timing?.status === 'running'
            const isPaused = task.timing?.status === 'paused'
            const isCompleted = task.timing?.status === 'completed'
            const elapsedSeconds = activeTimers[task.id] || 0

            return (
              <div
                key={task.id}
                className="mechanic-task-card"
                style={{
                  background: '#fff',
                  border: '1px solid',
                  borderColor: isRunning ? '#2563eb' : isCompleted ? '#10b981' : '#e2e8f0',
                  borderRadius: 12,
                  padding: 18,
                  boxShadow: isRunning ? '0 0 0 2px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {/* Task Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span className="kanban-card-number">OS #{task.os_code} · {task.plate}</span>
                    <h3 style={{ margin: '2px 0 0', fontSize: '1.05rem', color: '#0f172a' }}>{task.description}</h3>
                    {task.brand && <small style={{ color: '#64748b' }}>{task.brand} {task.model}</small>}
                  </div>
                  <div className="timer-badge" style={{ background: isRunning ? '#eff6ff' : isCompleted ? '#ecfdf5' : '#f8fafc', color: isRunning ? '#2563eb' : isCompleted ? '#10b981' : '#64748b', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem' }}>
                    <Clock size={16} style={{ display: 'inline', marginRight: 6 }} />
                    {formatDuration(elapsedSeconds)}
                  </div>
                </div>

                {/* Complaint Preview */}
                {task.complaint && (
                  <p style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, fontSize: '0.82rem', color: '#475569', margin: '8px 0 14px', borderLeft: '3px solid #cbd5e1' }}>
                    💬 {task.complaint}
                  </p>
                )}

                {/* Actions Bar */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                  {!isCompleted && !isRunning && (
                    <button type="button" className="primary-btn" onClick={() => void handleStartTask(task)} style={{ background: '#2563eb', flex: 1 }}>
                      <Play size={16} /> {isPaused ? 'Continuar' : 'Iniciar Serviço'}
                    </button>
                  )}

                  {isRunning && (
                    <>
                      <button type="button" className="secondary-btn" onClick={() => void handlePauseTask(task)} style={{ flex: 1 }}>
                        <Pause size={16} /> Pausar
                      </button>
                      <button type="button" className="primary-btn" onClick={() => void handleCompleteTask(task)} style={{ background: '#10b981', flex: 1 }}>
                        <CheckCircle2 size={16} /> Concluir
                      </button>
                    </>
                  )}

                  {isCompleted && (
                    <span className="status-badge status-completed" style={{ fontSize: '0.88rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} /> Concluído ({formatDuration(elapsedSeconds)})
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
