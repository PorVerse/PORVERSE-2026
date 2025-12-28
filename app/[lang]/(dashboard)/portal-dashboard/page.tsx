import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function PortalDashboardPage({
  params,
}: {
  params: { lang: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${params.lang}/login`)
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user's portals progress
  const { data: portals } = await supabase
    .from('user_portal_progress')
    .select(`
      *,
      portal:portals(*)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <DashboardClient
      lang={params.lang}
      user={user}
      profile={profile}
      portals={portals || []}
    />
  )
}
