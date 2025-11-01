// app/[lang]/billing/success/page.tsx
import Link from 'next/link'

export default function SuccessPage({ params, searchParams }: { params: { lang: 'en' | 'ro' }, searchParams: { session_id?: string } }) {
  const { lang } = params
  return (
    <div className="mx-auto max-w-xl p-6 text-white">
      <h1 className="mb-2 text-2xl font-semibold">{lang === 'ro' ? 'Plata reușită' : 'Payment successful'}</h1>
      <p className="mb-6 opacity-80">
        {lang === 'ro'
          ? 'Abonamentul tău a fost activat. Poți gestiona facturile din Portalul de clienți.'
          : 'Your subscription is now active. You can manage invoices in the Customer Portal.'}
      </p>
      <div className="flex gap-3">
        <Link href={`/${lang}/portal-dashboard`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
          {lang === 'ro' ? 'Mergi la Dashboard' : 'Go to Dashboard'}
        </Link>
        <Link href={`/${lang}/account`} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10">
          {lang === 'ro' ? 'Contul meu' : 'My account'}
        </Link>
      </div>
    </div>
  )
}
