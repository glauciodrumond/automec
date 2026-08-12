/**
 * Core Domain Service layer for AUTOOS.
 * Encapsulates multi-tenant database interactions for search, vehicle passport,
 * work task timing (apontamento), and inventory kardex movements.
 */

import { supabase } from '../lib/supabase'
import type {
  Customer,
  Vehicle,
  ServiceOrder,
  ServiceOrderItem,
  CheckinPhoto,
  WorkTaskTiming,
  InventoryMovement,
  InventoryMovementInsert,
  Product,
  WorkStation,
  CustomChecklist,
  Supplier,
  PurchaseOrder,
} from '../types/database'

export interface GlobalSearchResult {
  type: 'customer' | 'vehicle' | 'service_order' | 'product'
  id: string
  title: string
  subtitle: string
  link: string
}

export interface VehiclePassportData {
  vehicle: Vehicle
  owner: Customer | null
  serviceOrders: ServiceOrder[]
  replacedParts: ServiceOrderItem[]
  checkinPhotos: CheckinPhoto[]
  totalInvestment: number
  nextMaintenanceAlert: {
    lastServiceDate: string | null
    nextMaintenanceDate: string | null
    lastOdometer: number | null
    nextOdometer: number | null
    isOverdue: boolean
    daysRemaining: number | null
  }
}

/**
 * Searches across customers, vehicles, service orders, and products for a tenant.
 */
export async function searchGlobalEntities(
  tenantId: string,
  query: string
): Promise<GlobalSearchResult[]> {
  const cleanQuery = query.trim()
  if (!cleanQuery) return []

  const isNumeric = !isNaN(Number(cleanQuery))
  const numVal = Number(cleanQuery)

  const [customersRes, vehiclesRes, ordersRes, productsRes] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, phone, document')
      .eq('tenant_id', tenantId)
      .or(`name.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%,document.ilike.%${cleanQuery}%`)
      .limit(5),

    supabase
      .from('vehicles')
      .select('id, plate, brand, model, year')
      .eq('tenant_id', tenantId)
      .or(`plate.ilike.%${cleanQuery}%,model.ilike.%${cleanQuery}%,brand.ilike.%${cleanQuery}%`)
      .limit(5),

    isNumeric
      ? supabase
          .from('service_orders')
          .select('id, code, complaint, status')
          .eq('tenant_id', tenantId)
          .or(`code.eq.${numVal},complaint.ilike.%${cleanQuery}%`)
          .limit(5)
      : supabase
          .from('service_orders')
          .select('id, code, complaint, status')
          .eq('tenant_id', tenantId)
          .ilike('complaint', `%${cleanQuery}%`)
          .limit(5),

    supabase
      .from('products')
      .select('id, name, code, stock_current, unit, sell_price, group_name')
      .eq('tenant_id', tenantId)
      .or(`name.ilike.%${cleanQuery}%,group_name.ilike.%${cleanQuery}%,ncm.ilike.%${cleanQuery}%`)
      .limit(5),
  ])

  const results: GlobalSearchResult[] = []

  if (customersRes.data) {
    for (const c of customersRes.data) {
      results.push({
        type: 'customer',
        id: c.id,
        title: c.name,
        subtitle: [c.phone, c.document].filter(Boolean).join(' • ') || 'Cliente',
        link: '/customers',
      })
    }
  }

  if (vehiclesRes.data) {
    for (const v of vehiclesRes.data) {
      results.push({
        type: 'vehicle',
        id: v.id,
        title: v.plate ? v.plate.toUpperCase() : 'Veículo',
        subtitle: [v.brand, v.model, v.year?.toString()].filter(Boolean).join(' ') || 'Veículo',
        link: '/vehicles',
      })
    }
  }

  if (ordersRes.data) {
    for (const os of ordersRes.data) {
      results.push({
        type: 'service_order',
        id: os.id,
        title: `OS #${os.code}`,
        subtitle: os.complaint || `Status: ${os.status}`,
        link: `/service-orders/${os.id}`,
      })
    }
  }

  if (productsRes.data) {
    for (const p of productsRes.data) {
      results.push({
        type: 'product',
        id: p.id,
        title: p.name,
        subtitle: `Cód: ${p.code} | Est: ${p.stock_current} ${p.unit || ''} | R$ ${(p.sell_price || 0).toFixed(2)}`,
        link: '/products',
      })
    }
  }

  return results
}

/**
 * Fetches digital passport for a vehicle including owner info, full service history,
 * replaced parts, checkin photos, and calculated maintenance schedule.
 */
