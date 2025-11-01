'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLocalization } from '@/hooks/useLocalization'
import { useState } from 'react'

export default function BillingReturnPage({ params }: { params: { lang: 'en' | 'ro' } }) {
  const { language } = useLocalization()
  const sp = useSearchParams()
  const status = sp.get('status') // success | cancel | null
  const [portalLoading, setPortalLoading] = useState(false)

  const isSuccess = status === 'success'
  const isCancel = status === 'cancel'

  async function openCustomerPortal() {
    try {
      setPortalLoading(true)
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const json = await res.json()
      if (json?.ok && json.url) {
        window.location.href = json.url
      } else {
        alert(json?.error || (language === 'ro' ? 'Eroare portal.' : 'Portal error.'))
      }
    } catch {
      alert(language === 'ro' ? 'Eroare de rețea.' : 'Network error.')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] grid place-items-center text-white px-4 py-12">
      <div className="pv-card glass max-w-md w-full text-center p-8 rounded-2xl border border-white/10 bg-neutral-900/60 shadow-md">
        {isSuccess && (
          <>
            <div className="mb-4 text-2xl font-semibold">
              {language === 'ro' ? 'Plată reușită' : 'Payment Successful'}
            </div>
            <p className="mb-6 text-white/70">
              {language === 'ro'
                ? 'Abonamentul tău a fost activat. Îți mulțumim!'
                : 'Your subscription is active. Thank you!'}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href={`/${language}/portal-dashboard`}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
              >
                {language === 'ro' ? 'Mergi la Dashboard' : 'Go to Dashboard'}
              </Link>

              <button
                onClick={openCustomerPortal}
                disabled={portalLoading}
                className="inline-flex items-center justify-center rounded-xl bg-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-600 disabled:opacity-60"
              >
                {portalLoading
                  ? language === 'ro' ? 'Se deschide…' : 'Opening…'
                  : language === 'ro' ? 'Gestionează abonamentul' : 'Manage subscription'}
              </button>
            </div>
          </>
        )}

        {isCancel && (
          <>
            <div className="mb-4 text-2xl font-semibold">
              {language === 'ro' ? 'Plată anulată' : 'Payment Cancelled'}
            </div>
            <p className="mb-6 text-white/70">
              {language === 'ro'
                ? 'Nu s-a realizat nicio tranzacție. Poți reîncerca oricând.'
                : 'No charge was made. You can try again anytime.'}
            </p>
            <Link
              href={`/${language}/pricing`}
              className="inline-flex items-center justify-center rounded-xl bg-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-600"
            >
              {language === 'ro' ? 'Înapoi la Prețuri' : 'Back to Pricing'}
            </Link>
          </>
        )}

        {!isSuccess && !isCancel && (
          <>
            <div className="mb-4 text-2xl font-semibold">Billing</div>
            <p className="mb-6 text-white/70">
              {language === 'ro'
                ? 'Accesează detaliile de facturare sau istoricul plăților.'
                : 'Access your billing details and payment history.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href={`/${language}/pricing`}
                className="inline-flex items-center justify-center rounded-xl bg-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-600"
              >
                {language === 'ro' ? 'Vezi Prețurile' : 'See Pricing'}
              </Link>
              <Link
                href={`/${language}/portal-dashboard`}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
              >
                {language === 'ro' ? 'Dashboard' : 'Dashboard'}
              </Link>
              <button
                onClick={openCustomerPortal}
                disabled={portalLoading}
                className="inline-flex items-center justify-center rounded-xl bg-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-600 disabled:opacity-60"
              >
                {portalLoading
                  ? language === 'ro' ? 'Se deschide…' : 'Opening…'
                  : language === 'ro' ? 'Gestionează abonamentul' : 'Manage subscription'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
