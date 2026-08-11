import { describe, expect, it } from 'vitest'
import { maskPhone, maskCpfCnpj, maskCep, maskPlate } from '../lib/masks'

describe('Input Masks', () => {
  it('formats telephone correctly', () => {
    expect(maskPhone('31999998888')).toBe('(31) 99999-8888')
    expect(maskPhone('3138260476')).toBe('(31) 3826-0476')
  })

  it('formats CPF and CNPJ correctly', () => {
    expect(maskCpfCnpj('06281444663')).toBe('062.814.446-63')
    expect(maskCpfCnpj('12345678000195')).toBe('12.345.678/0001-95')
  })

  it('formats CEP correctly', () => {
    expect(maskCep('35164031')).toBe('35164-031')
  })

  it('formats Mercosul and classic plates', () => {
    expect(maskPlate('gxs1693')).toBe('GXS-1693')
    expect(maskPlate('abc1d23')).toBe('ABC1D23')
  })
})
