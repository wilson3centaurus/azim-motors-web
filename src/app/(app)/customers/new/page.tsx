'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createCustomerAction } from '@/lib/actions'

export default function NewCustomerPage() {
  const router = useRouter()
  const [loading, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', address: '', id_number: '', notes: '' })

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await createCustomerAction(form)
      if (!result.ok) {
        setError(result.message)
        return
      }

      router.push(`/customers/${result.id}`)
    })
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl">
      <div className="mb-4 sm:mb-6">
        <Link href="/customers" className="text-sm text-blue-600 hover:underline">← Customers</Link>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">New Customer</h1>
      </div>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <Card className="space-y-4 p-4 sm:p-6">
          <Input id="customer-name" label="Full Name *" required value={form.full_name} onChange={f('full_name')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="customer-phone" label="Phone *" required value={form.phone} onChange={f('phone')} />
          <Input id="customer-email" type="email" label="Email" value={form.email} onChange={f('email')} />
        </div>
          <Input id="customer-address" label="Address" value={form.address} onChange={f('address')} />
          <Input id="customer-id" label="ID / License Number" value={form.id_number} onChange={f('id_number')} />
          <Textarea id="customer-notes" label="Notes" rows={3} value={form.notes} onChange={f('notes')} />
        <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" loading={loading}>Create Customer</Button>
          <Link href="/customers" className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</Link>
        </div>
        </Card>
      </form>
    </div>
  )
}
