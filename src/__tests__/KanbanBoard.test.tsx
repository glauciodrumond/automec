import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { KanbanBoard } from '../components/KanbanBoard'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          neq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    })),
  },
}))

describe('KanbanBoard', () => {
  const activeTenant = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    tenantName: 'Oficina Central',
    role: 'owner' as const,
  }

  it('renders Kanban heading and stage columns', async () => {
    render(
      <MemoryRouter>
        <KanbanBoard activeTenant={activeTenant} />
      </MemoryRouter>
    )

    expect(screen.getByText(/kanban/i)).toBeDefined()

    await waitFor(() => {
      expect(screen.getByText('Entrada')).toBeDefined()
      expect(screen.getByText('Diagnóstico')).toBeDefined()
      expect(screen.getByText(/Aguard\. Peça/i)).toBeDefined()
      expect(screen.getByText('Em Execução')).toBeDefined()
      expect(screen.getByText(/Pronto/i)).toBeDefined()
      expect(screen.getByText('Entregue')).toBeDefined()
    })
  })
})
