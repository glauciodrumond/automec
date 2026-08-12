import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

describe('Migration 007 - AutoOS Phase 1 Schema', () => {
  it('migration file exists', () => {
    const migrationPath = resolve(
      __dirname,
      '../../supabase/migrations/202608110007_autoos_phase1.sql'
    )
    expect(existsSync(migrationPath)).toBe(true)

    const sqlContent = readFileSync(migrationPath, 'utf-8')
    expect(sqlContent).toContain('public.work_task_timings')
    expect(sqlContent).toContain('public.inventory_movements')
    expect(sqlContent).toContain('wtt_member_select')
    expect(sqlContent).toContain('inv_mov_member_select')
  })
})
