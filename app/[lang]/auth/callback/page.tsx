import CallbackClient from '.auth/CallbackClient.tsx'

export const dynamic = 'force-dynamic'

export default function Page({
  params,
  searchParams,
}: {
  params: { lang: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  return <CallbackClient params={params} searchParams={searchParams} />
}
