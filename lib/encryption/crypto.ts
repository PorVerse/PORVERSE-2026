/**
 * 🔐 PorVerse V2 - Encryption Utility
 * Production-grade client-side encryption cu Web Crypto API
 * 
 * @version 2.0.0 - WAVE 2 UPGRADED
 * @description AES-256-GCM encryption pentru Quantum Vault
 * 
 * CE FACE:
 * - Criptare/Decriptare cu AES-256-GCM
 * - Derivare cheie din passphrase (PBKDF2)
 * - Salt și IV aleatorii pentru fiecare operație
 * - Protecție împotriva tampering (GCM authentication)
 * - Zero-knowledge (passphrase nu e stocat niciodată)
 */

// ============================================================================
// 🔧 CONFIGURATION
// ============================================================================

const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM' as const,
  keyLength: 256,
  ivLength: 12, // 96 bits pentru GCM
  saltLength: 16, // 128 bits
  pbkdf2Iterations: 100000, // OWASP recommendation
  tagLength: 128, // GCM authentication tag
}

// ============================================================================
// 🔐 ENCRYPTION FUNCTIONS
// ============================================================================

/**
 * Generează cheie criptografică din passphrase
 * Folosește PBKDF2 pentru derivare securizată
 */
async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ENCRYPTION_CONFIG.pbkdf2Iterations,
      hash: 'SHA-256',
    },
    passphraseKey,
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength,
    },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Criptează text cu passphrase - WAVE 2 PRODUCTION-GRADE
 * 
 * @param plaintext - Text de criptat
 * @param passphrase - Passphrase utilizator
 * @returns String criptat (base64)
 * 
 * FORMAT FINAL: base64(salt + iv + ciphertext + authTag)
 */
export async function encrypt(
  plaintext: string,
  passphrase: string
): Promise<string> {
  try {
    // PASUL 1: Generează salt și IV aleatorii
    const salt = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength))
    const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength))

    // PASUL 2: Derive encryption key
    const key = await deriveKey(passphrase, salt)

    // PASUL 3: Criptează
    const encoder = new TextEncoder()
    const encodedText = encoder.encode(plaintext)

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv,
        tagLength: ENCRYPTION_CONFIG.tagLength,
      },
      key,
      encodedText
    )

    // PASUL 4: Combină salt + iv + ciphertext
    const combined = new Uint8Array(
      salt.length + iv.length + ciphertext.byteLength
    )
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

    // PASUL 5: Encode în base64
    return arrayBufferToBase64(combined)

  } catch (error) {
    console.error('❌ Encryption failed:', error)
    throw new Error('Encryption failed')
  }
}

/**
 * Decriptează text cu passphrase - WAVE 2 PRODUCTION-GRADE
 * 
 * @param encrypted - Text criptat (base64)
 * @param passphrase - Passphrase utilizator
 * @returns Text decriptat
 * 
 * @throws Error dacă passphrase-ul e greșit sau data e coruptă
 */
export async function decrypt(
  encrypted: string,
  passphrase: string
): Promise<string> {
  try {
    // PASUL 1: Decode base64
    const combined = base64ToArrayBuffer(encrypted)

    // PASUL 2: Extrage salt, IV, ciphertext
    const saltLength = ENCRYPTION_CONFIG.saltLength
    const ivLength = ENCRYPTION_CONFIG.ivLength

    const salt = combined.slice(0, saltLength)
    const iv = combined.slice(saltLength, saltLength + ivLength)
    const ciphertext = combined.slice(saltLength + ivLength)

    // PASUL 3: Derive encryption key
    const key = await deriveKey(passphrase, salt)

    // PASUL 4: Decriptează
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv,
        tagLength: ENCRYPTION_CONFIG.tagLength,
      },
      key,
      ciphertext
    )

    // PASUL 5: Decode text
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)

  } catch (error) {
    console.error('❌ Decryption failed:', error)
    throw new Error('Decryption failed - wrong passphrase or corrupted data')
  }
}

// ============================================================================
// 🛠️ UTILITY FUNCTIONS
// ============================================================================

/**
 * Convertește ArrayBuffer în base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

/**
 * Convertește base64 în ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Generează hash SHA-256 (pentru verificări)
 */
export async function hash(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return arrayBufferToBase64(hashBuffer)
}

/**
 * Verifică puterea passphrase-ului
 */
export function validatePassphraseStrength(passphrase: string): {
  isValid: boolean
  strength: 'weak' | 'medium' | 'strong'
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  // Lungime
  if (passphrase.length < 8) {
    feedback.push('Minimum 8 characters required')
  } else if (passphrase.length >= 12) {
    score += 2
  } else {
    score += 1
  }

  // Litere mari
  if (/[A-Z]/.test(passphrase)) {
    score += 1
  } else {
    feedback.push('Add uppercase letters')
  }

  // Litere mici
  if (/[a-z]/.test(passphrase)) {
    score += 1
  } else {
    feedback.push('Add lowercase letters')
  }

  // Numere
  if (/\d/.test(passphrase)) {
    score += 1
  } else {
    feedback.push('Add numbers')
  }

  // Caractere speciale
  if (/[^A-Za-z0-9]/.test(passphrase)) {
    score += 1
  } else {
    feedback.push('Add special characters')
  }

  const strength = score >= 5 ? 'strong' : score >= 3 ? 'medium' : 'weak'
  const isValid = passphrase.length >= 8 && score >= 3

  return { isValid, strength, feedback }
}

/**
 * ✅ WAVE 2 - ENCRYPTION UPGRADED! 🎉
 * 
 * FEATURES:
 * ✅ AES-256-GCM encryption (industry standard)
 * ✅ PBKDF2 key derivation (100k iterations)
 * ✅ Random salt + IV per operation
 * ✅ Authentication tag (prevents tampering)
 * ✅ Zero-knowledge (passphrase never stored)
 * ✅ Passphrase strength validation
 * ✅ Web Crypto API (native browser)
 * 
 * SECURITY:
 * - Salt previne rainbow table attacks
 * - IV previne pattern detection
 * - GCM tag asigură integritate
 * - PBKDF2 îngreunează brute-force
 */