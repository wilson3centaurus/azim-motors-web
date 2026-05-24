'use client'

import { useState, useTransition } from 'react'
import type { JobCard, JobStatus, PaymentStatus, UserProfile } from '@/lib/supabase/types'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { deleteJobCardAction, updateJobCardAction } from '@/lib/actions'
import { useRouter } from 'next/navigation'

const STATUSES: JobStatus[] = ['Pending', 'In Progress', 'Completed', 'Cancelled']
const PAYMENT_STATUSES: PaymentStatus[] = ['Unpaid', 'Deposit Paid', 'Paid']

type EditableJob = Pick<JobCard, 'id' | 'status' | 'service_type' | 'assigned_mechanic' | 'diagnosis' | 'work_done' | 'labour_cost' | 'quoted_amount' | 'payment_status' | 'estimated_return' | 'notes'>

export function JobCardActions({ job, mechanics, canDelete }: { job: EditableJob; mechanics: UserProfile[]; canDelete: boolean }) {
  const router = useRouter()
  const [saving, startTransition] = useTransition()
  const [deleting, startDeleteTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState({
    status: job.status,
    service_type: job.service_type ?? 'General Service',
    assigned_mechanic: job.assigned_mechanic ?? '',
    diagnosis: job.diagnosis ?? '',
    work_done: job.work_done ?? '',
    labour_cost: job.labour_cost ?? 0,
    quoted_amount: job.quoted_amount ?? 0,
    payment_status: job.payment_status ?? 'Unpaid',
    estimated_return: job.estimated_return ?? '',
    notes: job.notes ?? '',
  })

  async function handleSave() {
    setMessage('')
    setError('')
    startTransition(async () => {
      const result = await updateJobCardAction({
        id: job.id,
        status: form.status,
        service_type: form.service_type,
        assigned_mechanic: form.assigned_mechanic || null,
        diagnosis: form.diagnosis,
        work_done: form.work_done,
        labour_cost: Number(form.labour_cost),
        quoted_amount: Number(form.quoted_amount),
        payment_status: form.payment_status,
        estimated_return: form.estimated_return || null,
        notes: form.notes,
      })

      if (!result.ok) {
        setError(result.message)
        return
      }

      setMessage(result.message)
    })
  }

  function handleDelete() {
    setMessage('')
    setError('')
    startDeleteTransition(async () => {
      const result = await deleteJobCardAction({ id: job.id })
      if (!result.ok) {
        setError(result.message)
        setConfirmDelete(false)
        return
      }

      router.push(typeof result.redirectTo === 'string' ? result.redirectTo : '/job-cards')
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 dark:border-[#27433e] dark:bg-[#102623]/92">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9eb5af]">Update Job</h2>
        {canDelete && job.status !== 'Completed' ? (
          <Button type="button" variant="danger" size="sm" onClick={() => setConfirmDelete(true)} loading={deleting}>
            Delete Job Card
          </Button>
        ) : null}
      </div>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select label="Status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as JobStatus }))}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <div>
          <Input id="job-service-type" label="Service Type" value={form.service_type} onChange={e => setForm(p => ({ ...p, service_type: e.target.value }))} />
        </div>
        <div>
          <Select label="Assigned Mechanic" value={form.assigned_mechanic} onChange={e => setForm(p => ({ ...p, assigned_mechanic: e.target.value }))}>
            <option value="">— Unassigned —</option>
            {mechanics.map(m => (
              <option key={m.id} value={m.id}>{m.full_name}{m.phone ? ` — ${m.phone}` : ''}</option>
            ))}
          </Select>
          {form.assigned_mechanic && (() => {
            const m = mechanics.find(x => x.id === form.assigned_mechanic)
            return m ? (
              <div className="mt-2 flex items-center gap-2.5 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {m.full_name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{m.full_name}</p>
                  {m.phone && <p className="text-xs text-slate-500">{m.phone}</p>}
                </div>
              </div>
            ) : null
          })()}
          {mechanics.length === 0 && (
            <p className="text-xs text-slate-400 mt-1.5">
              No mechanics yet. <a href="/settings/users" className="text-blue-600 hover:underline">Add mechanics in Settings → Users</a>
            </p>
          )}
        </div>
        <Input id="job-estimated-return" label="Estimated Return" type="date" value={form.estimated_return} onChange={e => setForm(p => ({ ...p, estimated_return: e.target.value }))} />
        <Input id="job-labour-cost" label="Labour Cost (USD)" type="number" value={String(form.labour_cost)} onChange={e => setForm(p => ({ ...p, labour_cost: parseFloat(e.target.value || '0') }))} prefix="$" />
        <Input id="job-quoted-amount" label="Quoted Amount (USD)" type="number" value={String(form.quoted_amount)} onChange={e => setForm(p => ({ ...p, quoted_amount: parseFloat(e.target.value || '0') }))} prefix="$" />
        <div>
          <Select label="Payment Status" value={form.payment_status} onChange={e => setForm(p => ({ ...p, payment_status: e.target.value as PaymentStatus }))}>
            {PAYMENT_STATUSES.map(status => <option key={status}>{status}</option>)}
          </Select>
        </div>
      </div>

      <Textarea id="job-diagnosis" label="Diagnosis" rows={3} value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} />
      <Textarea id="job-work-done" label="Work Done" rows={3} value={form.work_done} onChange={e => setForm(p => ({ ...p, work_done: e.target.value }))} />
      <Textarea id="job-notes" label="Notes" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />

      <Button type="button" onClick={handleSave} loading={saving}>Save Changes</Button>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete job card?"
        description="This removes the active job card and restores any stock lines already booked to it. Completed job cards cannot be deleted."
        confirmLabel="Delete job card"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
