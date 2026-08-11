import { describe, expect, it } from 'vitest'
import { DEFAULT_CHECKIN_ITEMS, buildInitialCheckinItems } from '../lib/checkin'

describe('DEFAULT_CHECKIN_ITEMS', () => {
  it('contains the expected workshop check-in categories in display order', () => {
    expect(DEFAULT_CHECKIN_ITEMS.map((item) => item.category)).toEqual([
      'front',
      'rear',
      'left_side',
      'right_side',
      'interior',
      'dashboard',
      'odometer',
      'damage',
      'documents_objects',
      'extra',
    ])
  })
})

describe('buildInitialCheckinItems', () => {
  it('creates tenant-scoped check-in item inserts with default ok status', () => {
    const items = buildInitialCheckinItems('checkin-1', 'tenant-1')

    expect(items).toHaveLength(10)
    expect(items[0]).toMatchObject({
      tenant_id: 'tenant-1',
      checkin_id: 'checkin-1',
      category: 'front',
      status: 'ok',
      sort_order: 0,
    })
    expect(items[9]).toMatchObject({
      category: 'extra',
      sort_order: 9,
    })
  })
})
