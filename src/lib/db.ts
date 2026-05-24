import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Database, SqlJsStatic } from 'sql.js'
import { hash } from 'bcryptjs'

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
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'mechanic', 'receptionist')) DEFAULT 'mechanic',
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
    complaint TEXT NOT NULL,
    diagnosis TEXT,
    work_done TEXT,
    date_received TEXT NOT NULL,
    estimated_return TEXT,
    actual_return TEXT,
    labour_cost REAL NOT NULL DEFAULT 0,
    total_parts_cost REAL NOT NULL DEFAULT 0,
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
  const state: DatabaseState = { sql, db, writeQueue: Promise.resolve() }
  await seedIfEmpty(state.db)
  await persist(state.db)
  return state
}

async function seedIfEmpty(db: Database) {
  const row = selectOneFromDb<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM users')
  if ((Number(row?.count) || 0) > 0) return

  const now = timestamp()
  const email = process.env.AZIM_LOCAL_ADMIN_EMAIL ?? 'admin@admin.com'
  const password = process.env.AZIM_LOCAL_ADMIN_PASSWORD ?? 'admin1234'
  const passwordHash = await hash(password, 10)
  db.run(
    `INSERT INTO users (id, email, password_hash, full_name, role, phone, avatar_url, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'admin', NULL, NULL, 1, ?, ?)`,
    [crypto.randomUUID(), email.toLowerCase(), passwordHash, 'Azim Motors Admin', now, now],
  )
}

async function persist(db: Database) {
  const bytes = db.export()
  await writeFile(DB_FILE, Buffer.from(bytes))
}

async function getState() {
  if (!globalThis.__azimDbState) {
    globalThis.__azimDbState = createState()
  }
  return globalThis.__azimDbState
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