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
  commission_pct?: number
  commission_type?: 'percentage' | 'fixed'
  created_at: string
}
export type TenantMembershipRow = TenantMemberRow
export type TenantMember = TenantMemberRow
export type TenantMembership = TenantMemberRow
export interface TenantMemberInsert {
  tenant_id: string
  user_id: string
  role: TenantRole
  commission_pct?: number
  commission_type?: 'percentage' | 'fixed'
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
  barcode?: string | null
  supplier_name?: string | null
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
  barcode?: string | null
  supplier_name?: string | null
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
  birth_date?: string | null
  send_reminder_days?: number
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
  birth_date?: string | null
  send_reminder_days?: number
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

export type ServiceOrderStage = 'entry' | 'diagnosis' | 'waiting_parts' | 'in_execution' | 'ready' | 'delivered'
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'ticket' | 'billed'
export type PaymentStatus = 'pending' | 'paid' | 'overdue'

export interface PaymentRow {
  id: string
  tenant_id: string
  service_order_id: string
  customer_id: string | null
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  due_date: string
  paid_at: string | null
  notes: string | null
  created_at: string
}
export type Payment = PaymentRow
export interface PaymentInsert {
  id?: string
  tenant_id: string
  service_order_id: string
  customer_id?: string | null
  amount: number
  payment_method: PaymentMethod
  status?: PaymentStatus
  due_date?: string
  paid_at?: string | null
  notes?: string | null
  created_at?: string
}

export interface ServiceOrderRow {
  id: string
  tenant_id: string
  customer_id: string
  vehicle_id: string
  code: number
  order_type?: 'normal' | 'warranty' | 'budget'
  status: ServiceOrderStatus
  stage?: ServiceOrderStage
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
  payment_method?: PaymentMethod | null
  payment_status?: PaymentStatus
  assigned_to?: string | null
  approved_at?: string | null
  approved_by?: string | null
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
  stage?: ServiceOrderStage
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
  payment_method?: PaymentMethod | null
  payment_status?: PaymentStatus
  assigned_to?: string | null
  approved_at?: string | null
  approved_by?: string | null
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

// ─── Enterprise Full Schema Types ────────────────────────────────────────────

export type ScheduleStatus = 'scheduled' | 'confirmed' | 'converted' | 'cancelled'

export interface ScheduleRow {
  id: string
  tenant_id: string
  customer_id: string | null
  vehicle_id: string | null
  assigned_to: string | null
  scheduled_at: string
  duration_min: number
  service_description: string
  status: ScheduleStatus
  service_order_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
export type Schedule = ScheduleRow
export interface ScheduleInsert {
  id?: string
  tenant_id: string
  customer_id?: string | null
  vehicle_id?: string | null
  assigned_to?: string | null
  scheduled_at: string
  duration_min?: number
  service_description: string
  status?: ScheduleStatus
  service_order_id?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export type CommissionStatus = 'pending' | 'paid'

export interface CommissionRow {
  id: string
  tenant_id: string
  service_order_id: string
  user_id: string
  base_amount: number
  commission_pct: number
  commission_amount: number
  status: CommissionStatus
  paid_at: string | null
  notes: string | null
  created_at: string
}
export type Commission = CommissionRow
export interface CommissionInsert {
  id?: string
  tenant_id: string
  service_order_id: string
  user_id: string
  base_amount: number
  commission_pct: number
  commission_amount: number
  status?: CommissionStatus
  paid_at?: string | null
  notes?: string | null
  created_at?: string
}

export type CashTransactionKind = 'income' | 'expense'

export interface CashTransactionRow {
  id: string
  tenant_id: string
  service_order_id: string | null
  payment_id: string | null
  kind: CashTransactionKind
  category: string
  description: string
  amount: number
  transaction_date: string
  notes: string | null
  created_at: string
}
export type CashTransaction = CashTransactionRow
export interface CashTransactionInsert {
  id?: string
  tenant_id: string
  service_order_id?: string | null
  payment_id?: string | null
  kind: CashTransactionKind
  category: string
  description: string
  amount: number
  transaction_date?: string
  notes?: string | null
  created_at?: string
}

export interface ServiceOrderTokenRow {
  token: string
  tenant_id: string
  service_order_id: string
  expires_at: string
  created_at: string
}
export type ServiceOrderToken = ServiceOrderTokenRow

export interface ServiceOrderApprovalRow {
  id: string
  token: string
  service_order_item_id: string
  approved: boolean
  customer_name: string | null
  approved_at: string
}
export type ServiceOrderApproval = ServiceOrderApprovalRow
export interface ServiceOrderApprovalInsert {
  id?: string
  token: string
  service_order_item_id: string
  approved?: boolean
  customer_name?: string | null
  approved_at?: string
}

export type WorkTaskTimingStatus = 'running' | 'paused' | 'completed'

export interface WorkTaskTimingRow {
  id: string
  tenant_id: string
  service_order_id: string
  service_order_item_id: string
  mechanic_id: string
  status: WorkTaskTimingStatus
  started_at: string
  paused_at: string | null
  ended_at: string | null
  duration_seconds: number
  created_at: string
}
export type WorkTaskTiming = WorkTaskTimingRow

export interface WorkTaskTimingInsert {
  id?: string
  tenant_id: string
  service_order_id: string
  service_order_item_id: string
  mechanic_id: string
  status?: WorkTaskTimingStatus
  started_at?: string
  paused_at?: string | null
  ended_at?: string | null
  duration_seconds?: number
  created_at?: string
}

export type InventoryMovementKind = 'in' | 'out' | 'reserved' | 'adjustment'

export interface InventoryMovementRow {
  id: string
  tenant_id: string
  product_id: string
  service_order_id: string | null
  kind: InventoryMovementKind
  quantity: number
  unit_cost: number | null
  notes: string | null
  created_at: string
}
export type InventoryMovement = InventoryMovementRow

export interface InventoryMovementInsert {
  id?: string
  tenant_id: string
  product_id: string
  service_order_id?: string | null
  kind: InventoryMovementKind
  quantity: number
  unit_cost?: number | null
  notes?: string | null
  created_at?: string
}

export interface QualityCheckRow {
  id: string
  tenant_id: string
  service_order_id: string
  inspected_by: string
  test_drive_ok: boolean
  wheel_torque_ok: boolean
  fluids_checked: boolean
  dashboard_lights_clear: boolean
  wash_cleaned: boolean
  notes: string | null
  created_at: string
}
export type QualityCheck = QualityCheckRow

export interface QualityCheckInsert {
  id?: string
  tenant_id: string
  service_order_id: string
  inspected_by: string
  test_drive_ok?: boolean
  wheel_torque_ok?: boolean
  fluids_checked?: boolean
  dashboard_lights_clear?: boolean
  wash_cleaned?: boolean
  notes?: string | null
  created_at?: string
}

export type WorkStationKind = 'elevator' | 'box' | 'pit'
export type WorkStationStatus = 'available' | 'occupied' | 'maintenance'

export interface WorkStationRow {
  id: string
  tenant_id: string
  name: string
  kind: WorkStationKind
  status: WorkStationStatus
  current_service_order_id: string | null
  created_at: string
}
export type WorkStation = WorkStationRow

export interface WorkStationInsert {
  id?: string
  tenant_id: string
  name: string
  kind?: WorkStationKind
  status?: WorkStationStatus
  current_service_order_id?: string | null
  created_at?: string
}

export interface CustomChecklistRow {
  id: string
  tenant_id: string
  category_name: string
  item_label: string
  sort_order: number
  created_at: string
}
export type CustomChecklist = CustomChecklistRow

export interface CustomChecklistInsert {
  id?: string
  tenant_id: string
  category_name: string
  item_label: string
  sort_order?: number
  created_at?: string
}

export interface SupplierRow {
  id: string
  tenant_id: string
  name: string
  cnpj: string | null
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
}
export type Supplier = SupplierRow

export interface SupplierInsert {
  id?: string
  tenant_id: string
  name: string
  cnpj?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
  created_at?: string
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'cancelled'

export interface PurchaseOrderRow {
  id: string
  tenant_id: string
  supplier_id: string | null
  status: PurchaseOrderStatus
  total_cost: number
  notes: string | null
  received_at: string | null
  created_at: string
}
export type PurchaseOrder = PurchaseOrderRow

export interface PurchaseOrderInsert {
  id?: string
  tenant_id: string
  supplier_id?: string | null
  status?: PurchaseOrderStatus
  total_cost?: number
  notes?: string | null
  received_at?: string | null
  created_at?: string
}




