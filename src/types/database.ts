export type TenantRole = 'owner' | 'admin' | 'technician'
export type ServiceOrderStatus = 'open' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled'
export type ServiceOrderPriority = 'low' | 'normal' | 'high'
export type ServiceOrderItemKind = 'labor' | 'part' | 'other'
export type CheckinCategory =
  | 'front'
  | 'rear'
  | 'left_side'
  | 'right_side'
  | 'interior'
  | 'dashboard'
  | 'odometer'
  | 'damage'
  | 'documents_objects'
  | 'extra'
export type CheckinStatus = 'ok' | 'attention' | 'damaged' | 'not_applicable'

export type Json = boolean | number | string | null | { [key: string]: Json | undefined } | Json[]

export interface TenantRow {
  id: string
  name: string
  document: string | null
  phone: string | null
  created_at: string
}
export type Tenant = TenantRow
export interface TenantInsert {
  id?: string
  name: string
  document?: string | null
  phone?: string | null
  created_at?: string
}

export interface TenantMemberRow {
  tenant_id: string
  user_id: string
  role: TenantRole
  created_at: string
}
export type TenantMembershipRow = TenantMemberRow
export type TenantMember = TenantMemberRow
export type TenantMembership = TenantMemberRow
export interface TenantMemberInsert {
  tenant_id: string
  user_id: string
  role: TenantRole
  created_at?: string
}
export type TenantMembershipInsert = TenantMemberInsert

export type ProductKind = 'part' | 'labor' | 'service'

export interface ProductRow {
  id: string
  tenant_id: string
  code: number
  name: string
  group_name: string | null
  kind: ProductKind
  unit: string
  cost_price: number
  sell_price: number
  stock_current: number
  stock_min: number
  ncm: string | null
  active: boolean
  created_at: string
  updated_at: string
}
export type Product = ProductRow
export interface ProductInsert {
  id?: string
  tenant_id: string
  code: number
  name: string
  group_name?: string | null
  kind?: ProductKind
  unit?: string
  cost_price?: number
  sell_price?: number
  stock_current?: number
  stock_min?: number
  ncm?: string | null
  active?: boolean
  created_at?: string
  updated_at?: string
}

export interface CustomerRow {
  id: string
  tenant_id: string
  name: string
  fantasy_name?: string | null
  person_type?: 'physical' | 'legal'
  document: string | null
  phone: string | null
  email: string | null
  address: string | null
  cep?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  ie?: string | null
  created_at: string
  updated_at: string
}
export type Customer = CustomerRow
export interface CustomerInsert {
  id?: string
  tenant_id: string
  name: string
  fantasy_name?: string | null
  person_type?: 'physical' | 'legal'
  document?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  cep?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  ie?: string | null
  created_at?: string
  updated_at?: string
}

export interface VehicleRow {
  id: string
  tenant_id: string
  customer_id: string
  plate: string
  type: string
  brand: string | null
  model: string | null
  year: number | null
  color: string | null
  created_at: string
  updated_at: string
}
export type Vehicle = VehicleRow
export interface VehicleInsert {
  id?: string
  tenant_id: string
  customer_id: string
  plate: string
  type?: string
  brand?: string | null
  model?: string | null
  year?: number | null
  color?: string | null
  created_at?: string
  updated_at?: string
}

export interface ServiceOrderRow {
  id: string
  tenant_id: string
  customer_id: string
  vehicle_id: string
  code: number
  order_type?: 'normal' | 'warranty' | 'budget'
  status: ServiceOrderStatus
  priority: ServiceOrderPriority
  entry_at: string
  exit_at: string | null
  odometer: number | null
  complaint: string | null
  found_defect?: string | null
  internal_notes: string | null
  discount_amount?: number
  labor_total?: number
  parts_total?: number
  total_amount?: number
  created_by: string
  created_at: string
  updated_at: string
}
export type ServiceOrder = ServiceOrderRow
export interface ServiceOrderInsert {
  id?: string
  tenant_id: string
  customer_id: string
  vehicle_id: string
  code: number
  order_type?: 'normal' | 'warranty' | 'budget'
  status?: ServiceOrderStatus
  priority?: ServiceOrderPriority
  entry_at?: string
  exit_at?: string | null
  odometer?: number | null
  complaint?: string | null
  found_defect?: string | null
  internal_notes?: string | null
  discount_amount?: number
  labor_total?: number
  parts_total?: number
  total_amount?: number
  created_by: string
  created_at?: string
  updated_at?: string
}

export interface ServiceOrderItemRow {
  id: string
  tenant_id: string
  service_order_id: string
  product_id?: string | null
  kind: ServiceOrderItemKind
  description: string
  quantity: number
  unit_price: number
  created_at: string
}
export type ServiceOrderItem = ServiceOrderItemRow
export interface ServiceOrderItemInsert {
  id?: string
  tenant_id: string
  service_order_id: string
  product_id?: string | null
  kind: ServiceOrderItemKind
  description: string
  quantity?: number
  unit_price?: number
  created_at?: string
}

export interface CheckinRow {
  id: string
  tenant_id: string
  service_order_id: string
  general_notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}
export type Checkin = CheckinRow
export interface CheckinInsert {
  id?: string
  tenant_id: string
  service_order_id: string
  general_notes?: string | null
  created_by: string
  created_at?: string
  updated_at?: string
}

export interface CheckinItemRow {
  id: string
  tenant_id: string
  checkin_id: string
  category: CheckinCategory
  status: CheckinStatus
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}
export type CheckinItem = CheckinItemRow
export interface CheckinItemInsert {
  id?: string
  tenant_id: string
  checkin_id: string
  category: CheckinCategory
  status?: CheckinStatus
  notes?: string | null
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export interface CheckinPhotoRow {
  id: string
  tenant_id: string
  checkin_id: string
  checkin_item_id: string | null
  category: CheckinCategory
  storage_path: string
  caption: string | null
  content_type: string
  size_bytes: number
  sort_order: number
  uploaded_by: string
  created_at: string
}
export type CheckinPhoto = CheckinPhotoRow
export interface CheckinPhotoInsert {
  id?: string
  tenant_id: string
  checkin_id: string
  checkin_item_id?: string | null
  category: CheckinCategory
  storage_path: string
  caption?: string | null
  content_type: string
  size_bytes: number
  sort_order?: number
  uploaded_by: string
  created_at?: string
}

export interface AuditEventRow {
  id: string
  tenant_id: string
  actor_id: string | null
  entity_type: string
  entity_id: string
  event_type: string
  metadata: Json
  created_at: string
}
export type AuditEvent = AuditEventRow
export interface AuditEventInsert {
  id?: string
  tenant_id: string
  actor_id?: string | null
  entity_type: string
  entity_id: string
  event_type: string
  metadata?: Json
  created_at?: string
}

