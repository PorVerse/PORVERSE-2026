// app/[lang]/billing/cancel/page.tsx
import Link from 'next/link'

export default function CancelPage({ params }: { params: { lang: 'en' | 'ro' } }) {
  const { lang } = params
  return (
    <div className="mx-auto max-w-xl p-6 text-white">
      <h1 className="mb-2 text-2xl font-semibold">{lang === 'ro' ? 'Plata a fost anulată' : 'Payment cancelled'}</h1>
      <p className="mb-6 opacity-80">
        {lang === 'ro'
          ? 'Nu s-a debitat nimic. Poți relua oricând procesul de plată.'
          : 'No charge was made. You can restart the checkout anytime.'}
      </p>
      <Link href={`/${lang}/pricing`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
        {lang === 'ro' ? 'Înapoi la Prețuri' : 'Back to Pricing'}
      </Link>
    </div>
  )
}
