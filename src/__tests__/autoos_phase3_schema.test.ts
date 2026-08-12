import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('AUTOOS Phase 3 Schema', () => {
  it('has migration 009 file on disk', () => {
    const path = join(process.cwd(), 'supabase/migrations/202608110009_autoos_phase3.sql')
    expect(existsSync(path)).toBe(true)
  })
})
