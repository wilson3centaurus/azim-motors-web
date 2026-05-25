'use server'

import { compare, hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { seedSampleInventoryNow } from '@/lib/db'
import {
  addJobCardPart,
  adjustPartStock,
  createCustomerRecord,
  createJobCardRecord,
  createPartRecord,
  createSaleRecord,
  createSupplierRecord,
  createUserRecord,
  createVehicleRecord,
  deleteUserRecord,
  deleteJobCardRecord,
  getUserAccountById,
  getUserByEmail,
  getUserByPhone,
  getJobCardDetail,
  markJobCardNotificationSent,
  removeJobCardPart,
  resetPasswordForEmail,
  resetUserLoginAccess,
  toggleUserActiveRecord,
  updateJobCardRecord,
  updatePartRecord,
  updateUserPin,
  updateUserPassword,
  updateUserProfile,
  updateUserRoleRecord,
} from '@/lib/data'
import { authenticateUser, clearSession, createSession, requireAdmin, requireAnyRole, requireUser } from '@/lib/auth'
import { changePinSchema, createPartSchema, customerSchema, fieldErrors, jobCardDraftSchema, jobPartSchema, jobUpdateSchema, loginSchema, partSchema, passwordSchema, profileSchema, setPinSchema, stockAdjustmentSchema, supplierSchema, vehicleSchema } from '@/lib/validation'
import type { JobStatus, PaymentStatus, UserRole } from '@/lib/supabase/types'
import { sendJobCardCreatedEmail } from '@/lib/notifications'

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

export async function loginAction(input: { identifier: string; password: string }) {
  const parsed = loginSchema.safeParse({ identifier: input.identifier, secret: input.password, usePassword: false })
  if (!parsed.success) {
    return actionError('Check your login details and try again.', fieldErrors(parsed.error))
  }

  const user = await authenticateUser(parsed.data.identifier, parsed.data.secret, { usePassword: parsed.data.usePassword })
  if (!user) {
    return actionError('Invalid sign-in details.')
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
    email: loginSchema.shape.identifier,
  }).safeParse({ email: input.email, next: input.password, confirm: input.confirm })

  if (!parsed.success) {
    return actionError('Check the form and try again.', fieldErrors(parsed.error))
  }

  const email = parsed.data.email?.trim()
  if (!email) {
    return actionError('Enter your email address.')
  }

  const updated = await resetPasswordForEmail(email, parsed.data.next)
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
  await requireAnyRole(['admin', 'mechanic', 'salesperson', 'receptionist'])
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
  reorder_level?: number
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
  const user = await requireAnyRole(['admin', 'salesperson'])
  const parsed = createPartSchema.safeParse({
    ...input,
    supplier_id: input.supplier_id ?? undefined,
  })
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
  await requireAnyRole(['admin', 'salesperson'])
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
  const user = await requireAnyRole(['admin', 'salesperson'])
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
  newVehicle?: { registration?: string | null; make: string; model: string; year?: number | null; color?: string }
  service_type: string
  complaint: string
  assigned_mechanic?: string | null
  estimated_return?: string | null
  quoted_amount: number
  notes?: string
}) {
  const user = await requireAnyRole(['admin', 'mechanic'])
  const jobParsed = jobCardDraftSchema.safeParse({
    service_type: input.service_type,
    complaint: input.complaint,
    assigned_mechanic: input.assigned_mechanic,
    estimated_return: input.estimated_return,
    quoted_amount: input.quoted_amount,
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
    service_type: jobParsed.data.service_type,
    complaint: jobParsed.data.complaint,
    assigned_mechanic: jobParsed.data.assigned_mechanic,
    estimated_return: jobParsed.data.estimated_return,
    quoted_amount: jobParsed.data.quoted_amount,
    notes: jobParsed.data.notes,
    created_by: user.id,
  })

  const detail = await getJobCardDetail(job.id)
  if (detail.job?.customers?.email) {
    const sent = await sendJobCardCreatedEmail({
      recipientEmail: detail.job.customers.email,
      recipientName: detail.job.customers.full_name,
      jobNumber: detail.job.job_number,
      serviceType: detail.job.service_type,
      complaint: detail.job.complaint,
      estimatedReturn: detail.job.estimated_return,
      quotedAmount: detail.job.quoted_amount,
      mechanicName: detail.job.mechanic?.full_name ?? null,
      vehicleRegistration: detail.job.vehicles?.registration ?? null,
    }).catch(() => false)

    if (sent) {
      await markJobCardNotificationSent(job.id)
    }
  }

  revalidatePath('/job-cards')
  revalidatePath('/dashboard')
  revalidatePath('/return-dates')
  return actionOk({ id: job.id })
}

