import { compare } from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ensureRuntimeDefaultAdminCredentials, queryAll, queryOne } from '@/lib/db'
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifySessionToken } from '@/lib/session'
import type { UserRole } from '@/lib/supabase/types'
import { normalizePhone } from '@/lib/utils'

type UserRow = {
  id: string
  email: string
  password_hash: string
  pin_hash: string | null
  password_login_enabled: number
  full_name: string
  role: UserRole
  phone: string | null
  avatar_url: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export type SessionUser = {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  has_pin: boolean
  password_login_enabled: boolean
  created_at: string
  updated_at: string
}

function mapUser(row: UserRow | null): SessionUser | null {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    phone: row.phone,
    avatar_url: row.avatar_url,
    is_active: Boolean(row.is_active),
    has_pin: Boolean(row.pin_hash),
    password_login_enabled: Boolean(row.password_login_enabled),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function isDefaultAdminRecoveryUser(row: Pick<UserRow, 'email' | 'phone' | 'full_name' | 'role'>) {
  const desiredEmail = (process.env.AZIM_LOCAL_ADMIN_EMAIL ?? 'admin@admin.com').toLowerCase()
  const desiredPhone = process.env.AZIM_LOCAL_ADMIN_PHONE ?? '0770000000'

  return row.role === 'admin' && (
    row.full_name === 'Azim Motors Admin'
    || row.email.toLowerCase() === desiredEmail
    || row.phone === desiredPhone
  )
}

async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim()
  const normalizedPhone = normalizePhone(trimmed)
  const candidates = await queryAll<UserRow>(
    'SELECT * FROM users WHERE is_active = 1 AND (lower(email) = lower(?) OR phone = ?)',
    [trimmed, trimmed],
  )

  return candidates.find(candidate => {
    if (candidate.email.toLowerCase() === trimmed.toLowerCase()) return true
    return normalizePhone(candidate.phone) === normalizedPhone
  }) ?? await queryOne<UserRow>('SELECT * FROM users WHERE lower(email) = lower(?)', [trimmed])
}

export async function getUserById(id: string) {
  const row = await queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [id])
  return mapUser(row)
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const payload = await verifySessionToken(token)
  if (!payload) return null

  const user = await getUserById(payload.sub)
  if (!user || !user.is_active) return null
  return user
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin() {
  const user = await requireAnyRole(['admin'], '/settings')
  return user
}

export async function requireAnyRole(roles: UserRole[], fallback = '/dashboard') {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect(fallback)
  return user
}

export async function authenticateUser(identifier: string, secret: string, options?: { usePassword?: boolean }) {
  await ensureRuntimeDefaultAdminCredentials()
  const usePassword = options?.usePassword ?? false
  const row = await findUserByIdentifier(identifier)

  if (!row || !row.is_active) return null

  const credentialHash = usePassword ? row.password_hash : row.pin_hash
  if (!credentialHash) return null

  if (usePassword && !row.password_login_enabled && !isDefaultAdminRecoveryUser(row)) {
    return null
  }

  const matches = await compare(secret, credentialHash)
  if (!matches) return null
  return mapUser(row)
}

export async function createSession(user: SessionUser) {
  const token = await createSessionToken({ sub: user.id, email: user.email, role: user.role })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions)
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}