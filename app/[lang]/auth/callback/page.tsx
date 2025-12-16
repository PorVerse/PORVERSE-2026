import CallbackClient from './CallbackClient'

export default function CallbackPage({
  params,
  searchParams
}: {
  params: { lang: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  return <CallbackClient params={params} searchParams={searchParams} />
}
