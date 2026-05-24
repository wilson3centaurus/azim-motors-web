import { UsersAdmin } from './users-admin'
import { requireAdmin } from '@/lib/auth'
import { listUsers } from '@/lib/data'

export default async function UsersPage() {
  await requireAdmin()
  const users = await listUsers()

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <h1 className="text-xl font-bold text-slate-900">User Management</h1>
      <UsersAdmin users={users} />
    </div>
  )
}
