'use client'

import { useState, useTransition } from 'react'
import type { UserProfile, UserRole } from '@/lib/supabase/types'
import { ROLE_LABELS } from '@/lib/utils'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { createUserAction, toggleUserActiveAction, updateUserRoleAction } from '@/lib/actions'

const ROLES: UserRole[] = ['admin', 'mechanic', 'receptionist']

export function UsersAdmin({ users }: { users: UserProfile[] }) {
  const [pending, startTransition] = useTransition()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('mechanic')
  const [msg, setMsg] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createUserAction({ email: inviteEmail, full_name: inviteName, role: inviteRole })
      setMsg(result.message)
      if (result.ok) {
        setInviteEmail('')
        setInviteName('')
      }
      setTimeout(() => setMsg(''), 5000)
    })
  }

  async function updateRole(userId: string, role: UserRole) {
    startTransition(async () => {
      const result = await updateUserRoleAction({ userId, role })
      setMsg(result.message)
    })
  }

  async function toggleActive(userId: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleUserActiveAction({ userId, current })
      setMsg(result.message)
    })
  }

  return (
    <div className="space-y-5">
      {msg && <Alert variant={msg.startsWith('Error') ? 'error' : 'success'}>{msg}</Alert>}

      <Card className="p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Create New User</h2>
        <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
          <Input
            id="user-name"
            required
            placeholder="Full name"
            value={inviteName}
            onChange={e => setInviteName(e.target.value)}
            containerClassName="flex-1 min-w-48"
          />
          <Input
            id="user-email"
            type="email"
            required
            placeholder="Email address"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            containerClassName="flex-1 min-w-48"
          />
          <Select label="Role" value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)}>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
          <Button type="submit" loading={pending}>Create User</Button>
        </form>
      </Card>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">All Users</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {u.full_name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{u.full_name}</p>
                  <p className="text-xs text-slate-400 capitalize">{u.role}</p>
                </div>
                {!u.is_active && <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Inactive</span>}
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label={`Role for ${u.full_name}`}
                  title={`Role for ${u.full_name}`}
                  value={u.role}
                  onChange={e => updateRole(u.id, e.target.value as UserRole)}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => toggleActive(u.id, u.is_active)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${u.is_active ? 'border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-600' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                >
                  {u.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
