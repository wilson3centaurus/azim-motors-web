'use client'

import { useState, useTransition } from 'react'
import type { JobCard, JobStatus, UserProfile } from '@/lib/supabase/types'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { updateJobCardAction } from '@/lib/actions'

const STATUSES: JobStatus[] = ['Pending', 'In Progress', 'Completed', 'Cancelled']

type EditableJob = Pick<JobCard, 'id' | 'status' | 'assigned_mechanic' | 'diagnosis' | 'work_done' | 'labour_cost' | 'estimated_return' | 'notes'>

export function JobCardActions({ job, mechanics }: { job: EditableJob; mechanics: UserProfile[] }) {
  const [saving, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    status: job.status,
    assigned_mechanic: job.assigned_mechanic ?? '',
    diagnosis: job.diagnosis ?? '',
    work_done: job.work_done ?? '',
    labour_cost: job.labour_cost ?? 0,
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
        assigned_mechanic: form.assigned_mechanic || null,
        diagnosis: form.diagnosis,
        work_done: form.work_done,
        labour_cost: Number(form.labour_cost),
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Update Job</h2>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select label="Status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as JobStatus }))}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </Select>
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
      </div>

      <Textarea id="job-diagnosis" label="Diagnosis" rows={3} value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} />
      <Textarea id="job-work-done" label="Work Done" rows={3} value={form.work_done} onChange={e => setForm(p => ({ ...p, work_done: e.target.value }))} />
      <Textarea id="job-notes" label="Notes" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />

      <Button type="button" onClick={handleSave} loading={saving}>Save Changes</Button>
    </div>
  )
}
