import { describe, expect, it } from 'vitest'
import { getActiveTenant, toTenantOnboardingArgs } from '../lib/tenant'

describe('getActiveTenant', () => {
  it('maps a membership with its joined tenant into the active tenant context', () => {
    expect(
      getActiveTenant('user-1', {
        tenant_id: 'tenant-1',
        role: 'owner',
        tenants: { name: 'Oficina Central' },
      }),
    ).toEqual({
      userId: 'user-1',
      tenantId: 'tenant-1',
      tenantName: 'Oficina Central',
      role: 'owner',
    })
  })

  it('returns null when the joined tenant cannot be read so the gate can surface a membership error', () => {
    expect(
      getActiveTenant('user-1', {
        tenant_id: 'tenant-1',
        role: 'technician',
        tenants: null,
      }),
    ).toBeNull()
  })
})

describe('toTenantOnboardingArgs', () => {
  it('trims values and converts optional blanks to null for the onboarding RPC', () => {
    expect(
      toTenantOnboardingArgs({
        name: '  Oficina Central  ',
        document: '  12.345.678/0001-99 ',
        phone: ' ',
      }),
    ).toEqual({
      tenant_name: 'Oficina Central',
      tenant_document: '12.345.678/0001-99',
      tenant_phone: null,
    })
  })
})
