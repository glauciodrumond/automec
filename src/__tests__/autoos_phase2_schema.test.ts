import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import type { QualityCheckRow, QualityCheckInsert } from '../types/database'

describe('Migration 008 - AutoOS Phase 2 Quality Checks Schema', () => {
  it('migration file exists and contains correct DDL', () => {
    const migrationPath = resolve(
      __dirname,
      '../../supabase/migrations/202608110008_autoos_phase2.sql'
    )
    expect(existsSync(migrationPath)).toBe(true)

    const sqlContent = readFileSync(migrationPath, 'utf-8')
    expect(sqlContent).toContain('public.quality_checks')
    expect(sqlContent).toContain('quality_checks_tenant_order_idx')
    expect(sqlContent).toContain('qc_member_select')
    expect(sqlContent).toContain('qc_staff_insert')
    expect(sqlContent).toContain('public.is_tenant_member')
    expect(sqlContent).toContain('public.has_tenant_role')
  })

  it('exports QualityCheck types correctly', () => {
    const checkRow: QualityCheckRow = {
      id: 'qc-1',
      tenant_id: 'tenant-1',
      service_order_id: 'so-1',
      inspected_by: 'user-1',
      test_drive_ok: true,
      wheel_torque_ok: true,
      fluids_checked: true,
      dashboard_lights_clear: true,
      wash_cleaned: true,
      notes: 'All checks passed',
      created_at: '2026-08-11T20:00:00Z',
    }

    const checkInsert: QualityCheckInsert = {
      tenant_id: 'tenant-1',
      service_order_id: 'so-1',
      inspected_by: 'user-1',
    }

    expect(checkRow.inspected_by).toBe('user-1')
    expect(checkInsert.tenant_id).toBe('tenant-1')
  })
})
