import { Suspense } from 'react'

import { BillingClient } from './BillingClient'

export const dynamic = 'force-dynamic'

export default function BillingReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] grid place-items-center text-white">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <BillingClient />
    </Suspense>
  )
}

