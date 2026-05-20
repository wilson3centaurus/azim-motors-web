import { createClient } from '@/lib/supabase/server'
import { UsersAdmin } from './users-admin'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: self } = await supabase.from('user_profiles').select('role').eq('id', user?.id ?? '').single()

  if (self?.role !== 'admin') redirect('/settings')

  const { data: users } = await supabase
    .from('user_profiles')
    .select('*')
    .order('full_name')

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <h1 className="text-xl font-bold text-slate-900">User Management</h1>
      <UsersAdmin users={users ?? []} />
    </div>
  )
}
