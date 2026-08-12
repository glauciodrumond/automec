import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('AUTOOS Phase 4 Schema', () => {
  it('has migration 010 file on disk', () => {
    const path = join(process.cwd(), 'supabase/migrations/202608110010_autoos_phase4.sql')
    expect(existsSync(path)).toBe(true)
  })
})