export async function getVehiclePassport(
  tenantId: string,
  vehicleIdOrPlate: string
): Promise<VehiclePassportData | null> {
  const term = vehicleIdOrPlate.trim()
  if (!term) return null

  let vehicle: Vehicle | null = null

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term)

  if (isUuid) {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', term)
      .maybeSingle()
    vehicle = data
  }

  if (!vehicle) {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('tenant_id', tenantId)
      .ilike('plate', term)
      .maybeSingle()
    vehicle = data
  }

  if (!vehicle) return null

  const { data: owner } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', vehicle.customer_id)
    .maybeSingle()

  const { data: serviceOrdersData } = await supabase
    .from('service_orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('vehicle_id', vehicle.id)
    .order('entry_at', { ascending: false })

  const serviceOrders = serviceOrdersData || []
  const orderIds = serviceOrders.map((so) => so.id)

  let replacedParts: ServiceOrderItem[] = []
  let checkinPhotos: CheckinPhoto[] = []

  if (orderIds.length > 0) {
    const { data: partsData } = await supabase
      .from('service_order_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('service_order_id', orderIds)
      .eq('kind', 'part')

    replacedParts = partsData || []

    const { data: checkinsData } = await supabase
      .from('checkins')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('service_order_id', orderIds)

    const checkinIds = (checkinsData || []).map((c) => c.id)

    if (checkinIds.length > 0) {
      const { data: photosData } = await supabase
        .from('checkin_photos')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('checkin_id', checkinIds)

      checkinPhotos = photosData || []
    }
  }

  const totalInvestment = serviceOrders.reduce(
    (sum, so) => sum + (so.total_amount || 0),
    0
  )

  const latestOrder = serviceOrders[0]
  let lastServiceDate: string | null = null
  let nextMaintenanceDate: string | null = null
  let lastOdometer: number | null = null
  let nextOdometer: number | null = null
  let isOverdue = false
  let daysRemaining: number | null = null

  if (latestOrder) {
    lastServiceDate = latestOrder.exit_at || latestOrder.entry_at || latestOrder.created_at
    if (latestOrder.odometer != null && latestOrder.odometer > 0) {
      lastOdometer = latestOrder.odometer
      nextOdometer = (lastOdometer ?? 0) + 10000
    }

    if (lastServiceDate) {
      const dateObj = new Date(lastServiceDate)
      dateObj.setDate(dateObj.getDate() + 180)
      nextMaintenanceDate = dateObj.toISOString()

      const now = new Date()
      const diffMs = dateObj.getTime() - now.getTime()
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      isOverdue = daysRemaining < 0
    }
  }

  return {
    vehicle,
    owner: owner || null,
    serviceOrders,
    replacedParts,
    checkinPhotos,
    totalInvestment,
    nextMaintenanceAlert: {
      lastServiceDate,
      nextMaintenanceDate,
      lastOdometer,
      nextOdometer,
      isOverdue,
      daysRemaining,
    },
  }
}

/**
 * Starts or resumes a work task timer for a mechanic on a specific service order item.
 */
export async function startWorkTaskTiming(
  tenantId: string,
  serviceOrderId: string,
  serviceOrderItemId: string,
  mechanicId: string
): Promise<WorkTaskTiming> {
  const { data: existing } = await supabase
    .from('work_task_timings')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('service_order_item_id', serviceOrderItemId)
    .eq('mechanic_id', mechanicId)
    .neq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'paused') {
      const { data: updated, error } = await supabase
        .from('work_task_timings')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
          paused_at: null,
        })
        .eq('tenant_id', tenantId)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return updated
    }
    return existing
  }

  const { data: created, error } = await supabase
    .from('work_task_timings')
    .insert({
      tenant_id: tenantId,
      service_order_id: serviceOrderId,
      service_order_item_id: serviceOrderItemId,
      mechanic_id: mechanicId,
      status: 'running',
      started_at: new Date().toISOString(),
      duration_seconds: 0,
    })
    .select()
    .single()

  if (error) throw error
  return created
}

/**
 * Pauses an active work task timing and calculates elapsed duration in seconds.
 */
export async function pauseWorkTaskTiming(
  tenantId: string,
  timingId: string
): Promise<WorkTaskTiming> {
  const { data: timing, error: fetchErr } = await supabase
    .from('work_task_timings')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', timingId)
    .single()

  if (fetchErr || !timing) throw fetchErr || new Error('Timing record not found')

  if (timing.status !== 'running') {
    return timing
  }

  const now = new Date()
  const startedAt = new Date(timing.started_at)
  const elapsed = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000))
  const totalDuration = (timing.duration_seconds || 0) + elapsed

  const { data: updated, error: updateErr } = await supabase
    .from('work_task_timings')
    .update({
      status: 'paused',
      paused_at: now.toISOString(),
      duration_seconds: totalDuration,
    })
    .eq('tenant_id', tenantId)
    .eq('id', timingId)
    .select()
    .single()

  if (updateErr) throw updateErr
  return updated
}

