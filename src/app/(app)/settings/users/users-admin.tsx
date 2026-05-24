'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { UserProfile, UserRole } from '@/lib/supabase/types'
import { ROLE_LABELS } from '@/lib/utils'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { createUserAction, deleteUserAction, resetUserLoginAction, toggleUserActiveAction, updateUserRoleAction } from '@/lib/actions'

const ROLES = ['admin', 'salesperson', 'mechanic'] as const satisfies readonly UserRole[]

type ManagedRole = (typeof ROLES)[number]

const ROLE_SECTIONS: Array<{
  role: ManagedRole
  title: string
  description: string
}> = [
  {
    role: 'admin',
    title: 'Add Admin Employee',
    description: 'Create a full-access staff account for ownership or operations leads.',
  },
  {
    role: 'salesperson',
    title: 'Add Salesperson',
    description: 'Create a front-desk or parts-counter account for stock sales and customer intake.',
  },
  {
    role: 'mechanic',
    title: 'Add Mechanic',
    description: 'Create a workshop account for assigned repairs, diagnosis, and job updates.',
  },
]

function emptyInviteState() {
  return {
    full_name: '',
    phone: '',
    email: '',
  }
}

export function UsersAdmin({ users }: { users: UserProfile[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [inviteByRole, setInviteByRole] = useState<Record<ManagedRole, { full_name: string; phone: string; email: string }>>({
    admin: emptyInviteState(),
    salesperson: emptyInviteState(),
    mechanic: emptyInviteState(),
  })
  const [msg, setMsg] = useState('')
  const [newCredentials, setNewCredentials] = useState<null | {
    mode: 'created' | 'reset'
    fullName: string
    role: ManagedRole
    loginPhone: string
    loginEmail: string | null
    tempPassword: string
  }>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<UserProfile | null>(null)

  const usersByRole = {
    admin: users.filter(user => user.role === 'admin'),
    salesperson: users.filter(user => user.role === 'salesperson'),
    mechanic: users.filter(user => user.role === 'mechanic'),
  }

  function updateInvite(role: ManagedRole, field: 'full_name' | 'phone' | 'email', value: string) {
    setInviteByRole(current => ({
      ...current,
      [role]: {
        ...current[role],
        [field]: value,
      },
    }))
  }

  async function handleInvite(role: ManagedRole, e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const invite = inviteByRole[role]
      try {
        const result = await createUserAction({
          email: invite.email,
          full_name: invite.full_name,
          phone: invite.phone,
          role,
        })
        setMsg(result.message)
        if (result.ok) {
          setNewCredentials({
            mode: 'created',
            fullName: invite.full_name,
            role,
            loginPhone: result.loginPhone,
            loginEmail: result.loginEmail,
            tempPassword: result.tempPassword,
          })
          setInviteByRole(current => ({
            ...current,
            [role]: emptyInviteState(),
          }))
          router.refresh()
        }
      } catch {
        setMsg('Error creating user. Please try again.')
      }
      setTimeout(() => setMsg(''), 5000)
    })
  }

  async function resetLogin(user: UserProfile) {
    startTransition(async () => {
      try {
        const result = await resetUserLoginAction({ userId: user.id })
        setMsg(result.message)
        if (result.ok) {
          setNewCredentials({
            mode: 'reset',
            fullName: user.full_name,
            role: user.role as ManagedRole,
            loginPhone: result.loginPhone ?? user.phone ?? '',
            loginEmail: result.loginEmail ?? null,
            tempPassword: result.tempPassword,
          })
          router.refresh()
        }
      } catch {
        setMsg('Error resetting sign-in. Please try again.')
      }
      setTimeout(() => setMsg(''), 5000)
    })
  }

  async function updateRole(userId: string, role: UserRole) {
    startTransition(async () => {
      try {
        const result = await updateUserRoleAction({ userId, role })
        setMsg(result.message)
        if (result.ok) {
          router.refresh()
        }
      } catch {
        setMsg('Error updating user role. Please try again.')
      }
    })
  }

  async function toggleActive(userId: string, current: boolean) {
    startTransition(async () => {
      try {
        const result = await toggleUserActiveAction({ userId, current })
        setMsg(result.message)
        if (result.ok) {
          router.refresh()
        }
      } catch {
        setMsg('Error updating user status. Please try again.')
      }
    })
  }

  async function confirmDeleteUser() {
    if (!deleteCandidate) return

    startTransition(async () => {
      try {
        const result = await deleteUserAction({ userId: deleteCandidate.id })
        setMsg(result.message)
        if (result.ok) {
          setDeleteCandidate(null)
          router.refresh()
        }
      } catch {
        setMsg('Error deleting user. Please try again.')
      }
      setTimeout(() => setMsg(''), 5000)
    })
  }

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={deleteCandidate !== null}
        title="Delete employee"
        description={deleteCandidate ? `Delete ${deleteCandidate.full_name}? This removes the account for good. Existing job cards and sales will keep working with cleared user references.` : ''}
        confirmLabel="Delete employee"
        cancelLabel="Cancel"
        danger
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteCandidate(null)}
      />

      {msg && <Alert variant={msg.startsWith('Error') ? 'error' : 'success'}>{msg}</Alert>}

      {newCredentials ? (
        <Alert variant="info" title={newCredentials.mode === 'created' ? 'First sign-in details' : 'Reset sign-in details'}>
          <div className="space-y-3">
            <p>
              {newCredentials.fullName} can sign in as {ROLE_LABELS[newCredentials.role]} using their phone number or email, then set a fresh 4-digit PIN inside the app.
            </p>
            <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-strong)]">
              <p><strong>Phone login:</strong> {newCredentials.loginPhone}</p>
              {newCredentials.loginEmail ? <p><strong>Email login:</strong> {newCredentials.loginEmail}</p> : null}
              <p><strong>Recovery password:</strong> {newCredentials.tempPassword}</p>
            </div>
            <p className="text-xs text-[var(--text-soft)]">
              Give these details to the employee. After the first password sign-in, the app will force them to create a PIN.
            </p>
          </div>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {ROLE_SECTIONS.map(section => {
          const invite = inviteByRole[section.role]
          return (
            <Card key={section.role} className="p-5">
              <div className="mb-4 space-y-1">
                <h2 className="text-sm font-semibold text-slate-900">{section.title}</h2>
                <p className="text-sm text-slate-500">{section.description}</p>
              </div>
              <form onSubmit={event => handleInvite(section.role, event)} className="space-y-3">
                <Input
                  id={`${section.role}-name`}
                  required
                  label="Full Name"
                  placeholder="Full name"
                  value={invite.full_name}
                  onChange={e => updateInvite(section.role, 'full_name', e.target.value)}
                  containerClassName="w-full"
                />
                <Input
                  id={`${section.role}-phone`}
                  required
                  label="Phone Number"
                  placeholder="0770000000"
                  value={invite.phone}
                  onChange={e => updateInvite(section.role, 'phone', e.target.value)}
                  containerClassName="w-full"
                />
                <Input
                  id={`${section.role}-email`}
                  type="email"
                  label="Email (optional)"
                  placeholder="staff@hazim.local"
                  value={invite.email}
                  onChange={e => updateInvite(section.role, 'email', e.target.value)}
                  containerClassName="w-full"
                />
                <Button className="w-full" type="submit" loading={pending}>Create {ROLE_LABELS[section.role]}</Button>
              </form>
            </Card>
          )
        })}
      </div>

      <div className="space-y-4">
        {ROLE_SECTIONS.map(section => (
          <div key={section.role} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold text-slate-900">{ROLE_LABELS[section.role]} Team</h2>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                {usersByRole[section.role].length} active or inactive accounts
              </p>
            </div>
            <div className="divide-y divide-slate-50">
              {usersByRole[section.role].length === 0 ? (
                <div className="px-5 py-8 text-sm text-slate-400">No {section.role} accounts created yet.</div>
              ) : usersByRole[section.role].map(u => (
                <div key={u.id} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {u.full_name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{u.full_name}</p>
                      <p className="truncate text-xs capitalize text-slate-400">{u.phone ?? 'No phone'} · {u.role}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {u.has_pin ? 'PIN active' : 'PIN not set'} · {u.password_login_enabled ? 'Recovery password enabled' : 'PIN-only sign-in'}
                      </p>
                    </div>
                    {!u.is_active && <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-500">Inactive</span>}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                      id={`role-${u.id}`}
                      value={u.role}
                      onChange={e => updateRole(u.id, e.target.value as UserRole)}
                      className="sm:min-w-40"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </Select>
                    <button
                      type="button"
                      onClick={() => resetLogin(u)}
                      className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
                    >
                      Reset Sign-In
                    </button>
                    {u.role !== 'admin' ? (
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(u)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        Delete
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggleActive(u.id, u.is_active)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${u.is_active ? 'border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-600' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
