'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setLoginPinAction } from '@/lib/actions'

export function PinSetupGate({ open, fullName }: { open: boolean; fullName: string }) {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, startTransition] = useTransition()
  const [loggingOut, startLogout] = useTransition()

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await setLoginPinAction({ pin, confirm })
      if (!result.ok) {
        setError(result.errors?.pin?.[0] ?? result.errors?.confirm?.[0] ?? result.message)
        return
      }

      setPin('')
      setConfirm('')
      router.refresh()
    })
  }

  function handleSignOut() {
    startLogout(async () => {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.replace('/login')
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#102422]/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/70 bg-white p-5 shadow-2xl dark:border-[#27433e] dark:bg-[#102623] sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4e9b8e]">PIN Required</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-[#eef5f2]">Set your 4-digit login PIN</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-[#a7bbb5]">
          {fullName}, finish setup by choosing a 4-digit PIN. After this, you will use your phone or email together with this PIN to sign in.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}

          <Input
            id="setup-pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            pattern="[0-9]*"
            label="New PIN"
            placeholder="4 digits"
            value={pin}
            onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            required
          />

          <Input
            id="setup-pin-confirm"
            type="password"
            inputMode="numeric"
            maxLength={4}
            pattern="[0-9]*"
            label="Confirm PIN"
            placeholder="Repeat the same PIN"
            value={confirm}
            onChange={event => setConfirm(event.target.value.replace(/\D/g, '').slice(0, 4))}
            required
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={handleSignOut} loading={loggingOut}>
              Sign out
            </Button>
            <Button type="submit" loading={loading}>
              Save PIN
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}