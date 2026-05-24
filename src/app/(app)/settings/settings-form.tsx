'use client'

import { useState, useTransition } from 'react'
import type { UserProfile } from '@/lib/supabase/types'
import { ROLE_LABELS } from '@/lib/utils'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { changePasswordAction, saveProfileAction } from '@/lib/actions'

export function SettingsForm({ profile, email }: { profile: UserProfile | null; email: string }) {
  const [saving, startProfileTransition] = useTransition()
  const [pwSaving, startPasswordTransition] = useTransition()
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    startProfileTransition(async () => {
      const result = await saveProfileAction(form)
      setMsg(result.message)
      setTimeout(() => setMsg(''), 3000)
    })
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    startPasswordTransition(async () => {
      const result = await changePasswordAction(pw)
      setMsg(result.message)
      if (result.ok) setPw({ current: '', next: '', confirm: '' })
      setTimeout(() => setMsg(''), 4000)
    })
  }

  return (
    <div className="space-y-5">
      {msg && <Alert variant={msg.toLowerCase().includes('incorrect') ? 'error' : 'success'}>{msg}</Alert>}

      <Card className="p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <Input disabled label="Email" value={email} />
          <Input label="Full Name" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          <Input disabled label="Role" value={ROLE_LABELS[profile?.role as keyof typeof ROLE_LABELS] ?? profile?.role} />
          <Button type="submit" loading={saving}>Save Profile</Button>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <Input type="password" label="Current Password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} />
          <Input type="password" label="New Password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} />
          <Input type="password" label="Confirm Password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
          <Button type="submit" variant="secondary" loading={pwSaving} disabled={!pw.next}>Change Password</Button>
        </form>
      </Card>
    </div>
  )
}
