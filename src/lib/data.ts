import { hash } from 'bcryptjs'
import type { Database } from 'sql.js'
import { queryAll, queryOne, runInTransaction, selectOneInTransaction, timestamp, writeTransaction } from '@/lib/db'
import type { Customer, JobCard, JobCardPart, JobStatus, Part, RepairRecord, Supplier, UserProfile, UserRole, Vehicle } from '@/lib/supabase/types'

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

type CustomerRow = Customer
type VehicleRow = Omit<Vehicle, 'customers'>
type SupplierRow = Supplier
type PartRow = Omit<Part, 'suppliers' | 'is_active'> & { is_active: number }
type JobCardRow = Omit<JobCard, 'vehicles' | 'customers' | 'mechanic'>
type JobCardPartRow = Omit<JobCardPart, 'parts'>
type RepairRecordRow = Omit<RepairRecord, 'vehicles' | 'customers' | 'job_cards'>

function asNullableNumber(value: unknown) {
  return value === null || value === undefined || value === '' ? null : Number(value)
}

function boolInt(value: boolean) {
  return value ? 1 : 0
}

function likeQuery(value?: string) {
  if (!value) return null
  return `%${value.trim().toLowerCase()}%`
}

function mapUserProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    full_name: row.full_name,
    role: row.role,
    phone: row.phone,
    avatar_url: row.avatar_url,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapCustomer(row: CustomerRow): Customer {
  return row
}

function mapVehicle(row: VehicleRow): Vehicle {
  return row
}

function mapSupplier(row: SupplierRow): Supplier {
  return row
}

