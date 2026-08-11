import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { resolve } from 'path'

describe('Migration 006 - Enterprise Full Schema', () => {
  it('migration file exists', () => {
    const migrationPath = resolve(
      __dirname,
      '../../supabase/migrations/202608110006_enterprise_full_schema.sql'
    )
    expect(existsSync(migrationPath)).toBe(true)
  })
})
