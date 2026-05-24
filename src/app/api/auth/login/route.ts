import { NextResponse } from 'next/server'
import { authenticateUser, createSession } from '@/lib/auth'
import { fieldErrors, loginSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Check your login details and try again.',
        errors: fieldErrors(parsed.error),
      },
      { status: 400 },
    )
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password)
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Invalid email or password.',
      },
      { status: 401 },
    )
  }

  await createSession(user)

  return NextResponse.json({
    ok: true,
    redirectTo: '/dashboard',
  })
}