'use client'

import { useState, useTransition } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [secret, setSecret] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [loading, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, secret, usePassword: useRecovery }),
      })

      const result = await response.json()
      if (!response.ok || !result.ok) {
        setError(result.message ?? 'Unable to sign in right now.')
        return
      }

      // Hard navigation ensures the browser commits the session cookie before
      // the next server request fires (router.replace races with Set-Cookie).
      window.location.replace(result.redirectTo ?? '/dashboard')
    })
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_40px_80px_-32px_rgba(0,0,0,0.45)] dark:border-[#30363d] dark:bg-[#161b22]">
        <div className="mb-6 text-center">
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-[#e6edf3]">Sign in to your account</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#656d76]">Specialist in Mercedes Benz Services &amp; Repairs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            id="login-identifier"
            type={useRecovery ? 'text' : 'tel'}
            inputMode={useRecovery ? undefined : 'tel'}
            label={useRecovery ? 'Phone number or email' : 'Phone number'}
            value={identifier}
            onChange={event => setIdentifier(event.target.value)}
            required
            placeholder={useRecovery ? 'admin@admin.com' : '0770000000'}
          />

          <Input
            id="login-password"
            type="password"
            inputMode={useRecovery ? undefined : 'numeric'}
            maxLength={useRecovery ? undefined : 4}
            pattern={useRecovery ? undefined : '[0-9]*'}
            label={useRecovery ? 'Recovery Password' : '4-digit PIN'}
            value={secret}
            onChange={event => setSecret(useRecovery ? event.target.value : event.target.value.replace(/\D/g, '').slice(0, 4))}
            required
            placeholder={useRecovery ? 'Recovery password' : '••••'}
          />

          <Button type="submit" loading={loading} className="w-full">
            {useRecovery ? 'Use Recovery Access' : 'Sign in'}
          </Button>

          <button
            type="button"
            onClick={() => {
              setUseRecovery(current => !current)
              setSecret('')
              setIdentifier('')
              setError('')
            }}
            className="w-full text-sm font-semibold text-[#1754af] transition hover:text-[#0d3d8c] dark:text-[#58a6ff] dark:hover:text-[#79b8ff]"
          >
            {useRecovery ? 'Back to PIN sign-in' : 'Forgot PIN or first sign-in?'}
          </button>
        </form>
      </div>
    </div>
  )
}
