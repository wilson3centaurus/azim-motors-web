import { createClient, SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AzimClient = SupabaseClient<any, any, any>

const g = globalThis as { _azimDb?: AzimClient }

export function getDb(): AzimClient {
  if (!g._azimDb) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    g._azimDb = createClient<any, any, any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { schema: 'azim_motors' },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    )
  }
  return g._azimDb
}

export function timestamp(): string {
  return new Date().toISOString()
}

export async function seedSampleInventoryNow() {
  const db = getDb()
  const { data, error } = await db.rpc('seed_sample_inventory')
  if (error) throw new Error(error.message)
  return data as { inserted_parts: number }
}
