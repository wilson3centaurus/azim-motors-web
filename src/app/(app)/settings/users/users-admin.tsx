'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, UserRole } from '@/lib/supabase/types'
import { ROLE_LABELS } from '@/lib/utils'

const ROLES: UserRole[] = ['admin', 'mechanic', 'receptionist']

export function UsersAdmin({ users }: { users: UserProfile[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('mechanic')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true)
    const res = await fetch('/api/invite-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    const data = await res.json()
    if (data.error) setMsg('Error: ' + data.error)
    else { setMsg(`Invite sent to ${inviteEmail}`); setInviteEmail('') }
    setInviteLoading(false)
    setTimeout(() => setMsg(''), 5000)
  }

  async function updateRole(userId: string, role: UserRole) {
    await supabase.from('user_profiles').update({ role }).eq('id', userId)
    router.refresh()
  }

  async function toggleActive(userId: string, current: boolean) {
    await supabase.from('user_profiles').update({ is_active: !current }).eq('id', userId)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`border rounded-lg px-4 py-3 text-sm ${msg.startsWith('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>{msg}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Invite New User</h2>
        <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
          <input
            type="email"
            required
            placeholder="Email address"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1 min-w-48 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)} className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <button type="submit" disabled={inviteLoading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
            {inviteLoading ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

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
                  value={u.role}
                  onChange={e => updateRole(u.id, e.target.value as UserRole)}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                <button
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
