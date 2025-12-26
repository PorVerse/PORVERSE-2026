import { describe, it, expect, beforeEach } from 'vitest'
import {
  encrypt,
  decrypt,
  hash,
  compareHash,
  generateToken
} from '@/lib/security/encryption'

describe('encrypt/decrypt', () => {
  it('encrypts and decrypts text correctly', () => {
    const original = 'sensitive data'
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)
    
    expect(decrypted).toBe(original)
    expect(encrypted).not.toBe(original)
  })

  it('produces different ciphertexts for same input', () => {
    const text = 'test'
    const encrypted1 = encrypt(text)
    const encrypted2 = encrypt(text)
    
    expect(encrypted1).not.toBe(encrypted2)
  })

  it('handles empty strings', () => {
    const encrypted = encrypt('')
    const decrypted = decrypt(encrypted)
    
    expect(decrypted).toBe('')
  })

  it('handles special characters', () => {
    const special = '!@#$%^&*()_+{}[]|\\:";\'<>?,./'
    const encrypted = encrypt(special)
    const decrypted = decrypt(encrypted)
    
    expect(decrypted).toBe(special)
  })

  it('handles unicode characters', () => {
    const unicode = '你好世界 🌍'
    const encrypted = encrypt(unicode)
    const decrypted = decrypt(encrypted)
    
    expect(decrypted).toBe(unicode)
  })

  it('throws on invalid encrypted data', () => {
    expect(() => decrypt('invalid-data')).toThrow()
  })
})

describe('hash/compareHash', () => {
  it('hashes password correctly', async () => {
    const password = 'myPassword123!'
    const hashed = await hash(password)
    
    expect(hashed).not.toBe(password)
    expect(hashed.length).toBeGreaterThan(50)
  })

  it('produces different hashes for same password', async () => {
    const password = 'test'
    const hash1 = await hash(password)
    const hash2 = await hash(password)
    
    expect(hash1).not.toBe(hash2)
  })

  it('verifies correct password', async () => {
    const password = 'correctPassword123!'
    const hashed = await hash(password)
    const isValid = await compareHash(password, hashed)
    
    expect(isValid).toBe(true)
  })

  it('rejects incorrect password', async () => {
    const password = 'correctPassword123!'
    const hashed = await hash(password)
    const isValid = await compareHash('wrongPassword', hashed)
    
    expect(isValid).toBe(false)
  })

  it('handles empty passwords', async () => {
    const hashed = await hash('')
    const isValid = await compareHash('', hashed)
    
    expect(isValid).toBe(true)
  })
})

describe('generateToken', () => {
  it('generates token of specified length', () => {
    const token = generateToken(32)
    
    expect(token.length).toBe(32 * 2) // Hex encoding doubles length
  })

  it('generates different tokens', () => {
    const token1 = generateToken(16)
    const token2 = generateToken(16)
    
    expect(token1).not.toBe(token2)
  })

  it('generates hex characters only', () => {
    const token = generateToken(16)
    
    expect(/^[0-9a-f]+$/.test(token)).toBe(true)
  })

  it('handles small token sizes', () => {
    const token = generateToken(1)
    
    expect(token.length).toBe(2)
  })

  it('handles large token sizes', () => {
    const token = generateToken(128)
    
    expect(token.length).toBe(256)
  })
})