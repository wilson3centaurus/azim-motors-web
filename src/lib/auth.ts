import { compare, hash } from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifySessionToken } from '@/lib/session'
import type { UserRole } from '@/lib/supabase/types'
import { normalizePhone } from '@/lib/utils'

type ProfileRow = {
  id: string
  email: string
  password_hash: string
  pin_hash: string | null
  password_login_enabled: boolean
  full_name: string
  role: UserRole
  phone: string | null
  avatar_url: string | null
  is_active: boolean
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

function mapUser(row: ProfileRow | null): SessionUser | null {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    phone: row.phone,
    avatar_url: row.avatar_url,
    is_active: row.is_active,
    has_pin: row.pin_hash !== null,
    password_login_enabled: row.password_login_enabled,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function isDefaultAdminCandidate(row: Pick<ProfileRow, 'email' | 'phone' | 'full_name' | 'role'>) {
  const desiredEmail = (process.env.AZIM_LOCAL_ADMIN_EMAIL ?? 'admin@admin.com').toLowerCase()
  const desiredPhone = process.env.AZIM_LOCAL_ADMIN_PHONE ?? '0770000000'
  return row.role === 'admin' && (
    row.full_name === 'Azim Motors Admin'
    || row.email.toLowerCase() === desiredEmail
    || row.phone === desiredPhone
  )
}

async function findUserByIdentifier(identifier: string) {
  const db = getDb()
  const trimmed = identifier.trim()
  const normalizedPhone = normalizePhone(trimmed)

  const { data: byEmail } = await db
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .ilike('email', trimmed)
    .maybeSingle()
  if (byEmail) return byEmail as ProfileRow

  const { data: byPhone } = await db
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .eq('phone', trimmed)
    .maybeSingle()
  if (byPhone) return byPhone as ProfileRow

  if (normalizedPhone && normalizedPhone !== trimmed) {
    const { data: byNorm } = await db
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .eq('phone', normalizedPhone)
      .maybeSingle()
    if (byNorm) return byNorm as ProfileRow
  }

  return null
}

export async function ensureRuntimeDefaultAdminCredentials() {
  const db = getDb()
  const desiredEmail = (process.env.AZIM_LOCAL_ADMIN_EMAIL ?? 'admin@admin.com').toLowerCase()
  const desiredPhone = process.env.AZIM_LOCAL_ADMIN_PHONE ?? '0770000000'
  const desiredPassword = process.env.AZIM_LOCAL_ADMIN_PASSWORD ?? 'admin'

  const { data: admins } = await db
    .from('profiles')
    .select('id, email, password_hash, full_name, phone')
    .eq('role', 'admin')
    .order('created_at')
    .limit(1)

  if (!admins || admins.length === 0) {
    const passwordHash = await hash(desiredPassword, 10)
    await db.from('profiles').insert({
      email: desiredEmail,
      password_hash: passwordHash,
      full_name: 'Azim Motors Admin',
      role: 'admin',
      phone: desiredPhone,
      is_active: true,
      password_login_enabled: true,
    })
    return
  }

  const admin = admins[0] as ProfileRow
  if (!isDefaultAdminCandidate(admin)) return

  const alreadyCorrect = await compare(desiredPassword, admin.password_hash)
  if (alreadyCorrect) {
    // Ensure email/phone are up to date
    await db.from('profiles').update({
      email: desiredEmail,
      phone: desiredPhone,
      updated_at: new Date().toISOString(),
    }).eq('id', admin.id)
    return
  }

  const legacyHash = await compare('admin1234', admin.password_hash)
  if (!legacyHash) return

  const nextHash = await hash(desiredPassword, 10)
  await db.from('profiles').update({
    email: desiredEmail,
    phone: desiredPhone,
    password_hash: nextHash,
    updated_at: new Date().toISOString(),
  }).eq('id', admin.id)
}

export async function getUserById(id: string) {
  const db = getDb()
  const { data } = await db.from('profiles').select('*').eq('id', id).maybeSingle()
  return mapUser(data as ProfileRow | null)
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
  return requireAnyRole(['admin'], '/settings')
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

  if (usePassword && !row.password_login_enabled && !isDefaultAdminCandidate(row)) {
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
