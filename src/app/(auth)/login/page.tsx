'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
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

      router.replace(result.redirectTo ?? '/dashboard')
      router.refresh()
    })
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_32px_90px_-48px_rgba(21,38,36,0.55)] sm:p-8">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#1f5f59] shadow-[0_20px_40px_-20px_rgba(31,95,89,0.65)]">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Welcome back</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            className="w-full text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
          >
            {useRecovery ? 'Back to PIN sign-in' : 'Forgot PIN or first sign-in? Use recovery access'}
          </button>
        </form>
      </div>
    </div>
  )
}
