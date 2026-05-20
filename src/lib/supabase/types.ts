export type JobStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'
export type UserRole = 'admin' | 'mechanic' | 'receptionist'

export interface UserProfile {
  id: string
  full_name: string
  role: UserRole
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  full_name: string
  phone: string
  email: string | null
  address: string | null
  id_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  customer_id: string
  registration: string
  make: string
  model: string
  year: number | null
  color: string | null
  vin: string | null
  mileage_in: number | null
  rfid_tag: string | null
  notes: string | null
  created_at: string
  updated_at: string
  customers?: Customer
}

export interface Supplier {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  created_at: string
}

export interface Part {
  id: string
  part_number: string | null
  name: string
  description: string | null
  quantity: number
  reorder_level: number
  unit_cost: number
  selling_price: number | null
  supplier_id: string | null
  location: string | null
  rfid_tag: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  suppliers?: Supplier
}

export interface RfidScanLog {
  id: string
  epc: string
  scan_type: string
  vehicle_id: string | null
  part_id: string | null
  job_card_id: string | null
  device_id: string | null
  scanned_by: string | null
  created_at: string
  vehicles?: Vehicle
  parts?: Part
  job_cards?: JobCard
}

export interface JobCard {
  id: string
  job_number: string
  vehicle_id: string
  customer_id: string
  assigned_mechanic: string | null
  created_by: string | null
  status: JobStatus
  complaint: string
  diagnosis: string | null
  work_done: string | null
  date_received: string
  estimated_return: string | null
  actual_return: string | null
  labour_cost: number
  total_parts_cost: number
  notes: string | null
  created_at: string
  updated_at: string
  vehicles?: Vehicle
  customers?: Customer
  mechanic?: UserProfile
}

export interface JobCardPart {
  id: string
  job_card_id: string
  part_id: string
  quantity_used: number
  unit_cost: number
  created_at: string
  parts?: Part
}

export interface RepairRecord {
  id: string
  job_card_id: string
  vehicle_id: string
  customer_id: string
  completed_at: string
  diagnosis: string | null
  work_done: string | null
  labour_cost: number | null
  total_cost: number | null
  mileage_out: number | null
  technician_name: string | null
  created_at: string
  vehicles?: Vehicle
  customers?: Customer
  job_cards?: JobCard
}

export interface StockMovement {
  id: string
  part_id: string
  job_card_id: string | null
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  quantity_before: number
  quantity_after: number
  reason: string | null
  performed_by: string | null
  created_at: string
}

export interface DashboardStats {
  carsInService: number
  pendingJobs: number
  lowStockCount: number
  upcomingReturns: JobCard[]
  overdueJobs: JobCard[]
}
