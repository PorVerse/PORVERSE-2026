import LoginClient from './LoginClient'

export const dynamic = 'force-dynamic'

export default function Page({
  params,
  searchParams,
}: {
  params: { lang: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  return <LoginClient params={params} searchParams={searchParams} />
}
