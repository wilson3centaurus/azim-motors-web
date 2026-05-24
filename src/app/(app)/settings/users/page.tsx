import { UsersAdmin } from './users-admin'
import { requireAdmin } from '@/lib/auth'
import { listUsers } from '@/lib/data'

export default async function UsersPage() {
  await requireAdmin()
  const users = await listUsers()

  return (
    <div className="max-w-6xl space-y-5 p-3 sm:p-6">
      <h1 className="text-xl font-bold text-slate-900">User Management</h1>
      <UsersAdmin users={users} />
    </div>
  )
}
