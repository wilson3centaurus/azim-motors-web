'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { JobStatus, UserProfile } from '@/lib/supabase/types'

const STATUSES: JobStatus[] = ['Pending', 'In Progress', 'Completed', 'Cancelled']

export function JobCardActions({ job, mechanics }: { job: any; mechanics: UserProfile[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
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
    setSaving(true)
    await supabase.from('job_cards').update({
      status: form.status,
      assigned_mechanic: form.assigned_mechanic || null,
      diagnosis: form.diagnosis || null,
      work_done: form.work_done || null,
      labour_cost: Number(form.labour_cost),
      estimated_return: form.estimated_return || null,
      notes: form.notes || null,
      ...(form.status === 'Completed' ? { actual_return: new Date().toISOString().split('T')[0] } : {}),
    }).eq('id', job.id)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Update Job</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as JobStatus }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Assigned Mechanic</label>
          <select value={form.assigned_mechanic} onChange={e => setForm(p => ({ ...p, assigned_mechanic: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">— Unassigned —</option>
            {mechanics.map(m => (
              <option key={m.id} value={m.id}>{m.full_name}{m.phone ? ` — ${m.phone}` : ''}</option>
            ))}
          </select>
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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Estimated Return</label>
          <input type="date" value={form.estimated_return} onChange={e => setForm(p => ({ ...p, estimated_return: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Labour Cost (USD)</label>
          <input type="number" value={form.labour_cost} onChange={e => setForm(p => ({ ...p, labour_cost: parseFloat(e.target.value) }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Diagnosis</label>
        <textarea rows={2} value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Done</label>
        <textarea rows={2} value={form.work_done} onChange={e => setForm(p => ({ ...p, work_done: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
        <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
