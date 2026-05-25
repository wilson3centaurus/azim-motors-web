/* eslint-disable @typescript-eslint/no-require-imports */
// Helper script: writes the new Supabase-based data.ts
// Run with: node scripts/write-data-ts.js
const fs = require('fs')
const path = require('path')

const content = `import { hash } from 'bcryptjs'
import { getDb, timestamp } from '@/lib/db'
import type { Customer, JobCard, JobCardPart, JobStatus, Part, PaymentMethod, PaymentStatus, RepairRecord, Sale, Supplier, UserProfile, UserRole, Vehicle } from '@/lib/supabase/types'
import { normalizePhone } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeText(value?: string | null) {
  if (!value) return null
  const next = value.trim()
  return next.length > 0 ? next : null
}

function createSyntheticEmail(phone: string | null | undefined, fullName: string) {
  const normalized = normalizePhone(phone)
  if (normalized) return \`\${normalized}@staff.azim.local\`
  const slug = fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')
  return \`\${slug || 'staff'}@staff.azim.local\`
}

function mapUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
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

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUserProfileById(id: string) {
  const db = getDb()
  const { data, error } = await db.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapUserProfile(data as ProfileRow) : null
}

export async function getUserAccountById(id: string) {
  const db = getDb()
  const { data } = await db.from('profiles').select('*').eq('id', id).maybeSingle()
  return data as ProfileRow | null
}

export async function getUserByEmail(email: string) {
  const db = getDb()
  const { data } = await db.from('profiles').select('*').ilike('email', email.trim()).maybeSingle()
  return data as ProfileRow | null
}

export async function getUserByPhone(phone: string) {
  const db = getDb()
  const normalized = normalizePhone(phone)
  const { data } = await db.from('profiles').select('*').eq('phone', phone).maybeSingle()
  if (data) return data as ProfileRow
  if (normalized && normalized !== phone) {
    const { data: d2 } = await db.from('profiles').select('*').eq('phone', normalized).maybeSingle()
    return d2 as ProfileRow | null
  }
  return null
}

export async function listMechanics() {
  const db = getDb()
  const { data, error } = await db.from('profiles').select('*').eq('role', 'mechanic').eq('is_active', true).order('full_name')
  if (error) throw new Error(error.message)
  return (data as ProfileRow[]).map(mapUserProfile)
}

export async function listUsers() {
  const db = getDb()
  const { data, error } = await db.from('profiles').select('*').order('full_name')
  if (error) throw new Error(error.message)
  return (data as ProfileRow[]).map(mapUserProfile)
}

export async function getSettingsData(userId: string) {
  const db = getDb()
  const { data } = await db.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (!data) return null
  const row = data as ProfileRow
  return { profile: mapUserProfile(row), email: row.email }
}

export async function createUserRecord(payload: {
  email?: string | null
  full_name: string
  role: UserRole
  phone?: string | null
  password: string
}) {
  const db = getDb()
  const passwordHash = await hash(payload.password, 10)
  const email = sanitizeText(payload.email)?.toLowerCase() ?? createSyntheticEmail(payload.phone, payload.full_name)
  const now = timestamp()
  const { data, error } = await db.from('profiles').insert({
    email,
    password_hash: passwordHash,
    full_name: payload.full_name.trim(),
    role: payload.role,
    phone: sanitizeText(payload.phone),
    is_active: true,
    password_login_enabled: true,
    created_at: now,
    updated_at: now,
  }).select('id').single()
  if (error) throw new Error(error.message)
  return { id: (data as { id: string }).id }
}

export async function updateUserProfile(payload: { id: string; full_name: string; phone?: string | null }) {
  const db = getDb()
  const { error } = await db.from('profiles').update({
    full_name: payload.full_name.trim(),
    phone: sanitizeText(payload.phone),
    updated_at: timestamp(),
  }).eq('id', payload.id)
  if (error) throw new Error(error.message)
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  const db = getDb()
  const { error } = await db.from('profiles').update({ password_hash: passwordHash, updated_at: timestamp() }).eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function resetPasswordForEmail(email: string, nextPassword: string) {
  const user = await getUserByEmail(email)
  if (!user) return false
  const db = getDb()
  const passwordHash = await hash(nextPassword, 10)
  const { error } = await db.from('profiles').update({
    password_hash: passwordHash,
    pin_hash: null,
    password_login_enabled: true,
    updated_at: timestamp(),
  }).eq('id', user.id)
  if (error) throw new Error(error.message)
  return true
}

export async function updateUserPin(userId: string, pinHash: string) {
  const db = getDb()
  const { error } = await db.from('profiles').update({
    pin_hash: pinHash,
    password_login_enabled: false,
    updated_at: timestamp(),
  }).eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function resetUserLoginAccess(userId: string, passwordHash: string) {
  const db = getDb()
  const { error } = await db.from('profiles').update({
    password_hash: passwordHash,
    pin_hash: null,
    password_login_enabled: true,
    updated_at: timestamp(),
  }).eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function deleteUserRecord(userId: string) {
  const db = getDb()
  const { error } = await db.from('profiles').delete().eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function updateUserRoleRecord(userId: string, role: UserRole) {
  const db = getDb()
  const { error } = await db.from('profiles').update({ role, updated_at: timestamp() }).eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function toggleUserActiveRecord(userId: string, isActive: boolean) {
  const db = getDb()
  const { error } = await db.from('profiles').update({ is_active: isActive, updated_at: timestamp() }).eq('id', userId)
  if (error) throw new Error(error.message)
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardData(userId: string) {
  const db = getDb()
  const today = new Date().toISOString().slice(0, 10)

  const [userRes, inProgressRes, pendingRes, partsRes, upcomingRes, overdueRes, recentRes] = await Promise.all([
    db.from('profiles').select('*').eq('id', userId).maybeSingle(),
    db.from('job_cards').select('*', { count: 'exact', head: true }).eq('status', 'In Progress'),
    db.from('job_cards').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    db.from('parts').select('quantity, reorder_level').eq('is_active', true),
    db.from('job_cards')
      .select('id, job_number, estimated_return, status, customer_id, vehicle_id')
      .not('status', 'in', '("Completed","Cancelled")')
      .not('estimated_return', 'is', null)
      .gte('estimated_return', today)
      .order('estimated_return')
      .limit(5),
    db.from('job_cards')
      .select('id, job_number, estimated_return, status, customer_id, vehicle_id')
      .not('status', 'in', '("Completed","Cancelled")')
      .not('estimated_return', 'is', null)
      .lt('estimated_return', today)
      .order('estimated_return'),
    db.from('job_cards')
      .select('id, job_number, status, complaint, created_at, customer_id, vehicle_id')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const allCards = [...(upcomingRes.data ?? []), ...(overdueRes.data ?? []), ...(recentRes.data ?? [])] as Array<{ customer_id: string; vehicle_id: string }>
  const customerIds = [...new Set(allCards.map(j => j.customer_id))]
  const vehicleIds = [...new Set(allCards.map(j => j.vehicle_id))]

  const [customersRes, vehiclesRes] = await Promise.all([
    customerIds.length > 0
      ? db.from('customers').select('id, full_name').in('id', customerIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
    vehicleIds.length > 0
      ? db.from('vehicles').select('id, registration, make, model').in('id', vehicleIds)
      : Promise.resolve({ data: [] as Array<{ id: string; registration: string; make: string; model: string }> }),
  ])

  const customerMap = new Map((customersRes.data ?? []).map((c: { id: string; full_name: string }) => [c.id, c]))
  const vehicleMap = new Map((vehiclesRes.data ?? []).map((v: { id: string; registration: string; make: string; model: string }) => [v.id, v]))
  const lowStockCount = (partsRes.data ?? []).filter((p: { quantity: number; reorder_level: number }) => p.quantity <= p.reorder_level).length

  return {
    profile: userRes.data ? mapUserProfile(userRes.data as ProfileRow) : null,
    stats: {
      carsInService: inProgressRes.count ?? 0,
      pendingJobs: pendingRes.count ?? 0,
      lowStockCount,
    },
    upcomingJobs: (upcomingRes.data ?? []).map((job: Record<string, unknown>) => ({
      ...job,
      customers: customerMap.get(job.customer_id as string) ?? { full_name: '' },
      vehicles: vehicleMap.get(job.vehicle_id as string) ?? { registration: '', make: '', model: '' },
    })),
    overdueJobs: (overdueRes.data ?? []).map((job: Record<string, unknown>) => ({
      ...job,
      customers: customerMap.get(job.customer_id as string) ?? { full_name: '' },
      vehicles: vehicleMap.get(job.vehicle_id as string) ?? { registration: '', make: '', model: '' },
    })),
    recentJobs: (recentRes.data ?? []).map((job: Record<string, unknown>) => ({
      ...job,
      customers: customerMap.get(job.customer_id as string) ?? { full_name: '' },
      vehicles: vehicleMap.get(job.vehicle_id as string) ?? { registration: '' },
    })),
  }
}

export async function getMechanicDashboardData(userId: string) {
  const db = getDb()
  const today = new Date().toISOString().slice(0, 10)

  const [userRes, activeRes, completedRes] = await Promise.all([
    db.from('profiles').select('*').eq('id', userId).maybeSingle(),
    db.from('job_cards')
      .select('id, job_number, status, complaint, updated_at, customer_id, vehicle_id')
      .eq('assigned_mechanic', userId)
      .in('status', ['Pending', 'In Progress'])
      .order('updated_at', { ascending: false }),
    db.from('job_cards')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_mechanic', userId)
      .eq('status', 'Completed')
      .gte('actual_return', today),
  ])

  const activeJobs = activeRes.data ?? []
  const customerIds = [...new Set(activeJobs.map((j: Record<string, unknown>) => j.customer_id as string))]
  const vehicleIds = [...new Set(activeJobs.map((j: Record<string, unknown>) => j.vehicle_id as string))]

  const [customersRes, vehiclesRes] = await Promise.all([
    customerIds.length > 0 ? db.from('customers').select('id, full_name').in('id', customerIds) : Promise.resolve({ data: [] }),
    vehicleIds.length > 0 ? db.from('vehicles').select('id, registration').in('id', vehicleIds) : Promise.resolve({ data: [] }),
  ])

  const customerMap = new Map((customersRes.data ?? []).map((c: Record<string, unknown>) => [c.id, c]))
  const vehicleMap = new Map((vehiclesRes.data ?? []).map((v: Record<string, unknown>) => [v.id, v]))

  return {
    profile: userRes.data ? mapUserProfile(userRes.data as ProfileRow) : null,
    activeJobs: activeJobs.map((job: Record<string, unknown>) => ({
      ...job,
      customers: customerMap.get(job.customer_id as string) ?? { full_name: '' },
      vehicles: vehicleMap.get(job.vehicle_id as string) ?? { registration: '' },
    })),
    completedToday: completedRes.count ?? 0,
  }
}

export async function getSalesDashboardData(userId?: string) {
  const db = getDb()
  const today = new Date().toISOString().slice(0, 10)
  let salesQuery = db.from('sales').select('total_amount').gte('created_at', \`\${today}T00:00:00\`)
  if (userId) salesQuery = salesQuery.eq('sold_by', userId)
  const sales = await salesQuery

  const allParts = await listParts()
  const recentSales = await listSales(userId, 5)

  return {
    salesToday: (sales.data ?? []).reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.total_amount ?? 0), 0),
    salesCount: (sales.data ?? []).length,
    lowStockCount: allParts.filter(p => p.quantity <= p.reorder_level).length,
    availableParts: allParts.filter(p => p.quantity > 0),
    recentSales,
  }
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function listCustomers(search?: string) {
  const db = getDb()
  let query = db.from('customers').select('*, vehicles(id)').order('full_name')
  if (search?.trim()) {
    const q = \`%\${search.trim()}%\`
    query = query.or(\`full_name.ilike.\${q},phone.ilike.\${q},email.ilike.\${q}\`)
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    vehicles: Array.isArray(row.vehicles) ? row.vehicles : [],
  })) as Array<Customer & { vehicles: Array<{ id: string }> }>
}

export async function getCustomerDetail(id: string) {
  const db = getDb()
  const [customerRes, vehiclesRes, jobsRes] = await Promise.all([
    db.from('customers').select('*').eq('id', id).maybeSingle(),
    db.from('vehicles').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
    db.from('job_cards').select('*, vehicles(registration)').eq('customer_id', id).order('created_at', { ascending: false }),
  ])
  return {
    customer: customerRes.data as Customer | null,
    vehicles: (vehiclesRes.data ?? []) as Vehicle[],
    jobs: (jobsRes.data ?? []).map((j: Record<string, unknown>) => ({
      ...j,
      vehicles: j.vehicles as { registration: string } ?? { registration: '' },
    })) as JobCard[],
  }
}

export async function createCustomerRecord(payload: {
  full_name: string
  phone: string
  email?: string | null
  address?: string | null
  id_number?: string | null
  notes?: string | null
}) {
  const db = getDb()
  const now = timestamp()
  const { data, error } = await db.from('customers').insert({
    full_name: payload.full_name.trim(),
    phone: payload.phone.trim(),
    email: sanitizeText(payload.email),
    address: sanitizeText(payload.address),
    id_number: sanitizeText(payload.id_number),
    notes: sanitizeText(payload.notes),
    created_at: now,
    updated_at: now,
  }).select('id').single()
  if (error) throw new Error(error.message)
  return { id: (data as { id: string }).id }
}

export async function listCustomersForSelection() {
  const db = getDb()
  const { data, error } = await db.from('customers').select('*').order('full_name')
  if (error) throw new Error(error.message)
  return (data ?? []) as Customer[]
}

// ── Vehicles ──────────────────────────────────────────────────────────────────

export async function listVehiclesForCustomer(customerId: string) {
  const db = getDb()
  const { data, error } = await db.from('vehicles').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Vehicle[]
}

export async function createVehicleRecord(payload: {
  customer_id: string
  registration?: string | null
  make: string
  model: string
  year?: number | null
  color?: string | null
}) {
  const db = getDb()
  const now = timestamp()
  const id = crypto.randomUUID()
  const registration = sanitizeText(payload.registration)?.toUpperCase() ?? \`UNREGISTERED-\${id.slice(0, 8).toUpperCase()}\`
  const { error } = await db.from('vehicles').insert({
    id,
    customer_id: payload.customer_id,
    registration,
    make: payload.make.trim(),
    model: payload.model.trim(),
    year: payload.year ?? null,
    color: sanitizeText(payload.color),
    created_at: now,
    updated_at: now,
  })
  if (error) throw new Error(error.message)
  return { id }
}

export async function getVehicleHistory(vehicleId: string) {
  const db = getDb()
  const [vehicleRes, recordsRes] = await Promise.all([
    db.from('vehicles').select('*, customers(full_name, phone)').eq('id', vehicleId).maybeSingle(),
    db.from('repair_records')
      .select('*, job_cards(job_number, complaint, job_card_parts(quantity_used, unit_cost, parts(name)))')
      .eq('vehicle_id', vehicleId)
      .order('completed_at', { ascending: false }),
  ])
  return {
    vehicle: vehicleRes.data as (Vehicle & { customers: Customer }) | null,
    records: (recordsRes.data ?? []) as RepairRecord[],
  }
}

// ── Suppliers ─────────────────────────────────────────────────────────────────

export async function listSuppliers() {
  const db = getDb()
  const { data, error } = await db.from('suppliers').select('*').order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as Supplier[]
}

export async function createSupplierRecord(payload: {
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}) {
  const db = getDb()
  const { data, error } = await db.from('suppliers').insert({
    name: payload.name.trim(),
    contact_name: sanitizeText(payload.contact_name),
    phone: sanitizeText(payload.phone),
    email: sanitizeText(payload.email),
    address: sanitizeText(payload.address),
    created_at: timestamp(),
  }).select('id').single()
  if (error) throw new Error(error.message)
  return { id: (data as { id: string }).id }
}

// ── Parts ─────────────────────────────────────────────────────────────────────

export async function listParts() {
  const db = getDb()
  const { data, error } = await db.from('parts').select('*, suppliers(name)').eq('is_active', true).order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as Part[]
}

export async function listPartsForSale(search?: string) {
  const parts = await listParts()
  const query = search?.trim().toLowerCase()
  return parts.filter(p => {
    if (p.quantity <= 0) return false
    if (!query) return true
    return p.name.toLowerCase().includes(query) || (p.part_number ?? '').toLowerCase().includes(query)
  })
}

export async function getPartDetail(id: string) {
  const db = getDb()
  const [partRes, movementsRes, suppliers] = await Promise.all([
    db.from('parts').select('*, suppliers(name)').eq('id', id).maybeSingle(),
    db.from('stock_movements')
      .select('id, movement_type, quantity, quantity_before, quantity_after, reason, created_at')
      .eq('part_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    listSuppliers(),
  ])
  return {
    part: partRes.data as Part | null,
    movements: (movementsRes.data ?? []) as Array<{
      id: string
      movement_type: 'IN' | 'OUT' | 'ADJUSTMENT'
      quantity: number
      quantity_before: number
      quantity_after: number
      reason: string | null
      created_at: string
    }>,
    suppliers,
  }
}

export async function createPartRecord(payload: {
  name: string
  part_number?: string | null
  description?: string | null
  quantity: number
  reorder_level: number
  unit_cost: number
  selling_price?: number | null
  supplier_id?: string | null
  location?: string | null
  actorId?: string | null
}) {
  const db = getDb()
  const now = timestamp()
  const id = crypto.randomUUID()
  const { error } = await db.from('parts').insert({
    id,
    part_number: sanitizeText(payload.part_number),
    name: payload.name.trim(),
    description: sanitizeText(payload.description),
    quantity: payload.quantity,
    reorder_level: payload.reorder_level,
    unit_cost: payload.unit_cost,
    selling_price: payload.selling_price ?? null,
    supplier_id: sanitizeText(payload.supplier_id),
    location: sanitizeText(payload.location),
    is_active: true,
    created_at: now,
    updated_at: now,
  })
  if (error) throw new Error(error.message)

  await db.from('stock_movements').insert({
    id: crypto.randomUUID(),
    part_id: id,
    movement_type: 'IN',
    quantity: payload.quantity,
    quantity_before: 0,
    quantity_after: payload.quantity,
    reason: 'Initial stock',
    performed_by: payload.actorId ?? null,
    created_at: now,
  })

  return { id }
}

export async function updatePartRecord(payload: {
  id: string
  name: string
  part_number?: string | null
  description?: string | null
  reorder_level: number
  unit_cost: number
  selling_price?: number | null
  supplier_id?: string | null
  location?: string | null
}) {
  const db = getDb()
  const { error } = await db.from('parts').update({
    name: payload.name.trim(),
    part_number: sanitizeText(payload.part_number),
    description: sanitizeText(payload.description),
    reorder_level: payload.reorder_level,
    unit_cost: payload.unit_cost,
    selling_price: payload.selling_price ?? null,
    supplier_id: sanitizeText(payload.supplier_id),
    location: sanitizeText(payload.location),
    updated_at: timestamp(),
  }).eq('id', payload.id)
  if (error) throw new Error(error.message)
}

export async function adjustPartStock(payload: { id: string; quantity: number; reason?: string | null; actorId?: string | null }) {
  const db = getDb()
  const { error } = await db.rpc('adjust_part_stock', {
    p_part_id: payload.id,
    p_quantity: payload.quantity,
    p_reason: sanitizeText(payload.reason),
    p_actor_id: payload.actorId ?? null,
  })
  if (error) throw new Error(error.message)
}

// ── Job Cards ─────────────────────────────────────────────────────────────────

export async function listJobCards(filters: { status?: string; q?: string }) {
  const db = getDb()
  let query = db.from('job_cards')
    .select('*, customers(full_name, phone), vehicles(registration, make, model), mechanic:profiles!job_cards_assigned_mechanic_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.q?.trim()) {
    const q = \`%\${filters.q.trim()}%\`
    query = query.or(\`job_number.ilike.\${q},complaint.ilike.\${q}\`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as JobCard[]
}

export async function getJobCardDetail(id: string) {
  const db = getDb()
  const [jobRes, mechanics] = await Promise.all([
    db.from('job_cards')
      .select(\`
        *,
        customers(full_name, phone, email, address),
        vehicles(registration, make, model, year, color),
        mechanic:profiles!job_cards_assigned_mechanic_fkey(id, full_name, phone, role, avatar_url, is_active, created_at, updated_at),
        creator:profiles!job_cards_created_by_fkey(full_name),
        job_card_parts(*, parts(id, name, part_number))
      \`)
      .eq('id', id)
      .maybeSingle(),
    listMechanics(),
  ])

  if (!jobRes.data) return { job: null, mechanics, jobCardParts: [] as JobCardPart[] }

  const job = jobRes.data as JobCard
  const jobCardParts = (Array.isArray((job as Record<string, unknown>).job_card_parts)
    ? (job as Record<string, unknown>).job_card_parts
    : []) as JobCardPart[]

  return { job, mechanics, jobCardParts }
}

export async function getJobCardPrintData(id: string) {
  return getJobCardDetail(id)
}

export async function createJobCardRecord(payload: {
  customer_id: string
  vehicle_id: string
  service_type: string
  complaint: string
  assigned_mechanic?: string | null
  estimated_return?: string | null
  quoted_amount: number
  notes?: string | null
  created_by?: string | null
}) {
  const db = getDb()
  const { data: jobNumberData, error: seqError } = await db.rpc('next_job_number')
  if (seqError) throw new Error(seqError.message)
  const jobNumber = jobNumberData as string

  const now = timestamp()
  const id = crypto.randomUUID()
  const { error } = await db.from('job_cards').insert({
    id,
    job_number: jobNumber,
    vehicle_id: payload.vehicle_id,
    customer_id: payload.customer_id,
    assigned_mechanic: sanitizeText(payload.assigned_mechanic),
    created_by: payload.created_by ?? null,
    status: 'Pending',
    service_type: payload.service_type.trim(),
    complaint: payload.complaint.trim(),
    date_received: new Date().toISOString().slice(0, 10),
    estimated_return: sanitizeText(payload.estimated_return),
    labour_cost: 0,
    quoted_amount: payload.quoted_amount,
    total_parts_cost: 0,
    payment_status: 'Unpaid',
    customer_notification_sent: false,
    notes: sanitizeText(payload.notes),
    created_at: now,
    updated_at: now,
  })
  if (error) throw new Error(error.message)
  return { id }
}

export async function updateJobCardRecord(payload: {
  id: string
  status: JobStatus
  service_type?: string | null
  assigned_mechanic?: string | null
  diagnosis?: string | null
  work_done?: string | null
  labour_cost: number
  quoted_amount: number
  payment_status: PaymentStatus
  estimated_return?: string | null
  notes?: string | null
}) {
  const db = getDb()

  const { data: prev } = await db.from('job_cards').select('status, actual_return').eq('id', payload.id).maybeSingle()
  const wasCompleted = (prev as Record<string, unknown> | null)?.status === 'Completed'
  const prevActualReturn = (prev as Record<string, unknown> | null)?.actual_return as string | null

  let actualReturn: string | null = null
  if (payload.status === 'Completed') actualReturn = prevActualReturn ?? new Date().toISOString().slice(0, 10)
  else if (payload.status === 'Cancelled') actualReturn = prevActualReturn ?? null

  const { error } = await db.from('job_cards').update({
    status: payload.status,
    service_type: sanitizeText(payload.service_type),
    assigned_mechanic: sanitizeText(payload.assigned_mechanic),
    diagnosis: sanitizeText(payload.diagnosis),
    work_done: sanitizeText(payload.work_done),
    labour_cost: payload.labour_cost,
    quoted_amount: payload.quoted_amount,
    payment_status: payload.payment_status,
    estimated_return: sanitizeText(payload.estimated_return),
    notes: sanitizeText(payload.notes),
    actual_return: actualReturn,
    updated_at: timestamp(),
  }).eq('id', payload.id)
  if (error) throw new Error(error.message)

  if (!wasCompleted && payload.status === 'Completed') {
    await db.rpc('ensure_repair_record', { p_job_id: payload.id })
  }
}

export async function markJobCardNotificationSent(jobId: string) {
  const db = getDb()
  const { error } = await db.from('job_cards').update({ customer_notification_sent: true, updated_at: timestamp() }).eq('id', jobId)
  if (error) throw new Error(error.message)
}

export async function deleteJobCardRecord(jobId: string, actorId?: string | null) {
  const db = getDb()
  const { error } = await db.rpc('delete_job_card', {
    p_job_id: jobId,
    p_actor_id: actorId ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function addJobCardPart(payload: {
  job_card_id: string
  part_id: string
  quantity_used: number
  actorId?: string | null
}) {
  const db = getDb()
  const { error } = await db.rpc('add_job_card_part', {
    p_job_card_id: payload.job_card_id,
    p_part_id: payload.part_id,
    p_quantity: payload.quantity_used,
    p_actor_id: payload.actorId ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function removeJobCardPart(lineId: string, actorId?: string | null) {
  const db = getDb()
  const { error } = await db.rpc('remove_job_card_part', {
    p_line_id: lineId,
    p_actor_id: actorId ?? null,
  })
  if (error) throw new Error(error.message)
}

// ── Repair Records ────────────────────────────────────────────────────────────

export async function listRepairRecords(search?: string) {
  const db = getDb()
  const { data, error } = await db.from('repair_records')
    .select('*, vehicles(registration, make, model), customers(full_name, phone), job_cards(job_number)')
    .order('completed_at', { ascending: false })
  if (error) throw new Error(error.message)

  const query = search?.trim().toLowerCase()
  const rows = (data ?? []) as RepairRecord[]
  if (!query) return rows

  return rows.filter(r => {
    const v = (r as Record<string, unknown>).vehicles as { registration: string } | undefined
    const c = (r as Record<string, unknown>).customers as { full_name: string } | undefined
    const j = (r as Record<string, unknown>).job_cards as { job_number: string } | undefined
    return (
      v?.registration.toLowerCase().includes(query)
      || c?.full_name.toLowerCase().includes(query)
      || j?.job_number.toLowerCase().includes(query)
    )
  })
}

// ── Return Dates ──────────────────────────────────────────────────────────────

export async function getReturnDatesData() {
  const db = getDb()
  const { data, error } = await db.from('job_cards')
    .select('*, customers(full_name), vehicles(registration, make, model)')
    .not('status', 'in', '("Completed","Cancelled")')
    .not('estimated_return', 'is', null)
    .order('estimated_return')
  if (error) throw new Error(error.message)
  return (data ?? []) as JobCard[]
}

// ── Sales ─────────────────────────────────────────────────────────────────────

export async function listSales(userId?: string, limit?: number) {
  const db = getDb()
  let query = db.from('sales')
    .select('*, seller:profiles(full_name)')
    .order('created_at', { ascending: false })
  if (userId) query = query.eq('sold_by', userId)
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Sale[]
}

export async function createSaleRecord(payload: {
  customer_name?: string | null
  customer_phone?: string | null
  payment_method: PaymentMethod
  notes?: string | null
  sold_by?: string | null
  discount_amount?: number
  items: Array<{ part_id: string; quantity: number }>
}) {
  const db = getDb()
  const { data, error } = await db.rpc('create_sale', {
    p_customer_name: sanitizeText(payload.customer_name),
    p_customer_phone: sanitizeText(payload.customer_phone),
    p_payment_method: payload.payment_method,
    p_notes: sanitizeText(payload.notes),
    p_sold_by: payload.sold_by ?? null,
    p_discount_amount: payload.discount_amount ?? 0,
    p_items: payload.items,
  })
  if (error) throw new Error(error.message)
  const result = data as { id: string; sale_number: string; total_amount: number }
  return { id: result.id, sale_number: result.sale_number, total_amount: result.total_amount }
}

// ── Exports ───────────────────────────────────────────────────────────────────

export async function getJobExportData(filters: { from?: string | null; to?: string | null }) {
  const db = getDb()
  let query = db.from('repair_records')
    .select(\`
      *,
      vehicles(registration, make, model),
      customers(full_name, phone),
      job_cards(job_number, complaint, total_parts_cost)
    \`)
    .order('completed_at', { ascending: false })
  if (filters.from) query = query.gte('completed_at', filters.from)
  if (filters.to) query = query.lte('completed_at', \`\${filters.to}T23:59:59.999Z\`)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as RepairRecord[]
}

export async function getStockExportData() {
  return listParts()
}
`

const dest = path.join(__dirname, '..', 'src', 'lib', 'data.ts')
fs.writeFileSync(dest, content, 'utf8')
console.log('Wrote', dest, '—', content.split('\n').length, 'lines')