export async function updateJobCardAction(input: {
  id: string
  status: JobStatus
  service_type: string
  assigned_mechanic?: string | null
  diagnosis?: string
  work_done?: string
  labour_cost: number
  quoted_amount: number
  payment_status: PaymentStatus
  estimated_return?: string | null
  notes?: string
}) {
  await requireAnyRole(['admin', 'mechanic'])
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
  const user = await requireAnyRole(['admin', 'mechanic'])
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
  const user = await requireAnyRole(['admin', 'mechanic'])
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

export async function setLoginPinAction(input: { pin: string; confirm: string }) {
  const user = await requireUser()
  const parsed = setPinSchema.safeParse(input)
  if (!parsed.success) {
    return actionError('Enter a valid 4-digit PIN.', fieldErrors(parsed.error))
  }

  const pinHash = await hash(parsed.data.pin, 10)
  await updateUserPin(user.id, pinHash)
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return actionOk({ message: 'PIN saved. Use it for future sign-ins.' })
}

export async function changePinAction(input: { current: string; next: string; confirm: string }) {
  const user = await requireUser()
  const parsed = changePinSchema.safeParse(input)
  if (!parsed.success) {
    return actionError('Check your PIN details and try again.', fieldErrors(parsed.error))
  }

  const account = await getUserAccountById(user.id)
  if (!account) {
    return actionError('User account not found.')
  }

  if (!account.pin_hash) {
    return actionError('Set your first PIN before changing it.')
  }

  const matches = await compare(parsed.data.current, account.pin_hash)
  if (!matches) {
    return actionError('Current PIN is incorrect.')
  }

  const pinHash = await hash(parsed.data.next, 10)
  await updateUserPin(user.id, pinHash)
  revalidatePath('/settings')
  return actionOk({ message: 'PIN changed.' })
}

function isDefaultAdminRecoveryAccount(account: { role: UserRole; email: string; phone: string | null; full_name: string }) {
  const desiredEmail = (process.env.AZIM_LOCAL_ADMIN_EMAIL ?? 'admin@admin.com').toLowerCase()
  const desiredPhone = process.env.AZIM_LOCAL_ADMIN_PHONE ?? '0770000000'

  return account.role === 'admin' && (
    account.full_name === 'Azim Motors Admin'
    || account.email.toLowerCase() === desiredEmail
    || account.phone === desiredPhone
  )
}

export async function resetUserLoginAction(input: { userId: string }) {
  await requireAdmin()

  const account = await getUserAccountById(input.userId)
  if (!account) {
    return actionError('User account not found.')
  }

  const resetPassword = isDefaultAdminRecoveryAccount(account)
    ? (process.env.AZIM_LOCAL_ADMIN_PASSWORD ?? 'admin')
    : account.phone?.trim()

  if (!resetPassword) {
    return actionError('This user needs a phone number before sign-in can be reset.')
  }

  const passwordHash = await hash(resetPassword, 10)
  await resetUserLoginAccess(account.id, passwordHash)
  revalidatePath('/settings/users')

  return actionOk({
    message: 'Sign-in has been reset. The user must log in with the recovery password and set a new PIN.',
    loginPhone: account.phone,
    loginEmail: account.email,
    tempPassword: resetPassword,
  })
}

export async function createUserAction(input: { email?: string; full_name: string; role: UserRole; phone?: string }) {
  await requireAdmin()
  if (!input.full_name.trim()) {
    return actionError('Enter the user name.')
  }

  if (!input.phone?.trim()) {
    return actionError('Enter the phone number for this user.')
  }

  const existing = input.email?.trim() ? await getUserByEmail(input.email) : await getUserByPhone(input.phone)
  if (existing) {
    return actionError('A user with that identifier already exists.')
  }

  const tempPassword = input.phone.trim()
  await createUserRecord({
    email: input.email,
    full_name: input.full_name,
    role: input.role,
    phone: input.phone,
    password: tempPassword,
  })

  revalidatePath('/settings/users')
  return actionOk({
    message: 'User created. They can sign in with phone or email and use their phone number as the recovery password until they set a PIN.',
    loginPhone: input.phone.trim(),
    loginEmail: input.email?.trim() || null,
    tempPassword,
  })
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

export async function deleteUserAction(input: { userId: string }) {
  await requireAdmin()

  const account = await getUserAccountById(input.userId)
  if (!account) {
    return actionError('User account not found.')
  }

  if (account.role === 'admin') {
    return actionError('Admin accounts cannot be deleted here.')
  }

  await deleteUserRecord(account.id)
  revalidatePath('/settings/users')
  return actionOk({ message: `${account.full_name} deleted.` })
}

export async function deleteJobCardAction(input: { id: string }) {
  const user = await requireAnyRole(['admin', 'mechanic'])
  try {
    await deleteJobCardRecord(input.id, user.id)
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'Unable to delete job card.')
  }

  revalidatePath('/job-cards')
  revalidatePath('/dashboard')
  return actionOk({ message: 'Job card deleted.', redirectTo: '/job-cards' })
}

export async function createSaleAction(input: {
  customer_name?: string
  customer_phone?: string
  payment_method: string
  notes?: string
  discount_amount?: number
  items: Array<{ part_id: string; quantity: number }>
}) {
  const user = await requireAnyRole(['admin', 'salesperson'])
  try {
    const sale = await createSaleRecord({
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      payment_method: input.payment_method,
      notes: input.notes,
      discount_amount: input.discount_amount,
      items: input.items,
      sold_by: user.id,
    })

    revalidatePath('/sales')
    revalidatePath('/dashboard')
    revalidatePath('/inventory')
    return actionOk({ message: `Sale ${sale.sale_number} recorded.`, id: sale.id })
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'Unable to complete sale.')
  }
}

export async function seedSampleInventoryAction() {
  await requireAdmin()
  try {
    const result = await seedSampleInventoryNow()
    revalidatePath('/inventory')
    revalidatePath('/dashboard')
    revalidatePath('/sales')
    return actionOk({
      message: result.inserted_parts > 0
        ? `Sample inventory added. ${result.inserted_parts} parts inserted.`
        : 'Sample inventory already exists. No new parts were inserted.',
    })
  } catch (error) {
    return actionError(error instanceof Error ? error.message : 'Unable to seed sample inventory right now.')
  }
}