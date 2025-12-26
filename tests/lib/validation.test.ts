import { describe, it, expect } from 'vitest'
import {
  EmailSchema,
  PasswordSchema,
  UsernameSchema,
  UUIDSchema,
  PortalCreationSchema,
  BiometricConsentSchema,
  validate,
  safeValidate
} from '@/lib/validation/schemas'

describe('EmailSchema', () => {
  it('accepts valid email', () => {
    expect(() => EmailSchema.parse('test@example.com')).not.toThrow()
  })

  it('rejects invalid email', () => {
    expect(() => EmailSchema.parse('invalid')).toThrow()
  })

  it('rejects email with plus sign', () => {
    expect(() => EmailSchema.parse('test+alias@example.com')).toThrow()
  })

  it('converts to lowercase', () => {
    const result = EmailSchema.parse('TEST@EXAMPLE.COM')
    expect(result).toBe('test@example.com')
  })

  it('trims whitespace', () => {
    const result = EmailSchema.parse('  test@example.com  ')
    expect(result).toBe('test@example.com')
  })
})

describe('PasswordSchema', () => {
  it('accepts strong password', () => {
    expect(() => PasswordSchema.parse('StrongPass123!')).not.toThrow()
  })

  it('rejects short password', () => {
    expect(() => PasswordSchema.parse('Short1!')).toThrow()
  })

  it('rejects password without uppercase', () => {
    expect(() => PasswordSchema.parse('weakpass123!')).toThrow()
  })

  it('rejects password without number', () => {
    expect(() => PasswordSchema.parse('WeakPassword!')).toThrow()
  })

  it('rejects password without special char', () => {
    expect(() => PasswordSchema.parse('WeakPassword123')).toThrow()
  })
})

describe('UsernameSchema', () => {
  it('accepts valid username', () => {
    expect(() => UsernameSchema.parse('validuser123')).not.toThrow()
  })

  it('rejects short username', () => {
    expect(() => UsernameSchema.parse('ab')).toThrow()
  })

  it('rejects long username', () => {
    expect(() => UsernameSchema.parse('a'.repeat(31))).toThrow()
  })

  it('rejects username with spaces', () => {
    expect(() => UsernameSchema.parse('user name')).toThrow()
  })

  it('rejects username with special chars', () => {
    expect(() => UsernameSchema.parse('user@name')).toThrow()
  })
})

describe('UUIDSchema', () => {
  it('accepts valid UUID', () => {
    expect(() => UUIDSchema.parse('123e4567-e89b-12d3-a456-426614174000')).not.toThrow()
  })

  it('rejects invalid UUID', () => {
    expect(() => UUIDSchema.parse('not-a-uuid')).toThrow()
  })
})

describe('PortalCreationSchema', () => {
  it('accepts valid portal data', () => {
    const validData = {
      name: 'Test Portal',
      description: 'Test Description',
      category: 'body',
      difficulty_level: 1
    }
    expect(() => PortalCreationSchema.parse(validData)).not.toThrow()
  })

  it('rejects invalid difficulty level', () => {
    const invalidData = {
      name: 'Test Portal',
      description: 'Test Description',
      category: 'body',
      difficulty_level: 6 // Out of range
    }
    expect(() => PortalCreationSchema.parse(invalidData)).toThrow()
  })
})

describe('BiometricConsentSchema', () => {
  it('accepts valid consent', () => {
    const validData = {
      biometricCapture: true,
      dataStorage: true,
      dataAnalysis: true,
      consentTimestamp: new Date().toISOString()
    }
    expect(() => BiometricConsentSchema.parse(validData)).not.toThrow()
  })

  it('requires biometric capture', () => {
    const invalidData = {
      biometricCapture: false,
      dataStorage: true,
      dataAnalysis: true
    }
    expect(() => BiometricConsentSchema.parse(invalidData)).toThrow()
  })
})

describe('validate', () => {
  it('throws on validation error', () => {
    expect(() => validate(EmailSchema, 'invalid')).toThrow()
  })

  it('returns parsed data on success', () => {
    const result = validate(EmailSchema, 'test@example.com')
    expect(result).toBe('test@example.com')
  })
})

describe('safeValidate', () => {
  it('returns success=false on error', () => {
    const result = safeValidate(EmailSchema, 'invalid')
    expect(result.success).toBe(false)
  })

  it('returns success=true and data on success', () => {
    const result = safeValidate(EmailSchema, 'test@example.com')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('test@example.com')
    }
  })

  it('includes error details on failure', () => {
    const result = safeValidate(EmailSchema, 'invalid')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeDefined()
    }
  })
})