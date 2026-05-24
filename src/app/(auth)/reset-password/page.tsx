'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPasswordAction } from '@/lib/actions'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setError('')
    startTransition(async () => {
      const result = await resetPasswordAction({ email, password, confirm })
      if (!result.ok) {
        setError(result.message)
        return
      }

      setMessage(result.message)
      setPassword('')
      setConfirm('')
    })
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_32px_90px_-48px_rgba(21,38,36,0.55)] sm:p-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Reset password</h1>
        <p className="text-slate-500 text-sm mb-6">
          This local version resets the password directly inside the workstation database.
        </p>
        {message && <Alert variant="success" className="mb-4">{message}</Alert>}
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="reset-email"
            type="email"
            label="Email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
            placeholder="you@hazimmotors.com"
          />
          <Input
            id="reset-password"
            type="password"
            label="New Password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
            placeholder="At least 8 characters"
          />
          <Input
            id="reset-confirm"
            type="password"
            label="Confirm Password"
            value={confirm}
            onChange={event => setConfirm(event.target.value)}
            required
            placeholder="Repeat the new password"
          />
          <Button type="submit" loading={loading} className="w-full">
            Reset password
          </Button>
        </form>
        <Link href="/login" className="block text-center text-sm text-blue-600 hover:underline mt-4">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
