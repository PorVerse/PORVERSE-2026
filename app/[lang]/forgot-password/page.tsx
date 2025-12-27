import ForgotPasswordClient from './ForgotPasswordClient'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage({ params }: { params: { lang: string } }) {
  return <ForgotPasswordClient params={params} />
}