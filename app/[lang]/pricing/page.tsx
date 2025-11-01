'use client'

import { useMemo, useState } from 'react'
import { useLocalization } from '@/hooks/useLocalization'
import { getPrice, type PricingTier } from '@/lib/i18n/price-map'
import { formatCurrency, langToLocale } from '@/lib/i18n/format'
import Link from 'next/link'

type Plan = {
  id: 'portal_premium' | 'pro_monthly'
  name: string
  desc: string
}

const PLANS: Plan[] = [
  { id: 'portal_premium', name: 'Portal Premium', desc: 'Full access to PorVerse Premium' },
  { id: 'pro_monthly', name: 'Pro Monthly', desc: 'Monthly Pro features' },
]

export default function PricingPage({ params }: { params: { lang: 'en' | 'ro' } }) {
  const { language, pricingTier, currency, isLoading } = useLocalization()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const tier: PricingTier = pricingTier
  const locale = langToLocale(language)

  const plansWithPrices = useMemo(() => {
    return PLANS.map((p) => {
      const price = getPrice(p.id, tier)
      return { ...p, price }
    })
  }, [tier])

  async function startCheckout(productId: 'portal_premium' | 'pro_monthly') {
    try {
      setLoadingPlan(productId)
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // tier se auto-detectează din cookie/Accept-Language; trimitem și locale pt. UI Stripe
        body: JSON.stringify({ productId, locale: language }),
      })
      const json = await res.json()
      if (json?.ok && json.url) {
        window.location.href = json.url
      } else {
        alert(json?.error || 'Checkout error. Please try again.')
      }
    } catch (e) {
      alert('Network error. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 text-white">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold">Pricing</h1>
        <p className="text-white/70">
          {language === 'ro'
            ? 'Prețurile includ taxe locale acolo unde este cazul. Tiers: RO / EU / US.'
            : 'Prices include local taxes where applicable. Tiers: RO / EU / US.'}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {plansWithPrices.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6 shadow-md"
          >
            <div className="mb-1 text-lg font-semibold">{plan.name}</div>
            <div className="mb-4 text-white/70 text-sm">{plan.desc}</div>

            <div className="mb-6">
              <div className="text-4xl font-bold">
                {formatCurrency(plan.price.amount, {
                  currency: plan.price.currency, // sigur: vine din price-map
                  locale,
                })}
                <span className="ml-1 text-base text-white/60">/mo</span>
              </div>
            </div>

            <button
              onClick={() => startCheckout(plan.id)}
              disabled={loadingPlan === plan.id || isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-60"
            >
              {loadingPlan === plan.id
                ? language === 'ro' ? 'Se procesează…' : 'Processing…'
                : language === 'ro' ? 'Cumpără' : 'Buy'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 text-xs text-white/50 space-y-1">
        <div>
          Tier: <strong>{tier}</strong> · Currency: <strong>{currency}</strong> · Lang:&nbsp;
          <strong>{language}</strong>
        </div>
        <div>
          {language === 'ro' ? 'Ai deja un abonament?' : 'Already subscribed?'}{' '}
          <Link href={`/${language}/billing`} className="underline">
            {language === 'ro' ? 'Vezi Billing' : 'Go to Billing'}
          </Link>
        </div>
      </div>
    </div>
  )
}
