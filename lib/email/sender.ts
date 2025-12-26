/**
 * 📧 PorVerse V2 - Email Sender
 * Email delivery cu Resend + Supabase logging
 * 
 * @version 2.0.0 - WAVE 2 UPGRADED
 */

import { Resend } from 'resend'
import { emailTemplates } from './templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'PorVerse <hello@porverse.com>'

// ============================================================================
// 📧 EMAIL FUNCTIONS
// ============================================================================

/**
 * Trimite welcome email
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  userId: string
): Promise<boolean> {
  try {
    const template = emailTemplates.welcome(userName, userId)

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: template.subject,
      html: template.html,
    })

    if (error) {
      console.error('❌ Email failed:', error)
      await logEmail(userId, 'welcome', 'failed', error.message)
      return false
    }

    console.log('✅ Welcome email sent:', data?.id)
    await logEmail(userId, 'welcome', 'sent', undefined, data?.id)
    return true

  } catch (error) {
    console.error('❌ Welcome email error:', error)
    return false
  }
}

/**
 * Trimite portal completion email
 */
export async function sendPortalCompletionEmail(
  userEmail: string,
  userName: string,
  userId: string,
  portalName: string,
  nextPortal: string,
  xpGained: number = 100
): Promise<boolean> {
  try {
    const template = emailTemplates.portalCompleted(
      userName,
      portalName,
      nextPortal,
      xpGained
    )

    const { data, error } = await resend.emails.send({
      from: 'PorVerse Progress <progress@porverse.com>',
      to: userEmail,
      subject: template.subject,
      html: template.html,
    })

    if (error) {
      console.error('❌ Portal email failed:', error)
      await logEmail(userId, 'portal_completion', 'failed', error.message)
      return false
    }

    console.log('✅ Portal completion email sent:', data?.id)
    await logEmail(userId, 'portal_completion', 'sent', undefined, data?.id)
    return true

  } catch (error) {
    console.error('❌ Portal completion error:', error)
    return false
  }
}

/**
 * Trimite subscription confirmation email
 */
export async function sendSubscriptionEmail(
  userEmail: string,
  userName: string,
  userId: string,
  tier: string
): Promise<boolean> {
  try {
    const features = getFeaturesByTier(tier)
    const template = emailTemplates.subscriptionConfirmation(userName, tier, features)

    const { data, error } = await resend.emails.send({
      from: 'PorVerse Billing <billing@porverse.com>',
      to: userEmail,
      subject: template.subject,
      html: template.html,
    })

    if (error) {
      console.error('❌ Subscription email failed:', error)
      await logEmail(userId, 'subscription', 'failed', error.message)
      return false
    }

    console.log('✅ Subscription email sent:', data?.id)
    await logEmail(userId, 'subscription', 'sent', undefined, data?.id)
    return true

  } catch (error) {
    console.error('❌ Subscription email error:', error)
    return false
  }
}

/**
 * Trimite password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  userId: string,
  resetLink: string
): Promise<boolean> {
  try {
    const template = emailTemplates.passwordReset(userName, resetLink)

    const { data, error } = await resend.emails.send({
      from: 'PorVerse Security <security@porverse.com>',
      to: userEmail,
      subject: template.subject,
      html: template.html,
    })

    if (error) {
      console.error('❌ Password reset email failed:', error)
      await logEmail(userId, 'password_reset', 'failed', error.message)
      return false
    }

    console.log('✅ Password reset email sent:', data?.id)
    await logEmail(userId, 'password_reset', 'sent', undefined, data?.id)
    return true

  } catch (error) {
    console.error('❌ Password reset error:', error)
    return false
  }
}

// ============================================================================
// 🗄️ SUPABASE LOGGING
// ============================================================================

/**
 * Loghează email în Supabase pentru tracking
 */
async function logEmail(
  userId: string,
  emailType: string,
  status: 'sent' | 'failed',
  errorMessage?: string,
  emailId?: string
): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    await supabase.from('email_logs').insert({
      user_id: userId,
      email_type: emailType,
      status,
      error_message: errorMessage,
      external_id: emailId,
      created_at: new Date().toISOString(),
    })

  } catch (error) {
    console.warn('⚠️ Failed to log email:', error)
  }
}

/**
 * Obține features bazat pe tier
 */
function getFeaturesByTier(tier: string): string[] {
  const tiers: Record<string, string[]> = {
    Premium: [
      '🔐 Quantum Vault - Encrypted personal sanctuary',
      '🤖 Advanced AI Guidance - Personalized insights',
      '😊 Biometric Emotion Tracking - Real-time analysis',
      '⚡ Priority Support - Dedicated assistance',
      '📊 Advanced Analytics - Deep insights',
    ],
    Pro: [
      '🔐 Quantum Vault - Encrypted personal sanctuary',
      '🤖 AI Guidance - Smart recommendations',
      '😊 Emotion Tracking - Understand your patterns',
      '📧 Email Support - Quick responses',
    ],
  }

  return tiers[tier] || tiers.Premium
}

/**
 * Obține statistici email pentru user
 */
export async function getEmailStats(userId: string): Promise<{
  totalSent: number
  totalFailed: number
  recentEmails: Array<{
    type: string
    status: string
    sentAt: string
  }>
}> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    const totalSent = data.filter((e) => e.status === 'sent').length
    const totalFailed = data.filter((e) => e.status === 'failed').length

    return {
      totalSent,
      totalFailed,
      recentEmails: data.map((e) => ({
        type: e.email_type,
        status: e.status,
        sentAt: e.created_at,
      })),
    }

  } catch (error) {
    console.error('❌ Failed to get email stats:', error)
    return { totalSent: 0, totalFailed: 0, recentEmails: [] }
  }
}

/**
 * ✅ WAVE 2 - EMAIL SENDER UPGRADED!
 * 
 * FEATURES:
 * ✅ Resend integration
 * ✅ Multiple email types
 * ✅ Supabase logging
 * ✅ Error handling
 * ✅ Stats tracking
 * ✅ Type-safe
 */