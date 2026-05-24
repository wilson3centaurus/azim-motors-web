'use server'

import { compare, hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import {
  addJobCardPart,
  adjustPartStock,
  createCustomerRecord,
  createJobCardRecord,
  createPartRecord,
  createSupplierRecord,
  createUserRecord,
  createVehicleRecord,
  getUserAccountById,
  getUserByEmail,
  removeJobCardPart,
  resetPasswordForEmail,
  toggleUserActiveRecord,
  updateJobCardRecord,
  updatePartRecord,
  updateUserPassword,
  updateUserProfile,
  updateUserRoleRecord,
} from '@/lib/data'
import { authenticateUser, clearSession, createSession, requireAdmin, requireUser } from '@/lib/auth'
import { customerSchema, fieldErrors, jobCardDraftSchema, jobPartSchema, jobUpdateSchema, loginSchema, partSchema, passwordSchema, profileSchema, stockAdjustmentSchema, supplierSchema, vehicleSchema } from '@/lib/validation'
import type { JobStatus, UserRole } from '@/lib/supabase/types'

type ActionFailure = {
  ok: false
  message: string
  errors?: Record<string, string[]>
}

function actionError(message: string, fieldErrorMap?: Record<string, string[]>) {
  return { ok: false as const, message, errors: fieldErrorMap } satisfies ActionFailure
}

function actionOk(): { ok: true }
function actionOk<T extends Record<string, unknown>>(payload: T): { ok: true } & T
function actionOk(payload: Record<string, unknown> = {}) {
  return { ok: true as const, ...payload }
}

export async function loginAction(input: { email: string; password: string }) {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return actionError('Check your login details and try again.', fieldErrors(parsed.error))
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password)
  if (!user) {
    return actionError('Invalid email or password.')
  }

  await createSession(user)
  return actionOk({ redirectTo: '/dashboard' })
}

export async function logoutAction() {
  await clearSession()
  return actionOk({ redirectTo: '/login' })
}

export async function resetPasswordAction(input: { email: string; password: string; confirm: string }) {
  const parsed = passwordSchema.pick({ next: true, confirm: true }).extend({
    email: loginSchema.shape.email,
  }).safeParse({ email: input.email, next: input.password, confirm: input.confirm })

  if (!parsed.success) {
    return actionError('Check the form and try again.', fieldErrors(parsed.error))
  }

  const updated = await resetPasswordForEmail(parsed.data.email, parsed.data.next)
  if (!updated) {
    return actionError('No account exists for that email.')
  }

  return actionOk({ message: 'Password reset. You can sign in now.' })
}

export async function createCustomerAction(input: {
  full_name: string
  phone: string
  email?: string
  address?: string
  id_number?: string
  notes?: string
}) {
  await requireUser()
  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) {
    return actionError('Check the customer details and try again.', fieldErrors(parsed.error))
  }

  const result = await createCustomerRecord(parsed.data)
  revalidatePath('/customers')
  return actionOk({ id: result.id })
}

export async function createPartAction(input: {
  name: string
  part_number?: string
  description?: string
  quantity: number
  reorder_level: number
  unit_cost: number
  selling_price?: number | null
  supplier_id?: string | null
  location?: string
  newSupplier?: {
    name: string
    contact_name?: string
    phone?: string
    email?: string
    address?: string
  } | null
}) {
  const user = await requireUser()
  const parsed = partSchema.safeParse(input)
  if (!parsed.success) {
    return actionError('Check the part details and try again.', fieldErrors(parsed.error))
  }

  let supplierId = parsed.data.supplier_id ?? null
  if (input.newSupplier?.name?.trim()) {
    const supplierParsed = supplierSchema.safeParse(input.newSupplier)
    if (!supplierParsed.success) {
      return actionError('Check the supplier details and try again.', fieldErrors(supplierParsed.error))
    }
    const supplier = await createSupplierRecord(supplierParsed.data)
    supplierId = supplier.id
  }

  await createPartRecord({ ...parsed.data, supplier_id: supplierId, actorId: user.id })
  revalidatePath('/inventory')
  return actionOk({ redirectTo: '/inventory' })
}

