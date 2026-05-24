import { SettingsForm } from './settings-form'
import { requireUser } from '@/lib/auth'
import { getSettingsData } from '@/lib/data'

export default async function SettingsPage() {
  const user = await requireUser()
  const settings = await getSettingsData(user.id)

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Settings</h1>
      <SettingsForm profile={settings?.profile ?? null} email={settings?.email ?? ''} />
    </div>
  )
}
