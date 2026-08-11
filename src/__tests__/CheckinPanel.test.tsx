import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CheckinPanel } from '../components/CheckinPanel'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'checkin-1' }, error: null }),
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'item-1', category: 'front', status: 'ok', sort_order: 1 },
                { id: 'item-2', category: 'rear', status: 'ok', sort_order: 2 }
              ],
              error: null
            }),
          })),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'checkin-1' }, error: null }),
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/photo.jpg' } })),
      })),
    },
  },
}))

describe('CheckinPanel', () => {
  it('renders check-in loading state then displays checklist categories', async () => {
    const activeTenant = { userId: 'user-1', tenantId: 'tenant-1', tenantName: 'Oficina Central', role: 'owner' as const }
    render(<CheckinPanel activeTenant={activeTenant} serviceOrderId="order-1" mode="checkin" />)

    expect(screen.getByText(/carregando.*check-in/i)).toBeDefined()

    await waitFor(() => {
      expect(screen.getAllByText(/Frente/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Traseira/i).length).toBeGreaterThan(0)
    })
  })
})