export async function updatePartAction(input: {
  id: string
  name: string
  part_number?: string
  description?: string
  reorder_level: number
  unit_cost: number
  selling_price?: number | null
  supplier_id?: string | null
  location?: string
}) {
  await requireUser()
  const parsed = partSchema.omit({ quantity: true }).safeParse({
    name: input.name,
    part_number: input.part_number,
    description: input.description,
    reorder_level: input.reorder_level,
    unit_cost: input.unit_cost,
    selling_price: input.selling_price ?? null,
    supplier_id: input.supplier_id,
    location: input.location,
  })

  if (!parsed.success) {
    return actionError('Check the part details and try again.', fieldErrors(parsed.error))
  }

  await updatePartRecord(input)
  revalidatePath(`/inventory/${input.id}`)
  revalidatePath('/inventory')
  return actionOk({ message: 'Part updated.' })
}

export async function adjustPartStockAction(input: { id: string; quantity: number; reason?: string }) {
  const user = await requireUser()
  const parsed = stockAdjustmentSchema.safeParse({ quantity: input.quantity, reason: input.reason, currentQuantity: 0 })
  if (!parsed.success) {
    return actionError('Check the adjustment and try again.', fieldErrors(parsed.error))
  }

  try {
    await adjustPartStock({ ...input, actorId: user.id })
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'Unable to adjust stock.')
  }

  revalidatePath(`/inventory/${input.id}`)
  revalidatePath('/inventory')
  return actionOk({ message: 'Stock adjusted.' })
}

export async function createJobCardAction(input: {
  selectedCustomerId?: string | null
  newCustomer?: { full_name: string; phone: string; email?: string }
  selectedVehicleId?: string | null
  newVehicle?: { registration: string; make: string; model: string; year?: number | null; color?: string }
  complaint: string
  assigned_mechanic?: string | null
  estimated_return?: string | null
  notes?: string
}) {
  const user = await requireUser()
  const jobParsed = jobCardDraftSchema.safeParse({
    complaint: input.complaint,
    assigned_mechanic: input.assigned_mechanic,
    estimated_return: input.estimated_return,
    notes: input.notes,
  })

  if (!jobParsed.success) {
    return actionError('Check the job details and try again.', fieldErrors(jobParsed.error))
  }

  let customerId = input.selectedCustomerId ?? null
  if (!customerId && input.newCustomer) {
    const customerParsed = customerSchema.pick({ full_name: true, phone: true, email: true }).safeParse(input.newCustomer)
    if (!customerParsed.success) {
      return actionError('Check the customer details and try again.', fieldErrors(customerParsed.error))
    }
    const customer = await createCustomerRecord(customerParsed.data)
    customerId = customer.id
  }

  if (!customerId) {
    return actionError('Select or create a customer first.')
  }

  let vehicleId = input.selectedVehicleId ?? null
  if (!vehicleId && input.newVehicle) {
    const vehicleParsed = vehicleSchema.safeParse(input.newVehicle)
    if (!vehicleParsed.success) {
      return actionError('Check the vehicle details and try again.', fieldErrors(vehicleParsed.error))
    }
    const vehicle = await createVehicleRecord({ ...vehicleParsed.data, customer_id: customerId })
    vehicleId = vehicle.id
  }

  if (!vehicleId) {
    return actionError('Select or create a vehicle first.')
  }

  const job = await createJobCardRecord({
    customer_id: customerId,
    vehicle_id: vehicleId,
    complaint: jobParsed.data.complaint,
    assigned_mechanic: jobParsed.data.assigned_mechanic,
    estimated_return: jobParsed.data.estimated_return,
    notes: jobParsed.data.notes,
    created_by: user.id,
  })

  revalidatePath('/job-cards')
  revalidatePath('/dashboard')
  revalidatePath('/return-dates')
  return actionOk({ id: job.id })
}

