import { compare } from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { queryOne } from '@/lib/db'
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifySessionToken } from '@/lib/session'
import type { UserRole } from '@/lib/supabase/types'

type UserRow = {
  id: string
  email: string
  password_hash: string
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
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
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
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/settings')
  return user
}

export async function authenticateUser(email: string, password: string) {
  const row = await queryOne<UserRow>('SELECT * FROM users WHERE lower(email) = lower(?)', [email.trim()])
  if (!row || !row.is_active) return null

  const matches = await compare(password, row.password_hash)
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