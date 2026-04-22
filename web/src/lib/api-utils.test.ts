import { describe, expect, it } from 'vitest'

describe('Condition Validation', () => {
  const validConditions = ['OK', 'RUSAK_RINGAN', 'RUSAK_TOTAL', 'MAINTENANCE'] as const
  
  it('should have valid condition values', () => {
    expect(validConditions).toContain('OK')
    expect(validConditions).toContain('RUSAK_RINGAN')
    expect(validConditions).toContain('RUSAK_TOTAL')
    expect(validConditions).toContain('MAINTENANCE')
  })
})

describe('Price Formatting', () => {
  const formatRupiah = (amount: number): string => {
    return amount.toLocaleString('id-ID')
  }

  it('should format prices in Indonesian locale', () => {
    expect(formatRupiah(5000000)).toBe('5.000.000')
    expect(formatRupiah(0)).toBe('0')
    expect(formatRupiah(100000)).toBe('100.000')
  })
})

describe('Asset Code Validation', () => {
  const isValidCode = (code: string): boolean => {
    return code.length > 0 && code.length <= 50
  }

  it('should reject empty codes', () => {
    expect(isValidCode('')).toBe(false)
  })

  it('should accept valid codes', () => {
    expect(isValidCode('PC-LAB1-001')).toBe(true)
    expect(isValidCode('LAPTOP-001')).toBe(true)
  })
})

describe('Category Name Validation', () => {
  const isValidName = (name: string): boolean => {
    return name.trim().length >= 2 && name.length <= 100
  }

  it('should accept valid names', () => {
    expect(isValidName('Laptop')).toBe(true)
    expect(isValidName('PC Desktop')).toBe(true)
    expect(isValidName('Switch')).toBe(true)
  })

  it('should reject short names', () => {
    expect(isValidName('')).toBe(false)
    expect(isValidName('A')).toBe(false)
  })
})

describe('URL Builder', () => {
  const API_BASE = 'http://localhost:8080'
  
  const buildUrl = (path: string): string => {
    return `${API_BASE}${path}`
  }

  it('should build correct API URLs', () => {
    expect(buildUrl('/api/categories')).toBe('http://localhost:8080/api/categories')
    expect(buildUrl('/api/assets/1')).toBe('http://localhost:8080/api/assets/1')
  })
})

describe('Array Operations', () => {
  it('should filter items by condition', () => {
    const items = [
      { id: 1, condition: 'OK' },
      { id: 2, condition: 'RUSAK_RINGAN' },
      { id: 3, condition: 'OK' },
    ]
    
    const okItems = items.filter(i => i.condition === 'OK')
    expect(okItems.length).toBe(2)
  })

  it('should calculate total value', () => {
    const items = [
      { price: 5000000 },
      { price: 3000000 },
      { price: null },
    ]
    
    const total = items.reduce((sum, item) => sum + (item.price ?? 0), 0)
    expect(total).toBe(8000000)
  })
})
