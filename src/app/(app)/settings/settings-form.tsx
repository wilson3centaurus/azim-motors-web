'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { UserProfile } from '@/lib/supabase/types'
import { ROLE_LABELS } from '@/lib/utils'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { changePinAction, saveProfileAction, seedSampleInventoryAction, setLoginPinAction } from '@/lib/actions'

export function SettingsForm({ profile, email }: { profile: UserProfile | null; email: string }) {
  const router = useRouter()
  const [saving, startProfileTransition] = useTransition()
  const [pinSaving, startPinTransition] = useTransition()
  const [seeding, startSeedTransition] = useTransition()
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
  const [pin, setPin] = useState({ current: '', next: '', confirm: '' })

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    startProfileTransition(async () => {
      const result = await saveProfileAction(form)
      setMsg(result.message)
      setTimeout(() => setMsg(''), 3000)
    })
  }

  async function savePin(e: React.FormEvent) {
    e.preventDefault()
    startPinTransition(async () => {
      const result = profile?.has_pin
        ? await changePinAction({ current: pin.current, next: pin.next, confirm: pin.confirm })
        : await setLoginPinAction({ pin: pin.next, confirm: pin.confirm })
      setMsg(result.message)
      if (result.ok) {
        setPin({ current: '', next: '', confirm: '' })
        router.refresh()
      }
      setTimeout(() => setMsg(''), 4000)
    })
  }

  function seedInventory() {
    startSeedTransition(async () => {
      const result = await seedSampleInventoryAction()
      setMsg(result.message)
      if (result.ok) {
        router.refresh()
      }
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
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Login PIN</h2>
        <form onSubmit={savePin} className="space-y-4">
          {profile?.has_pin ? (
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]*"
              label="Current PIN"
              value={pin.current}
              onChange={e => setPin(p => ({ ...p, current: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
            />
          ) : null}
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            pattern="[0-9]*"
            label={profile?.has_pin ? 'New PIN' : 'Set 4-digit PIN'}
            hint={profile?.has_pin ? 'Use a simple 4-digit PIN you can remember.' : 'After saving, this PIN becomes the main sign-in secret for this account.'}
            value={pin.next}
            onChange={e => setPin(p => ({ ...p, next: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
          />
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            pattern="[0-9]*"
            label="Confirm PIN"
            value={pin.confirm}
            onChange={e => setPin(p => ({ ...p, confirm: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
          />
          <Button type="submit" variant="secondary" loading={pinSaving} disabled={!pin.next}>
            {profile?.has_pin ? 'Change PIN' : 'Save PIN'}
          </Button>
        </form>
      </Card>

      {profile?.role === 'admin' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Employee Management</h2>
            <p className="mb-4 text-sm text-slate-500">
              Add admins, salespeople, and mechanics, then manage their roles and account status from one screen.
            </p>
            <Link
              href="/settings/users"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#1f5f59] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(24,73,68,0.45)] transition hover:bg-[#184944] focus:outline-none focus:ring-2 focus:ring-[#1f5f59] focus:ring-offset-2"
            >
              Open Employee Manager
            </Link>
          </Card>

          <Card className="p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Admin Utilities</h2>
            <p className="mb-4 text-sm text-slate-500">
              Add sample Mercedes parts, repair kits, workshop tools, and suppliers into inventory for demo and testing use.
            </p>
            <Button type="button" onClick={seedInventory} loading={seeding}>
              Add Sample Inventory
            </Button>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