function mapPart(row: PartRow): Part {
  return {
    id: row.id,
    part_number: row.part_number,
    name: row.name,
    description: row.description,
    quantity: row.quantity,
    reorder_level: row.reorder_level,
    unit_cost: row.unit_cost,
    selling_price: row.selling_price,
    supplier_id: row.supplier_id,
    location: row.location,
    rfid_tag: row.rfid_tag,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapJobCard(row: JobCardRow): JobCard {
  return row
}

function mapJobCardPart(row: JobCardPartRow): JobCardPart {
  return row
}

function mapRepairRecord(row: RepairRecordRow): RepairRecord {
  return row
}

function currentDate() {
  return new Date().toISOString().slice(0, 10)
}

function sanitizeText(value?: string | null) {
  if (!value) return null
  const next = value.trim()
  return next.length > 0 ? next : null
}

function nextJobNumber(db: Database) {
  const year = new Date().getFullYear()
  const existing = selectOneInTransaction<{ year: number; value: number }>(db, 'SELECT year, value FROM job_number_sequences WHERE year = ?', [year])

  if (!existing) {
    runInTransaction(db, 'INSERT INTO job_number_sequences (year, value) VALUES (?, 0)', [year])
  }

  runInTransaction(db, 'UPDATE job_number_sequences SET value = value + 1 WHERE year = ?', [year])
  const updated = selectOneInTransaction<{ value: number }>(db, 'SELECT value FROM job_number_sequences WHERE year = ?', [year])
  const value = String(updated?.value ?? 1).padStart(4, '0')
  return `JC-${year}-${value}`
}

function recalculateJobPartsCost(db: Database, jobId: string) {
  const totalRow = selectOneInTransaction<{ total: number }>(
    db,
    'SELECT COALESCE(SUM(quantity_used * unit_cost), 0) AS total FROM job_card_parts WHERE job_card_id = ?',
    [jobId],
  )
  runInTransaction(db, 'UPDATE job_cards SET total_parts_cost = ?, updated_at = ? WHERE id = ?', [Number(totalRow?.total ?? 0), timestamp(), jobId])
}

function ensureRepairRecord(db: Database, jobId: string) {
  const job = selectOneInTransaction<{
    id: string
    status: JobStatus
    vehicle_id: string
    customer_id: string
    diagnosis: string | null
    work_done: string | null
    labour_cost: number | null
    total_parts_cost: number | null
    assigned_mechanic: string | null
    created_at: string
  }>(
    db,
    'SELECT id, status, vehicle_id, customer_id, diagnosis, work_done, labour_cost, total_parts_cost, assigned_mechanic, created_at FROM job_cards WHERE id = ?',
    [jobId],
  )

  if (!job || job.status !== 'Completed') return

  const existing = selectOneInTransaction<{ id: string }>(db, 'SELECT id FROM repair_records WHERE job_card_id = ?', [jobId])
  if (existing) return

  const mechanic = job.assigned_mechanic
    ? selectOneInTransaction<{ full_name: string }>(db, 'SELECT full_name FROM users WHERE id = ?', [job.assigned_mechanic])
    : null

  const now = timestamp()
  runInTransaction(
    db,
    `INSERT INTO repair_records (id, job_card_id, vehicle_id, customer_id, completed_at, diagnosis, work_done, labour_cost, total_cost, mileage_out, technician_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    [
      crypto.randomUUID(),
      job.id,
      job.vehicle_id,
      job.customer_id,
      now,
      job.diagnosis,
      job.work_done,
      asNullableNumber(job.labour_cost),
      Number(job.labour_cost ?? 0) + Number(job.total_parts_cost ?? 0),
      mechanic?.full_name ?? null,
      now,
    ],
  )
}

export async function getUserProfileById(id: string) {
  const row = await queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [id])
  return row ? mapUserProfile(row) : null
}

export async function getUserAccountById(id: string) {
  return queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [id])
}

export async function getUserByEmail(email: string) {
  return queryOne<UserRow>('SELECT * FROM users WHERE lower(email) = lower(?)', [email.trim()])
}

export async function listMechanics() {
  const rows = await queryAll<UserRow>("SELECT * FROM users WHERE role = 'mechanic' AND is_active = 1 ORDER BY full_name")
  return rows.map(mapUserProfile)
}

export async function getDashboardData(userId: string) {
  const [user, inProgress, pending, lowStock, upcoming, overdue, recent] = await Promise.all([
    queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [userId]),
    queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM job_cards WHERE status = 'In Progress'"),
    queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM job_cards WHERE status = 'Pending'"),
    queryOne<{ count: number }>('SELECT COUNT(*) AS count FROM parts WHERE is_active = 1 AND quantity <= reorder_level'),
    queryAll<{
      id: string
      job_number: string
      estimated_return: string
      status: JobStatus
      registration: string
      make: string
      model: string
      full_name: string
    }>(
      `SELECT job_cards.id, job_cards.job_number, job_cards.estimated_return, job_cards.status,
              vehicles.registration, vehicles.make, vehicles.model, customers.full_name
       FROM job_cards
       JOIN vehicles ON vehicles.id = job_cards.vehicle_id
       JOIN customers ON customers.id = job_cards.customer_id
       WHERE job_cards.status NOT IN ('Completed', 'Cancelled')
         AND job_cards.estimated_return IS NOT NULL
         AND job_cards.estimated_return >= ?
       ORDER BY job_cards.estimated_return ASC
       LIMIT 5`,
      [currentDate()],
    ),
    queryAll<{
      id: string
      job_number: string
      estimated_return: string
      status: JobStatus
      registration: string
      make: string
      model: string
      full_name: string
    }>(
      `SELECT job_cards.id, job_cards.job_number, job_cards.estimated_return, job_cards.status,
              vehicles.registration, vehicles.make, vehicles.model, customers.full_name
       FROM job_cards
       JOIN vehicles ON vehicles.id = job_cards.vehicle_id
       JOIN customers ON customers.id = job_cards.customer_id
       WHERE job_cards.status NOT IN ('Completed', 'Cancelled')
         AND job_cards.estimated_return IS NOT NULL
         AND job_cards.estimated_return < ?
       ORDER BY job_cards.estimated_return ASC`,
      [currentDate()],
    ),
    queryAll<{
      id: string
      job_number: string
      status: JobStatus
      complaint: string
      created_at: string
      full_name: string
      registration: string
    }>(
      `SELECT job_cards.id, job_cards.job_number, job_cards.status, job_cards.complaint, job_cards.created_at,
              customers.full_name, vehicles.registration
       FROM job_cards
       JOIN customers ON customers.id = job_cards.customer_id
       JOIN vehicles ON vehicles.id = job_cards.vehicle_id
       ORDER BY job_cards.created_at DESC
       LIMIT 6`,
    ),
  ])

  return {
    profile: user ? mapUserProfile(user) : null,
    stats: {
      carsInService: Number(inProgress?.count ?? 0),
      pendingJobs: Number(pending?.count ?? 0),
      lowStockCount: Number(lowStock?.count ?? 0),
    },
    upcomingJobs: upcoming.map(job => ({
      id: job.id,
      job_number: job.job_number,
      estimated_return: job.estimated_return,
      status: job.status,
      vehicles: { registration: job.registration, make: job.make, model: job.model },
      customers: { full_name: job.full_name },
    })),
    overdueJobs: overdue.map(job => ({
      id: job.id,
      job_number: job.job_number,
      estimated_return: job.estimated_return,
      status: job.status,
      vehicles: { registration: job.registration, make: job.make, model: job.model },
      customers: { full_name: job.full_name },
    })),
    recentJobs: recent.map(job => ({
      id: job.id,
      job_number: job.job_number,
      status: job.status,
      complaint: job.complaint,
      created_at: job.created_at,
      customers: { full_name: job.full_name },
      vehicles: { registration: job.registration },
    })),
  }
}

export async function listCustomers(search?: string) {
  const term = likeQuery(search)
  const rows = await queryAll<
    CustomerRow & { vehicle_count: number }
  >(
    `SELECT customers.*, COUNT(vehicles.id) AS vehicle_count
     FROM customers
     LEFT JOIN vehicles ON vehicles.customer_id = customers.id
     WHERE (? IS NULL OR lower(customers.full_name) LIKE ? OR lower(customers.phone) LIKE ? OR lower(COALESCE(customers.email, '')) LIKE ?)
     GROUP BY customers.id
     ORDER BY customers.full_name ASC`,
    [term, term, term, term],
  )

  return rows.map(row => ({
    ...mapCustomer(row),
    vehicles: Array.from({ length: Number(row.vehicle_count ?? 0) }, (_, index) => ({ id: `${row.id}-${index}` })),
  }))
}

export async function getCustomerDetail(id: string) {
  const [customer, vehicles, jobs] = await Promise.all([
    queryOne<CustomerRow>('SELECT * FROM customers WHERE id = ?', [id]),
    queryAll<VehicleRow>('SELECT * FROM vehicles WHERE customer_id = ? ORDER BY created_at DESC', [id]),
    queryAll<
      JobCardRow & { registration: string | null }
    >(
      `SELECT job_cards.*, vehicles.registration
       FROM job_cards
       JOIN vehicles ON vehicles.id = job_cards.vehicle_id
       WHERE job_cards.customer_id = ?
       ORDER BY job_cards.created_at DESC`,
      [id],
    ),
  ])

  return {
    customer: customer ? mapCustomer(customer) : null,
    vehicles: vehicles.map(mapVehicle),
    jobs: jobs.map(job => ({ ...mapJobCard(job), vehicles: { registration: job.registration ?? '' } as Vehicle })),
  }
}

export async function listSuppliers() {
  const rows = await queryAll<SupplierRow>('SELECT * FROM suppliers ORDER BY name ASC')
  return rows.map(mapSupplier)
}

export async function listParts() {
  const rows = await queryAll<PartRow & { supplier_name: string | null }>(
    `SELECT parts.*, suppliers.name AS supplier_name
     FROM parts
     LEFT JOIN suppliers ON suppliers.id = parts.supplier_id
     WHERE parts.is_active = 1
     ORDER BY parts.name ASC`,
  )

  return rows.map(row => ({ ...mapPart(row), suppliers: row.supplier_name ? { name: row.supplier_name } as Supplier : undefined }))
}

export async function getPartDetail(id: string) {
  const [part, movements, suppliers] = await Promise.all([
    queryOne<PartRow & { supplier_name: string | null }>(
      `SELECT parts.*, suppliers.name AS supplier_name
       FROM parts
       LEFT JOIN suppliers ON suppliers.id = parts.supplier_id
       WHERE parts.id = ?`,
      [id],
    ),
    queryAll<{
      id: string
      movement_type: 'IN' | 'OUT' | 'ADJUSTMENT'
      quantity: number
      quantity_before: number
      quantity_after: number
      reason: string | null
      created_at: string
    }>('SELECT * FROM stock_movements WHERE part_id = ? ORDER BY created_at DESC LIMIT 20', [id]),
    listSuppliers(),
  ])

  return {
    part: part ? { ...mapPart(part), suppliers: part.supplier_name ? { name: part.supplier_name } as Supplier : undefined } : null,
    movements,
    suppliers,
  }
}

export async function listJobCards(filters: { status?: string; q?: string }) {
  const q = likeQuery(filters.q)
  const rows = await queryAll<
    JobCardRow & {
      customer_name: string
      customer_phone: string
      registration: string
      make: string
      model: string
      mechanic_name: string | null
    }
  >(
    `SELECT job_cards.*, customers.full_name AS customer_name, customers.phone AS customer_phone,
            vehicles.registration, vehicles.make, vehicles.model,
            mechanics.full_name AS mechanic_name
     FROM job_cards
     JOIN customers ON customers.id = job_cards.customer_id
     JOIN vehicles ON vehicles.id = job_cards.vehicle_id
     LEFT JOIN users mechanics ON mechanics.id = job_cards.assigned_mechanic
     WHERE (? IS NULL OR job_cards.status = ?)
       AND (? IS NULL OR lower(job_cards.job_number) LIKE ? OR lower(job_cards.complaint) LIKE ?)
     ORDER BY job_cards.created_at DESC`,
    [filters.status && filters.status !== 'all' ? filters.status : null, filters.status && filters.status !== 'all' ? filters.status : null, q, q, q],
  )

  return rows.map(job => ({
    ...mapJobCard(job),
    customers: { full_name: job.customer_name, phone: job.customer_phone } as Customer,
    vehicles: { registration: job.registration, make: job.make, model: job.model } as Vehicle,
    mechanic: job.mechanic_name ? ({ full_name: job.mechanic_name } as UserProfile) : undefined,
  }))
}

export async function getJobCardDetail(id: string) {
  const [job, mechanics, parts] = await Promise.all([
    queryOne<
      JobCardRow & {
        customer_name: string
        customer_phone: string
        customer_email: string | null
        customer_address: string | null
        registration: string
        make: string
        model: string
        year: number | null
        color: string | null
        mechanic_name: string | null
        mechanic_phone: string | null
        creator_name: string | null
      }
    >(
      `SELECT job_cards.*, customers.full_name AS customer_name, customers.phone AS customer_phone, customers.email AS customer_email, customers.address AS customer_address,
              vehicles.registration, vehicles.make, vehicles.model, vehicles.year, vehicles.color,
              mechanics.full_name AS mechanic_name, mechanics.phone AS mechanic_phone,
              creators.full_name AS creator_name
       FROM job_cards
       JOIN customers ON customers.id = job_cards.customer_id
       JOIN vehicles ON vehicles.id = job_cards.vehicle_id
       LEFT JOIN users mechanics ON mechanics.id = job_cards.assigned_mechanic
       LEFT JOIN users creators ON creators.id = job_cards.created_by
       WHERE job_cards.id = ?`,
      [id],
    ),
    listMechanics(),
    queryAll<JobCardPartRow & { part_name: string | null; part_number: string | null }>(
      `SELECT job_card_parts.*, parts.name AS part_name, parts.part_number AS part_number
       FROM job_card_parts
       JOIN parts ON parts.id = job_card_parts.part_id
       WHERE job_card_parts.job_card_id = ?
       ORDER BY job_card_parts.created_at ASC`,
      [id],
    ),
  ])

  if (!job) {
    return { job: null, mechanics, jobCardParts: [] as Array<JobCardPart & { parts?: Part }> }
  }

  return {
    job: {
      ...mapJobCard(job),
      customers: { full_name: job.customer_name, phone: job.customer_phone, email: job.customer_email, address: job.customer_address } as Customer,
      vehicles: { registration: job.registration, make: job.make, model: job.model, year: job.year, color: job.color } as Vehicle,
      mechanic: job.mechanic_name ? ({ id: job.assigned_mechanic ?? '', full_name: job.mechanic_name, phone: job.mechanic_phone, role: 'mechanic', avatar_url: null, is_active: true, created_at: '', updated_at: '' } as UserProfile) : undefined,
      creator: job.creator_name ? { full_name: job.creator_name } : undefined,
      job_card_parts: parts.map(part => ({
        ...mapJobCardPart(part),
        parts: { name: part.part_name ?? '', part_number: part.part_number ?? null } as Part,
      })),
    },
    mechanics,
    jobCardParts: parts.map(part => ({
      ...mapJobCardPart(part),
      parts: { name: part.part_name ?? '', part_number: part.part_number ?? null } as Part,
    })),
  }
}

export async function getJobCardPrintData(id: string) {
  return getJobCardDetail(id)
}

export async function listRepairRecords(search?: string) {
  const rows = await queryAll<
    RepairRecordRow & {
      registration: string
      make: string
      model: string
      customer_name: string
      customer_phone: string
      job_number: string
    }
  >(
    `SELECT repair_records.*, vehicles.registration, vehicles.make, vehicles.model,
            customers.full_name AS customer_name, customers.phone AS customer_phone,
            job_cards.job_number
     FROM repair_records
     JOIN vehicles ON vehicles.id = repair_records.vehicle_id
     JOIN customers ON customers.id = repair_records.customer_id
     JOIN job_cards ON job_cards.id = repair_records.job_card_id
     ORDER BY repair_records.completed_at DESC`,
  )

  const query = search?.trim().toLowerCase()
  const filtered = !query ? rows : rows.filter(record =>
    record.registration.toLowerCase().includes(query)
    || record.customer_name.toLowerCase().includes(query)
    || record.job_number.toLowerCase().includes(query),
  )

  return filtered.map(record => ({
    ...mapRepairRecord(record),
    vehicles: { registration: record.registration, make: record.make, model: record.model } as Vehicle,
    customers: { full_name: record.customer_name, phone: record.customer_phone } as Customer,
    job_cards: { job_number: record.job_number } as JobCard,
  }))
}

export async function getVehicleHistory(vehicleId: string) {
  const [vehicle, records] = await Promise.all([
    queryOne<VehicleRow & { customer_name: string; customer_phone: string }>(
      `SELECT vehicles.*, customers.full_name AS customer_name, customers.phone AS customer_phone
       FROM vehicles
       JOIN customers ON customers.id = vehicles.customer_id
       WHERE vehicles.id = ?`,
      [vehicleId],
    ),
    queryAll<RepairRecordRow & { job_number: string; complaint: string | null }>(
      `SELECT repair_records.*, job_cards.job_number, job_cards.complaint
       FROM repair_records
       JOIN job_cards ON job_cards.id = repair_records.job_card_id
       WHERE repair_records.vehicle_id = ?
       ORDER BY repair_records.completed_at DESC`,
      [vehicleId],
    ),
  ])

  const partsByJobCard = new Map<string, Array<{ quantity_used: number; unit_cost: number; parts: { name: string } }>>()
  if (records.length > 0) {
    const partRows = await queryAll<{ job_card_id: string; quantity_used: number; unit_cost: number; part_name: string }>(
      `SELECT job_card_parts.job_card_id, job_card_parts.quantity_used, job_card_parts.unit_cost, parts.name AS part_name
       FROM job_card_parts
       JOIN parts ON parts.id = job_card_parts.part_id
       WHERE job_card_parts.job_card_id IN (${records.map(() => '?').join(',')})`,
      records.map(record => record.job_card_id),
    )

    for (const row of partRows) {
      const current = partsByJobCard.get(row.job_card_id) ?? []
      current.push({ quantity_used: Number(row.quantity_used), unit_cost: Number(row.unit_cost), parts: { name: row.part_name } })
      partsByJobCard.set(row.job_card_id, current)
    }
  }

  return {
    vehicle: vehicle ? ({ ...mapVehicle(vehicle), customers: { full_name: vehicle.customer_name, phone: vehicle.customer_phone } as Customer }) : null,
    records: records.map(record => ({
      ...mapRepairRecord(record),
      job_cards: {
        job_number: record.job_number,
        complaint: record.complaint,
        job_card_parts: partsByJobCard.get(record.job_card_id) ?? [],
      } as JobCard,
    })),
  }
}

export async function getReturnDatesData() {
  const rows = await queryAll<
    JobCardRow & { customer_name: string; registration: string; make: string; model: string }
  >(
    `SELECT job_cards.*, customers.full_name AS customer_name, vehicles.registration, vehicles.make, vehicles.model
     FROM job_cards
     JOIN customers ON customers.id = job_cards.customer_id
     JOIN vehicles ON vehicles.id = job_cards.vehicle_id
     WHERE job_cards.status NOT IN ('Completed', 'Cancelled')
       AND job_cards.estimated_return IS NOT NULL
     ORDER BY job_cards.estimated_return ASC`,
  )

  return rows.map(job => ({
    ...mapJobCard(job),
    customers: { full_name: job.customer_name } as Customer,
    vehicles: { registration: job.registration, make: job.make, model: job.model } as Vehicle,
  }))
}

export async function getSettingsData(userId: string) {
  const row = await queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [userId])
  return row ? { profile: mapUserProfile(row), email: row.email } : null
}

export async function listUsers() {
  const rows = await queryAll<UserRow>('SELECT * FROM users ORDER BY full_name ASC')
  return rows.map(mapUserProfile)
}

export async function createCustomerRecord(payload: {
  full_name: string
  phone: string
  email?: string | null
  address?: string | null
  id_number?: string | null
  notes?: string | null
}) {
  return writeTransaction(db => {
    const now = timestamp()
    const id = crypto.randomUUID()
    runInTransaction(
      db,
      `INSERT INTO customers (id, full_name, phone, email, address, id_number, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, payload.full_name.trim(), payload.phone.trim(), sanitizeText(payload.email), sanitizeText(payload.address), sanitizeText(payload.id_number), sanitizeText(payload.notes), now, now],
    )
    return { id }
  })
}

