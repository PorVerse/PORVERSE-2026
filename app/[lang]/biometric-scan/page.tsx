/**
 * 📸 PorVerse V2 - Biometric Scan Page (Example)
 * Exemplu complet de integrare a sistemului biometric
 * 
 * @version 2.0.0
 * @description Page example cu toate componentele integrate
 */

'use client'

import { useState, useEffect } from 'react'
import { BiometricScanner } from '@/components/biometric/biometric-scanner'
import { PrivacyConsent } from '@/components/biometric/privacy-consent'
import { useBiometricScan, useBiometricConsent, useEmotionTracking } from '@/hooks/useBiometricScan'
import type { BiometricReading, ConsentLevel } from '@/types/biometric'

// ============================================================================
// 📸 BIOMETRIC SCAN PAGE
// ============================================================================

export default function BiometricScanPage() {
  // ========================================================================
  // 🎯 USER DATA (get from auth)
  // ========================================================================
  
  // TODO: Replace with actual user from auth
  const userId = 'demo-user-123'

  // ========================================================================
  // 🔐 CONSENT MANAGEMENT
  // ========================================================================
  
  const { hasConsent, saveConsent } = useBiometricConsent(userId)
  const [showConsentModal, setShowConsentModal] = useState(false)

  useEffect(() => {
    // Show consent modal if user hasn't consented yet
    if (!hasConsent) {
      setShowConsentModal(true)
    }
  }, [hasConsent])

  const handleConsentAccept = (consent: ConsentLevel) => {
    saveConsent(consent)
    setShowConsentModal(false)
  }

  const handleConsentDecline = () => {
    setShowConsentModal(false)
    // Optionally redirect or show message
    alert('Biometric scanning requires consent. You can change this later in settings.')
  }

  // ========================================================================
  // 📊 BIOMETRIC SCANNING
  // ========================================================================
  
  const [readings, setReadings] = useState<BiometricReading[]>([])
  const [isScanning, setIsScanning] = useState(false)

  const handleScanComplete = (reading: BiometricReading) => {
    console.log('✅ Scan complete:', reading)
    
    // Add to readings history (keep last 10)
    setReadings(prev => [...prev, reading].slice(-10))
    
    // Optional: Save to database, trigger notifications, etc.
  }

  const handleScanError = (error: Error) => {
    console.error('❌ Scan error:', error)
    alert(`Scan error: ${error.message}`)
  }

  // ========================================================================
  // 📈 EMOTION TRACKING
  // ========================================================================
  
  const { emotionHistory, isLoading: historyLoading } = useEmotionTracking(userId)

  // ========================================================================
  // 🎨 RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🎭 Scanare Biometrică
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Detectează emoții și nivelul de stress în timp real
          </p>
        </div>

        {/* Consent Modal */}
        <PrivacyConsent
          isOpen={showConsentModal}
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
          userId={userId}
          mode="full"
        />

        {/* Main Content (only show if has consent) */}
        {hasConsent ? (
          <div className="space-y-6">
            {/* Scanner */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <BiometricScanner
                userId={userId}
                onScanComplete={handleScanComplete}
                onError={handleScanError}
                autoStart={false}
                scanInterval={1000}
                showOverlay={true}
                showQuality={true}
                showEmotion={true}
                privacyMode="strict"
              />
            </div>

            {/* Recent Readings */}
            {readings.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  📊 Citiri Recente
                </h2>
                <div className="grid gap-3">
                  {readings.slice().reverse().map((reading, idx) => (
                    <ReadingCard key={idx} reading={reading} />
                  ))}
                </div>
              </div>
            )}

            {/* Emotion History */}
            {!historyLoading && emotionHistory.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  📈 Istoric Emoțional
                </h2>
                <div className="space-y-2">
                  {emotionHistory.slice(0, 10).map((reading, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getEmotionEmoji(reading.emotion?.emotion)}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {getEmotionLabel(reading.emotion?.emotion)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(reading.timestamp).toLocaleString('ro-RO')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Stress: {getStressLabel(reading.stress?.level)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Confidence: {Math.round((reading.emotion?.confidence || 0) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <InfoCard
                icon="🔐"
                title="Privacy First"
                description="Toate datele sunt procesate pe dispozitivul tău"
              />
              <InfoCard
                icon="⚡"
                title="Real-time"
                description="Detectare emoții în timp real cu AI"
              />
              <InfoCard
                icon="📊"
                title="Analytics"
                description="Urmărește pattern-urile emoționale în timp"
              />
            </div>

            {/* Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                ⚙️ Setări
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowConsentModal(true)}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-left"
                >
                  🔐 Modifică Permisiunile
                </button>
                <button
                  onClick={() => {
                    if (confirm('Ești sigur că vrei să ștergi toate datele biometrice? Această acțiune nu poate fi anulată.')) {
                      // TODO: Implement data deletion
                      alert('Datele vor fi șterse (implementare în curs)')
                    }
                  }}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-left"
                >
                  🗑️ Șterge Toate Datele (GDPR)
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement data export
                    alert('Datele vor fi exportate (implementare în curs)')
                  }}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-left"
                >
                  📦 Exportă Datele (GDPR)
                </button>
              </div>
            </div>
          </div>
        ) : (
          // No Consent Message
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Consimțământ Necesar
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Pentru a folosi scanarea biometrică, trebuie să acorzi permisiunea de acces la cameră.
            </p>
            <button
              onClick={() => setShowConsentModal(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Acordă Permisiuni
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 🎨 HELPER COMPONENTS
// ============================================================================

function ReadingCard({ reading }: { reading: BiometricReading }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="text-4xl">
          {getEmotionEmoji(reading.emotion?.emotion)}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {getEmotionLabel(reading.emotion?.emotion)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(reading.timestamp).toLocaleTimeString('ro-RO')}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Stress: {getStressLabel(reading.stress?.level)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Intensity: {Math.round((reading.emotion?.intensity || 0) * 100)}%
        </p>
      </div>
    </div>
  )
}

function InfoCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  )
}

// ============================================================================
// 🔧 HELPERS
// ============================================================================

function getEmotionEmoji(emotion?: string): string {
  const emojis: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    surprised: '😲',
    fearful: '😨',
    disgusted: '🤢',
    neutral: '😐',
  }
  return emojis[emotion || 'neutral'] || '😐'
}

function getEmotionLabel(emotion?: string): string {
  const labels: Record<string, string> = {
    happy: 'Fericit',
    sad: 'Trist',
    angry: 'Nervos',
    surprised: 'Surprins',
    fearful: 'Speriat',
    disgusted: 'Dezgustat',
    neutral: 'Neutru',
  }
  return labels[emotion || 'neutral'] || 'Necunoscut'
}

function getStressLabel(level?: string): string {
  const labels: Record<string, string> = {
    low: 'Scăzut',
    moderate: 'Moderat',
    high: 'Ridicat',
    critical: 'Critical',
  }
  return labels[level || 'low'] || 'Necunoscut'
}

/**
 * NOTES:
 * 
 * 1. Replace 'demo-user-123' with actual user ID from authentication
 * 2. Implement actual data deletion in GDPR delete button
 * 3. Implement data export functionality
 * 4. Add more analytics/charts for emotion tracking
 * 5. Consider adding notifications for stress detection
 * 6. Add integration with portal progress system
 */