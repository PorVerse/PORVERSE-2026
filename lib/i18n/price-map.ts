// lib/i18n/price-map.ts
// Tiered pricing + Stripe price_id mapping by tier (RO/EU/US).
// Safe for edge/server/client (no secret keys here).

export type PricingTier = 'romania' | 'eu' | 'us'
export type PriceCurrency = 'RON' | 'EUR' | 'USD'

export interface TierPrice {
  amount: number
  currency: PriceCurrency
}

export type BillingMode = 'one_time' | 'subscription'

export interface ProductPriceMap {
  [productId: string]: {
    billingMode: BillingMode
    romania: TierPrice
    eu: TierPrice
    us: TierPrice
  }
}

// ------- Public catalog (amounts shown în UI) -------
const CATALOG: ProductPriceMap = {
  portal_premium: {
    billingMode: 'subscription',
    romania: { amount: 79, currency: 'RON' },
    eu: { amount: 19, currency: 'EUR' },
    us: { amount: 19, currency: 'USD' },
  },
  pro_monthly: {
    billingMode: 'subscription',
    romania: { amount: 39, currency: 'RON' },
    eu: { amount: 9, currency: 'EUR' },
    us: { amount: 9, currency: 'USD' },
  },
} as const

/**
 * Get display price for a product and tier.
 */
export function getPrice(
  productId: keyof typeof CATALOG | string,
  tier: PricingTier
): TierPrice {
  const record = (CATALOG as ProductPriceMap)[productId]
  if (!record) return { amount: 0, currency: 'EUR' }
  return record[tier]
}

/**
 * Get billing mode for a product (one_time/subscription). Defaults to 'subscription' for safety.
 */
export function getBillingMode(productId: keyof typeof CATALOG | string): BillingMode {
  const record = (CATALOG as ProductPriceMap)[productId]
  return record?.billingMode ?? 'subscription'
}

// ------- Stripe price_id mapping (via ENV) -------
// Define ENV names once; keep all secrets in server env (not exposed to client).
const STRIPE_PRICE_IDS: Record<
  string,
  Partial<Record<PricingTier, string>>
> = {
  // Example ENV names (set them in your hosting dashboard):
  // portal_premium:
  //   - STRIPE_PRICE_PORTAL_PREMIUM_RO
  //   - STRIPE_PRICE_PORTAL_PREMIUM_EU
  //   - STRIPE_PRICE_PORTAL_PREMIUM_US
  portal_premium: {
    romania: process.env.NEXT_PUBLIC_STRIPE_PRICE_PORTAL_PREMIUM_RO, // if you must show it client-side
    eu: process.env.NEXT_PUBLIC_STRIPE_PRICE_PORTAL_PREMIUM_EU,
    us: process.env.NEXT_PUBLIC_STRIPE_PRICE_PORTAL_PREMIUM_US,
  },
  pro_monthly: {
    romania: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_RO,
    eu: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_EU,
    us: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_US,
  },
}

/**
 * Resolve Stripe price_id for a product/tier.
 * Return undefined if not configured. You will validate server-side before creating a session.
 */
export function getStripePriceId(
  productId: keyof typeof CATALOG | string,
  tier: PricingTier
): string | undefined {
  return STRIPE_PRICE_IDS[productId]?.[tier]
}

export const __priceCatalog = CATALOG
