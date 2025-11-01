// lib/auth/auth-helpers.ts
// Authentication Helper Functions - Complete

import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

// ==========================================
// SIGN UP & SIGN IN
// ==========================================

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw new Error(error.message)
  return data
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw new Error(error.message)
  return data
}

export async function signInWithMagicLink(email: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// SIGN OUT
// ==========================================

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

// ==========================================
// PASSWORD MANAGEMENT
// ==========================================

export async function resetPassword(email: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) throw new Error(error.message)
  return data
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// USER & PROFILE
// ==========================================

export async function getCurrentUser() {
  const supabase = createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting user:', error)
    return null
  }

  return user
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error getting profile:', error)
    return null
  }

  return data
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Profile>
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// SUBSCRIPTION CHECKS
// ==========================================

export async function hasActiveSubscription(
  userId: string
): Promise<boolean> {
  const profile = await getUserProfile(userId)

  if (!profile) return false

  return (
    profile.subscription_status === 'active' ||
    profile.subscription_status === 'trialing'
  )
}

export async function getSubscriptionTier(
  userId: string
): Promise<'free' | 'pro' | 'elite'> {
  const profile = await getUserProfile(userId)
  return profile?.subscription_tier || 'free'
}

export async function canAccessFeature(
  userId: string,
  feature: 'ai' | 'biometric' | 'quantum' | 'unlimited_portals'
): Promise<boolean> {
  const tier = await getSubscriptionTier(userId)

  const featureAccess = {
    free: ['ai'],
    pro: ['ai', 'biometric', 'unlimited_portals'],
    elite: ['ai', 'biometric', 'quantum', 'unlimited_portals'],
  }

  return featureAccess[tier].includes(feature)
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================

export async function refreshSession() {
  const supabase = createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.refreshSession()

  if (error) throw new Error(error.message)
  return session
}

export async function getSession() {
  const supabase = createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting session:', error)
    return null
  }

  return session
}

// ==========================================
// AUTH STATE LISTENER
// ==========================================

export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const supabase = createClient()

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })

  return subscription
}