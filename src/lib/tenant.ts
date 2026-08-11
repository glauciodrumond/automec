import type { TenantRole } from '../types/database'

export interface ActiveTenantContext {
  userId: string
  tenantId: string
  tenantName: string
  role: TenantRole
}

interface TenantMembershipWithTenant {
  tenant_id: string
  role: TenantRole
  tenants: { name: string } | null
}

export interface TenantOnboardingFormValues {
  name: string
  document: string
  phone: string
}

export function getActiveTenant(
  userId: string,
  membership: TenantMembershipWithTenant,
): ActiveTenantContext | null {
  if (!membership.tenants) {
    return null
  }

  return {
    userId,
    tenantId: membership.tenant_id,
    tenantName: membership.tenants.name,
    role: membership.role,
  }
}

export function toTenantOnboardingArgs(values: TenantOnboardingFormValues) {
  const optionalValue = (value: string) => value.trim() || null

  return {
    tenant_name: values.name.trim(),
    tenant_document: optionalValue(values.document),
    tenant_phone: optionalValue(values.phone),
  }
}