export async function createSupplierRecord(payload: {
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}) {
  return writeTransaction(db => {
    const id = crypto.randomUUID()
    runInTransaction(
      db,
      `INSERT INTO suppliers (id, name, contact_name, phone, email, address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, payload.name.trim(), sanitizeText(payload.contact_name), sanitizeText(payload.phone), sanitizeText(payload.email), sanitizeText(payload.address), timestamp()],
    )
    return { id }
  })
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
  return writeTransaction(db => {
    const now = timestamp()
    const id = crypto.randomUUID()
    runInTransaction(
      db,
      `INSERT INTO parts (id, part_number, name, description, quantity, reorder_level, unit_cost, selling_price, supplier_id, location, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        sanitizeText(payload.part_number),
        payload.name.trim(),
        sanitizeText(payload.description),
        payload.quantity,
        payload.reorder_level,
        payload.unit_cost,
        payload.selling_price ?? null,
        sanitizeText(payload.supplier_id),
        sanitizeText(payload.location),
        now,
        now,
      ],
    )

    runInTransaction(
      db,
      `INSERT INTO stock_movements (id, part_id, job_card_id, movement_type, quantity, quantity_before, quantity_after, reason, performed_by, created_at)
       VALUES (?, ?, NULL, 'IN', ?, 0, ?, 'Initial stock', ?, ?)`,
      [crypto.randomUUID(), id, payload.quantity, payload.quantity, payload.actorId ?? null, now],
    )

    return { id }
  })
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
  return writeTransaction(db => {
    runInTransaction(
      db,
      `UPDATE parts
       SET name = ?, part_number = ?, description = ?, reorder_level = ?, unit_cost = ?, selling_price = ?, supplier_id = ?, location = ?, updated_at = ?
       WHERE id = ?`,
      [
        payload.name.trim(),
        sanitizeText(payload.part_number),
        sanitizeText(payload.description),
        payload.reorder_level,
        payload.unit_cost,
        payload.selling_price ?? null,
        sanitizeText(payload.supplier_id),
        sanitizeText(payload.location),
        timestamp(),
        payload.id,
      ],
    )
  })
}

