import type { CheckinCategory, CheckinItemInsert } from '../types/database'

export interface DefaultCheckinItem {
  category: CheckinCategory
  label: string
  sortOrder: number
}

export const DEFAULT_CHECKIN_ITEMS: DefaultCheckinItem[] = [
  { category: 'front', label: 'Frente', sortOrder: 0 },
  { category: 'rear', label: 'Traseira', sortOrder: 1 },
  { category: 'left_side', label: 'Lateral esquerda', sortOrder: 2 },
  { category: 'right_side', label: 'Lateral direita', sortOrder: 3 },
  { category: 'interior', label: 'Interior', sortOrder: 4 },
  { category: 'dashboard', label: 'Painel', sortOrder: 5 },
  { category: 'odometer', label: 'Hodometro', sortOrder: 6 },
  { category: 'damage', label: 'Avarias', sortOrder: 7 },
  { category: 'documents_objects', label: 'Documentos/objetos', sortOrder: 8 },
  { category: 'extra', label: 'Extras', sortOrder: 9 },
]

export function buildInitialCheckinItems(checkinId: string, tenantId: string): CheckinItemInsert[] {
  return DEFAULT_CHECKIN_ITEMS.map((item) => ({
    tenant_id: tenantId,
    checkin_id: checkinId,
    category: item.category,
    status: 'ok',
    notes: null,
    sort_order: item.sortOrder,
  }))
}
