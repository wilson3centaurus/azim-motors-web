import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Database, SqlJsStatic } from 'sql.js'
import { compare, hash } from 'bcryptjs'

type SqlParam = string | number | null
type SqlRow = object

const DB_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DB_DIR, 'azim-motors.sqlite')
const SQL_WASM_DIR = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist')

const schema = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    pin_hash TEXT,
    password_login_enabled INTEGER NOT NULL DEFAULT 1,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'mechanic', 'salesperson', 'receptionist')) DEFAULT 'mechanic',
    phone TEXT,
    avatar_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    id_number TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    registration TEXT NOT NULL UNIQUE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    color TEXT,
    vin TEXT,
    mileage_in INTEGER,
    rfid_tag TEXT UNIQUE,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS parts (
    id TEXT PRIMARY KEY,
    part_number TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
    unit_cost REAL NOT NULL DEFAULT 0,
    selling_price REAL,
    supplier_id TEXT,
    location TEXT,
    rfid_tag TEXT UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS job_number_sequences (
    year INTEGER PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS job_cards (
    id TEXT PRIMARY KEY,
    job_number TEXT NOT NULL UNIQUE,
    vehicle_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    assigned_mechanic TEXT,
    created_by TEXT,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    service_type TEXT,
    complaint TEXT NOT NULL,
    diagnosis TEXT,
    work_done TEXT,
    date_received TEXT NOT NULL,
    estimated_return TEXT,
    actual_return TEXT,
    labour_cost REAL NOT NULL DEFAULT 0,
    quoted_amount REAL NOT NULL DEFAULT 0,
    total_parts_cost REAL NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'Unpaid',
    customer_notification_sent INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_mechanic) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS job_card_parts (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    part_id TEXT NOT NULL,
    quantity_used INTEGER NOT NULL CHECK (quantity_used > 0),
    unit_cost REAL NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(job_card_id, part_id),
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS repair_records (
    id TEXT PRIMARY KEY,
    job_card_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    diagnosis TEXT,
    work_done TEXT,
    labour_cost REAL,
    total_cost REAL,
    mileage_out INTEGER,
    technician_name TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    part_id TEXT NOT NULL,
    job_card_id TEXT,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reason TEXT,
    performed_by TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
    FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE SET NULL,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    sale_number TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    customer_phone TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    discount_amount REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    notes TEXT,
    sold_by TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    part_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price REAL NOT NULL,
    line_total REAL NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_customers_full_name ON customers(full_name);
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
  CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration);
  CREATE INDEX IF NOT EXISTS idx_parts_name ON parts(name);
  CREATE INDEX IF NOT EXISTS idx_job_cards_customer_id ON job_cards(customer_id);
  CREATE INDEX IF NOT EXISTS idx_job_cards_vehicle_id ON job_cards(vehicle_id);
  CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
  CREATE INDEX IF NOT EXISTS idx_job_cards_estimated_return ON job_cards(estimated_return);
  CREATE INDEX IF NOT EXISTS idx_job_card_parts_job_card_id ON job_card_parts(job_card_id);
  CREATE INDEX IF NOT EXISTS idx_stock_movements_part_id ON stock_movements(part_id);
  CREATE INDEX IF NOT EXISTS idx_repair_records_vehicle_id ON repair_records(vehicle_id);
`

type DatabaseState = {
  sql: SqlJsStatic
  db: Database
  writeQueue: Promise<unknown>
}

declare global {
  var __azimDbState: Promise<DatabaseState> | undefined
}

async function loadSqlJs() {
  const sqlModule = await import('sql.js')
  const initSqlJs = 'default' in sqlModule ? sqlModule.default : sqlModule
  return initSqlJs as (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsStatic>
}

async function createState(): Promise<DatabaseState> {
  await mkdir(DB_DIR, { recursive: true })
  const initSqlJs = await loadSqlJs()
  const sql = await initSqlJs({
    locateFile: file => path.join(SQL_WASM_DIR, file),
  })

  let db: Database
  try {
    const file = await readFile(DB_FILE)
    db = new sql.Database(new Uint8Array(file))
  } catch {
    db = new sql.Database()
  }

  db.run(schema)
  migrateSchema(db)
  const state: DatabaseState = { sql, db, writeQueue: Promise.resolve() }
  await seedIfEmpty(state.db)
  await ensureDefaultAdminCredentials(state.db)
  seedInventoryIfEmpty(state.db)
  await persist(state.db)
  return state
}

function getTableColumns(db: Database, tableName: string) {
  return selectAllFromDb<{ name: string }>(db, `PRAGMA table_info(${tableName})`).map(column => column.name)
}

function recreateUsersTableForRoles(db: Database) {
  const createStatement = selectOneFromDb<{ sql: string }>(db, "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'")
  if (createStatement?.sql?.includes("'salesperson'")) return

  db.run('BEGIN')
  try {
    db.run('ALTER TABLE users RENAME TO users_legacy')
    db.run(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        pin_hash TEXT,
        password_login_enabled INTEGER NOT NULL DEFAULT 1,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'mechanic', 'salesperson', 'receptionist')) DEFAULT 'mechanic',
        phone TEXT,
        avatar_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
    db.run(`
            INSERT INTO users (id, email, password_hash, pin_hash, password_login_enabled, full_name, role, phone, avatar_url, is_active, created_at, updated_at)
            SELECT id, email, password_hash, NULL, 1, full_name,
             CASE WHEN role = 'receptionist' THEN 'salesperson' ELSE role END,
             phone, avatar_url, is_active, created_at, updated_at
      FROM users_legacy
    `)
    db.run('DROP TABLE users_legacy')
    db.run('COMMIT')
  } catch (error) {
    try {
      db.run('ROLLBACK')
    } catch {}
    throw error
  }
}

function migrateSchema(db: Database) {
  recreateUsersTableForRoles(db)

  const userColumns = new Set(getTableColumns(db, 'users'))
  if (!userColumns.has('pin_hash')) db.run('ALTER TABLE users ADD COLUMN pin_hash TEXT')
  if (!userColumns.has('password_login_enabled')) db.run('ALTER TABLE users ADD COLUMN password_login_enabled INTEGER NOT NULL DEFAULT 1')

  const jobCardColumns = new Set(getTableColumns(db, 'job_cards'))
  if (!jobCardColumns.has('service_type')) db.run("ALTER TABLE job_cards ADD COLUMN service_type TEXT")
  if (!jobCardColumns.has('quoted_amount')) db.run("ALTER TABLE job_cards ADD COLUMN quoted_amount REAL NOT NULL DEFAULT 0")
  if (!jobCardColumns.has('payment_status')) db.run("ALTER TABLE job_cards ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'Unpaid'")
  if (!jobCardColumns.has('customer_notification_sent')) db.run("ALTER TABLE job_cards ADD COLUMN customer_notification_sent INTEGER NOT NULL DEFAULT 0")

  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      sale_number TEXT NOT NULL UNIQUE,
      customer_name TEXT,
      customer_phone TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'Cash',
      notes TEXT,
      sold_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price REAL NOT NULL,
      line_total REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE RESTRICT
    )
  `)
}

async function seedIfEmpty(db: Database) {
  const row = selectOneFromDb<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM users')
  if ((Number(row?.count) || 0) > 0) return

  const now = timestamp()
  const email = process.env.AZIM_LOCAL_ADMIN_EMAIL ?? 'admin@admin.com'
  const phone = process.env.AZIM_LOCAL_ADMIN_PHONE ?? '0770000000'
  const password = process.env.AZIM_LOCAL_ADMIN_PASSWORD ?? 'admin'
  const passwordHash = await hash(password, 10)
  db.run(
    `INSERT INTO users (id, email, password_hash, pin_hash, password_login_enabled, full_name, role, phone, avatar_url, is_active, created_at, updated_at)
     VALUES (?, ?, ?, NULL, 1, ?, 'admin', ?, NULL, 1, ?, ?)` ,
    [crypto.randomUUID(), email.toLowerCase(), passwordHash, 'Azim Motors Admin', phone, now, now],
  )
}

async function ensureDefaultAdminCredentials(db: Database) {
  const admin = selectOneFromDb<{
    id: string
    email: string
    password_hash: string
    full_name: string
    phone: string | null
  }>(
    db,
    `SELECT id, email, password_hash, full_name, phone
     FROM users
     WHERE role = 'admin'
     ORDER BY created_at ASC
     LIMIT 1`,
  )

  if (!admin) return false

  const desiredEmail = (process.env.AZIM_LOCAL_ADMIN_EMAIL ?? 'admin@admin.com').toLowerCase()
  const desiredPhone = process.env.AZIM_LOCAL_ADMIN_PHONE ?? '0770000000'
  const desiredPassword = process.env.AZIM_LOCAL_ADMIN_PASSWORD ?? 'admin'
  const legacyPassword = 'admin1234'
  const isDefaultAdminCandidate = admin.full_name === 'Azim Motors Admin'
    || admin.email.toLowerCase() === desiredEmail
    || admin.phone === desiredPhone

  if (!isDefaultAdminCandidate) return false

  const alreadyUsingDesiredPassword = await compare(desiredPassword, admin.password_hash)
  const stillUsingLegacyPassword = alreadyUsingDesiredPassword ? false : await compare(legacyPassword, admin.password_hash)

  if (!alreadyUsingDesiredPassword && !stillUsingLegacyPassword) return false

  const nextPasswordHash = alreadyUsingDesiredPassword ? admin.password_hash : await hash(desiredPassword, 10)
  db.run(
    `UPDATE users
     SET email = ?, phone = ?, password_hash = ?, updated_at = ?
     WHERE id = ?`,
    [desiredEmail, desiredPhone, nextPasswordHash, timestamp(), admin.id],
  )

  return true
}

export async function ensureRuntimeDefaultAdminCredentials() {
  const state = await getState()
  const changed = await ensureDefaultAdminCredentials(state.db)
  if (changed) {
    await persist(state.db)
  }
}

function seedInventoryIfEmpty(db: Database) {
  const row = selectOneFromDb<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM parts')
  if ((Number(row?.count) || 0) > 0) return

  seedSampleInventory(db)
}

function seedSampleInventory(db: Database) {
  const now = timestamp()
  let insertedParts = 0
  let insertedSuppliers = 0

  const supplierRows = [
    {
      id: crypto.randomUUID(),
      name: 'Star Benz Spares',
      contact_name: 'Martin Dube',
      phone: '+263774110220',
      email: 'benzparts@azim.local',
      address: 'Msasa Industrial, Harare',
    },
    {
      id: crypto.randomUUID(),
      name: 'Workshop Tools Hub',
      contact_name: 'Rudo Moyo',
      phone: '+263774220330',
      email: 'tools@azim.local',
      address: 'Graniteside, Harare',
    },
  ]

  for (const supplier of supplierRows) {
    const existingSupplier = selectOneFromDb<{ id: string }>(db, 'SELECT id FROM suppliers WHERE name = ? LIMIT 1', [supplier.name])
    if (!existingSupplier) {
      db.run(
        `INSERT INTO suppliers (id, name, contact_name, phone, email, address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [supplier.id, supplier.name, supplier.contact_name, supplier.phone, supplier.email, supplier.address, now],
      )
      insertedSuppliers += 1
    } else {
      supplier.id = existingSupplier.id
    }
  }

  const sampleParts = [
    {
      name: 'Mercedes-Benz W204 Oil Filter Kit',
      part_number: 'MB-W204-OFK',
      description: 'Service kit with oil filter, sump washer, and O-rings for routine C-Class servicing.',
      quantity: 12,
      reorder_level: 3,
      unit_cost: 18,
      selling_price: 30,
      supplier_id: supplierRows[0].id,
      location: 'Shelf A1',
    },
    {
      name: 'Mercedes-Benz Brake Pad Set Front',
      part_number: 'MB-BPF-212',
      description: 'Front brake pad set suitable for common E-Class workshop jobs.',
      quantity: 8,
      reorder_level: 2,
      unit_cost: 52,
      selling_price: 78,
      supplier_id: supplierRows[0].id,
      location: 'Shelf A4',
    },
    {
      name: 'Engine Tune-Up Repair Kit',
      part_number: 'KIT-TUNE-01',
      description: 'Assorted plugs, belts, and fluid-service consumables for tune-up work.',
      quantity: 6,
      reorder_level: 2,
      unit_cost: 95,
      selling_price: 135,
      supplier_id: supplierRows[1].id,
      location: 'Kit Rack B2',
    },
    {
      name: 'Torque Wrench 1/2 inch',
      part_number: 'TOOL-TW-12',
      description: 'Workshop-grade torque wrench for suspension, wheel, and engine work.',
      quantity: 4,
      reorder_level: 1,
      unit_cost: 80,
      selling_price: 120,
      supplier_id: supplierRows[1].id,
      location: 'Tool Wall C1',
    },
    {
      name: 'Mercedes-Benz Suspension Bush Kit',
      part_number: 'MB-SBK-ML',
      description: 'Front-end bush repair kit for common Mercedes suspension jobs.',
      quantity: 5,
      reorder_level: 2,
      unit_cost: 68,
      selling_price: 102,
      supplier_id: supplierRows[0].id,
      location: 'Shelf B3',
    },
    {
      name: 'Diagnostic Scanner OBD Kit',
      part_number: 'TOOL-OBD-PRO',
      description: 'Garage diagnostic tool kit for quick ECU scan and fault tracing.',
      quantity: 3,
      reorder_level: 1,
      unit_cost: 140,
      selling_price: 195,
      supplier_id: supplierRows[1].id,
      location: 'Tool Locker D2',
    },
  ]

  for (const part of sampleParts) {
    const existingPart = selectOneFromDb<{ id: string }>(db, 'SELECT id FROM parts WHERE part_number = ? LIMIT 1', [part.part_number])
    if (existingPart) {
      continue
    }

    const id = crypto.randomUUID()
    db.run(
      `INSERT INTO parts (id, part_number, name, description, quantity, reorder_level, unit_cost, selling_price, supplier_id, location, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        part.part_number,
        part.name,
        part.description,
        part.quantity,
        part.reorder_level,
        part.unit_cost,
        part.selling_price,
        part.supplier_id,
        part.location,
        now,
        now,
      ],
    )

    db.run(
      `INSERT INTO stock_movements (id, part_id, job_card_id, movement_type, quantity, quantity_before, quantity_after, reason, performed_by, created_at)
       VALUES (?, ?, NULL, 'IN', ?, 0, ?, 'Seed sample stock', NULL, ?)`,
      [crypto.randomUUID(), id, part.quantity, part.quantity, now],
    )

    insertedParts += 1
  }

  return { insertedParts, insertedSuppliers }
}

export async function seedSampleInventoryNow() {
  return writeTransaction(db => seedSampleInventory(db))
}

async function persist(db: Database) {
  const bytes = db.export()
  await writeFile(DB_FILE, Buffer.from(bytes))
}

async function ensureStateSchema(state: DatabaseState) {
  const userColumns = new Set(getTableColumns(state.db, 'users'))
  if (userColumns.has('pin_hash') && userColumns.has('password_login_enabled')) return

  migrateSchema(state.db)
  await ensureDefaultAdminCredentials(state.db)
  await persist(state.db)
}

async function getState() {
  if (!globalThis.__azimDbState) {
    globalThis.__azimDbState = createState()
  }
  const state = await globalThis.__azimDbState
  await ensureStateSchema(state)
  return state
}

export function timestamp() {
  return new Date().toISOString()
}

function selectAllFromDb<T extends SqlRow>(db: Database, sql: string, params: SqlParam[] = []) {
  const statement = db.prepare(sql, params)
  const rows: T[] = []

  try {
    while (statement.step()) {
      rows.push(statement.getAsObject() as T)
    }
  } finally {
    statement.free()
  }

  return rows
}

function selectOneFromDb<T extends SqlRow>(db: Database, sql: string, params: SqlParam[] = []) {
  return selectAllFromDb<T>(db, sql, params)[0] ?? null
}

export async function queryAll<T extends SqlRow>(sql: string, params: SqlParam[] = []) {
  const state = await getState()
  return selectAllFromDb<T>(state.db, sql, params)
}

export async function queryOne<T extends SqlRow>(sql: string, params: SqlParam[] = []) {
  const state = await getState()
  return selectOneFromDb<T>(state.db, sql, params)
}

export async function writeTransaction<T>(callback: (db: Database) => Promise<T> | T): Promise<T> {
  const state = await getState()

  const run = state.writeQueue.then(async () => {
    state.db.run('BEGIN')
    try {
      const result = await callback(state.db)
      state.db.run('COMMIT')
      await persist(state.db)
      return result
    } catch (error) {
      try {
        state.db.run('ROLLBACK')
      } catch {}
      throw error
    }
  })

  state.writeQueue = run.then(() => undefined, () => undefined)
  return run
}

export function selectAllInTransaction<T extends SqlRow>(db: Database, sql: string, params: SqlParam[] = []) {
  return selectAllFromDb<T>(db, sql, params)
}

export function selectOneInTransaction<T extends SqlRow>(db: Database, sql: string, params: SqlParam[] = []) {
  return selectOneFromDb<T>(db, sql, params)
}

export function runInTransaction(db: Database, sql: string, params: SqlParam[] = []) {
  db.run(sql, params)
}