export async function adjustPartStock(payload: {
  id: string
  quantity: number
  reason?: string | null
  actorId?: string | null
}) {
  return writeTransaction(db => {
    const part = selectOneInTransaction<{ quantity: number }>(db, 'SELECT quantity FROM parts WHERE id = ?', [payload.id])
    if (!part) throw new Error('Part not found.')
    const nextQuantity = Number(part.quantity) + payload.quantity
    if (nextQuantity < 0) throw new Error('Adjustment would make stock negative.')

    const now = timestamp()
    runInTransaction(db, 'UPDATE parts SET quantity = ?, updated_at = ? WHERE id = ?', [nextQuantity, now, payload.id])
    runInTransaction(
      db,
      `INSERT INTO stock_movements (id, part_id, job_card_id, movement_type, quantity, quantity_before, quantity_after, reason, performed_by, created_at)
       VALUES (?, ?, NULL, 'ADJUSTMENT', ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), payload.id, payload.quantity, Number(part.quantity), nextQuantity, sanitizeText(payload.reason) ?? 'Manual adjustment', payload.actorId ?? null, now],
    )
  })
}

export async function createVehicleRecord(payload: {
  customer_id: string
  registration: string
  make: string
  model: string
  year?: number | null
  color?: string | null
}) {
  return writeTransaction(db => {
    const now = timestamp()
    const id = crypto.randomUUID()
    runInTransaction(
      db,
      `INSERT INTO vehicles (id, customer_id, registration, make, model, year, color, vin, mileage_in, rfid_tag, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?)`,
      [id, payload.customer_id, payload.registration.trim().toUpperCase(), payload.make.trim(), payload.model.trim(), payload.year ?? null, sanitizeText(payload.color), now, now],
    )
    return { id }
  })
}

export async function listCustomersForSelection() {
  const rows = await queryAll<CustomerRow>('SELECT * FROM customers ORDER BY full_name ASC')
  return rows.map(mapCustomer)
}

export async function listVehiclesForCustomer(customerId: string) {
  const rows = await queryAll<VehicleRow>('SELECT * FROM vehicles WHERE customer_id = ? ORDER BY created_at DESC', [customerId])
  return rows.map(mapVehicle)
}

export async function createJobCardRecord(payload: {
  customer_id: string
  vehicle_id: string
  complaint: string
  assigned_mechanic?: string | null
  estimated_return?: string | null
  notes?: string | null
  created_by?: string | null
}) {
  return writeTransaction(db => {
    const id = crypto.randomUUID()
    const now = timestamp()
    const dateReceived = currentDate()
    const jobNumber = nextJobNumber(db)

    runInTransaction(
      db,
      `INSERT INTO job_cards (id, job_number, vehicle_id, customer_id, assigned_mechanic, created_by, status, complaint, diagnosis, work_done, date_received, estimated_return, actual_return, labour_cost, total_parts_cost, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, NULL, NULL, ?, ?, NULL, 0, 0, ?, ?, ?)`,
      [
        id,
        jobNumber,
        payload.vehicle_id,
        payload.customer_id,
        sanitizeText(payload.assigned_mechanic),
        payload.created_by ?? null,
        payload.complaint.trim(),
        dateReceived,
        sanitizeText(payload.estimated_return),
        sanitizeText(payload.notes),
        now,
        now,
      ],
    )

    return { id }
  })
}

export async function updateJobCardRecord(payload: {
  id: string
  status: JobStatus
  assigned_mechanic?: string | null
  diagnosis?: string | null
  work_done?: string | null
  labour_cost: number
  estimated_return?: string | null
  notes?: string | null
}) {
  return writeTransaction(db => {
    const previous = selectOneInTransaction<{ status: JobStatus; actual_return: string | null }>(db, 'SELECT status, actual_return FROM job_cards WHERE id = ?', [payload.id])
    if (!previous) throw new Error('Job card not found.')

    const actualReturn = payload.status === 'Completed'
      ? previous.actual_return ?? currentDate()
      : payload.status === 'Cancelled'
        ? previous.actual_return
        : null

    runInTransaction(
      db,
      `UPDATE job_cards
       SET status = ?, assigned_mechanic = ?, diagnosis = ?, work_done = ?, labour_cost = ?, estimated_return = ?, notes = ?, actual_return = ?, updated_at = ?
       WHERE id = ?`,
      [
        payload.status,
        sanitizeText(payload.assigned_mechanic),
        sanitizeText(payload.diagnosis),
        sanitizeText(payload.work_done),
        payload.labour_cost,
        sanitizeText(payload.estimated_return),
        sanitizeText(payload.notes),
        actualReturn,
        timestamp(),
        payload.id,
      ],
    )

    if (previous.status !== 'Completed' && payload.status === 'Completed') {
      ensureRepairRecord(db, payload.id)
    }
  })
}

export async function addJobCardPart(payload: {
  job_card_id: string
  part_id: string
  quantity_used: number
  actorId?: string | null
}) {
  return writeTransaction(db => {
    const part = selectOneInTransaction<{ id: string; quantity: number; unit_cost: number; selling_price: number | null }>(db, 'SELECT id, quantity, unit_cost, selling_price FROM parts WHERE id = ?', [payload.part_id])
    if (!part) throw new Error('Part not found.')
    if (Number(part.quantity) < payload.quantity_used) throw new Error('Insufficient stock for selected part.')

    const existing = selectOneInTransaction<{ id: string }>(db, 'SELECT id FROM job_card_parts WHERE job_card_id = ? AND part_id = ?', [payload.job_card_id, payload.part_id])
    if (existing) throw new Error('That part is already attached to the job card.')

    const now = timestamp()
    const nextQuantity = Number(part.quantity) - payload.quantity_used
    const unitCost = Number(part.selling_price ?? part.unit_cost)
    runInTransaction(
      db,
      `INSERT INTO job_card_parts (id, job_card_id, part_id, quantity_used, unit_cost, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), payload.job_card_id, payload.part_id, payload.quantity_used, unitCost, now],
    )
    runInTransaction(db, 'UPDATE parts SET quantity = ?, updated_at = ? WHERE id = ?', [nextQuantity, now, payload.part_id])
    runInTransaction(
      db,
      `INSERT INTO stock_movements (id, part_id, job_card_id, movement_type, quantity, quantity_before, quantity_after, reason, performed_by, created_at)
       VALUES (?, ?, ?, 'OUT', ?, ?, ?, 'Used on job card', ?, ?)`,
      [crypto.randomUUID(), payload.part_id, payload.job_card_id, -payload.quantity_used, Number(part.quantity), nextQuantity, payload.actorId ?? null, now],
    )
    recalculateJobPartsCost(db, payload.job_card_id)
  })
}