export async function updateJobCardAction(input: {
  id: string
  status: JobStatus
  assigned_mechanic?: string | null
  diagnosis?: string
  work_done?: string
  labour_cost: number
  estimated_return?: string | null
  notes?: string
}) {
  await requireUser()
  const parsed = jobUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return actionError('Check the job update and try again.', fieldErrors(parsed.error))
  }

  await updateJobCardRecord({ id: input.id, ...parsed.data })
  revalidatePath(`/job-cards/${input.id}`)
  revalidatePath('/job-cards')
  revalidatePath('/dashboard')
  revalidatePath('/repair-records')
  revalidatePath('/return-dates')
  return actionOk({ message: 'Job updated.' })
}

export async function addJobPartAction(input: { job_card_id: string; part_id: string; quantity: number; available: number }) {
  const user = await requireUser()
  const parsed = jobPartSchema.safeParse({ partId: input.part_id, quantity: input.quantity, available: input.available })
  if (!parsed.success) {
    return actionError('Check the part quantity and try again.', fieldErrors(parsed.error))
  }

  try {
    await addJobCardPart({ job_card_id: input.job_card_id, part_id: input.part_id, quantity_used: input.quantity, actorId: user.id })
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'Unable to add part.')
  }

  revalidatePath(`/job-cards/${input.job_card_id}`)
  revalidatePath('/inventory')
  return actionOk({ message: 'Part added.' })
}

export async function removeJobPartAction(input: { lineId: string; job_card_id: string }) {
  const user = await requireUser()
  try {
    await removeJobCardPart(input.lineId, user.id)
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'Unable to remove part.')
  }

  revalidatePath(`/job-cards/${input.job_card_id}`)
  revalidatePath('/inventory')
  return actionOk({ message: 'Part removed.' })
}

export async function saveProfileAction(input: { full_name: string; phone?: string }) {
  const user = await requireUser()
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return actionError('Check the profile details and try again.', fieldErrors(parsed.error))
  }

  await updateUserProfile({ id: user.id, ...parsed.data })
  revalidatePath('/settings')
  return actionOk({ message: 'Profile saved.' })
}

export async function changePasswordAction(input: { current: string; next: string; confirm: string }) {
  const user = await requireUser()
  const parsed = passwordSchema.safeParse(input)
  if (!parsed.success) {
    return actionError('Check the password fields and try again.', fieldErrors(parsed.error))
  }

  const account = await getUserAccountById(user.id)
  if (!account) {
    return actionError('User account not found.')
  }

  const matches = await compare(parsed.data.current, account.password_hash)
  if (!matches) {
    return actionError('Current password is incorrect.')
  }

  const passwordHash = await hash(parsed.data.next, 10)
  await updateUserPassword(user.id, passwordHash)
  return actionOk({ message: 'Password changed.' })
}

export async function createUserAction(input: { email: string; full_name: string; role: UserRole; phone?: string }) {
  await requireAdmin()
  const emailParsed = loginSchema.pick({ email: true }).safeParse({ email: input.email })
  if (!emailParsed.success) {
    return actionError('Enter a valid email address.', fieldErrors(emailParsed.error))
  }

  if (!input.full_name.trim()) {
    return actionError('Enter the user name.')
  }

  const existing = await getUserByEmail(input.email)
  if (existing) {
    return actionError('A user with that email already exists.')
  }

  const tempPassword = `Azim-${Math.random().toString(36).slice(2, 8)}!9`
  await createUserRecord({
    email: input.email,
    full_name: input.full_name,
    role: input.role,
    phone: input.phone,
    password: tempPassword,
  })

  revalidatePath('/settings/users')
  return actionOk({ message: `User created. Temporary password: ${tempPassword}` })
}

export async function updateUserRoleAction(input: { userId: string; role: UserRole }) {
  await requireAdmin()
  await updateUserRoleRecord(input.userId, input.role)
  revalidatePath('/settings/users')
  return actionOk({ message: 'Role updated.' })
}

export async function toggleUserActiveAction(input: { userId: string; current: boolean }) {
  await requireAdmin()
  await toggleUserActiveRecord(input.userId, !input.current)
  revalidatePath('/settings/users')
  return actionOk({ message: !input.current ? 'User activated.' : 'User deactivated.' })
}