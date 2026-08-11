// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ServiceOrderDetail } from '../components/ServiceOrderDetail'
import { ServiceOrderList } from '../components/ServiceOrderList'
import { NewServiceOrder } from '../components/NewServiceOrder'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({ supabase: { from: mocks.from, rpc: mocks.rpc } }))

const activeTenant = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  tenantName: 'Oficina Central',
  role: 'owner' as const,
}

function query(data: unknown) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    update: vi.fn(),
    maybeSingle: vi.fn(),
    then: (resolve: (value: { data: unknown; error: null }) => unknown) => resolve({ data, error: null }),
  }
  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.in.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.limit.mockReturnValue(builder)
  builder.update.mockReturnValue(builder)
  builder.maybeSingle.mockResolvedValue({ data, error: null })
  return builder
}

describe('service order workflow', () => {
  afterEach(cleanup)

  beforeEach(() => vi.clearAllMocks())

  it('lists active tenant orders and dashboard status counts', async () => {
    const activeOrders = query([
      {
        id: 'order-1', code: 24, status: 'open', priority: 'normal', entry_at: '2026-08-11T10:00:00Z',
        customers: { name: 'Ana Lima' }, vehicles: { plate: 'ABC1D23', brand: 'Fiat', model: 'Uno' },
      },
    ])
    const completedOrders = query([{ id: 'order-2' }])
    mocks.from.mockImplementation((table: string) => table === 'service_orders' && mocks.from.mock.calls.filter(([name]) => name === 'service_orders').length === 1 ? activeOrders : completedOrders)

    render(<MemoryRouter><ServiceOrderList activeTenant={activeTenant} /></MemoryRouter>)

    expect((await screen.findByRole('link', { name: /OS 24/i })).getAttribute('href')).toBe('/orders/order-1')
    expect(screen.getByText('Ana Lima')).toBeTruthy()
    expect(screen.getAllByText('1', { selector: '.dashboard-card-value' })).toHaveLength(2)
    expect(activeOrders.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1')
    expect(activeOrders.in).toHaveBeenCalledWith('status', ['open', 'in_progress', 'waiting_parts'])
  })

  it('renders the required detail tabs and tenant-scoped service items', async () => {
    const order = query({
      id: 'order-1', code: 24, status: 'open', priority: 'normal', entry_at: '2026-08-11T10:00:00Z', odometer: 45210,
      complaint: 'Motor falhando', customer_id: 'customer-1', vehicle_id: 'vehicle-1',
    })
    const customer = query({ id: 'customer-1', name: 'Ana Lima' })
    const vehicle = query({ id: 'vehicle-1', plate: 'ABC1D23', brand: 'Fiat', model: 'Uno' })
    const items = query([{ id: 'item-1', kind: 'labor', description: 'Diagnostico', quantity: 1, unit_price: 120 }])
    const products = query([])
    const tenants = query({ id: 'tenant-1', name: 'Oficina Central' })

    mocks.from.mockImplementation((table: string) => ({ service_orders: order, customers: customer, vehicles: vehicle, service_order_items: items, products, tenants })[table])

    render(<MemoryRouter initialEntries={['/orders/order-1']}><Routes><Route path="/orders/:id" element={<ServiceOrderDetail activeTenant={activeTenant} />} /></Routes></MemoryRouter>)

    await screen.findByRole('heading', { name: /OS 24/i })
    expect(screen.getByRole('tab', { name: 'Resumo' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Check-in' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Itens/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Fotos' })).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: /Itens/i }))
    expect(await screen.findByText('Diagnostico')).toBeTruthy()
    expect(items.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1')
    expect(items.eq).toHaveBeenCalledWith('service_order_id', 'order-1')
  })

  it('creates an order through the transactional RPC with normalized form values', async () => {
    mocks.rpc.mockResolvedValue({ data: 'order-new', error: null })

    render(<MemoryRouter initialEntries={['/orders/new']}><Routes>
      <Route path="/orders/new" element={<NewServiceOrder activeTenant={activeTenant} />} />
      <Route path="/orders/:id" element={<p>Order created</p>} />
    </Routes></MemoryRouter>)

    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: '  Ana Lima  ' } })
    fireEvent.change(screen.getByLabelText(/Telefone/i), { target: { value: '11999990000' } })
    fireEvent.change(screen.getByLabelText(/CPF/i), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText(/Placa/i), { target: { value: ' abc1d23 ' } })
    fireEvent.change(screen.getByLabelText(/Marca/i), { target: { value: ' Fiat ' } })
    fireEvent.change(screen.getByLabelText(/Modelo/i), { target: { value: ' Uno ' } })
    fireEvent.change(screen.getByLabelText(/Ano/i), { target: { value: '2021' } })
    fireEvent.change(screen.getByLabelText(/Cor/i), { target: { value: ' Azul ' } })
    fireEvent.change(screen.getByLabelText(/Quilometragem/i), { target: { value: '45210' } })
    fireEvent.change(screen.getByLabelText(/Reclamação|Reclamacao/i), { target: { value: ' Motor falhando ' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Criar OS' }).closest('form')!)

    await screen.findByText('Order created')
    expect(mocks.rpc).toHaveBeenCalledWith('create_service_order_with_customer_vehicle', {
      p_tenant_id: 'tenant-1',
      p_customer_name: 'Ana Lima',
      p_customer_phone: '(11) 99999-0000',
      p_customer_document: null,
      p_vehicle_plate: 'ABC1D23',
      p_vehicle_brand: 'Fiat',
      p_vehicle_model: 'Uno',
      p_vehicle_year: 2021,
      p_vehicle_color: 'Azul',
      p_complaint: 'Motor falhando',
      p_odometer: 45210,
    })
    expect(mocks.from).not.toHaveBeenCalled()
  })
})
