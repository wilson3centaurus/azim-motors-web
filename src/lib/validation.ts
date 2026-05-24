import { z } from 'zod'

const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s0-9]{6,20}$/

const optionalTrimmed = () =>
  z
    .string()
    .trim()
    .optional()
    .transform(value => value && value.length > 0 ? value : undefined)

const optionalDate = () =>
  z
    .string()
    .optional()
    .transform(value => value && value.length > 0 ? value : undefined)

function dateIsTodayOrLater(date: string) {
  const today = new Date().toISOString().slice(0, 10)
  return date >= today
}

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter a phone number or email address.'),
  secret: z.string().trim().min(1, 'Enter your PIN or password.'),
  usePassword: z.boolean().optional().default(false),
}).superRefine((values, ctx) => {
  if (!values.usePassword && !phoneRegex.test(values.identifier)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['identifier'],
      message: 'Enter a valid phone number.',
    })
  }

  if (!values.usePassword && !/^\d{4}$/.test(values.secret)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['secret'],
      message: 'Enter your 4-digit PIN.',
    })
  }
})

const pinSchema = z.string().trim().regex(/^\d{4}$/, 'PIN must be exactly 4 digits.')

export const setPinSchema = z
  .object({
    pin: pinSchema,
    confirm: z.string().trim(),
  })
  .refine(values => values.pin === values.confirm, {
    path: ['confirm'],
    message: 'PINs do not match.',
  })

export const changePinSchema = z
  .object({
    current: pinSchema,
    next: pinSchema,
    confirm: z.string().trim(),
  })
  .refine(values => values.next === values.confirm, {
    path: ['confirm'],
    message: 'PINs do not match.',
  })

export const customerSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name is required.'),
  phone: z.string().trim().regex(phoneRegex, 'Enter a valid phone number.'),
  email: optionalTrimmed().refine(value => !value || z.email().safeParse(value).success, 'Enter a valid email address.'),
  address: optionalTrimmed(),
  id_number: optionalTrimmed(),
  notes: optionalTrimmed(),
})

export const supplierSchema = z.object({
  name: z.string().trim().min(2, 'Supplier name is required.'),
  contact_name: optionalTrimmed(),
  phone: optionalTrimmed().refine(value => !value || phoneRegex.test(value), 'Enter a valid phone number.'),
  email: optionalTrimmed().refine(value => !value || z.email().safeParse(value).success, 'Enter a valid email address.'),
  address: optionalTrimmed(),
})

export const partSchema = z.object({
  name: z.string().trim().min(2, 'Part name is required.'),
  part_number: optionalTrimmed(),
  description: optionalTrimmed(),
  quantity: z.number().min(0, 'Quantity cannot be negative.'),
  reorder_level: z.number().min(0, 'Reorder level cannot be negative.'),
  unit_cost: z.number().min(0, 'Unit cost cannot be negative.'),
  selling_price: z.number().min(0, 'Selling price cannot be negative.').nullable(),
  supplier_id: optionalTrimmed(),
  location: optionalTrimmed(),
})

export const createPartSchema = z.object({
  name: z.string().trim().min(2, 'Part name is required.'),
  part_number: optionalTrimmed(),
  description: optionalTrimmed(),
  quantity: z.number().min(0, 'Quantity cannot be negative.'),
  reorder_level: z.number().min(0, 'Reorder level cannot be negative.').optional().default(0),
  unit_cost: z.number().min(0, 'Unit cost cannot be negative.'),
  selling_price: z.number().min(0, 'Selling price cannot be negative.').nullable(),
  supplier_id: optionalTrimmed(),
  location: optionalTrimmed(),
})

export const vehicleSchema = z.object({
  registration: optionalTrimmed(),
  make: z.string().trim().min(2, 'Make is required.'),
  model: z.string().trim().min(1, 'Model is required.'),
  year: z
    .number()
    .int('Year must be a whole number.')
    .min(1900, 'Enter a realistic year.')
    .max(new Date().getFullYear() + 1, 'Enter a realistic year.')
    .nullable(),
  color: optionalTrimmed(),
})

export const jobCardDraftSchema = z.object({
  service_type: z.string().trim().min(2, 'Select the main service requested.'),
  complaint: z.string().trim().min(3, 'Enter the main complaint.'),
  assigned_mechanic: optionalTrimmed(),
  estimated_return: optionalDate().refine(value => !value || dateIsTodayOrLater(value), 'Estimated return cannot be in the past.'),
  quoted_amount: z.number().min(0, 'Quoted amount cannot be negative.'),
  notes: optionalTrimmed(),
})

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name is required.'),
  phone: optionalTrimmed().refine(value => !value || phoneRegex.test(value), 'Enter a valid phone number.'),
})

export const passwordSchema = z
  .object({
    current: z.string().min(6, 'Enter your current password.'),
    next: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Za-z]/, 'Password must include a letter.')
      .regex(/[0-9]/, 'Password must include a number.'),
    confirm: z.string().min(8, 'Confirm your new password.'),
  })
  .refine(values => values.next === values.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match.',
  })

export const jobUpdateSchema = z.object({
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Cancelled']),
  service_type: z.string().trim().min(2, 'Select the main service requested.'),
  assigned_mechanic: optionalTrimmed(),
  diagnosis: optionalTrimmed(),
  work_done: optionalTrimmed(),
  labour_cost: z.number().min(0, 'Labour cost cannot be negative.'),
  quoted_amount: z.number().min(0, 'Quoted amount cannot be negative.'),
  payment_status: z.enum(['Unpaid', 'Deposit Paid', 'Paid']),
  estimated_return: optionalDate().refine(value => !value || dateIsTodayOrLater(value), 'Estimated return cannot be in the past.'),
  notes: optionalTrimmed(),
})

export const stockAdjustmentSchema = z.object({
  quantity: z.number().int('Use a whole number.').refine(value => value !== 0, 'Enter a non-zero adjustment.'),
  reason: optionalTrimmed(),
  currentQuantity: z.number(),
}).refine(values => values.currentQuantity + values.quantity >= 0, {
  path: ['quantity'],
  message: 'Adjustment would make stock negative.',
})

export const jobPartSchema = z.object({
  partId: z.string().trim().min(1, 'Select a part first.'),
  quantity: z.number().int('Use a whole number.').min(1, 'Quantity must be at least 1.'),
  available: z.number().int(),
}).refine(values => values.quantity <= values.available, {
  path: ['quantity'],
  message: 'Quantity exceeds available stock.',
})

export function fieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors
}

export function toOptionalString(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export function toNumber(value: string | number) {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function toNullableNumber(value: string | number) {
  if (value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}