import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'azim_session'

const sessionSecret = new TextEncoder().encode(
  process.env.AZIM_SESSION_SECRET ?? 'azim-local-dev-secret-change-me',
)

type SessionPayload = {
  sub: string
  email: string
  role: string
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(sessionSecret)
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, sessionSecret)
    if (!payload.sub || typeof payload.email !== 'string' || typeof payload.role !== 'string') {
      return null
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    }
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 14,
}