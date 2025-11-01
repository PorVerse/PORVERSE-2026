// lib/billing/checkout.ts
import type Stripe from 'stripe'
import { getBillingMode, type PricingTier } from '@/lib/i18n/price-map'
import { resolveStripePriceId } from '@/lib/billing/stripe-prices.server'

export type CheckoutInput = {
  productId: string
  tier: PricingTier
  locale?: 'auto' | 'en' | 'ro'
  customerEmail?: string | null
  successUrl: string
  cancelUrl: string
  userId?: string
}

export function buildCheckoutSessionParams(input: CheckoutInput): Stripe.Checkout.SessionCreateParams {
  const { productId, tier, locale = 'auto', customerEmail, successUrl, cancelUrl, userId } = input

  const priceId = resolveStripePriceId(productId, tier)
  const billingMode = getBillingMode(productId as any)

  const base: Stripe.Checkout.SessionCreateParams = {
    mode: billingMode === 'one_time' ? 'payment' : 'subscription',
    ui_mode: 'hosted',
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale,
    customer_email: customerEmail ?? undefined,
    metadata: { product_id: productId, pricing_tier: tier, user_id: userId ?? '' },
    client_reference_id: userId ?? undefined,
  }

  return {
    ...base,
    line_items: [{ price: priceId, quantity: 1 }],
    ...(billingMode === 'subscription'
      ? { subscription_data: { metadata: { product_id: productId, pricing_tier: tier, user_id: userId ?? '' } } }
      : {}),
  }
}
