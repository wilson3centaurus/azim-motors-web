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
  email: z.email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
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

export const vehicleSchema = z.object({
  registration: z.string().trim().min(2, 'Registration is required.'),
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
  complaint: z.string().trim().min(8, 'Describe the complaint in a bit more detail.'),
  assigned_mechanic: optionalTrimmed(),
  estimated_return: optionalDate().refine(value => !value || dateIsTodayOrLater(value), 'Estimated return cannot be in the past.'),
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
  assigned_mechanic: optionalTrimmed(),
  diagnosis: optionalTrimmed(),
  work_done: optionalTrimmed(),
  labour_cost: z.number().min(0, 'Labour cost cannot be negative.'),
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