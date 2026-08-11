import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TeamMembers } from '../components/TeamMembers'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [
              { tenant_id: 't-1', user_id: 'u-1', role: 'owner', commission_pct: 10, commission_type: 'percentage', created_at: '2026-01-01' }
            ],
            error: null
          }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    })),
  },
}))

describe('TeamMembers', () => {
  const activeTenant = {
    userId: 'u-1',
    tenantId: 't-1',
    tenantName: 'Oficina Central',
    role: 'owner' as const,
  }

  it('renders team heading and member list', async () => {
    render(<TeamMembers activeTenant={activeTenant} />)

    expect(screen.getByText(/Membros da Equipe/i)).toBeDefined()

    await waitFor(() => {
      expect(screen.getByText(/Proprietário/i)).toBeDefined()
    })
  })
})
