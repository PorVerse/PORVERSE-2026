/**
 * Field-Level Encryption Service
 * SUPER ENTERPRISE INTERSTELLAR Level
 * 
 * Encryption for:
 * - Biometric data (CRITICAL)
 * - Health information
 * - Personal identifiable information (PII)
 * - Payment information
 * 
 * Algorithm: AES-256-GCM (NIST approved)
 * Key Derivation: scrypt (password-based)
 */

import { 
  createCipheriv, 
  createDecipheriv, 
  randomBytes, 
  scrypt,
  createHash
} from 'crypto'
import { promisify } from 'util'
import { getEnv } from '@/lib/env'

const scryptAsync = promisify(scrypt)

/**
 * Encryption configuration constants
 */
const CONFIG = {
  algorithm: 'aes-256-gcm' as const,
  keyLength: 32, // 256 bits
  ivLength: 16,  // 128 bits
  saltLength: 64,
  tagLength: 16,
  encoding: 'base64' as const
}

/**
 * Field-Level Encryption Service
 */
export class FieldEncryption {
  private masterKey: string

  constructor(masterKey?: string) {
    this.masterKey = masterKey || getEnv('ENCRYPTION_MASTER_KEY') || ''
    
    if (!this.masterKey || this.masterKey.length < 32) {
      throw new Error(
        'Encryption master key must be at least 32 characters. ' +
        'Generate with: openssl rand -base64 32'
      )
    }
  }

  /**
   * Encrypt sensitive field data
   * Returns base64-encoded ciphertext
   * 
   * @param plaintext - Data to encrypt
   * @param masterKey - Optional override master key
   */
  async encrypt(plaintext: string, masterKey?: string): Promise<string> {
    const key = masterKey || this.masterKey
    
    // Generate random salt and IV
    const salt = randomBytes(CONFIG.saltLength)
    const iv = randomBytes(CONFIG.ivLength)
    
    // Derive encryption key from master key using scrypt
    const derivedKey = (await scryptAsync(
      key,
      salt,
      CONFIG.keyLength
    )) as Buffer
    
    // Create cipher
    const cipher = createCipheriv(CONFIG.algorithm, derivedKey, iv)
    
    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ])
    
    // Get authentication tag (GCM mode)
    const tag = cipher.getAuthTag()
    
    // Combine: salt + iv + tag + encrypted
    // This allows decryption without storing salt/IV separately
    const result = Buffer.concat([salt, iv, tag, encrypted])
    
    // Return as base64
    return result.toString(CONFIG.encoding)
  }

  /**
   * Decrypt sensitive field data
   * 
   * @param ciphertext - Base64-encoded encrypted data
   * @param masterKey - Optional override master key
   */
  async decrypt(ciphertext: string, masterKey?: string): Promise<string> {
    const key = masterKey || this.masterKey
    const data = Buffer.from(ciphertext, CONFIG.encoding)
    
    // Extract components
    const salt = data.subarray(0, CONFIG.saltLength)
    const iv = data.subarray(
      CONFIG.saltLength,
      CONFIG.saltLength + CONFIG.ivLength
    )
    const tag = data.subarray(
      CONFIG.saltLength + CONFIG.ivLength,
      CONFIG.saltLength + CONFIG.ivLength + CONFIG.tagLength
    )
    const encrypted = data.subarray(
      CONFIG.saltLength + CONFIG.ivLength + CONFIG.tagLength
    )
    
    // Derive decryption key (must match encryption key)
    const derivedKey = (await scryptAsync(
      key,
      salt,
      CONFIG.keyLength
    )) as Buffer
    
    // Create decipher
    const decipher = createDecipheriv(CONFIG.algorithm, derivedKey, iv)
    decipher.setAuthTag(tag)
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])
    
    return decrypted.toString('utf8')
  }

  /**
   * Encrypt object fields selectively
   * Useful for partial encryption of records
   */
  async encryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[]
  ): Promise<T> {
    const result = { ...obj }
    
    for (const field of fieldsToEncrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        const plaintext = typeof obj[field] === 'string' 
          ? obj[field] 
          : JSON.stringify(obj[field])
        
        result[field] = await this.encrypt(plaintext) as any
      }
    }
    
    return result
  }

  /**
   * Decrypt object fields selectively
   */
  async decryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: (keyof T)[],
    parseJSON = true
  ): Promise<T> {
    const result = { ...obj }
    
    for (const field of fieldsToDecrypt) {
      if (obj[field]) {
        const decrypted = await this.decrypt(obj[field] as string)
        
        if (parseJSON) {
          try {
            result[field] = JSON.parse(decrypted) as any
          } catch {
            result[field] = decrypted as any
          }
        } else {
          result[field] = decrypted as any
        }
      }
    }
    
    return result
  }

  /**
   * Hash data (one-way)
   * Useful for searching encrypted data
   */
  hash(data: string): string {
    return createHash('sha256')
      .update(data)
      .digest('hex')
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hash: string): boolean {
    return this.hash(data) === hash
  }
}