export async function removeJobCardPart(lineId: string, actorId?: string | null) {
  return writeTransaction(db => {
    const line = selectOneInTransaction<{ id: string; job_card_id: string; part_id: string; quantity_used: number }>(db, 'SELECT * FROM job_card_parts WHERE id = ?', [lineId])
    if (!line) throw new Error('Part line not found.')

    const part = selectOneInTransaction<{ quantity: number }>(db, 'SELECT quantity FROM parts WHERE id = ?', [line.part_id])
    const currentQuantity = Number(part?.quantity ?? 0)
    const nextQuantity = currentQuantity + Number(line.quantity_used)
    const now = timestamp()

    runInTransaction(db, 'DELETE FROM job_card_parts WHERE id = ?', [lineId])
    runInTransaction(db, 'UPDATE parts SET quantity = ?, updated_at = ? WHERE id = ?', [nextQuantity, now, line.part_id])
    runInTransaction(
      db,
      `INSERT INTO stock_movements (id, part_id, job_card_id, movement_type, quantity, quantity_before, quantity_after, reason, performed_by, created_at)
       VALUES (?, ?, ?, 'IN', ?, ?, ?, 'Removed from job card', ?, ?)`,
      [crypto.randomUUID(), line.part_id, line.job_card_id, Number(line.quantity_used), currentQuantity, nextQuantity, actorId ?? null, now],
    )
    recalculateJobPartsCost(db, line.job_card_id)
  })
}

