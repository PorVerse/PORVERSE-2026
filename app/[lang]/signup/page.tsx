import SignupClient from './SignupClient'

export const dynamic = 'force-dynamic'

export default function Page({
  params,
  searchParams,
}: {
  params: { lang: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  return <SignupClient params={params} searchParams={searchParams} />
}