/**
 * Singleton instance
 */
let encryptionService: FieldEncryption | null = null

export function getEncryptionService(): FieldEncryption {
  if (!encryptionService) {
    encryptionService = new FieldEncryption()
  }
  return encryptionService
}

/**
 * Convenience functions
 */
export async function encryptData(plaintext: string): Promise<string> {
  return getEncryptionService().encrypt(plaintext)
}

export async function decryptData(ciphertext: string): Promise<string> {
  return getEncryptionService().decrypt(ciphertext)
}

/**
 * Key rotation support
 * CRITICAL: Run monthly via cron job
 * 
 * Steps:
 * 1. Get all encrypted records from database
 * 2. Decrypt with old key
 * 3. Re-encrypt with new key
 * 4. Update database
 * 5. Log rotation in audit trail
 */
export class KeyRotationService {
  /**
   * Rotate encryption keys for all records
   * 
   * @param oldMasterKey - Current master key
   * @param newMasterKey - New master key to rotate to
   * @param getRecords - Function to fetch encrypted records
   * @param updateRecord - Function to update record
   */
  async rotateKeys<T extends { id: string; encrypted_data: string }>(
    oldMasterKey: string,
    newMasterKey: string,
    getRecords: () => Promise<T[]>,
    updateRecord: (id: string, encrypted_data: string) => Promise<void>
  ): Promise<void> {
    const oldEncryption = new FieldEncryption(oldMasterKey)
    const newEncryption = new FieldEncryption(newMasterKey)
    
    // Get all encrypted records
    const records = await getRecords()
    
    console.log(`🔄 Starting key rotation for ${records.length} records...`)
    
    let successCount = 0
    let errorCount = 0
    
    // Process each record
    for (const record of records) {
      try {
        // Decrypt with old key
        const decrypted = await oldEncryption.decrypt(record.encrypted_data)
        
        // Re-encrypt with new key
        const reEncrypted = await newEncryption.encrypt(decrypted)
        
        // Update record
        await updateRecord(record.id, reEncrypted)
        
        successCount++
      } catch (error) {
        console.error(`❌ Failed to rotate key for record ${record.id}:`, error)
        errorCount++
      }
    }
    
    console.log(`✅ Key rotation complete: ${successCount} success, ${errorCount} errors`)
    
    if (errorCount > 0) {
      throw new Error(`Key rotation completed with ${errorCount} errors`)
    }
  }

  /**
   * Audit log for key rotation
   */
  async logRotation(
    newKeyHash: string,
    recordsCount: number
  ): Promise<void> {
    // TODO: Implement audit logging
    console.log(`🔐 Key rotation logged: ${recordsCount} records, new key hash: ${newKeyHash}`)
  }
}

/**
 * Example usage:
 * 
 * // Encrypt biometric data
 * const encryption = getEncryptionService()
 * const encrypted = await encryption.encrypt(JSON.stringify(biometricData))
 * await db.insert({ user_id, encrypted_biometric_data: encrypted })
 * 
 * // Decrypt biometric data
 * const record = await db.query('SELECT encrypted_biometric_data FROM ...')
 * const decrypted = await encryption.decrypt(record.encrypted_biometric_data)
 * const biometricData = JSON.parse(decrypted)
 * 
 * // Encrypt selective fields
 * const user = { name: 'John', email: 'john@example.com', ssn: '123-45-6789' }
 * const encrypted = await encryption.encryptFields(user, ['ssn'])
 * // encrypted.ssn is now encrypted, name and email are plaintext
 */