export async function updateUserProfile(payload: {
  id: string
  full_name: string
  phone?: string | null
}) {
  return writeTransaction(db => {
    runInTransaction(db, 'UPDATE users SET full_name = ?, phone = ?, updated_at = ? WHERE id = ?', [payload.full_name.trim(), sanitizeText(payload.phone), timestamp(), payload.id])
  })
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  return writeTransaction(db => {
    runInTransaction(db, 'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [passwordHash, timestamp(), userId])
  })
}

export async function resetPasswordForEmail(email: string, nextPassword: string) {
  const user = await getUserByEmail(email)
  if (!user) return false
  const passwordHash = await hash(nextPassword, 10)
  await updateUserPassword(user.id, passwordHash)
  return true
}

export async function createUserRecord(payload: {
  email: string
  full_name: string
  role: UserRole
  phone?: string | null
  password: string
}) {
  const passwordHash = await hash(payload.password, 10)
  return writeTransaction(db => {
    const now = timestamp()
    const id = crypto.randomUUID()
    runInTransaction(
      db,
      `INSERT INTO users (id, email, password_hash, full_name, role, phone, avatar_url, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, 1, ?, ?)`,
      [id, payload.email.trim().toLowerCase(), passwordHash, payload.full_name.trim(), payload.role, sanitizeText(payload.phone), now, now],
    )
    return { id }
  })
}

export async function updateUserRoleRecord(userId: string, role: UserRole) {
  return writeTransaction(db => {
    runInTransaction(db, 'UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [role, timestamp(), userId])
  })
}

export async function toggleUserActiveRecord(userId: string, isActive: boolean) {
  return writeTransaction(db => {
    runInTransaction(db, 'UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?', [boolInt(isActive), timestamp(), userId])
  })
}

export async function getJobExportData(filters: { from?: string | null; to?: string | null }) {
  const rows = await queryAll<
    RepairRecordRow & {
      registration: string
      make: string
      model: string
      customer_name: string
      customer_phone: string
      job_number: string
      complaint: string | null
      total_parts_cost: number | null
    }
  >(
    `SELECT repair_records.*, vehicles.registration, vehicles.make, vehicles.model,
            customers.full_name AS customer_name, customers.phone AS customer_phone,
            job_cards.job_number, job_cards.complaint, job_cards.total_parts_cost
     FROM repair_records
     JOIN vehicles ON vehicles.id = repair_records.vehicle_id
     JOIN customers ON customers.id = repair_records.customer_id
     JOIN job_cards ON job_cards.id = repair_records.job_card_id
     WHERE (? IS NULL OR repair_records.completed_at >= ?)
       AND (? IS NULL OR repair_records.completed_at <= ?)
     ORDER BY repair_records.completed_at DESC`,
    [filters.from ?? null, filters.from ?? null, filters.to ? `${filters.to}T23:59:59.999Z` : null, filters.to ? `${filters.to}T23:59:59.999Z` : null],
  )

  return rows.map(record => ({
    ...mapRepairRecord(record),
    vehicles: { registration: record.registration, make: record.make, model: record.model } as Vehicle,
    customers: { full_name: record.customer_name, phone: record.customer_phone } as Customer,
    job_cards: { job_number: record.job_number, complaint: record.complaint, total_parts_cost: record.total_parts_cost } as JobCard,
  }))
}

export async function getStockExportData() {
  const rows = await queryAll<PartRow & { supplier_name: string | null }>(
    `SELECT parts.*, suppliers.name AS supplier_name
     FROM parts
     LEFT JOIN suppliers ON suppliers.id = parts.supplier_id
     WHERE parts.is_active = 1
     ORDER BY parts.name ASC`,
  )

  return rows.map(row => ({ ...mapPart(row), suppliers: row.supplier_name ? ({ name: row.supplier_name } as Supplier) : undefined }))
}