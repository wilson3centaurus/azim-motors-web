import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user?.id ?? '').single()

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Settings</h1>
      <SettingsForm profile={profile} email={user?.email ?? ''} />
    </div>
  )
}