/**
 * Marks a work task timing as completed and saves final duration and ended timestamp.
 */
export async function completeWorkTaskTiming(
  tenantId: string,
  timingId: string
): Promise<WorkTaskTiming> {
  const { data: timing, error: fetchErr } = await supabase
    .from('work_task_timings')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', timingId)
    .single()

  if (fetchErr || !timing) throw fetchErr || new Error('Timing record not found')

  const now = new Date()
  let totalDuration = timing.duration_seconds || 0

  if (timing.status === 'running') {
    const startedAt = new Date(timing.started_at)
    const elapsed = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000))
    totalDuration += elapsed
  }

  const { data: updated, error: updateErr } = await supabase
    .from('work_task_timings')
    .update({
      status: 'completed',
      ended_at: now.toISOString(),
      duration_seconds: totalDuration,
    })
    .eq('tenant_id', tenantId)
    .eq('id', timingId)
    .select()
    .single()

  if (updateErr) throw updateErr
  return updated
}

/**
 * Helper: Fetches customers list for tenant.
 */
export async function getCustomers(tenantId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name')

  if (error) throw error
  return data || []
}

/**
 * Helper: Fetches vehicles list for tenant.
 */
export async function getVehicles(tenantId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('plate')

  if (error) throw error
  return data || []
}

/**
 * Helper: Fetches service orders for tenant.
 */
