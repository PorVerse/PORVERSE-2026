/**
 * 🔐 PorVerse V2 - Privacy Consent Modal
 * GDPR-compliant consent modal for biometric data processing
 * 
 * @version 2.1.0 - ENTERPRISE FIXED
 * @author PorVerse Development Team
 * @description Production-ready consent modal with proper validation
 * 
 * FIXES:
 * ✅ Required field (biometricCapture) now auto-checked and disabled
 * ✅ State initialization includes required=true for biometric capture
 * ✅ Proper validation before allowing continue
 * ✅ Enhanced UX for required vs optional permissions
 * ✅ Enterprise-grade error handling
 */

'use client'

import { useState } from 'react'
import type { ConsentLevel } from '@/types/biometric'

// ============================================================================
// 🎯 TYPES
// ============================================================================

interface PrivacyConsentProps {
  isOpen: boolean
  onAccept: (consent: ConsentLevel) => void
  onDecline: () => void
  userId: string
  mode?: 'full' | 'minimal'
}

// ============================================================================
// 🔐 PRIVACY CONSENT MODAL
// ============================================================================

export function PrivacyConsent({
  isOpen,
  onAccept,
  onDecline,
  userId,
  mode = 'full',
}: PrivacyConsentProps) {
  // ========================================================================
  // 📊 STATE
  // ========================================================================

  /**
   * Consent choices state
   * IMPORTANT: biometricCapture is REQUIRED and must be true by default
   */
  const [consentChoices, setConsentChoices] = useState({
    biometricCapture: true,   // ✅ FIX: REQUIRED - Always true
    emotionAnalysis: false,
    dataStorage: false,
    analytics: false,
    sharing: false,
  })

  const [step, setStep] = useState<'intro' | 'details' | 'confirm'>(
    mode === 'minimal' ? 'confirm' : 'intro'
  )

  // ========================================================================
  // 🎯 HANDLERS
  // ========================================================================

  /**
   * Toggle consent choice
   * NOTE: biometricCapture cannot be toggled (it's required)
   */
  const handleToggle = (key: keyof typeof consentChoices) => {
    // Prevent toggling required fields
    if (key === 'biometricCapture') {
      console.warn('Cannot toggle biometricCapture - it is required')
      return
    }
    
    setConsentChoices(prev => ({ ...prev, [key]: !prev[key] }))
  }

  /**
   * Accept all permissions
   * Sets all permissions to true except sharing (must be explicit)
   */
  const handleAcceptAll = () => {
    const fullConsent: ConsentLevel = {
      biometricCapture: true,   // Required
      emotionAnalysis: true,
      dataStorage: true,
      analytics: true,
      sharing: false,           // Never auto-accept sharing for security
      timestamp: Date.now(),
      version: '2.0.0',
    }
    onAccept(fullConsent)
  }

  /**
   * Accept selected permissions
   * Validates that required permissions are granted
   */
  const handleAcceptSelected = () => {
    // Validation: biometricCapture must be true
    if (!consentChoices.biometricCapture) {
      alert('Capturarea biometrică este obligatorie pentru a continua.')
      return
    }

    const consent: ConsentLevel = {
      ...consentChoices,
      timestamp: Date.now(),
      version: '2.0.0',
    }
    onAccept(consent)
  }

  /**
   * Decline all permissions
   * User chooses not to use biometric features
   */
  const handleDecline = () => {
    onDecline()
  }

  /**
   * Check if user can proceed
   * Required: biometricCapture must be true
   */
  const canProceed = consentChoices.biometricCapture

  // ========================================================================
  // 🎨 RENDER
  // ========================================================================

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="text-white text-3xl">🔐</div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Confidențialitate & Consimțământ
              </h2>
              <p className="text-green-100 text-sm mt-1">
                Respectăm drepturile tale în conformitate cu GDPR
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {/* INTRO STEP */}
          {step === 'intro' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Bine ai venit la Scanarea Biometrică! 👋
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Pentru a-ți oferi o experiență personalizată, sistemul nostru poate analiza
                  expresiile faciale pentru a detecta emoții și nivelul de stress. Datele tale
                  sunt procesate <strong>exclusiv pe dispozitivul tău</strong> și nu sunt
                  trimise pe niciun server fără consimțământul tău explicit.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="text-2xl">ℹ️</div>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      Ce trebuie să știi:
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span>Procesare <strong>100% pe device</strong> - datele nu părăsesc computerul tău</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span>Criptare <strong>AES-256</strong> pentru orice date salvate</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span>Poți șterge datele <strong>oricând</strong> (GDPR Right to be Forgotten)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span>Poți exporta datele tale <strong>în orice moment</strong></span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('details')}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Continuă →
                </button>
                <button
                  onClick={handleDecline}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  Nu acum
                </button>
              </div>
            </div>
          )}

          {/* DETAILS STEP */}
          {step === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Alege ce permisiuni să acorzi
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Poți selecta individual fiecare permisiune. Pentru funcționalitate completă,
                  recomandăm să accepți toate.
                </p>
              </div>

              <div className="space-y-3">
                {/* Biometric Capture - REQUIRED */}
                <ConsentOption
                  checked={consentChoices.biometricCapture}
                  onChange={() => handleToggle('biometricCapture')}
                  title="Capturare Biometrică"
                  description="Permite accesul la cameră pentru detectarea feței și a expresiilor faciale."
                  required
                  disabled={true}  // Cannot be disabled - it's required!
                  icon="📸"
                />

                {/* Emotion Analysis - RECOMMENDED */}
                <ConsentOption
                  checked={consentChoices.emotionAnalysis}
                  onChange={() => handleToggle('emotionAnalysis')}
                  title="Analiză Emoțională"
                  description="Analizează expresiile faciale pentru a detecta emoții (fericit, trist, etc.) și nivelul de stress."
                  recommended
                  icon="🎭"
                />

                {/* Data Storage */}
                <ConsentOption
                  checked={consentChoices.dataStorage}
                  onChange={() => handleToggle('dataStorage')}
                  title="Stocare Date (Criptate)"
                  description="Salvează citirile biometrice criptate pentru a urmări progresul în timp. Datele pot fi șterse oricând."
                  icon="💾"
                />

                {/* Analytics */}
                <ConsentOption
                  checked={consentChoices.analytics}
                  onChange={() => handleToggle('analytics')}
                  title="Analytics Anonimizate"
                  description="Folosește date anonimizate pentru a îmbunătăți sistemul. Nu conțin informații identificabile."
                  icon="📊"
                />

                {/* Sharing - WARNING */}
                <ConsentOption
                  checked={consentChoices.sharing}
                  onChange={() => handleToggle('sharing')}
                  title="Partajare Date"
                  description="Permite partajarea datelor cu terți selectați (DEZACTIVAT implicit pentru siguranță maximă)."
                  warning
                  icon="🔗"
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="text-xl">💡</div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> Capturarea biometrică este obligatorie pentru funcționarea
                    sistemului. Celelalte permisiuni sunt opționale și pot fi modificate oricând
                    din setările contului.
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!canProceed}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuă →
                </button>
                <button
                  onClick={() => setStep('intro')}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  ← Înapoi
                </button>
              </div>
            </div>
          )}

          {/* CONFIRM STEP */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Confirmă alegerile tale
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Verifică permisiunile selectate înainte de a continua.
                </p>
              </div>

              {/* Summary */}
              {Object.values(consentChoices).some(v => v) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 dark:text-green-300 mb-3">
                    Rezumat permisiuni selectate:
                  </h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(consentChoices).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className={value ? 'text-green-600' : 'text-gray-400'}>
                          {value ? '✓' : '○'}
                        </span>
                        <span className={`${value ? 'text-green-800 dark:text-green-200' : 'text-gray-500'}`}>
                          {getConsentLabel(key)}
                        </span>
                        {key === 'biometricCapture' && (
                          <span className="text-xs text-red-600 dark:text-red-400">(Obligatoriu)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="text-xl">⚖️</div>
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Drepturile tale GDPR:</strong> Poți oricând să îți retragi consimțământul,
                    să soliciți ștergerea datelor (Right to be Forgotten), sau să exporți toate
                    datele personale (Right to Data Portability).
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAcceptAll}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  ✓ Accept Toate Permisiunile
                </button>

                {mode === 'full' && (
                  <button
                    onClick={handleAcceptSelected}
                    disabled={!canProceed}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!canProceed ? 'Capturarea biometrică este obligatorie' : ''}
                  >
                    Accept Permisiunile Selectate
                  </button>
                )}

                <button
                  onClick={handleDecline}
                  className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  Refuz
                </button>

                {mode === 'full' && (
                  <button
                    onClick={() => setStep('details')}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    ← Modifică permisiunile
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 dark:text-gray-400">
              User ID: <span className="font-mono">{userId.slice(0, 8)}...</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Version 2.0.0 • GDPR Compliant
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 🎨 CONSENT OPTION COMPONENT
// ============================================================================

interface ConsentOptionProps {
  checked: boolean
  onChange: () => void
  title: string
  description: string
  required?: boolean
  recommended?: boolean
  warning?: boolean
  disabled?: boolean
  icon: string
}

/**
 * Individual consent option component
 * 
 * @param checked - Is the option checked?
 * @param onChange - Handler for checkbox change
 * @param title - Option title
 * @param description - Option description
 * @param required - Is this option required? (cannot be unchecked)
 * @param recommended - Is this option recommended?
 * @param warning - Does this option need a warning?
 * @param disabled - Is this option disabled? (for required fields)
 * @param icon - Emoji icon for the option
 */
function ConsentOption({
  checked,
  onChange,
  title,
  description,
  required,
  recommended,
  warning,
  disabled,
  icon,
}: ConsentOptionProps) {
  return (
    <label
      className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
        disabled
          ? 'cursor-not-allowed opacity-90'
          : 'cursor-pointer'
      } ${
        checked
          ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${warning ? 'border-amber-300 dark:border-amber-700' : ''}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 ${
          disabled ? 'opacity-100 cursor-not-allowed' : 'cursor-pointer'
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xl">{icon}</span>
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h4>
          {required && (
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded">
              Obligatoriu
            </span>
          )}
          {recommended && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
              Recomandat
            </span>
          )}
          {warning && (
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded">
              ⚠️ Atenție
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
        {required && disabled && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Această permisiune este necesară pentru funcționarea sistemului.
          </p>
        )}
      </div>
    </label>
  )
}

// ============================================================================
// 🔧 HELPERS
// ============================================================================

/**
 * Get human-readable label for consent key
 * 
 * @param key - Consent key (e.g., 'biometricCapture')
 * @returns Human-readable label (e.g., 'Capturare Biometrică')
 */
function getConsentLabel(key: string): string {
  const labels: Record<string, string> = {
    biometricCapture: 'Capturare Biometrică',
    emotionAnalysis: 'Analiză Emoțională',
    dataStorage: 'Stocare Date',
    analytics: 'Analytics',
    sharing: 'Partajare Date',
  }
  return labels[key] || key
}

// ============================================================================
// 🎯 EXPORT
// ============================================================================

export default PrivacyConsent

/**
 * ✅ ENTERPRISE FIXES APPLIED:
 * 
 * 1. ✅ biometricCapture now starts as TRUE (required)
 * 2. ✅ Required checkbox is checked and disabled (cannot be unchecked)
 * 3. ✅ Proper validation before allowing continue
 * 4. ✅ Clear UI indicators for required vs optional
 * 5. ✅ Enhanced error messages and tooltips
 * 6. ✅ Better state management
 * 7. ✅ Comprehensive comments and documentation
 * 
 * USAGE EXAMPLE:
 * 
 * ```tsx
 * import { PrivacyConsent } from '@/components/biometric/privacy-consent'
 * import { useBiometricConsent } from '@/hooks/useBiometricScan'
 * 
 * function BiometricSetup() {
 *   const { hasConsent, saveConsent } = useBiometricConsent(user.id)
 *   const [showConsent, setShowConsent] = useState(!hasConsent)
 * 
 *   const handleAccept = (consent: ConsentLevel) => {
 *     saveConsent(consent)
 *     setShowConsent(false)
 *   }
 * 
 *   const handleDecline = () => {
 *     setShowConsent(false)
 *     // Redirect or show message
 *   }
 * 
 *   return (
 *     <>
 *       <PrivacyConsent
 *         isOpen={showConsent}
 *         onAccept={handleAccept}
 *         onDecline={handleDecline}
 *         userId={user.id}
 *       />
 *       {hasConsent && <BiometricScanner userId={user.id} />}
 *     </>
 *   )
 * }
 * ```
 */