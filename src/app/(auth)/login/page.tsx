'use client'

import Image from 'next/image'
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
    <div className="w-full max-w-md">
      <div className="rounded-xl border border-white/80 bg-white/92 p-5 shadow-[0_32px_90px_-48px_rgba(21,38,36,0.55)] sm:p-6">
        <div className="mb-5 text-center">
          <div className="mb-3 flex justify-center">
            <Image
              src="/hazin-motors-logo.png"
              alt="Hazim Motors"
              width={280}
              height={96}
              className="h-31 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="font-display text-xl font-bold text-slate-900">Sign in to your account</h1>
          <p className="mt-0.5 text-xs text-slate-500">Specialist in Mercedes Benz Services &amp; Repairs</p>
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
            className="w-full text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
          >
            {useRecovery ? 'Back to PIN sign-in' : 'Forgot PIN or first sign-in?'}
          </button>
        </form>
      </div>
    </div>
  )
}
