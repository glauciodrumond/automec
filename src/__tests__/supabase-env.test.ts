import { describe, expect, it } from 'vitest'
import { getSupabaseConfig } from '../lib/supabase'

describe('getSupabaseConfig', () => {
  it('returns a stable configuration object', () => {
    const config = getSupabaseConfig()

    expect(config).toHaveProperty('url')
    expect(config).toHaveProperty('anonKey')
    expect(config).toHaveProperty('configured')
    expect(typeof config.configured).toBe('boolean')
  })
})
