// lib/billing/stripe-prices.server.ts
import type { PricingTier } from '@/lib/i18n/price-map'

function envVarName(productId: string, tier: PricingTier): string {
  const id = productId.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
  const tierKey = tier === 'romania' ? 'RO' : tier.toUpperCase()
  return `STRIPE_PRICE_${id}_${tierKey}`
}

/** Returnează price_id pentru Stripe din ENV; aruncă eroare dacă lipsește. */
export function resolveStripePriceId(productId: string, tier: PricingTier): string {
  const name = envVarName(productId, tier)
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing env ${name} (Stripe price_id for ${productId}/${tier})`)
  }
  return value
}
