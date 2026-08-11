// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGate } from '../components/AuthGate'

const mocks = vi.hoisted(() => {
  const insert = vi.fn()
  const maybeSingle = vi.fn()
  const order = vi.fn()
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order,
    limit: vi.fn(),
    maybeSingle,
    insert,
  }

  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.limit.mockReturnValue(builder)

  return {
    builder,
    from: vi.fn(() => builder),
    getSession: vi.fn(),
    insert,
    maybeSingle,
    onAuthStateChange: vi.fn(),
    order,
    rpc: vi.fn(),
    signOut: vi.fn(),
  }
})

vi.mock('../lib/supabase', () => ({
  getSupabaseConfig: () => ({ configured: true }),
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signOut: mocks.signOut,
    },
    from: mocks.from,
    rpc: mocks.rpc,
  },
}))

describe('AuthGate onboarding', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    })
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    mocks.rpc.mockResolvedValue({ error: null })
  })

  it('creates a first workshop through the RPC without direct table inserts', async () => {
    render(<AuthGate>{() => <p>Authenticated</p>}</AuthGate>)

    await screen.findByRole('heading', { name: 'Cadastre sua oficina' })
    fireEvent.change(screen.getByLabelText('Nome da oficina'), { target: { value: 'Oficina Central' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar oficina' }))

    await waitFor(() => {
      expect(mocks.rpc).toHaveBeenCalledWith('create_tenant_with_owner', {
        tenant_name: 'Oficina Central',
        tenant_document: null,
        tenant_phone: null,
      })
    })

    expect(mocks.insert).not.toHaveBeenCalled()
    expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: true })
  })

  it('shows a membership error instead of onboarding when its tenant join is unreadable', async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { tenant_id: 'tenant-1', role: 'owner', tenants: null },
      error: null,
    })

    render(<AuthGate>{() => <p>Authenticated</p>}</AuthGate>)

    await screen.findByText('Nao foi possivel validar sua oficina. Verifique a sessao e as permissoes RLS.')
    expect(screen.queryByRole('heading', { name: 'Cadastre sua oficina' })).toBeNull()
  })
})
