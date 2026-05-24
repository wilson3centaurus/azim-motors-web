import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use the local user management flow in Settings.' },
    { status: 410 },
  )
}