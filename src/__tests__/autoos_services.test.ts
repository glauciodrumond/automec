import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatWhatsAppQuoteUrl,
  formatWhatsAppStatusUrl,
  normalizeWhatsAppPhone,
} from '../services/whatsappService'
import {
  searchGlobalEntities,
  getVehiclePassport,
  startWorkTaskTiming,
  pauseWorkTaskTiming,
  completeWorkTaskTiming,
} from '../services/autoosService'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  }
})

describe('WhatsApp Domain Service', () => {
  it('normalizes Brazilian phone numbers correctly', () => {
    expect(normalizeWhatsAppPhone('(31) 99999-8888')).toBe('5531999998888')
    expect(normalizeWhatsAppPhone('3138260476')).toBe('553138260476')
    expect(normalizeWhatsAppPhone('5531999998888')).toBe('5531999998888')
  })

  it('formats WhatsApp Quote URL with encoded parameters and formatted price', () => {
    const url = formatWhatsAppQuoteUrl(
      '(11) 98888-7777',
      'Carlos Silva',
      'https://app.autoos.com.br/portal/token-123',
      1250.5
    )

    expect(url).toContain('https://wa.me/5511988887777?text=')
    expect(decodeURIComponent(url)).toContain('Carlos Silva')
    expect(decodeURIComponent(url)).toContain('https://app.autoos.com.br/portal/token-123')
    expect(decodeURIComponent(url)).toContain('1.250,50')
  })

  it('formats WhatsApp OS Status URL with status label and OS code', () => {
    const url = formatWhatsAppStatusUrl(
      '11977776666',
      'Ana Maria',
      1042,
      'Em Execução',
      'https://app.autoos.com.br/portal/token-456'
    )

    expect(url).toContain('https://wa.me/5511977776666?text=')
    expect(decodeURIComponent(url)).toContain('Ana Maria')
    expect(decodeURIComponent(url)).toContain('Ordem de Serviço #1042')
    expect(decodeURIComponent(url)).toContain('Em Execução')
    expect(decodeURIComponent(url)).toContain('https://app.autoos.com.br/portal/token-456')
  })
})