export async function getServiceOrders(tenantId: string): Promise<ServiceOrder[]> {
  const { data, error } = await supabase
    .from('service_orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('code', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Helper: Fetches products / inventory for tenant.
 */
export async function getInventory(tenantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name')

  if (error) throw error
  return data || []
}

/**
 * Helper: Records an inventory movement (Kardex).
 */
export async function recordInventoryMovement(
  tenantId: string,
  movement: InventoryMovementInsert
): Promise<InventoryMovement> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert({
      ...movement,
      tenant_id: tenantId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export interface CRMOpportunitiesData {
  pendingQuotesTotal: number
  pendingQuotes: Array<{
    id: string
    code: number
    customer_name: string
    customer_phone: string | null
    plate: string
    total_amount: number | null
    created_at: string
  }>
  inactiveClientsTotal: number
  inactiveClients: Array<{
    id: string
    name: string
    phone: string | null
    last_order_at: string | null
  }>
}

export async function saveQualityCheck(
  tenantId: string,
  serviceOrderId: string,
  inspectedBy: string,
  data: {
    testDrive: boolean
    wheelTorque: boolean
    fluids: boolean
    dashboardLights: boolean
    washCleaned: boolean
    notes?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('quality_checks').upsert(
    {
      tenant_id: tenantId,
      service_order_id: serviceOrderId,
      inspected_by: inspectedBy,
      test_drive_ok: data.testDrive,
      wheel_torque_ok: data.wheelTorque,
      fluids_checked: data.fluids,
      dashboard_lights_clear: data.dashboardLights,
      wash_cleaned: data.washCleaned,
      notes: data.notes || null,
    },
    { onConflict: 'tenant_id, service_order_id' }
  )

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getCRMOpportunities(tenantId: string): Promise<CRMOpportunitiesData> {
  const [{ data: pendingOrders }, { data: customers }] = await Promise.all([
    supabase
      .from('service_orders')
      .select('id, code, created_at, total_amount, customers(name, phone), vehicles(plate)')
      .eq('tenant_id', tenantId)
      .eq('order_type', 'budget')
      .neq('status', 'cancelled'),
    supabase
      .from('customers')
      .select('id, name, phone, updated_at')
      .eq('tenant_id', tenantId),
  ])

  const pendingQuotes = (pendingOrders || []).map((ord: any) => ({
    id: ord.id,
    code: ord.code,
    customer_name: ord.customers?.name || 'Cliente',
    customer_phone: ord.customers?.phone || null,
    plate: ord.vehicles?.plate || '—',
    total_amount: ord.total_amount || 0,
    created_at: ord.created_at,
  }))

  const pendingQuotesTotal = pendingQuotes.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)

  const inactiveClients = (customers || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    phone: c.phone || null,
    last_order_at: c.updated_at || null,
  }))

  const inactiveClientsTotal = inactiveClients.length * 450 // Estimated average service

  return {
    pendingQuotesTotal,
    pendingQuotes,
    inactiveClientsTotal,
    inactiveClients,
  }
}

export async function reserveStockForApprovedOrder(tenantId: string, serviceOrderId: string): Promise<void> {
  const { data: items } = await supabase
    .from('service_order_items')
    .select('product_id, quantity')
    .eq('tenant_id', tenantId)
    .eq('service_order_id', serviceOrderId)
    .eq('kind', 'part')

  if (!items || items.length === 0) return

  for (const item of items) {
    if (item.product_id) {
      await recordInventoryMovement(tenantId, {
        tenant_id: tenantId,
        product_id: item.product_id,
        service_order_id: serviceOrderId,
        kind: 'reserved',
        quantity: item.quantity,
        notes: `Reserva para OS aprovada`,
      })
    }
  }
}

export async function getProductKardex(tenantId: string, productId: string): Promise<InventoryMovement[]> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as InventoryMovement[]) || []
}

export async function getWorkstations(tenantId: string): Promise<WorkStation[]> {
  const { data, error } = await supabase
    .from('work_stations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name')

  if (error) throw error
  return (data as WorkStation[]) || []
}

export async function createWorkstation(
  tenantId: string,
  name: string,
  kind: 'elevator' | 'box' | 'pit' = 'elevator'
): Promise<WorkStation> {
  const { data, error } = await supabase
    .from('work_stations')
    .insert({
      tenant_id: tenantId,
      name,
      kind,
      status: 'available',
    })
    .select()
    .single()

  if (error) throw error
  return data as WorkStation
}

export async function assignOrderToWorkstation(
  tenantId: string,
  serviceOrderId: string,
  workstationId: string
): Promise<void> {
  await Promise.all([
    supabase
      .from('work_stations')
      .update({ status: 'occupied', current_service_order_id: serviceOrderId })
      .eq('tenant_id', tenantId)
      .eq('id', workstationId),
    supabase
      .from('service_orders')
      .update({ work_station_id: workstationId })
      .eq('tenant_id', tenantId)
      .eq('id', serviceOrderId),
  ])
}

export async function releaseWorkstation(tenantId: string, workstationId: string): Promise<void> {
  const { data: ws } = await supabase
    .from('work_stations')
    .select('current_service_order_id')
    .eq('tenant_id', tenantId)
    .eq('id', workstationId)
    .maybeSingle()

  if (ws?.current_service_order_id) {
    await supabase
      .from('service_orders')
      .update({ work_station_id: null })
      .eq('tenant_id', tenantId)
      .eq('id', ws.current_service_order_id)
  }

  await supabase
    .from('work_stations')
    .update({ status: 'available', current_service_order_id: null })
    .eq('tenant_id', tenantId)
    .eq('id', workstationId)
}

export async function getCustomChecklists(tenantId: string): Promise<CustomChecklist[]> {
  const { data, error } = await supabase
    .from('custom_checklists')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('category_name')

  if (error) throw error
  return (data as CustomChecklist[]) || []
}

export async function addCustomChecklistItem(
  tenantId: string,
  categoryName: string,
  itemLabel: string
): Promise<CustomChecklist> {
  const { data, error } = await supabase
    .from('custom_checklists')
    .insert({
      tenant_id: tenantId,
      category_name: categoryName,
      item_label: itemLabel,
    })
    .select()
    .single()

  if (error) throw error
  return data as CustomChecklist
}

export async function getSuppliers(tenantId: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name')

  if (error) throw error
  return (data as Supplier[]) || []
}

export async function createSupplier(
  tenantId: string,
  supplier: { name: string; cnpj?: string; phone?: string; email?: string }
): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      tenant_id: tenantId,
      name: supplier.name,
      cnpj: supplier.cnpj || null,
      phone: supplier.phone || null,
      email: supplier.email || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Supplier
}

export async function getPurchaseOrders(tenantId: string): Promise<PurchaseOrder[]> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as PurchaseOrder[]) || []
}

export async function receivePurchaseOrder(tenantId: string, purchaseOrderId: string): Promise<void> {
  const { data: items } = await supabase
    .from('purchase_order_items')
    .select('product_id, quantity, unit_cost')
    .eq('tenant_id', tenantId)
    .eq('purchase_order_id', purchaseOrderId)

  if (items && items.length > 0) {
    for (const item of items) {
      // Record Kardex movement
      await recordInventoryMovement(tenantId, {
        tenant_id: tenantId,
        product_id: item.product_id,
        kind: 'in',
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        notes: 'Entrada por Pedido de Compra',
      })

      // Increment product stock
      const { data: prod } = await supabase
        .from('products')
        .select('stock_current')
        .eq('tenant_id', tenantId)
        .eq('id', item.product_id)
        .single()

      if (prod) {
        await supabase
          .from('products')
          .update({ stock_current: (prod.stock_current || 0) + item.quantity })
          .eq('tenant_id', tenantId)
          .eq('id', item.product_id)
      }
    }
  }

  await supabase
    .from('purchase_orders')
    .update({ status: 'received', received_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('id', purchaseOrderId)
}



