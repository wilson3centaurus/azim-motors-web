'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
        body: JSON.stringify({ email, password }),
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
          <p className="mt-2 text-sm text-slate-500">Sign in to the local Azim Motors workshop system.</p>
        </div>

        <div className="mb-5 rounded-2xl border border-[#ead7b9] bg-[#fff7e8] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#915b19]">Local Admin</p>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs leading-relaxed text-[#7a5120]">
              <span className="rounded bg-white/80 px-1.5 py-0.5 font-mono">admin@admin.com</span>
              {' / '}
              <span className="rounded bg-white/80 px-1.5 py-0.5 font-mono">admin1234</span>
            </div>
            <button
              type="button"
              onClick={() => { setEmail('admin@admin.com'); setPassword('admin1234') }}
              className="shrink-0 rounded-xl bg-[#d86f45] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#c65f39]"
            >
              Fill
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            id="login-email"
            type="email"
            label="Email address"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
            placeholder="you@azimmotors.com"
          />

          <Input
            id="login-password"
            type="password"
            label="Password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
            placeholder="••••••••"
          />

          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