describe('AUTOOS Service Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when searchGlobalEntities query is empty or whitespace', async () => {
    const results = await searchGlobalEntities('tenant-1', '   ')
    expect(results).toEqual([])
  })

  it('searches global entities across customers, vehicles, service orders, and products', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'customers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'c1', name: 'João Santos', phone: '31999990000', document: '12345678900' },
                  ],
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'vehicles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'v1', plate: 'ABC1D23', brand: 'VW', model: 'Gol', year: 2020 },
                  ],
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'service_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'so1', code: 101, complaint: 'Barulho no freio', status: 'in_progress' },
                  ],
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'products') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'p1', name: 'Pastilha de Freio', code: 501, stock_current: 10, unit: 'UN', sell_price: 150.0 },
                  ],
                }),
              }),
            }),
          }),
        }
      }
      return {}
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom as any)

    const results = await searchGlobalEntities('tenant-1', 'freio')

    expect(results).toHaveLength(4)
    expect(results[0]).toEqual({
      type: 'customer',
      id: 'c1',
      title: 'João Santos',
      subtitle: '31999990000 • 12345678900',
      link: '/customers',
    })
    expect(results[1]).toEqual({
      type: 'vehicle',
      id: 'v1',
      title: 'ABC1D23',
      subtitle: 'VW Gol 2020',
      link: '/vehicles',
    })
    expect(results[2]).toEqual({
      type: 'service_order',
      id: 'so1',
      title: 'OS #101',
      subtitle: 'Barulho no freio',
      link: '/service-orders/so1',
    })
    expect(results[3]).toEqual({
      type: 'product',
      id: 'p1',
      title: 'Pastilha de Freio',
      subtitle: 'Cód: 501 | Est: 10 UN | R$ 150.00',
      link: '/products',
    })
  })

  it('calculates vehicle passport details and maintenance alert', async () => {
    const mockVehicle = {
      id: 'v123',
      tenant_id: 'tenant-1',
      customer_id: 'c123',
      plate: 'GXS1693',
      type: 'car',
      brand: 'Fiat',
      model: 'Uno',
      year: 2018,
      color: 'Silver',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    const mockOwner = {
      id: 'c123',
      tenant_id: 'tenant-1',
      name: 'Maria Oliveira',
      document: '11122233344',
      phone: '31988887777',
      email: 'maria@example.com',
      address: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    const mockOrders = [
      {
        id: 'so-1',
        tenant_id: 'tenant-1',
        customer_id: 'c123',
        vehicle_id: 'v123',
        code: 1050,
        status: 'completed',
        priority: 'normal',
        entry_at: '2026-02-01T10:00:00Z',
        exit_at: '2026-02-02T16:00:00Z',
        odometer: 45000,
        complaint: 'Troca de óleo',
        total_amount: 350,
        created_by: 'user-1',
        created_at: '2026-02-01T10:00:00Z',
        updated_at: '2026-02-02T16:00:00Z',
      },
    ]

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'vehicles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockVehicle }),
              }),
            }),
          }),
        }
      }
      if (table === 'customers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockOwner }),
              }),
            }),
          }),
        }
      }
      if (table === 'service_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockOrders }),
              }),
            }),
          }),
        }
      }
      if (table === 'service_order_items') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'soi-1',
                      tenant_id: 'tenant-1',
                      service_order_id: 'so-1',
                      kind: 'part',
                      description: 'Filtro de Óleo',
                      quantity: 1,
                      unit_price: 50,
                      created_at: '2026-02-01T10:00:00Z',
                    },
                  ],
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'checkins') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [{ id: 'chk-1' }] }),
            }),
          }),
        }
      }
      if (table === 'checkin_photos') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }),
        }
      }
      return {}
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom as any)

    const passport = await getVehiclePassport('tenant-1', 'GXS1693')

    expect(passport).not.toBeNull()
    expect(passport?.vehicle.plate).toBe('GXS1693')
    expect(passport?.owner?.name).toBe('Maria Oliveira')
    expect(passport?.serviceOrders).toHaveLength(1)
    expect(passport?.replacedParts).toHaveLength(1)
    expect(passport?.totalInvestment).toBe(350)
    expect(passport?.nextMaintenanceAlert.lastOdometer).toBe(45000)
    expect(passport?.nextMaintenanceAlert.nextOdometer).toBe(55000)
  })

  it('handles work task timing start, pause, and completion', async () => {
    const timingId = 'wt-100'
    const now = new Date()
    const tenSecAgo = new Date(now.getTime() - 10000).toISOString()

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'work_task_timings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  neq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                      }),
                    }),
                  }),
                }),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: timingId,
                    tenant_id: 'tenant-1',
                    service_order_id: 'so-1',
                    service_order_item_id: 'soi-1',
                    mechanic_id: 'mech-1',
                    status: 'running',
                    started_at: tenSecAgo,
                    duration_seconds: 0,
                    created_at: tenSecAgo,
                  },
                }),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: timingId,
                  tenant_id: 'tenant-1',
                  service_order_id: 'so-1',
                  service_order_item_id: 'soi-1',
                  mechanic_id: 'mech-1',
                  status: 'running',
                  started_at: now.toISOString(),
                  duration_seconds: 0,
                },
              }),
            }),
          }),
          update: vi.fn().mockImplementation((updatePayload: any) => ({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: timingId,
                      tenant_id: 'tenant-1',
                      service_order_id: 'so-1',
                      service_order_item_id: 'soi-1',
                      mechanic_id: 'mech-1',
                      ...updatePayload,
                    },
                  }),
                }),
              }),
            }),
          })),
        }
      }
      return {}
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom as any)

    const started = await startWorkTaskTiming('tenant-1', 'so-1', 'soi-1', 'mech-1')
    expect(started.status).toBe('running')

    const paused = await pauseWorkTaskTiming('tenant-1', timingId)
    expect(paused.status).toBe('paused')
    expect(paused.duration_seconds).toBeGreaterThanOrEqual(10)

    const completed = await completeWorkTaskTiming('tenant-1', timingId)
    expect(completed.status).toBe('completed')
    expect(completed.ended_at).toBeDefined()
  })
})
